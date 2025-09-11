
'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { db, isConfigured } from '@/lib/firebase';
import { collection, getDocs, query, orderBy, limit, addDoc, serverTimestamp, writeBatch, doc, getDoc, collectionGroup, deleteDoc, where } from 'firebase/firestore';
import { summarizeInvoice } from '@/ai/flows/invoice-summary';
import type { Invoice, InvoiceItem, Product, Customer, InvoiceDetail, InvoiceHistory } from '@/lib/types';
import { getInventory } from './inventory';

const InvoiceSummarySchema = z.object({
  items: z.array(z.object({
    productName: z.string(),
    description: z.string().optional(),
    quantity: z.number(),
    unitPrice: z.number(),
  }))
});

export async function getInvoiceSummary(items: InvoiceItem[]): Promise<{ summary?: string; error?: string }> {
  try {
    const parsedItems = InvoiceSummarySchema.safeParse({ items });
    if (!parsedItems.success) {
      return { error: 'Invalid item format.' };
    }

    const itemsString = parsedItems.data.items
      .map(item => `${item.quantity} x ${item.productName} (${item.description || 'Custom Item'}) @ $${item.unitPrice.toFixed(2)}`)
      .join('\n');
    
    const result = await summarizeInvoice({ invoiceItems: itemsString });
    return { summary: result.summary };
  } catch (error) {
    console.error('Error getting invoice summary:', error);
    return { error: 'Failed to generate summary.' };
  }
}

const DATA_PATH = 'cellphone-inventory-system/data';
const INVOICES_COLLECTION = 'invoices';
const INVENTORY_COLLECTION = 'inventory';
const INVENTORY_HISTORY_COLLECTION = 'inventory_history';
const INVOICES_HISTORY_COLLECTION = 'invoices_history';
const CUSTOMERS_COLLECTION = 'customers';


export async function getInvoices(): Promise<InvoiceDetail[]> {
  if (!isConfigured) {
    return [];
  }
  try {
    const dataDocRef = doc(db, DATA_PATH);
    const invoicesCollectionRef = collection(dataDocRef, INVOICES_COLLECTION);
    const customersCollectionRef = collection(dataDocRef, CUSTOMERS_COLLECTION);

    const q = query(invoicesCollectionRef, orderBy('createdAt', 'desc'));
    
    const [invoiceSnapshot, customersSnapshot] = await Promise.all([
        getDocs(q),
        getDocs(customersCollectionRef),
    ]);

    const customerMap = new Map<string, Customer>();
    customersSnapshot.docs.forEach(doc => {
      const data = doc.data();
      customerMap.set(doc.id, {
        id: doc.id,
        name: data.name,
        email: data.email,
        phone: data.phone,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : new Date().toISOString(),
        totalInvoices: 0,
        totalSpent: 0,
      } as Customer);
    });

    const invoiceDetails: InvoiceDetail[] = [];

    for (const invoiceDoc of invoiceSnapshot.docs) {
      const invoiceData = invoiceDoc.data() as Invoice;
      const createdAt = invoiceData.createdAt?.toDate ? invoiceData.createdAt.toDate().toISOString() : new Date().toISOString();
      

      const itemsCollectionRef = collection(invoiceDoc.ref, 'invoice_items');
      const itemsSnapshot = await getDocs(itemsCollectionRef);
      const items = itemsSnapshot.docs.map(itemDoc => ({ id: itemDoc.id, ...itemDoc.data() } as InvoiceItem));

      const customer = customerMap.get(invoiceData.customerId);
      
      if (customer) {
        const invoiceBase = { id: invoiceDoc.id, ...invoiceData, createdAt } as Invoice;
        invoiceDetails.push({
          ...invoiceBase,
          customer,
          items,
        });
      }
    }

    return invoiceDetails;
  } catch (error) {
      console.error('Error fetching invoices:', error);
      return [];
  }
}

export async function getLatestInvoiceNumber(): Promise<number> {
  if (!isConfigured) {
    return 1000;
  }
  try {
    const dataDocRef = doc(db, DATA_PATH);
    const invoicesCollectionRef = collection(dataDocRef, INVOICES_COLLECTION);
    const q = query(invoicesCollectionRef, orderBy('createdAt', 'desc'), limit(1));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return 1000;
    }

    const latestInvoice = snapshot.docs[0].data();
    const latestNumber = parseInt(latestInvoice.invoiceNumber, 10);
    
    if (isNaN(latestNumber)) {
        return 1000;
    }

    return latestNumber + 1;
  } catch (error) {
    console.error('Error fetching latest invoice number:', error);
    return 1000;
  }
}

interface SendInvoiceData {
  invoiceData: Omit<Invoice, 'id' | 'createdAt' | 'status'>;
  items: InvoiceItem[];
  customer?: Customer;
}

