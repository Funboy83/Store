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
  where
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { GeneralItem, GeneralItemHistory, PartBatch, BatchConsumptionResult } from '@/lib/types';
import { revalidatePath } from 'next/cache';
import { 
  generateBatchId, 
  createBatch, 
  calculateTotalQuantity, 
  calculateAverageCost, 
  findOldestAvailableBatch 
} from '@/lib/batch-utils';

const DATA_PATH = 'app-data/cellsmart-data';
const GENERAL_ITEMS_COLLECTION = 'general-inventory';
const GENERAL_ITEMS_HISTORY_COLLECTION = 'general-inventory-history';

// Check if Firebase is configured
const isConfigured = !!db;

// FIFO Consumption Logic - The Core Function
export async function consumeGeneralItemFromOldestBatch(
  itemId: string, 
  quantityToConsume: number = 1,
  jobId?: string,
  notes?: string
): Promise<BatchConsumptionResult> {
  if (!isConfigured) {
    return { success: false, error: 'Firebase is not configured.' };
  }

  try {
    // Get the current item
    const itemResult = await getGeneralItem(itemId);
    if (!itemResult.success || !itemResult.item) {
      return { success: false, error: 'Item not found.' };
    }

    const item = itemResult.item;
    
    // Check if we have enough total quantity
    if (item.totalQuantityInStock < quantityToConsume) {
      return { 
        success: false, 
        error: `Insufficient inventory. Available: ${item.totalQuantityInStock}, Required: ${quantityToConsume}` 
      };
    }

    // Check if item has batches, if not create a legacy batch
    if (!item.batches || item.batches.length === 0) {
      if (item.totalQuantityInStock > 0) {
        console.log(`Creating legacy batch for general item ${itemId} with ${item.totalQuantityInStock} units`);
        const legacyBatch = createBatch(
          item.totalQuantityInStock,
          item.avgCost || 0,
          'Legacy Stock',
          'Migrated from old inventory system'
        );
        
        // Update the item with the new batch
        const dataDocRef = doc(db, DATA_PATH);
        const itemRef = doc(dataDocRef, GENERAL_ITEMS_COLLECTION, itemId);
        await updateDoc(itemRef, {
          batches: [legacyBatch],
          updatedAt: serverTimestamp()
        });
        
        // Update our local item object
        item.batches = [legacyBatch];
      } else {
        return { success: false, error: 'No batches available and no stock to migrate.' };
      }
    }

    // Find the oldest available batch
    const oldestBatch = findOldestAvailableBatch(item.batches);
    if (!oldestBatch) {
      const totalBatchQuantity = item.batches?.reduce((total, batch) => total + batch.quantity, 0) || 0;
      return { 
        success: false, 
        error: `No available batches found. Total batch quantity: ${totalBatchQuantity}, Item stock: ${item.totalQuantityInStock}` 
      };
    }

    // Check if the oldest batch has enough quantity
    if (oldestBatch.quantity < quantityToConsume) {
      const totalAvailable = item.batches.reduce((total, batch) => total + batch.quantity, 0);
      return { 
        success: false, 
        error: `Insufficient stock in oldest batch. Batch ${oldestBatch.batchId} has ${oldestBatch.quantity} units, but ${quantityToConsume} requested. Total available: ${totalAvailable}. Multi-batch consumption not yet supported.` 
      };
    }

    // Deduct from the oldest batch
    const updatedBatches = item.batches.map(batch => {
      if (batch.batchId === oldestBatch.batchId) {
        return { ...batch, quantity: batch.quantity - quantityToConsume };
      }
      return batch;
    });

    // Calculate new totals
    const newTotalQuantity = calculateTotalQuantity(updatedBatches);
    const newAvgCost = calculateAverageCost(updatedBatches);

    // Update the item document
    const dataDocRef = doc(db, DATA_PATH);
    const itemRef = doc(dataDocRef, GENERAL_ITEMS_COLLECTION, itemId);
    
    await updateDoc(itemRef, {
      batches: updatedBatches,
      totalQuantityInStock: newTotalQuantity,
      avgCost: newAvgCost,
      updatedAt: serverTimestamp()
    });

    // Create history entry
    await createGeneralItemHistory({
      itemId,
      type: 'use',
      quantity: quantityToConsume,
      batchId: oldestBatch.batchId,
      costPrice: oldestBatch.costPrice,
      jobId,
      notes: notes || `FIFO consumption from batch ${oldestBatch.batchId}`
    });

    revalidatePath('/dashboard/general-inventory');
    revalidatePath('/dashboard/inventory');

    return {
      success: true,
      costPrice: oldestBatch.costPrice,
      batchId: oldestBatch.batchId,
      remainingQuantity: newTotalQuantity
    };

  } catch (error) {
    console.error('Error consuming general item from oldest batch:', error);
    return { success: false, error: 'Failed to consume item from batch.' };
  }
}

