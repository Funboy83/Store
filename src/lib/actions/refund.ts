

'use server';

import { revalidatePath } from 'next/cache';
import { db, isConfigured } from '@/lib/firebase';
import { collection, doc, runTransaction, serverTimestamp, getDoc, increment, query, where, getDocs } from 'firebase/firestore';
import type { Invoice, InvoiceDetail, InvoiceItem, Customer, CreditNote, Product } from '@/lib/types';
import { _createInvoiceWithItems, getLatestInvoiceNumber } from './invoice';
import { _createPaymentWithinTransaction } from './payment';
import { getLatestCreditNoteNumber } from './credit-note';

const DATA_PATH = 'app-data/cellsmart-data';
const INVOICES_COLLECTION = 'invoices';
const CUSTOMERS_COLLECTION = 'customers';
const CREDIT_NOTES_COLLECTION = 'credit_notes';
const PAYMENTS_COLLECTION = 'payments';
const INVENTORY_COLLECTION = 'inventory';
const INVENTORY_HISTORY_COLLECTION = 'inventory_history';

interface ProcessRefundExchangePayload {
    originalInvoice: InvoiceDetail;
    returnedItems: InvoiceItem[];
    exchangeItems: InvoiceItem[];
    customer: Customer;
    paymentMade: {
        cash: number;
        card: number;
    };
    refundMethod?: 'Cash' | 'Card' | 'StoreCredit';
}

