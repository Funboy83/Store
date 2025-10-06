import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { 
  collection, 
  getDocs, 
  doc,
  writeBatch,
  query,
  where
} from 'firebase/firestore';

const DATA_PATH = 'app-data/cellsmart-data';
const INVENTORY_COLLECTION = 'inventory';
const INVENTORY_HISTORY_COLLECTION = 'inventory_history';

export async function POST(request: NextRequest) {
  try {
    const { creditNoteId, originalInvoiceId } = await request.json();
    
    if (!creditNoteId || !originalInvoiceId) {
      return NextResponse.json({ error: 'Credit note ID and original invoice ID required' }, { status: 400 });
    }
    
    const dataDocRef = doc(db, DATA_PATH);
    const results = {
      creditNoteId,
      originalInvoiceId,
      restoredItems: [] as any[],
      errors: [] as any[]
    };
    
    // Find all history items for this invoice
    const historyQuery = query(
      collection(dataDocRef, INVENTORY_HISTORY_COLLECTION),
      where('invoiceId', '==', originalInvoiceId)
    );
    
    const historySnapshot = await getDocs(historyQuery);
    
    if (historySnapshot.empty) {
      return NextResponse.json({ 
        error: 'No inventory history found for this invoice',
        results 
      });
    }
    
    const batch = writeBatch(db);
    let restoredCount = 0;
    
    for (const historyDoc of historySnapshot.docs) {
      const historyData = historyDoc.data();
      
      try {
        // Extract product data from history (remove history-specific fields)
        const { status, amount, movedAt, customerId, customerName, invoiceId, ...originalProduct } = historyData;
        
        // Clean up the data and ensure it's properly formatted
        const cleanProduct = {
          id: originalProduct.id,
          imei: originalProduct.imei || '',
          brand: originalProduct.brand || '',
          model: originalProduct.model || '',
          price: originalProduct.price || 0,
          storage: originalProduct.storage || '',
          grade: originalProduct.grade || '',
          color: originalProduct.color || '',
          carrier: originalProduct.carrier || '',
          battery: originalProduct.battery || 100,
          date: originalProduct.date || new Date().toISOString().split('T')[0],
          condition: originalProduct.condition || 'Used',
          status: 'Available' as const,
          createdAt: originalProduct.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        
        // Restore to inventory
        const inventoryRef = doc(dataDocRef, `${INVENTORY_COLLECTION}/${originalProduct.id}`);
        batch.set(inventoryRef, cleanProduct);
        
        // Remove from history
        batch.delete(historyDoc.ref);
        
        results.restoredItems.push({
          id: originalProduct.id,
          brand: originalProduct.brand,
          model: originalProduct.model,
          imei: originalProduct.imei,
          status: 'Restored to Available'
        });
        
        restoredCount++;
      } catch (error) {
        results.errors.push({
          historyId: historyDoc.id,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
    
    if (restoredCount > 0) {
      await batch.commit();
    }
    
    return NextResponse.json({ 
      success: true,
      message: `Successfully restored ${restoredCount} items to inventory`,
      results
    });
  } catch (error) {
    console.error('Manual restore error:', error);
    return NextResponse.json({ 
      error: 'Failed to restore items', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}