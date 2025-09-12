
'use server';

import { revalidatePath } from 'next/cache';
import { db, isConfigured } from '@/lib/firebase';
import { collection, doc, runTransaction, serverTimestamp, getDocs, where, query, orderBy } from 'firebase/firestore';
import type { Invoice, Customer, TenderDetail } from '@/lib/types';

interface ApplyPaymentPayload {
  customerId: string;
  cashAmount: number;
  checkAmount: number;
  cardAmount: number;
}

const DATA_PATH = 'cellphone-inventory-system/data';
const PAYMENTS_COLLECTION = 'payments';
const INVOICES_COLLECTION = 'invoices';
const CUSTOMERS_COLLECTION = 'customers';

export async function applyPayment(payload: ApplyPaymentPayload): Promise<{ success: boolean; error?: string }> {
  if (!isConfigured) {
    return { success: false, error: 'Firebase is not configured.' };
  }

  const { customerId, cashAmount, checkAmount, cardAmount } = payload;
  const totalPaid = cashAmount + checkAmount + cardAmount;

  if (totalPaid <= 0) {
    return { success: false, error: 'Payment amount must be greater than zero.' };
  }

  try {
    await runTransaction(db, async (transaction) => {
      const dataDocRef = doc(db, DATA_PATH);
      
      // 1. Fetch outstanding invoices for the customer within the transaction
      const invoicesCollectionRef = collection(dataDocRef, INVOICES_COLLECTION);
      const outstandingInvoicesQuery = query(
        invoicesCollectionRef,
        where('customerId', '==', customerId),
        where('status', 'in', ['Unpaid', 'Partial']),
        orderBy('issueDate', 'asc')
      );
      
      const invoiceSnapshot = await getDocs(outstandingInvoicesQuery, { readTime: transaction.readTime });
      const outstandingInvoices = invoiceSnapshot.docs.map(d => ({ id: d.id, ...d.data() } as Invoice));

      let paymentRemaining = totalPaid;
      const appliedInvoiceIds: string[] = [];

      // 2. Create the payment record
      const paymentRef = doc(collection(dataDocRef, PAYMENTS_COLLECTION));
      const tenderDetails: TenderDetail[] = [];
      if (cashAmount > 0) tenderDetails.push({ method: 'Cash', amount: cashAmount });
      if (checkAmount > 0) tenderDetails.push({ method: 'Check', amount: checkAmount });
      if (cardAmount > 0) tenderDetails.push({ method: 'Card/Zelle/Wire', amount: cardAmount });

      // The appliedToInvoices will be filled in the loop below.
      transaction.set(paymentRef, {
        customerId: customerId,
        paymentDate: serverTimestamp(),
        recordedBy: 'admin_user', // Hardcoded user
        amountPaid: totalPaid,
        appliedToInvoices: [], // Will be updated later
        tenderDetails: tenderDetails,
      });

      // 3. Allocate payment to invoices
      for (const invoice of outstandingInvoices) {
        if (paymentRemaining <= 0) break;
        
        const invoiceRef = doc(dataDocRef, `${INVOICES_COLLECTION}/${invoice.id}`);
        const currentAmountPaid = invoice.amountPaid || 0;
        const amountDueOnInvoice = invoice.total - currentAmountPaid;
        
        if (amountDueOnInvoice <= 0) continue;

        const amountToApply = Math.min(paymentRemaining, amountDueOnInvoice);
        const newAmountPaid = currentAmountPaid + amountToApply;
        
        let newStatus: Invoice['status'] = 'Partial';
        if (newAmountPaid >= invoice.total) {
          newStatus = 'Paid';
        }

        transaction.update(invoiceRef, {
          amountPaid: newAmountPaid,
          status: newStatus,
          paymentIds: [...(invoice.paymentIds || []), paymentRef.id],
        });

        appliedInvoiceIds.push(invoice.id);
        paymentRemaining -= amountToApply;
      }

      // Update the payment record with the invoices it was applied to
      transaction.update(paymentRef, { appliedToInvoices: appliedInvoiceIds });
      
      // 4. Update customer's debt
      const customerRef = doc(dataDocRef, `${CUSTOMERS_COLLECTION}/${customerId}`);
      const customerDoc = await transaction.get(customerRef);
      if (customerDoc.exists()) {
          const currentDebt = customerDoc.data().debt || 0;
          const newDebt = Math.max(0, currentDebt - totalPaid);
          transaction.update(customerRef, { debt: newDebt });
      }
    });

    revalidatePath(`/dashboard/customers/${customerId}`);
    revalidatePath(`/dashboard/customers/${customerId}/payment`);
    revalidatePath('/dashboard/invoices');

    return { success: true };

  } catch (error) {
    console.error('Error applying payment:', error);
    if (error instanceof Error) {
      return { success: false, error: `Failed to apply payment: ${error.message}` };
    }
    return { success: false, error: 'An unknown error occurred while applying the payment.' };
  }
}
