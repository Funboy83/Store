import { db, isConfigured } from '@/lib/firebase';
import { doc, collection, query, where, orderBy, limit, getDocs, getDoc, startAfter } from 'firebase/firestore';
import { InvoiceDetail, Invoice, InvoiceItem, Customer } from '@/lib/types';

// Constants
const DATA_PATH = "app-data/cellsmart-data";
const INVOICES_COLLECTION = "invoices";
const CUSTOMERS_COLLECTION = "customers";

// Add this to your invoice actions for better performance
export async function getInvoicesPaginated(
  pageSize: number = 20,
  lastInvoiceId?: string
): Promise<{ invoices: InvoiceDetail[]; hasMore: boolean; lastDocId?: string }> {
  if (!isConfigured) {
    return { invoices: [], hasMore: false };
  }

  try {
    const dataDocRef = doc(db, DATA_PATH);
    const invoicesCollectionRef = collection(dataDocRef, INVOICES_COLLECTION);
    
    let invoicesQuery = query(
      invoicesCollectionRef,
      where('status', '!=', 'Voided'),
      orderBy('createdAt', 'desc'),
      limit(pageSize + 1) // Get one extra to check if there are more
    );

    // If we have a lastInvoiceId, start after that document
    if (lastInvoiceId) {
      const lastDocRef = doc(dataDocRef, `${INVOICES_COLLECTION}/${lastInvoiceId}`);
      const lastDocSnap = await getDoc(lastDocRef);
      if (lastDocSnap.exists()) {
        invoicesQuery = query(
          invoicesCollectionRef,
          where('status', '!=', 'Voided'),
          orderBy('createdAt', 'desc'),
          startAfter(lastDocSnap),
          limit(pageSize + 1)
        );
      }
    }

    const [invoiceSnapshot, customersSnapshot] = await Promise.all([
      getDocs(invoicesQuery),
      getDocs(collection(dataDocRef, CUSTOMERS_COLLECTION))
    ]);

    const hasMore = invoiceSnapshot.docs.length > pageSize;
    const invoiceDocs = hasMore ? invoiceSnapshot.docs.slice(0, -1) : invoiceSnapshot.docs;

    const customerMap = new Map<string, Customer>();
    customersSnapshot.docs.forEach(docSnap => {
      const data = docSnap.data();
      customerMap.set(docSnap.id, {
        id: docSnap.id,
        name: data.name,
        email: data.email,
        phone: data.phone,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : new Date().toISOString(),
        totalInvoices: 0,
        totalSpent: 0,
        debt: data.debt || 0,
      } as Customer);
    });

    // Process invoices in parallel
    const invoicePromises = invoiceDocs.map(async (invoiceDoc) => {
      const invoiceData = invoiceDoc.data() as Invoice;
      const createdAt = invoiceData.createdAt?.toDate ? invoiceData.createdAt.toDate().toISOString() : new Date().toISOString();

      // Only fetch items for now, skip edit history for list view
      const itemsSnapshot = await getDocs(collection(invoiceDoc.ref, 'invoice_items'));
      const items = itemsSnapshot.docs.map(itemDoc => ({ id: itemDoc.id, ...itemDoc.data() } as InvoiceItem));

      let customer: Customer | undefined;
      if (invoiceData.customerId === 'Aj0l1O2kJcvlF3J0uVMX') {
        customer = customerMap.get('Aj0l1O2kJcvlF3J0uVMX');
        if (customer) {
          customer = { ...customer, name: invoiceData.customerName || 'Walk-In Customer' };
        }
      } else {
        customer = customerMap.get(invoiceData.customerId);
      }
      
      if (customer) {
        const invoiceBase = { ...invoiceData, id: invoiceDoc.id, createdAt } as Invoice;
        return {
          ...invoiceBase,
          customer,
          items,
          isEdited: false // Skip edit history check for list performance
        } as InvoiceDetail;
      }
      return null;
    });

    const invoiceResults = await Promise.all(invoicePromises);
    const invoices = invoiceResults.filter((invoice): invoice is InvoiceDetail => invoice !== null);

    return {
      invoices,
      hasMore,
      lastDocId: invoices.length > 0 ? invoices[invoices.length - 1].id : undefined
    };
  } catch (error) {
    console.error('Error fetching paginated invoices:', error);
    return { invoices: [], hasMore: false };
  }
}