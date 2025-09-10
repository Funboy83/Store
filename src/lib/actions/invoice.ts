
'use server';

import { summarizeInvoice } from '@/ai/flows/invoice-summary';
import type { InvoiceItem } from '@/lib/types';
import { z } from 'zod';
import { db, isConfigured } from '@/lib/firebase';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';

const InvoiceSummarySchema = z.object({
  items: z.array(z.object({
    productName: z.string(),
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
      .map(item => `${item.quantity} x ${item.productName} @ $${item.unitPrice.toFixed(2)}`)
      .join('\n');
    
    const result = await summarizeInvoice({ invoiceItems: itemsString });
    return { summary: result.summary };
  } catch (error) {
    console.error('Error getting invoice summary:', error);
    return { error: 'Failed to generate summary.' };
  }
}

const INVOICES_PATH = 'cellphone-inventory-system/data/invoices';

export async function getLatestInvoiceNumber(): Promise<number> {
  if (!isConfigured) {
    return 1000;
  }
  try {
    const invoicesCollection = collection(db, INVOICES_PATH);
    const q = query(invoicesCollection, orderBy('invoiceNumber', 'desc'), limit(1));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return 1000;
    }

    const latestInvoice = snapshot.docs[0].data();
    const latestNumberStr = latestInvoice.invoiceNumber.replace('UXERFLOW-INV', '');
    const latestNumber = parseInt(latestNumberStr, 10);
    
    if (isNaN(latestNumber)) {
        return 1000;
    }

    return latestNumber + 1;
  } catch (error) {
    console.error('Error fetching latest invoice number:', error);
    return 1000;
  }
}