export async function sendInvoice({ invoiceData, items, customer }: SendInvoiceData) {
    if (!isConfigured) {
        return { success: false, error: 'Firebase is not configured.' };
    }

    if (!customer) {
      return { success: false, error: 'Customer is required.' };
    }

    try {
        const batch = writeBatch(db);
        const dataDocRef = doc(db, DATA_PATH);
        
        const invoiceRef = doc(collection(dataDocRef, INVOICES_COLLECTION));
        
        const finalInvoiceData: any = {
            ...invoiceData,
            status: 'Pending',
            customerId: customer.id,
            createdAt: serverTimestamp(),
        };

        batch.set(invoiceRef, finalInvoiceData);

        for (const item of items) {
          const itemRef = doc(collection(invoiceRef, 'invoice_items'));
          
          const itemData: any = { ...item };
          if (!item.isCustom) {
            itemData.inventoryId = item.id;
          }
          batch.set(itemRef, itemData);

          if (!item.isCustom && item.id) {
              const inventoryItemRef = doc(collection(dataDocRef, INVENTORY_COLLECTION), item.id);
              const inventoryItemSnap = await getDoc(inventoryItemRef);

              if (inventoryItemSnap.exists()) {
                  const product = { id: inventoryItemSnap.id, ...inventoryItemSnap.data() } as Product;
                  const historyRef = doc(collection(dataDocRef, INVENTORY_HISTORY_COLLECTION));
                  const productHistory = {
                      ...product,
                      status: 'Sold' as const,
                      amount: item.total,
                      movedAt: serverTimestamp(),
                      customerId: finalInvoiceData.customerId,
                      customerName: finalInvoiceData.customerName || customer?.name,
                      invoiceId: invoiceRef.id,
                  };
                  batch.set(historyRef, productHistory);
                  batch.delete(inventoryItemRef);
              }
          }
        }
        
        await batch.commit();

        revalidatePath('/dashboard/invoices');
        revalidatePath('/dashboard/inventory');
        revalidatePath('/dashboard/inventory/history');
        
        return { success: true, invoiceId: invoiceRef.id };

    } catch (error) {
        console.error('Error sending invoice and updating inventory:', error);
        if (error instanceof Error) {
            return { success: false, error: `Failed to send invoice: ${error.message}` };
        }
        return { success: false, error: 'An unknown error occurred while sending the invoice.' };
    }
}


export async function archiveInvoice(invoice: InvoiceDetail): Promise<{ success: boolean, error?: string }> {
  if (!isConfigured) {
    return { success: false, error: 'Firebase is not configured.' };
  }

  try {
    const batch = writeBatch(db);
    const dataDocRef = doc(db, DATA_PATH);

    const historyInvoiceRef = doc(dataDocRef, `${INVOICES_HISTORY_COLLECTION}/${invoice.id}`);
    const { items, customer, ...invoiceBase } = invoice;
    const historyInvoiceData: Omit<InvoiceHistory, 'archivedAt'> & {customerName?: string} = {
      ...invoiceBase,
      customerId: customer.id,
      customerName: customer.name,
      status: 'Voided',
    }
    
    batch.set(historyInvoiceRef, {
      ...historyInvoiceData,
      archivedAt: serverTimestamp(),
    });

    for (const item of items) {
      const historyItemRef = doc(historyInvoiceRef, `invoice_items/${item.id}`);
      batch.set(historyItemRef, item);
    }

    const inventoryHistoryRef = collection(dataDocRef, INVENTORY_HISTORY_COLLECTION);
    const q = query(inventoryHistoryRef, where('invoiceId', '==', invoice.id));
    const historyItemsSnap = await getDocs(q);

    for (const docSnap of historyItemsSnap.docs) {
      const historyItem = docSnap.data();
      
      const { status, amount, movedAt, customerId, customerName, invoiceId, ...originalProduct } = historyItem;

      const inventoryRef = doc(dataDocRef, `${INVENTORY_COLLECTION}/${originalProduct.id}`);
      batch.set(inventoryRef, originalProduct); 
      batch.delete(docSnap.ref);
    }
    
    const originalInvoiceRef = doc(dataDocRef, `${INVOICES_COLLECTION}/${invoice.id}`);
    const originalItemsRef = collection(originalInvoiceRef, 'invoice_items');
    const originalItemsSnap = await getDocs(originalItemsRef);
    for (const itemDoc of originalItemsSnap.docs) {
      batch.delete(itemDoc.ref);
    }
    batch.delete(originalInvoiceRef);

    await batch.commit();

    revalidatePath('/dashboard/invoices');
    revalidatePath('/dashboard/inventory');
    revalidatePath('/dashboard/inventory/history');

    return { success: true };
  } catch (error) {
    console.error('Error archiving invoice:', error);
    if (error instanceof Error) {
      return { success: false, error: `Failed to archive invoice: ${error.message}` };
    }
    return { success: false, error: 'An unknown error occurred while archiving the invoice.' };
  }
}

    