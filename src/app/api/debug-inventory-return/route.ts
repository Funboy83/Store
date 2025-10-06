import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { 
  collection, 
  getDocs, 
  doc,
  getDoc,
  query,
  where
} from 'firebase/firestore';

const DATA_PATH = 'app-data/cellsmart-data';
const INVENTORY_COLLECTION = 'inventory';
const INVENTORY_HISTORY_COLLECTION = 'inventory_history';
const CREDIT_NOTES_COLLECTION = 'credit_notes';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const creditNoteId = searchParams.get('creditNoteId');
    
    if (!creditNoteId) {
      return NextResponse.json({ error: 'Credit note ID required' }, { status: 400 });
    }
    
    const results = {
      creditNoteId,
      creditNote: null as any,
      inventoryItems: [] as any[],
      returnedItems: [] as any[]
    };
    
    // Get credit note
    const dataDocRef = doc(db, DATA_PATH);
    const creditNoteRef = doc(dataDocRef, `${CREDIT_NOTES_COLLECTION}/${creditNoteId}`);
    const creditNoteDoc = await getDoc(creditNoteRef);
    
    if (!creditNoteDoc.exists()) {
      return NextResponse.json({ error: 'Credit note not found' }, { status: 404 });
    }
    
    results.creditNote = { id: creditNoteDoc.id, ...creditNoteDoc.data() };
    results.returnedItems = results.creditNote.items || [];
    
    // Check inventory status for each returned item
    const inventoryChecks = [];
    for (const item of results.returnedItems) {
      if (!item.isCustom && item.inventoryId) {
        try {
          // Check current inventory
          const inventoryRef = doc(dataDocRef, `${INVENTORY_COLLECTION}/${item.inventoryId}`);
          const inventoryDoc = await getDoc(inventoryRef);
          
          let status = 'NOT_FOUND';
          let found = false;
          let data = null;
          let note = '';
          
          if (inventoryDoc.exists()) {
            // Item exists in current inventory
            status = inventoryDoc.data()?.status || 'Unknown';
            found = true;
            data = inventoryDoc.data();
            note = 'Item found in current inventory';
          } else {
            // Check if item is in history (was sold)
            const historyQuery = query(
              collection(dataDocRef, INVENTORY_HISTORY_COLLECTION),
              where('id', '==', item.inventoryId),
              where('invoiceId', '==', results.creditNote.originalInvoiceId)
            );
            const historySnapshot = await getDocs(historyQuery);
            
            if (!historySnapshot.empty) {
              const historyData = historySnapshot.docs[0].data();
              status = 'IN_HISTORY';
              found = true;
              data = historyData;
              note = 'Item found in inventory history (was sold and can be restored)';
            } else {
              status = 'NOT_FOUND';
              note = 'Item not found in inventory or history';
            }
          }
          
          inventoryChecks.push({
            itemName: item.productName,
            inventoryId: item.inventoryId,
            found,
            status,
            data,
            note
          });
        } catch (error) {
          inventoryChecks.push({
            itemName: item.productName,
            inventoryId: item.inventoryId,
            found: false,
            status: 'ERROR',
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      } else {
        inventoryChecks.push({
          itemName: item.productName,
          inventoryId: item.inventoryId || 'N/A',
          found: false,
          status: 'CUSTOM_ITEM',
          note: 'Custom items are not tracked in inventory'
        });
      }
    }
    
    results.inventoryItems = inventoryChecks;
    
    return NextResponse.json(results);
  } catch (error) {
    console.error('Inventory check error:', error);
    return NextResponse.json({ 
      error: 'Failed to check inventory', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}