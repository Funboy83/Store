
'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { db, isConfigured } from '@/lib/firebase';
import { collection, getDocs, query, orderBy, limit, addDoc, serverTimestamp, writeBatch, doc } from 'firebase/firestore';
import { summarizeInvoice } from '@/ai/flows/invoice-summary';
import type { Invoice, InvoiceItem, Product } from '@/lib/types';
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

const INVOICES_PATH = 'cellphone-inventory-system/data/invoices';
const INVENTORY_PATH = 'cellphone-inventory-system/data/inventory';
const INVENTORY_HISTORY_PATH = 'cellphone-inventory-system/data/inventory_history';

export async function getLatestInvoiceNumber(): Promise<number> {
  if (!isConfigured) {
    return 1000;
  }
  try {
    const invoicesCollection = collection(db, INVOICES_PATH);
    const q = query(invoicesCollection, orderBy('createdAt', 'desc'), limit(1));
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

export async function sendInvoice(invoiceData: Omit<Invoice, 'id' | 'status'>) {
    if (!isConfigured) {
        return { success: false, error: 'Firebase is not configured.' };
    }

    try {
        const batch = writeBatch(db);
        const currentInventory = await getInventory();

        // 1. Add invoice to the invoices collection
        const invoiceRef = doc(collection(db, INVOICES_PATH));
        batch.set(invoiceRef, {
            ...invoiceData,
            status: 'Pending', // Or whatever default status
            createdAt: serverTimestamp(),
        });

        // 2. Move sold items from inventory to inventory_history
        for (const item of invoiceData.items) {
            if (!item.isCustom) {
                const product = currentInventory.find(p => p.id === item.id);
                if (product) {
                    const historyRef = doc(collection(db, INVENTORY_HISTORY_PATH));
                    const productHistory = {
                        ...product,
                        status: 'Sold',
                        amount: item.total,
                        movedAt: serverTimestamp(),
                        customerId: invoiceData.customer.id,
                    };
                    batch.set(historyRef, productHistory);

                    const inventoryItemRef = doc(db, INVENTORY_PATH, item.id);
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
