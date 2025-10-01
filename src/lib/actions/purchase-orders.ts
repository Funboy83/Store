'use server';

import { 
  collection, 
  doc, 
  addDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy, 
  serverTimestamp,
  where,
  getDoc
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { PurchaseOrder, PurchaseOrderItem, Part } from '@/lib/types';
import { revalidatePath } from 'next/cache';
import { createBatch, calculateTotalQuantity, calculateAverageCost } from '@/lib/batch-utils';

const DATA_PATH = 'app-data/cellsmart-data';
const PURCHASE_ORDERS_COLLECTION = 'purchase-orders';
const PARTS_COLLECTION = 'parts';

// Check if Firebase is configured
const isConfigured = !!db;

// Create a new purchase order (initially as draft)
export async function createPurchaseOrder(
  orderData: Omit<PurchaseOrder, 'id' | 'createdAt' | 'updatedAt' | 'status' | 'totalItems' | 'totalCost'>
): Promise<{ success: boolean; error?: string; orderId?: string }> {
  if (!isConfigured) {
    return { success: false, error: 'Firebase is not configured.' };
  }

  try {
    const totalItems = orderData.items.reduce((sum, item) => sum + item.quantityReceived, 0);
    const totalCost = orderData.items.reduce((sum, item) => sum + item.totalCost, 0);

    const order: Omit<PurchaseOrder, 'id'> = {
      ...orderData,
      totalItems,
      totalCost,
      status: 'draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const dataDocRef = doc(db, DATA_PATH);
    const ordersRef = collection(dataDocRef, PURCHASE_ORDERS_COLLECTION);
    
    const docRef = await addDoc(ordersRef, {
      ...order,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    revalidatePath('/dashboard/restock');
    revalidatePath('/dashboard/purchase-orders');

    return { success: true, orderId: docRef.id };
  } catch (error) {
    console.error('Error creating purchase order:', error);
    return { success: false, error: 'Failed to create purchase order.' };
  }
}

// Commit purchase order to inventory (FIFO Implementation)
export async function commitPurchaseOrderToInventory(
  orderId: string
): Promise<{ success: boolean; error?: string; message?: string }> {
  if (!isConfigured) {
    return { success: false, error: 'Firebase is not configured.' };
  }

  try {
    // Get the purchase order
    const dataDocRef = doc(db, DATA_PATH);
    const orderRef = doc(dataDocRef, PURCHASE_ORDERS_COLLECTION, orderId);
    const orderDoc = await getDoc(orderRef);

    if (!orderDoc.exists()) {
      return { success: false, error: 'Purchase order not found.' };
    }

    const order = { id: orderDoc.id, ...orderDoc.data() } as PurchaseOrder;

    if (order.status === 'committed') {
      return { success: false, error: 'Purchase order has already been committed to inventory.' };
    }

    // Process each item in the purchase order
    const partsRef = collection(dataDocRef, PARTS_COLLECTION);
    let processedItems = 0;
    const errors: string[] = [];

    for (const item of order.items) {
      try {
        // Get the part document
        const partRef = doc(dataDocRef, PARTS_COLLECTION, item.partId);
        const partDoc = await getDoc(partRef);

        if (!partDoc.exists()) {
          errors.push(`Part ${item.partName} not found`);
          continue;
        }

        const part = { id: partDoc.id, ...partDoc.data() } as Part;

        // Create a new batch for this received stock
        const newBatch = createBatch(
          item.quantityReceived,
          item.costPerItem,
          order.supplierName,
          `Purchase Order #${order.referenceNumber || orderId} - ${order.purchaseDate}`
        );

        // Add the new batch to existing batches
        const updatedBatches = [...part.batches, newBatch];

        // Calculate new totals
        const newTotalQuantity = calculateTotalQuantity(updatedBatches);
        const newAvgCost = calculateAverageCost(updatedBatches);

        // Update the part document with new batch
        await updateDoc(partRef, {
          batches: updatedBatches,
          totalQuantityInStock: newTotalQuantity,
          avgCost: newAvgCost,
          updatedAt: serverTimestamp()
        });

        processedItems++;
        console.log(`✅ Added batch ${newBatch.batchId} to ${item.partName}: ${item.quantityReceived} units @ $${item.costPerItem}`);

      } catch (error) {
        console.error(`Error processing item ${item.partName}:`, error);
        errors.push(`Failed to process ${item.partName}: ${error}`);
      }
    }

    // Update purchase order status to committed
    await updateDoc(orderRef, {
      status: 'committed',
      updatedAt: serverTimestamp()
    });

    revalidatePath('/dashboard/parts');
    revalidatePath('/dashboard/inventory');
    revalidatePath('/dashboard/restock');
    revalidatePath('/dashboard/purchase-orders');

    const successMessage = `Successfully committed ${processedItems} items to inventory`;
    
    if (errors.length > 0) {
      return { 
        success: true, 
        message: `${successMessage}. ${errors.length} items had errors: ${errors.join(', ')}` 
      };
    }

    return { success: true, message: successMessage };

  } catch (error) {
    console.error('Error committing purchase order to inventory:', error);
    return { success: false, error: 'Failed to commit purchase order to inventory.' };
  }
}

// Get all purchase orders
export async function getPurchaseOrders(): Promise<PurchaseOrder[]> {
  if (!isConfigured) {
    return [];
  }

  try {
    const dataDocRef = doc(db, DATA_PATH);
    const ordersRef = collection(dataDocRef, PURCHASE_ORDERS_COLLECTION);
    const q = query(ordersRef, orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || doc.data().createdAt,
      updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString() || doc.data().updatedAt,
      purchaseDate: doc.data().purchaseDate || new Date().toISOString(),
    })) as PurchaseOrder[];
  } catch (error) {
    console.error('Error fetching purchase orders:', error);
    return [];
  }
}

// Get a specific purchase order
export async function getPurchaseOrder(orderId: string): Promise<{ success: boolean; order?: PurchaseOrder; error?: string }> {
  if (!isConfigured) {
    return { success: false, error: 'Firebase is not configured.' };
  }

  try {
    const dataDocRef = doc(db, DATA_PATH);
    const orderRef = doc(dataDocRef, PURCHASE_ORDERS_COLLECTION, orderId);
    const orderDoc = await getDoc(orderRef);

    if (!orderDoc.exists()) {
      return { success: false, error: 'Purchase order not found.' };
    }

    const order = {
      id: orderDoc.id,
      ...orderDoc.data(),
      createdAt: orderDoc.data()?.createdAt?.toDate?.()?.toISOString() || orderDoc.data()?.createdAt,
      updatedAt: orderDoc.data()?.updatedAt?.toDate?.()?.toISOString() || orderDoc.data()?.updatedAt,
      purchaseDate: orderDoc.data()?.purchaseDate || new Date().toISOString(),
    } as PurchaseOrder;

    return { success: true, order };
  } catch (error) {
    console.error('Error fetching purchase order:', error);
    return { success: false, error: 'Failed to fetch purchase order.' };
  }
}

// Delete a purchase order (only if not committed)
export async function deletePurchaseOrder(orderId: string): Promise<{ success: boolean; error?: string }> {
  if (!isConfigured) {
    return { success: false, error: 'Firebase is not configured.' };
  }

  try {
    // Check if order exists and is not committed
    const orderResult = await getPurchaseOrder(orderId);
    if (!orderResult.success || !orderResult.order) {
      return { success: false, error: 'Purchase order not found.' };
    }

    if (orderResult.order.status === 'committed') {
      return { success: false, error: 'Cannot delete committed purchase orders.' };
    }

    const dataDocRef = doc(db, DATA_PATH);
    const orderRef = doc(dataDocRef, PURCHASE_ORDERS_COLLECTION, orderId);
    await deleteDoc(orderRef);

    revalidatePath('/dashboard/restock');
    revalidatePath('/dashboard/purchase-orders');

    return { success: true };
  } catch (error) {
    console.error('Error deleting purchase order:', error);
    return { success: false, error: 'Failed to delete purchase order.' };
  }
}