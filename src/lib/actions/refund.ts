
'use server';

import { revalidatePath } from 'next/cache';
import { db, isConfigured } from '@/lib/firebase';
import { collection, doc, runTransaction, serverTimestamp, writeBatch, getDoc, increment } from 'firebase/firestore';
import type { Invoice, InvoiceItem, Customer, CreditNote, Product } from '@/lib/types';
import { _createInvoiceWithItems, getLatestInvoiceNumber } from './invoice';

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
    paymentMade: number; // Amount customer is paying for the exchange
}

export async function processRefundExchange(payload: ProcessRefundExchangePayload): Promise<{ success: boolean; error?: string }> {
    if (!isConfigured) {
        return { success: false, error: 'Firebase is not configured.' };
    }

    const { originalInvoice, returnedItems, exchangeItems, customer, paymentMade } = payload;
    
    const totalCredit = returnedItems.reduce((acc, item) => acc + item.total, 0);
    const exchangeTotal = exchangeItems.reduce((acc, item) => acc + item.total, 0);
    const finalBalance = exchangeTotal - totalCredit;

    try {
        await runTransaction(db, async (transaction) => {
            const dataDocRef = doc(db, DATA_PATH);
            const originalInvoiceRef = doc(dataDocRef, `${INVOICES_COLLECTION}/${originalInvoice.id}`);

            // === 1. Create the Credit Note ===
            const creditNoteRef = doc(collection(dataDocRef, CREDIT_NOTES_COLLECTION));
            const creditNoteData: Omit<CreditNote, 'id'> = {
                originalInvoiceId: originalInvoice.id,
                customerId: customer.id,
                issueDate: new Date().toISOString().split('T')[0],
                items: returnedItems,
                totalCredit: totalCredit,
            };
            transaction.set(creditNoteRef, creditNoteData);

            // === 2. Create the New Invoice for exchange items (if any) ===
            let newInvoiceRef = null;
            if (exchangeItems.length > 0) {
                const newInvoiceNumber = await getLatestInvoiceNumber();
                const newInvoiceData: Omit<Invoice, 'id' | 'createdAt'> = {
                    invoiceNumber: String(newInvoiceNumber),
                    customerId: customer.id,
                    customerName: originalInvoice.customerName,
                    subtotal: exchangeTotal,
                    tax: 0, // Assuming no tax for simplicity, can be changed
                    discount: 0,
                    total: exchangeTotal,
                    issueDate: new Date().toISOString().split('T')[0],
                    dueDate: new Date().toISOString().split('T')[0],
                    status: finalBalance <= 0 ? 'Paid' : 'Unpaid',
                    amountPaid: Math.min(totalCredit, exchangeTotal), // Apply credit first
                    paymentIds: [],
                    relatedCreditNoteId: creditNoteRef.id,
                };

                // Re-using the refactored invoice creation logic within the transaction
                const batchForInvoice = writeBatch(db); // Create a temporary batch
                newInvoiceRef = await _createInvoiceWithItems(batchForInvoice, { invoiceData: newInvoiceData, items: exchangeItems, customer });
                // We can't commit this batch, so this approach is flawed for transactions.
                // We need to inline the logic of _createInvoiceWithItems here.
                
                // Let's inline the logic from _createInvoiceWithItems
                const manualNewInvoiceRef = doc(collection(dataDocRef, INVOICES_COLLECTION));
                newInvoiceRef = manualNewInvoiceRef; // Use this ref going forward
                
                transaction.set(manualNewInvoiceRef, { ...newInvoiceData, createdAt: serverTimestamp() });
                for(const item of exchangeItems) {
                    const itemRef = doc(collection(manualNewInvoiceRef, 'invoice_items'));
                    transaction.set(itemRef, item);
                    if(!item.isCustom) {
                        transaction.update(doc(dataDocRef, `${INVENTORY_COLLECTION}/${item.inventoryId}`), { status: 'Sold' });
                    }
                }
                const historyRef = doc(collection(manualNewInvoiceRef, 'edit_history'));
                transaction.set(historyRef, {
                    timestamp: serverTimestamp(), user: 'admin_user', changes: { initialCreation: { from: null, to: 'Exchange Invoice Created' } }
                });

                // Link credit note to new invoice
                transaction.update(creditNoteRef, { newExchangeInvoiceId: newInvoiceRef.id });
            }

            // === 3. Handle Final Payment/Refund ===
            if (finalBalance > 0 && paymentMade > 0) { // Customer owes money and paid it
                const paymentRef = doc(collection(dataDocRef, PAYMENTS_COLLECTION));
                transaction.set(paymentRef, {
                    customerId: customer.id, paymentDate: serverTimestamp(), recordedBy: 'admin_user',
                    amountPaid: paymentMade, type: 'payment', appliedToInvoices: newInvoiceRef ? [newInvoiceRef.id] : [],
                    tenderDetails: [{ method: 'StoreCredit', amount: totalCredit }, { method: 'Cash', amount: paymentMade }]
                });
                if (newInvoiceRef) {
                    transaction.update(newInvoiceRef, { status: 'Paid', amountPaid: exchangeTotal, paymentIds: [paymentRef.id] });
                }
            } else if (finalBalance < 0) { // You owe the customer a refund
                const refundAmount = Math.abs(finalBalance);
                const refundRef = doc(collection(dataDocRef, PAYMENTS_COLLECTION));
                transaction.set(refundRef, {
                    customerId: customer.id, paymentDate: serverTimestamp(), recordedBy: 'admin_user',
                    amountPaid: refundAmount, type: 'refund', appliedToInvoices: [originalInvoice.id],
                    tenderDetails: [{ method: 'Cash', amount: refundAmount }]
                });
                transaction.update(creditNoteRef, { refundPaymentId: refundRef.id });
            }
            
            // === 4. Update Debt ===
            const customerRef = doc(dataDocRef, `${CUSTOMERS_COLLECTION}/${customer.id}`);
            // Net effect on debt: -(credit) + (new invoice total) - (payment made)
            const debtChange = exchangeTotal - totalCredit - paymentMade;
            transaction.update(customerRef, { debt: increment(debtChange) });


            // === 5. Create Audit Link on Original Invoice ===
            transaction.update(originalInvoiceRef, { relatedCreditNoteId: creditNoteRef.id });

            // === 6. Update Inventory for Returned Items ===
            for (const item of returnedItems) {
                if (!item.isCustom && item.inventoryId) {
                    const productRef = doc(dataDocRef, `${INVENTORY_COLLECTION}/${item.inventoryId}`);
                    // For simplicity, we just mark as available. A real system might have a "Refurbishment" status.
                    transaction.update(productRef, { status: 'Available' });
                }
            }
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