// Create General Item with initial batch
export async function createGeneralItem(
  itemData: Omit<GeneralItem, 'id' | 'createdAt' | 'updatedAt' | 'batches' | 'totalQuantityInStock' | 'avgCost'> & {
    initialQuantity: number;
    initialCost: number;
    supplier?: string;
  }
): Promise<{ success: boolean; error?: string; itemId?: string }> {
  if (!isConfigured) {
    return { success: false, error: 'Firebase is not configured.' };
  }

  try {
    // Create the initial batch
    const initialBatch = createBatch(
      itemData.initialQuantity, 
      itemData.initialCost, 
      itemData.supplier,
      'Initial stock'
    );

    // Create item data, filtering out undefined values
    const itemBase: Omit<GeneralItem, 'id'> = {
      name: itemData.name,
      sku: itemData.sku,
      categoryId: itemData.categoryId,
      subCategoryId: itemData.subCategoryId,
      brand: itemData.brand,
      model: itemData.model,
      description: itemData.description,
      condition: itemData.condition,
      batches: [initialBatch],
      totalQuantityInStock: itemData.initialQuantity,
      minQuantity: itemData.minQuantity,
      avgCost: itemData.initialCost,
      price: itemData.price,
      location: itemData.location,
      notes: itemData.notes,
      customFields: itemData.customFields,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Filter out undefined values for Firebase
    const item = Object.fromEntries(
      Object.entries(itemBase).filter(([_, value]) => value !== undefined)
    );

    const dataDocRef = doc(db, DATA_PATH);
    const itemsRef = collection(dataDocRef, GENERAL_ITEMS_COLLECTION);
    
    const docRef = await addDoc(itemsRef, {
      ...item,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    // Create initial inventory history entry
    await createGeneralItemHistory({
      itemId: docRef.id,
      type: 'purchase',
      quantity: itemData.initialQuantity,
      batchId: initialBatch.batchId,
      costPrice: itemData.initialCost,
      notes: 'Initial stock - first batch',
    });

    revalidatePath('/dashboard/general-inventory');
    revalidatePath('/dashboard/inventory');

    return { success: true, itemId: docRef.id };
  } catch (error) {
    console.error('Error creating general item:', error);
    return { success: false, error: 'Failed to create general item.' };
  }
}

// Add Stock (Restock) - Creates a new batch
export async function addGeneralItemStock(
  itemId: string,
  quantity: number,
  costPrice: number,
  supplier?: string,
  notes?: string,
  purchaseOrderId?: string,
  referenceNumber?: string
): Promise<{ success: boolean; error?: string; batchId?: string }> {
  if (!isConfigured) {
    return { success: false, error: 'Firebase is not configured.' };
  }

  try {
    // Get current item
    const itemResult = await getGeneralItem(itemId);
    if (!itemResult.success || !itemResult.item) {
      return { success: false, error: 'Item not found.' };
    }

    const item = itemResult.item;

    // Create new batch
    const newBatch = createBatch(quantity, costPrice, supplier, notes, purchaseOrderId, referenceNumber);

    // Add new batch to existing batches
    const updatedBatches = [...item.batches, newBatch];

    // Calculate new totals
    const newTotalQuantity = calculateTotalQuantity(updatedBatches);
    const newAvgCost = calculateAverageCost(updatedBatches);

    // Update the item document
    const dataDocRef = doc(db, DATA_PATH);
    const itemRef = doc(dataDocRef, GENERAL_ITEMS_COLLECTION, itemId);
    
    await updateDoc(itemRef, {
      batches: updatedBatches,
      totalQuantityInStock: newTotalQuantity,
      avgCost: newAvgCost,
      updatedAt: serverTimestamp()
    });

    // Create history entry
    await createGeneralItemHistory({
      itemId,
      type: 'purchase',
      quantity,
      batchId: newBatch.batchId,
      costPrice,
      notes: notes || `Restocked - new batch ${newBatch.batchId}`
    });

    revalidatePath('/dashboard/general-inventory');
    revalidatePath('/dashboard/inventory');

    return { success: true, batchId: newBatch.batchId };
  } catch (error) {
    console.error('Error adding general item stock:', error);
    return { success: false, error: 'Failed to add stock.' };
  }
}

// Migration helper to convert legacy items to new batch structure
function migrateLegacyGeneralItem(data: any): GeneralItem {
  // Check if this is a legacy item (has quantity/cost instead of batches)
  if (data.quantity !== undefined && data.cost !== undefined && !data.batches) {
    console.log(`Migrating legacy general item: ${data.name}`);
    
    // Create a single batch from the legacy quantity/cost
    const legacyBatch = createBatch(
      data.quantity || 0,
      data.cost || 0,
      undefined,
      'Migrated from legacy inventory'
    );

    return {
      id: data.id,
      name: data.name || '',
      sku: data.sku,
      categoryId: data.categoryId,
      subCategoryId: data.subCategoryId,
      brand: data.brand,
      model: data.model,
      description: data.description,
      condition: data.condition || 'New',
      batches: data.quantity > 0 ? [legacyBatch] : [],
      totalQuantityInStock: data.quantity || 0,
      minQuantity: data.minQuantity || 0,
      avgCost: data.cost || 0,
      price: data.price || 0,
      location: data.location,
      notes: data.notes,
      customFields: data.customFields,
      createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
      updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt,
    };
  }

  // Already migrated item with batch structure
  return {
    id: data.id,
    name: data.name || '',
    sku: data.sku,
    categoryId: data.categoryId,
    subCategoryId: data.subCategoryId,
    brand: data.brand,
    model: data.model,
    description: data.description,
    condition: data.condition || 'New',
    batches: data.batches || [],
    totalQuantityInStock: data.totalQuantityInStock || calculateTotalQuantity(data.batches || []),
    minQuantity: data.minQuantity || 0,
    avgCost: data.avgCost || calculateAverageCost(data.batches || []),
    price: data.price || 0,
    location: data.location,
    notes: data.notes,
    customFields: data.customFields,
    createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
    updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt,
  };
}

export async function getGeneralItems(): Promise<GeneralItem[]> {
  if (!isConfigured) {
    console.log('Firebase is not configured');
    return [];
  }

  try {
    const dataDocRef = doc(db, DATA_PATH);
    const itemsRef = collection(dataDocRef, GENERAL_ITEMS_COLLECTION);
    const q = query(itemsRef, orderBy('name', 'asc'));
    
    const snapshot = await getDocs(q);
    const items: GeneralItem[] = snapshot.docs.map(doc => {
      const data = { ...doc.data(), id: doc.id };
      return migrateLegacyGeneralItem(data);
    });

    return items;
  } catch (error) {
    console.error('Error fetching general items:', error);
    return [];
  }
}

export async function getGeneralItemById(itemId: string): Promise<GeneralItem | null> {
  try {
    const items = await getGeneralItems();
    return items.find(item => item.id === itemId) || null;
  } catch (error) {
    console.error('Error fetching general item by ID:', error);
    return null;
  }
}

export async function getGeneralItem(itemId: string): Promise<{ success: boolean; item?: GeneralItem; error?: string }> {
  if (!isConfigured) {
    return { success: false, error: 'Firebase is not configured.' };
  }

  try {
    const item = await getGeneralItemById(itemId);
    if (!item) {
      return { success: false, error: 'Item not found.' };
    }
    return { success: true, item };
  } catch (error) {
    console.error('Error fetching general item:', error);
    return { success: false, error: 'Failed to fetch item.' };
  }
}

export async function updateGeneralItem(itemId: string, updates: Partial<Omit<GeneralItem, 'id' | 'createdAt'>>): Promise<{ success: boolean; error?: string }> {
  if (!isConfigured) {
    return { success: false, error: 'Firebase is not configured.' };
  }

  try {
    const dataDocRef = doc(db, DATA_PATH);
    const itemRef = doc(dataDocRef, `${GENERAL_ITEMS_COLLECTION}/${itemId}`);
    
    // Filter out undefined values for Firebase
    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, value]) => value !== undefined)
    );
    
    await updateDoc(itemRef, {
      ...filteredUpdates,
      updatedAt: serverTimestamp(),
    });

    revalidatePath('/dashboard/general-inventory');
    revalidatePath('/dashboard/inventory');

    return { success: true };
  } catch (error) {
    console.error('Error updating general item:', error);
    return { success: false, error: 'Failed to update item.' };
  }
}

