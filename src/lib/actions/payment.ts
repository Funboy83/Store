
'use server';

import { revalidatePath } from 'next/cache';
import { db, isConfigured } from '@/lib/firebase';
import { collection, doc, runTransaction, serverTimestamp, getDocs, where, query, orderBy, increment } from 'firebase/firestore';
import type { Invoice, Customer, TenderDetail, Payment, PaymentDetail } from '@/lib/types';
import { getCustomers } from './customers';

interface ApplyPaymentPayload {
  customerId: string;
  cashAmount: number;
  checkAmount: number;
  cardAmount: number;
  notes?: string;
}

const DATA_PATH = 'cellphone-inventory-system/data';
const PAYMENTS_COLLECTION = 'payments';
const INVOICES_COLLECTION = 'invoices';
const CUSTOMERS_COLLECTION = 'customers';

export async function getPayments(): Promise<PaymentDetail[]> {
  if (!isConfigured) {
    return [];
  }
  try {
    const dataDocRef = doc(db, DATA_PATH);
    const paymentsCollectionRef = collection(dataDocRef, PAYMENTS_COLLECTION);
    
    const [paymentsSnapshot, customers] = await Promise.all([
      getDocs(query(paymentsCollectionRef, orderBy('paymentDate', 'desc'))),
      getCustomers()
    ]);
    
    const customerMap = new Map<string, Customer>();
    customers.forEach(customer => customerMap.set(customer.id, customer));
    
    return paymentsSnapshot.docs.map(doc => {
      const data = doc.data() as Payment;
      const paymentDate = data.paymentDate?.toDate ? data.paymentDate.toDate() : (data.paymentDate ? new Date(data.paymentDate) : new Date());
      const customer = data.customerId ? customerMap.get(data.customerId) : undefined;
      
      return { 
        id: doc.id, 
        ...data,
        paymentDate: paymentDate.toISOString(),
        customerName: customer ? customer.name : 'N/A',
      } as PaymentDetail;
    });

  } catch (error) {
    console.error('Error fetching payments:', error);
    return [];
  }
}

export async function applyPayment(payload: ApplyPaymentPayload): Promise<{ success: boolean; error?: string }> {
  if (!isConfigured) {
    return { success: false, error: 'Firebase is not configured.' };
  }

  const { customerId, cashAmount, checkAmount, cardAmount, notes } = payload;
  const totalPaid = cashAmount + checkAmount + cardAmount;

  if (totalPaid <= 0) {
    return { success: false, error: 'Payment amount must be greater than zero.' };
  }

  try {
    await runTransaction(db, async (transaction) => {
      const dataDocRef = doc(db, DATA_PATH);
      const customerRef = doc(dataDocRef, `${CUSTOMERS_COLLECTION}/${customerId}`);
      const invoicesCollectionRef = collection(dataDocRef, INVOICES_COLLECTION);
      
      // --- 1. READ PHASE ---
      const customerDoc = await transaction.get(customerRef);
      if (!customerDoc.exists()) {
        throw new Error("Customer not found.");
      }

      const outstandingInvoicesQuery = query(
        invoicesCollectionRef,
        where('customerId', '==', customerId),
        where('status', 'in', ['Unpaid', 'Partial'])
      );
      
      const querySnapshot = await getDocs(outstandingInvoicesQuery);
      
      const outstandingInvoices = querySnapshot.docs
        .map(d => ({ id: d.id, ...d.data() } as Invoice))
        .sort((a, b) => new Date(a.issueDate).getTime() - new Date(b.issueDate).getTime());

      // --- 2. LOGIC/CALCULATION PHASE (IN-MEMORY) ---
      let paymentRemaining = totalPaid;
      const appliedInvoiceIds: string[] = [];
      const invoiceUpdates: { ref: any; data: any }[] = [];

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
        
        invoiceUpdates.push({
          ref: invoiceRef,
          data: {
            amountPaid: newAmountPaid,
            status: newStatus,
            paymentIds: [...(invoice.paymentIds || []), 'placeholder_payment_id'], // Placeholder
          }
        });

        appliedInvoiceIds.push(invoice.id);
        paymentRemaining -= amountToApply;
      }
      
      const currentDebt = customerDoc.data().debt || 0;
      const newDebt = Math.max(0, currentDebt - totalPaid);

      // --- 3. WRITE PHASE ---
      const paymentRef = doc(collection(dataDocRef, PAYMENTS_COLLECTION));
      const tenderDetails: TenderDetail[] = [];
      if (cashAmount > 0) tenderDetails.push({ method: 'Cash', amount: cashAmount });
      if (checkAmount > 0) tenderDetails.push({ method: 'Check', amount: checkAmount });
      if (cardAmount > 0) tenderDetails.push({ method: 'Card/Zelle/Wire', amount: cardAmount });

      const paymentData: any = {
        customerId: customerId,
        paymentDate: serverTimestamp(),
        recordedBy: 'admin_user', // Hardcoded user
        amountPaid: totalPaid,
        appliedToInvoices: appliedInvoiceIds,
        tenderDetails: tenderDetails,
      };

      if (notes) {
        paymentData.notes = notes;
      }
      
      transaction.set(paymentRef, paymentData);

      for (const update of invoiceUpdates) {
        const paymentIds = update.data.paymentIds.map((id: string) => id === 'placeholder_payment_id' ? paymentRef.id : id);
        transaction.update(update.ref, { ...update.data, paymentIds });
      }
      
      transaction.update(customerRef, { debt: newDebt });
    });

    revalidatePath(`/dashboard/customers/${customerId}`);
    revalidatePath(`/dashboard/customers/${customerId}/payment`);
    revalidatePath('/dashboard/invoices');
    revalidatePath('/dashboard/finance');


    return { success: true };

  } catch (error) {
    console.error('Error applying payment:', error);
    if (error instanceof Error) {
      return { success: false, error: `Failed to apply payment: ${error.message}` };
    }
    return { success: false, error: 'An unknown error occurred while applying the payment.' };
  }
}
