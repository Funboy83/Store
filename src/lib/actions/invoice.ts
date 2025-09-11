
'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { db, isConfigured } from '@/lib/firebase';
import { collection, getDocs, query, orderBy, limit, addDoc, serverTimestamp, writeBatch, doc, getDoc, collectionGroup } from 'firebase/firestore';
import { summarizeInvoice } from '@/ai/flows/invoice-summary';
import type { Invoice, InvoiceItem, Product, Customer, InvoiceDetail } from '@/lib/types';
import { getInventory } from './inventory';
import { getCustomers } from './customers';


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


export async function getInvoices(): Promise<InvoiceDetail[]> {
  if (!isConfigured) {
    return [];
  }
  try {
    const dataDocRef = doc(db, DATA_PATH);
    const invoicesCollectionRef = collection(dataDocRef, INVOICES_COLLECTION);
    const q = query(invoicesCollectionRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);

    const customers = await getCustomers();
    const customerMap = new Map(customers.map(c => [c.id, c]));

    const invoiceDetails: InvoiceDetail[] = [];

    for (const invoiceDoc of snapshot.docs) {
      const invoiceData = { id: invoiceDoc.id, ...invoiceDoc.data() } as Invoice;
      
      const itemsCollectionRef = collection(invoiceDoc.ref, 'invoice_items');
      const itemsSnapshot = await getDocs(itemsCollectionRef);
      const items = itemsSnapshot.docs.map(itemDoc => ({ id: itemDoc.id, ...itemDoc.data() } as InvoiceItem));

      const customer = customerMap.get(invoiceData.customerId) || {
        id: invoiceData.customerId,
        name: invoiceData.customerId === 'walk-in' ? 'Walk-in Customer' : 'Unknown Customer',
        email: '',
        phone: ''
      } as Customer;
      
      invoiceDetails.push({
        ...invoiceData,
        customer,
        items,
      });
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
  customer: Customer;
}

export async function sendInvoice({ invoiceData, items, customer }: SendInvoiceData) {
    if (!isConfigured) {
        return { success: false, error: 'Firebase is not configured.' };
    }

    try {
        const batch = writeBatch(db);
        const dataDocRef = doc(db, DATA_PATH);
        const currentInventory = await getInventory();

        // 1. Add primary invoice document
        const invoiceRef = doc(collection(dataDocRef, INVOICES_COLLECTION));
        batch.set(invoiceRef, {
            ...invoiceData,
            status: 'Pending',
            createdAt: serverTimestamp(),
        });

        // 2. Add each item to the 'invoice_items' subcollection
        for (const item of items) {
          const itemRef = doc(collection(invoiceRef, 'invoice_items'));
          batch.set(itemRef, item);
        }

        // 3. Move sold items from inventory to inventory_history
        for (const item of items) {
            if (!item.isCustom) {
                const product = currentInventory.find(p => p.id === item.id);
                if (product) {
                    const historyRef = doc(collection(dataDocRef, INVENTORY_HISTORY_COLLECTION));
                    const productHistory = {
                        ...product,
                        status: 'Sold',
                        amount: item.total,
                        movedAt: serverTimestamp(),
                        customerId: customer.id,
                        customerName: customer.name,
                    };
                    batch.set(historyRef, productHistory);

                    const inventoryItemRef = doc(collection(dataDocRef, INVENTORY_COLLECTION), item.id);
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