export async function processRefundExchange(payload: ProcessRefundExchangePayload): Promise<{ success: boolean; error?: string }> {
    if (!isConfigured) {
        return { success: false, error: 'Firebase is not configured.' };
    }

    const { originalInvoice, returnedItems, exchangeItems, customer, paymentMade, refundMethod } = payload;
    
    const totalCredit = returnedItems.reduce((acc, item) => acc + item.total, 0);
    const exchangeTotal = exchangeItems.reduce((acc, item) => acc + item.total, 0);
    const finalBalance = exchangeTotal - totalCredit;
    const totalNewPayment = paymentMade.cash + paymentMade.card;

    try {
        // === SIMPLIFIED: Items now stay in inventory with 'Sold' status ===
        const dataDocRef = doc(db, DATA_PATH);
        let restoredCount = 0;
        
        await runTransaction(db, async (transaction) => {
            const originalInvoiceRef = doc(dataDocRef, `${INVOICES_COLLECTION}/${originalInvoice.id}`);
            const customerRef = doc(dataDocRef, `${CUSTOMERS_COLLECTION}/${customer.id}`);

            // === ALL READS MUST HAPPEN FIRST ===
            // Read customer document
            const customerDoc = await transaction.get(customerRef);

            // === NOW ALL WRITES ===
            // 1. Create the Credit Note with custom number
            const creditNoteRef = doc(collection(dataDocRef, CREDIT_NOTES_COLLECTION));
            const creditNoteNumber = await getLatestCreditNoteNumber();
            const creditToApply = exchangeItems.length > 0 ? Math.min(totalCredit, exchangeTotal) : 0;
            const remainingCreditAfterExchange = totalCredit - creditToApply;
            
            const creditNoteData: Omit<CreditNote, 'id'> = {
                creditNoteNumber: String(creditNoteNumber),
                originalInvoiceId: originalInvoice.id,
                customerId: customer.id,
                issueDate: new Date().toISOString().split('T')[0],
                items: returnedItems,
                totalCredit: totalCredit,
                remainingCredit: remainingCreditAfterExchange,
                status: remainingCreditAfterExchange > 0 ? 'available' : 'fully_used',
            };
            transaction.set(creditNoteRef, creditNoteData);

            transaction.update(originalInvoiceRef, { relatedCreditNoteId: creditNoteRef.id });

            // 2. Handle returned items: Update inventory status AND create audit history
            for (const item of returnedItems) {
                if (!item.isCustom && item.inventoryId) {
                    const inventoryRef = doc(dataDocRef, `${INVENTORY_COLLECTION}/${item.inventoryId}`);
                    
                    // Update inventory status back to Available
                    transaction.update(inventoryRef, {
                        status: 'Available',
                        updatedAt: serverTimestamp()
                    });
                    
                    // Create audit history record for the return
                    const returnHistoryRef = doc(collection(dataDocRef, INVENTORY_HISTORY_COLLECTION));
                    transaction.set(returnHistoryRef, {
                        id: item.inventoryId,
                        imei: item.description?.split(' - ')[0] || 'N/A',
                        brand: item.productName.split(' ')[0] || 'Unknown',
                        model: item.productName.split(' ').slice(1).join(' ') || 'Unknown',
                        price: item.unitPrice,
                        storage: 'N/A', // Would need to fetch from original inventory if needed
                        grade: 'N/A',   // Would need to fetch from original inventory if needed
                        color: 'N/A',   // Would need to fetch from original inventory if needed
                        carrier: 'N/A', // Would need to fetch from original inventory if needed
                        battery: 0,     // Would need to fetch from original inventory if needed
                        date: new Date().toISOString().split('T')[0],
                        condition: 'N/A', // Would need to fetch from original inventory if needed
                        status: 'Returned' as const,
                        amount: -item.total, // Negative amount indicates return
                        movedAt: serverTimestamp(),
                        customerId: customer.id,
                        customerName: customer.name,
                        invoiceId: originalInvoice.id,
                        creditNoteId: creditNoteRef.id,
                        createdAt: serverTimestamp(),
                        updatedAt: serverTimestamp(),
                    });
                    
                    restoredCount++;
                    console.log(`Restored inventory item ${item.inventoryId} (${item.productName}) back to Available status with audit trail`);
                }
            }
            
            // === 3. Create New Invoice for Exchange Items (Simplified) ===
            if (exchangeItems.length > 0) {
                const newInvoiceNumber = await getLatestInvoiceNumber();
                const newInvoiceRef = doc(collection(dataDocRef, INVOICES_COLLECTION));
                const finalAmountPaidOnNewInvoice = creditToApply + totalNewPayment;
                const newInvoiceStatus: Invoice['status'] = finalAmountPaidOnNewInvoice >= exchangeTotal ? 'Paid' : (finalAmountPaidOnNewInvoice > 0 ? 'Partial' : 'Unpaid');

                // Create simplified invoice (without complex helper functions for now)
                const newInvoiceData = {
                    invoiceNumber: newInvoiceNumber,
                    customerId: customer.id,
                    customerName: originalInvoice.customer?.name || customer.name,
                    subtotal: exchangeTotal, 
                    tax: 0, 
                    discount: 0, 
                    total: exchangeTotal,
                    issueDate: new Date().toISOString().split('T')[0],
                    dueDate: new Date().toISOString().split('T')[0],
                    status: newInvoiceStatus,
                    amountPaid: finalAmountPaidOnNewInvoice,
                    paymentIds: [],
                    relatedCreditNoteId: creditNoteRef.id,
                    createdAt: serverTimestamp()
                };

                transaction.set(newInvoiceRef, newInvoiceData);
                
                // Create invoice items
                for (const item of exchangeItems) {
                    const itemRef = doc(collection(newInvoiceRef, 'items'));
                    transaction.set(itemRef, {
                        ...item,
                        invoiceId: newInvoiceRef.id,
                        createdAt: serverTimestamp()
                    });
                }
                
                transaction.update(creditNoteRef, { newExchangeInvoiceId: newInvoiceRef.id, status: 'fully_used' });
            }
            
            // === 4. Simplified Refund Handling ===
            if (remainingCreditAfterExchange > 0 && refundMethod) {
                // Create simplified refund payment record
                const refundPaymentRef = doc(collection(dataDocRef, PAYMENTS_COLLECTION));
                const refundPaymentData = {
                    customerId: customer.id,
                    paymentDate: serverTimestamp(),
                    recordedBy: 'admin_user',
                    amountPaid: -remainingCreditAfterExchange, // Negative for refund
                    type: 'refund',
                    appliedToInvoices: [],
                    tenderDetails: [{
                        method: refundMethod,
                        amount: remainingCreditAfterExchange
                    }],
                    sourceCreditNoteId: creditNoteRef.id,
                    createdAt: serverTimestamp()
                };
                
                transaction.set(refundPaymentRef, refundPaymentData);
                transaction.update(creditNoteRef, { refundPaymentId: refundPaymentRef.id, status: 'refunded' });
            }            // === 5. Update Customer Debt (Only for Store Credit) ===
            // Only add to debt if refund method is Store Credit
            // Cash/Card refunds are actual money transactions, not store credit
            if (remainingCreditAfterExchange > 0 && refundMethod === 'StoreCredit') {
                const debtChange = -remainingCreditAfterExchange; // Negative debt = store credit
                if (customerDoc.exists()) {
                    transaction.update(customerRef, { debt: increment(debtChange) });
                    console.log(`Added store credit of $${remainingCreditAfterExchange} to customer ${customer.name}`);
                } else {
                    console.warn(`Customer ${customer.id} not found in database path, skipping debt update`);
                }
            }
            // For Cash/Card refunds, no debt update needed - it's a real money transaction
        });

        // Revalidate paths after successful transaction
        revalidatePath('/dashboard/invoices');
        revalidatePath(`/dashboard/invoices/${originalInvoice.id}`);
        revalidatePath('/dashboard/inventory');
        revalidatePath('/dashboard/inventory/history');
        revalidatePath('/dashboard/customers');
        revalidatePath(`/dashboard/customers/${customer.id}`);
        revalidatePath('/dashboard/finance');

        console.log(`✓ Refund/exchange processed successfully. Restored ${restoredCount} items to inventory.`);
        return { success: true };
    } catch (error) {
        console.error('Error processing refund/exchange:', error);
        if (error instanceof Error) {
            return { success: false, error: `Transaction failed: ${error.message}` };
        }
        return { success: false, error: 'An unknown error occurred during the refund process.' };
    }
}