export async function deleteGeneralItem(itemId: string): Promise<{ success: boolean; error?: string }> {
  if (!isConfigured) {
    return { success: false, error: 'Firebase is not configured.' };
  }

  try {
    const dataDocRef = doc(db, DATA_PATH);
    const itemRef = doc(dataDocRef, `${GENERAL_ITEMS_COLLECTION}/${itemId}`);
    
    await deleteDoc(itemRef);

    revalidatePath('/dashboard/general-inventory');
    revalidatePath('/dashboard/inventory');

    return { success: true };
  } catch (error) {
    console.error('Error deleting general item:', error);
    return { success: false, error: 'Failed to delete item.' };
  }
}

export async function createGeneralItemHistory(historyData: Omit<GeneralItemHistory, 'id' | 'createdAt'>): Promise<{ success: boolean; error?: string }> {
  if (!isConfigured) {
    return { success: false, error: 'Firebase is not configured.' };
  }

  try {
    const history: Omit<GeneralItemHistory, 'id'> = {
      ...historyData,
      createdAt: new Date().toISOString(),
    };

    const dataDocRef = doc(db, DATA_PATH);
    const historyRef = collection(dataDocRef, GENERAL_ITEMS_HISTORY_COLLECTION);
    
    await addDoc(historyRef, {
      ...history,
      createdAt: serverTimestamp(),
    });

    return { success: true };
  } catch (error) {
    console.error('Error creating general item history:', error);
    return { success: false, error: 'Failed to create item history.' };
  }
}

