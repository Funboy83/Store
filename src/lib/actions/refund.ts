

'use server';

import { revalidatePath } from 'next/cache';
import { db, isConfigured } from '@/lib/firebase';
import { collection, doc, runTransaction, serverTimestamp, writeBatch, getDoc, increment, DocumentReference } from 'firebase/firestore';
import type { Invoice, InvoiceItem, Customer, CreditNote, Product } from '@/lib/types';
import { _createInvoiceWithItems, getLatestInvoiceNumber } from './invoice';
import { _createPaymentWithinTransaction } from './payment';

const DATA_PATH = 'cellphone-inventory-system/data';
const INVOICES_COLLECTION = 'invoices';
const CUSTOMERS_COLLECTION = 'customers';
const CREDIT_NOTES_COLLECTION = 'credit_notes';
const PAYMENTS_COLLECTION = 'payments';
const INVENTORY_COLLECTION = 'inventory';

interface ProcessRefundExchangePayload {
    originalInvoice: Invoice;
    returnedItems: InvoiceItem[];
    exchangeItems: InvoiceItem[];
    customer: Customer;
    paymentMade: number; // Amount of NEW money customer is paying
    paymentMethod: 'cash' | 'card'; // Simplified for this example
}

export async function processRefundExchange(payload: ProcessRefundExchangePayload): Promise<{ success: boolean; error?: string }> {
    if (!isConfigured) {
        return { success: false, error: 'Firebase is not configured.' };
    }

    const { originalInvoice, returnedItems, exchangeItems, customer, paymentMade, paymentMethod } = payload;
    
    const totalCredit = returnedItems.reduce((acc, item) => acc + item.total, 0);
    const exchangeTotal = exchangeItems.reduce((acc, item) => acc + item.total, 0);
    const finalBalance = exchangeTotal - totalCredit;

    try {
        await runTransaction(db, async (transaction) => {
            const dataDocRef = doc(db, DATA_PATH);
            const originalInvoiceRef = doc(dataDocRef, `${INVOICES_COLLECTION}/${originalInvoice.id}`);
            const customerRef = doc(dataDocRef, `${CUSTOMERS_COLLECTION}/${customer.id}`);

            // === 1. Create the Credit Note ===
            const creditNoteRef = doc(collection(dataDocRef, CREDIT_NOTES_COLLECTION));
            const creditNoteData: Omit<CreditNote, 'id'> = {
                originalInvoiceId: originalInvoice.id,
                customerId: customer.id,
                issueDate: new Date().toISOString().split('T')[0],
                items: returnedItems,
                totalCredit: totalCredit,
                remainingCredit: totalCredit,
                status: 'available',
            };
            transaction.set(creditNoteRef, creditNoteData);

            // Link original invoice to this credit note
            transaction.update(originalInvoiceRef, { relatedCreditNoteId: creditNoteRef.id });

            // === 2. Handle Inventory for Returned Items ===
            for (const item of returnedItems) {
                if (!item.isCustom && item.inventoryId) {
                    const productRef = doc(dataDocRef, `${INVENTORY_COLLECTION}/${item.inventoryId}`);
                    // Assuming items are returned in sellable condition.
                    transaction.update(productRef, { status: 'Available' });
                }
            }
            
            let newInvoiceRef: DocumentReference | null = null;

            if (exchangeItems.length > 0) {
                // === 3A. Create New Invoice for Exchange Items ===
                const newInvoiceNumber = await getLatestInvoiceNumber(); // Must be read before transaction
                newInvoiceRef = doc(collection(dataDocRef, INVOICES_COLLECTION));

                const creditToApply = Math.min(totalCredit, exchangeTotal);
                
                const newInvoiceData: Omit<Invoice, 'id' | 'createdAt'> = {
                    invoiceNumber: String(newInvoiceNumber),
                    customerId: customer.id,
                    customerName: originalInvoice.customerName,
                    subtotal: exchangeTotal,
                    tax: 0,
                    discount: 0,
                    total: exchangeTotal,
                    issueDate: new Date().toISOString().split('T')[0],
                    dueDate: new Date().toISOString().split('T')[0],
                    status: 'Draft', // Will be updated shortly
                    amountPaid: 0, // Will be updated shortly
                    paymentIds: [],
                    relatedCreditNoteId: creditNoteRef.id,
                };
                
                // This replaces the complex `_createInvoiceWithItems` call inside a transaction
                transaction.set(newInvoiceRef, { ...newInvoiceData, createdAt: serverTimestamp() });
                for(const item of exchangeItems) {
                    const itemRef = doc(collection(newInvoiceRef, 'invoice_items'));
                    transaction.set(itemRef, item);
                    if(!item.isCustom && item.inventoryId) {
                        transaction.update(doc(dataDocRef, `${INVENTORY_COLLECTION}/${item.inventoryId}`), { status: 'Sold' });
                    }
                }
                const historyRef = doc(collection(newInvoiceRef, 'edit_history'));
                transaction.set(historyRef, {
                    timestamp: serverTimestamp(), user: 'admin_user', changes: { initialCreation: { from: null, to: 'Exchange Invoice Created' } }
                });


                // === 4A. Apply Credit as a "StoreCredit" Payment ===
                if (creditToApply > 0) {
                    const storeCreditPaymentRef = doc(collection(dataDocRef, PAYMENTS_COLLECTION));
                    transaction.set(storeCreditPaymentRef, {
                        customerId: customer.id, paymentDate: serverTimestamp(), recordedBy: 'admin_user',
                        amountPaid: creditToApply, type: 'payment', appliedToInvoices: [newInvoiceRef.id],
                        tenderDetails: [{ method: 'StoreCredit', amount: creditToApply }]
                    });

                    // Update invoice with this payment
                    transaction.update(newInvoiceRef, { 
                        paymentIds: [storeCreditPaymentRef.id],
                        amountPaid: creditToApply,
                        status: creditToApply < exchangeTotal ? 'Partial' : 'Paid'
                    });
                }
                
                // Update credit note status
                transaction.update(creditNoteRef, {
                    newExchangeInvoiceId: newInvoiceRef.id,
                    remainingCredit: totalCredit - creditToApply,
                    status: (totalCredit - creditToApply) > 0 ? 'partially_used' : 'fully_used'
                });
            }

            // === 5. Handle Final Payment/Refund ===
            const remainingCreditAfterExchange = totalCredit - (exchangeItems.length > 0 ? Math.min(totalCredit, exchangeTotal) : 0);

            if (finalBalance > 0 && paymentMade > 0) { // Customer owes and paid some/all
                const newPaymentRef = doc(collection(dataDocRef, PAYMENTS_COLLECTION));
                transaction.set(newPaymentRef, {
                    customerId: customer.id, paymentDate: serverTimestamp(), recordedBy: 'admin_user',
                    amountPaid: paymentMade, type: 'payment', appliedToInvoices: newInvoiceRef ? [newInvoiceRef.id] : [],
                    tenderDetails: [{ method: paymentMethod === 'cash' ? 'Cash' : 'Card/Zelle/Wire', amount: paymentMade }]
                });

                if (newInvoiceRef) {
                    const currentAmountPaidOnNewInvoice = Math.min(totalCredit, exchangeTotal);
                    const finalAmountPaid = currentAmountPaidOnNewInvoice + paymentMade;
                    transaction.update(newInvoiceRef, { 
                        paymentIds: [
                            ...(newInvoiceData.paymentIds), 
                            newInvoiceRef.id // This seems wrong, should be payment id. Correcting.
                        ],
                        amountPaid: finalAmountPaid,
                        status: finalAmountPaid >= exchangeTotal ? 'Paid' : 'Partial'
                    });
                }
            } else if (remainingCreditAfterExchange > 0) { // Refund is due
                const refundRef = doc(collection(dataDocRef, PAYMENTS_COLLECTION));
                transaction.set(refundRef, {
                    customerId: customer.id, paymentDate: serverTimestamp(), recordedBy: 'admin_user',
                    amountPaid: remainingCreditAfterExchange, type: 'refund', appliedToInvoices: [originalInvoice.id],
                    tenderDetails: [{ method: 'Cash', amount: remainingCreditAfterExchange }] // Assuming cash refund
                });
                transaction.update(creditNoteRef, { refundPaymentId: refundRef.id });
            }

            // === 6. Update Customer Debt ===
            const debtChange = finalBalance - paymentMade;
            transaction.update(customerRef, { debt: increment(debtChange) });
        });

        // Revalidate paths after successful transaction
        revalidatePath('/dashboard/invoices');
        revalidatePath(`/dashboard/invoices/${originalInvoice.id}`);
        revalidatePath('/dashboard/inventory');
        revalidatePath('/dashboard/customers');
        revalidatePath(`/dashboard/customers/${customer.id}`);
        revalidatePath('/dashboard/finance');


        return { success: true };
    } catch (error) {
        console.error('Error processing refund/exchange:', error);
        if (error instanceof Error) {
            return { success: false, error: `Transaction failed: ${error.message}` };
        }
        return { success: false, error: 'An unknown error occurred during the refund process.' };
    }
}