export async function getGeneralItemHistory(itemId?: string): Promise<GeneralItemHistory[]> {
  if (!isConfigured) {
    return [];
  }

  try {
    const dataDocRef = doc(db, DATA_PATH);
    const historyRef = collection(dataDocRef, GENERAL_ITEMS_HISTORY_COLLECTION);
    
    let q = query(historyRef, orderBy('createdAt', 'desc'));
    if (itemId) {
      q = query(historyRef, where('itemId', '==', itemId), orderBy('createdAt', 'desc'));
    }
    
    const snapshot = await getDocs(q);
    const history: GeneralItemHistory[] = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        ...data,
        id: doc.id,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
      } as GeneralItemHistory;
    });

    return history;
  } catch (error) {
    console.error('Error fetching general item history:', error);
    return [];
  }
}

export async function getLowStockGeneralItems(): Promise<GeneralItem[]> {
  try {
    const items = await getGeneralItems();
    return items.filter(item => item.totalQuantityInStock <= item.minQuantity);
  } catch (error) {
    console.error('Error fetching low stock general items:', error);
    return [];
  }
}

export async function getGeneralItemsStats() {
  try {
    const items = await getGeneralItems();
    const lowStock = await getLowStockGeneralItems();
    
    const stats = {
      totalItems: items.length,
      totalValue: items.reduce((sum, item) => sum + (item.totalQuantityInStock * item.avgCost), 0),
      lowStock: lowStock.length,
      outOfStock: items.filter(item => item.totalQuantityInStock === 0).length,
      categories: items.reduce((acc, item) => {
        const category = item.categoryId || 'Uncategorized';
        acc[category] = (acc[category] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
    };

    return stats;
  } catch (error) {
    console.error('Error getting general items stats:', error);
    return {
      totalItems: 0,
      totalValue: 0,
      lowStock: 0,
      outOfStock: 0,
      categories: {},
    };
  }
}

// Migration function to fix general items without proper batch data
export async function migrateLegacyGeneralItems(): Promise<{ success: boolean; migratedCount: number; error?: string }> {
  if (!isConfigured) {
    return { success: false, migratedCount: 0, error: 'Firebase is not configured.' };
  }

  try {
    const dataDocRef = doc(db, DATA_PATH);
    const itemsRef = collection(dataDocRef, GENERAL_ITEMS_COLLECTION);
    const snapshot = await getDocs(itemsRef);
    
    let migratedCount = 0;
    
    for (const itemDoc of snapshot.docs) {
      const item = { id: itemDoc.id, ...itemDoc.data() } as GeneralItem;
      
      // Check if item needs migration (no batches but has stock)
      if ((!item.batches || item.batches.length === 0) && item.totalQuantityInStock > 0) {
        console.log(`Migrating general item: ${item.name} (${item.id}) with ${item.totalQuantityInStock} units`);
        
        const legacyBatch = createBatch(
          item.totalQuantityInStock,
          item.avgCost || 0,
          'Legacy Stock',
          'Auto-migrated from old inventory system'
        );
        
        await updateDoc(itemDoc.ref, {
          batches: [legacyBatch],
          updatedAt: serverTimestamp()
        });
        
        migratedCount++;
      }
    }
    
    revalidatePath('/dashboard/general-inventory');
    revalidatePath('/dashboard/inventory');
    
    return { success: true, migratedCount };
  } catch (error) {
    console.error('Error migrating legacy general items:', error);
    return { success: false, migratedCount: 0, error: 'Failed to migrate legacy items.' };
  }
}