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
import { Part, PartHistory, PartBatch, BatchConsumptionResult } from '@/lib/types';
import { revalidatePath } from 'next/cache';
import { 
  generateBatchId, 
  createBatch, 
  calculateTotalQuantity, 
  calculateAverageCost, 
  findOldestAvailableBatch 
} from '@/lib/batch-utils';

const DATA_PATH = 'app-data/cellsmart-data';
const PARTS_COLLECTION = 'parts';
const PARTS_HISTORY_COLLECTION = 'parts-history';

// Check if Firebase is configured
const isConfigured = !!db;

// FIFO Consumption Logic - The Core Function
export async function consumePartFromOldestBatch(
  partId: string, 
  quantityToConsume: number = 1,
  jobId?: string,
  notes?: string
): Promise<BatchConsumptionResult> {
  if (!isConfigured) {
    return { success: false, error: 'Firebase is not configured.' };
  }

  try {
    // Get the current part
    const partResult = await getPart(partId);
    if (!partResult.success || !partResult.part) {
      return { success: false, error: 'Part not found.' };
    }

    const part = partResult.part;
    
    // Check if we have enough total quantity
    if (part.totalQuantityInStock < quantityToConsume) {
      return { 
        success: false, 
        error: `Insufficient inventory. Available: ${part.totalQuantityInStock}, Required: ${quantityToConsume}` 
      };
    }

    // Find the oldest available batch
    const oldestBatch = findOldestAvailableBatch(part.batches);
    if (!oldestBatch) {
      return { success: false, error: 'No available batches found.' };
    }

    // Check if the oldest batch has enough quantity
    if (oldestBatch.quantity < quantityToConsume) {
      return { 
        success: false, 
        error: `Oldest batch only has ${oldestBatch.quantity} units, but ${quantityToConsume} requested. Multi-batch consumption not yet supported.` 
      };
    }

    // Deduct from the oldest batch
    const updatedBatches = part.batches.map(batch => {
      if (batch.batchId === oldestBatch.batchId) {
        return { ...batch, quantity: batch.quantity - quantityToConsume };
      }
      return batch;
    });

    // Calculate new totals
    const newTotalQuantity = calculateTotalQuantity(updatedBatches);
    const newAvgCost = calculateAverageCost(updatedBatches);

    // Update the part document
    const dataDocRef = doc(db, DATA_PATH);
    const partRef = doc(dataDocRef, PARTS_COLLECTION, partId);
    
    await updateDoc(partRef, {
      batches: updatedBatches,
      totalQuantityInStock: newTotalQuantity,
      avgCost: newAvgCost,
      updatedAt: serverTimestamp()
    });

    // Create history entry
    await createPartHistory({
      partId,
      type: 'use',
      quantity: quantityToConsume,
      batchId: oldestBatch.batchId,
      costPrice: oldestBatch.costPrice,
      jobId,
      notes: notes || `FIFO consumption from batch ${oldestBatch.batchId}`
    });

    revalidatePath('/dashboard/parts');
    revalidatePath('/dashboard/inventory');

    return {
      success: true,
      costPrice: oldestBatch.costPrice,
      batchId: oldestBatch.batchId,
      remainingQuantity: newTotalQuantity
    };

  } catch (error) {
    console.error('Error consuming part from oldest batch:', error);
    return { success: false, error: 'Failed to consume part from batch.' };
  }
}

// Create Part with initial batch
export async function createPart(
  partData: Omit<Part, 'id' | 'createdAt' | 'updatedAt' | 'batches' | 'totalQuantityInStock' | 'avgCost'> & {
    initialQuantity: number;
    initialCost: number;
    supplier?: string;
  }
): Promise<{ success: boolean; error?: string; partId?: string }> {
  if (!isConfigured) {
    return { success: false, error: 'Firebase is not configured.' };
  }

  try {
    // Create the initial batch
    const initialBatch = createBatch(
      partData.initialQuantity, 
      partData.initialCost, 
      partData.supplier,
      'Initial stock'
    );

    const part: Omit<Part, 'id'> = {
      name: partData.name,
      partNumber: partData.partNumber,
      category: partData.category,
      brand: partData.brand,
      model: partData.model,
      compatibility: partData.compatibility,
      condition: partData.condition,
      batches: [initialBatch],
      totalQuantityInStock: partData.initialQuantity,
      minQuantity: partData.minQuantity,
      avgCost: partData.initialCost,
      price: partData.price,
      location: partData.location,
      notes: partData.notes,
      customFields: partData.customFields,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const dataDocRef = doc(db, DATA_PATH);
    const partsRef = collection(dataDocRef, PARTS_COLLECTION);
    
    const docRef = await addDoc(partsRef, {
      ...part,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    // Create initial inventory history entry
    await createPartHistory({
      partId: docRef.id,
      type: 'purchase',
      quantity: partData.initialQuantity,
      batchId: initialBatch.batchId,
      costPrice: partData.initialCost,
      notes: 'Initial stock - first batch',
    });

    revalidatePath('/dashboard/parts');
    revalidatePath('/dashboard/inventory');

    return { success: true, partId: docRef.id };
  } catch (error) {
    console.error('Error creating part:', error);
    return { success: false, error: 'Failed to create part.' };
  }
}

// Add Stock (Restock) - Creates a new batch
export async function addPartStock(
  partId: string,
  quantity: number,
  costPrice: number,
  supplier?: string,
  notes?: string
): Promise<{ success: boolean; error?: string; batchId?: string }> {
  if (!isConfigured) {
    return { success: false, error: 'Firebase is not configured.' };
  }

  try {
    // Get current part
    const partResult = await getPart(partId);
    if (!partResult.success || !partResult.part) {
      return { success: false, error: 'Part not found.' };
    }

    const part = partResult.part;

    // Create new batch
    const newBatch = createBatch(quantity, costPrice, supplier, notes);

    // Add new batch to existing batches
    const updatedBatches = [...part.batches, newBatch];

    // Calculate new totals
    const newTotalQuantity = calculateTotalQuantity(updatedBatches);
    const newAvgCost = calculateAverageCost(updatedBatches);

    // Update the part document
    const dataDocRef = doc(db, DATA_PATH);
    const partRef = doc(dataDocRef, PARTS_COLLECTION, partId);
    
    await updateDoc(partRef, {
      batches: updatedBatches,
      totalQuantityInStock: newTotalQuantity,
      avgCost: newAvgCost,
      updatedAt: serverTimestamp()
    });

    // Create history entry
    await createPartHistory({
      partId,
      type: 'purchase',
      quantity,
      batchId: newBatch.batchId,
      costPrice,
      notes: notes || `Restocked - new batch ${newBatch.batchId}`
    });

    revalidatePath('/dashboard/parts');
    revalidatePath('/dashboard/inventory');

    return { success: true, batchId: newBatch.batchId };
  } catch (error) {
    console.error('Error adding part stock:', error);
    return { success: false, error: 'Failed to add stock.' };
  }
}

// Migration helper to convert legacy parts to new batch structure
function migrateLegacyPart(data: any): Part {
  // Check if this is a legacy part (has quantity/cost instead of batches)
  if (data.quantity !== undefined && data.cost !== undefined && !data.batches) {
    console.log(`Migrating legacy part: ${data.name}`);
    
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
      partNumber: data.partNumber,
      category: data.category,
      brand: data.brand,
      model: data.model,
      compatibility: data.compatibility || [],
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

  // Already migrated part with batch structure
  return {
    id: data.id,
    name: data.name || '',
    partNumber: data.partNumber,
    category: data.category,
    brand: data.brand,
    model: data.model,
    compatibility: data.compatibility || [],
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

export async function getParts(): Promise<Part[]> {
  if (!isConfigured) {
    console.log('Firebase is not configured');
    return [];
  }

  try {
    const dataDocRef = doc(db, DATA_PATH);
    const partsRef = collection(dataDocRef, PARTS_COLLECTION);
    const q = query(partsRef, orderBy('name', 'asc'));
    
    const snapshot = await getDocs(q);
    const parts: Part[] = snapshot.docs.map(doc => {
      const data = { ...doc.data(), id: doc.id };
      return migrateLegacyPart(data);
    });

    return parts;
  } catch (error) {
    console.error('Error fetching parts:', error);
    return [];
  }
}



export async function getPartById(partId: string): Promise<Part | null> {
  try {
    const parts = await getParts();
    return parts.find(part => part.id === partId) || null;
  } catch (error) {
    console.error('Error fetching part by ID:', error);
    return null;
  }
}

export async function getPart(partId: string): Promise<{ success: boolean; part?: Part; error?: string }> {
  if (!isConfigured) {
    return { success: false, error: 'Firebase is not configured.' };
  }

  try {
    const part = await getPartById(partId);
    if (!part) {
      return { success: false, error: 'Part not found.' };
    }
    return { success: true, part };
  } catch (error) {
    console.error('Error fetching part:', error);
    return { success: false, error: 'Failed to fetch part.' };
  }
}

export async function updatePart(partId: string, updates: Partial<Omit<Part, 'id' | 'createdAt'>>): Promise<{ success: boolean; error?: string }> {
  if (!isConfigured) {
    return { success: false, error: 'Firebase is not configured.' };
  }

  try {
    const dataDocRef = doc(db, DATA_PATH);
    const partRef = doc(dataDocRef, `${PARTS_COLLECTION}/${partId}`);
    
    await updateDoc(partRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });

    revalidatePath('/dashboard/parts');
    revalidatePath('/dashboard/inventory');

    return { success: true };
  } catch (error) {
    console.error('Error updating part:', error);
    return { success: false, error: 'Failed to update part.' };
  }
}

export async function deletePart(partId: string): Promise<{ success: boolean; error?: string }> {
  if (!isConfigured) {
    return { success: false, error: 'Firebase is not configured.' };
  }

  try {
    const dataDocRef = doc(db, DATA_PATH);
    const partRef = doc(dataDocRef, `${PARTS_COLLECTION}/${partId}`);
    
    await deleteDoc(partRef);

    revalidatePath('/dashboard/parts');
    revalidatePath('/dashboard/inventory');

    return { success: true };
  } catch (error) {
    console.error('Error deleting part:', error);
    return { success: false, error: 'Failed to delete part.' };
  }
}

// DEPRECATED: Use consumePartFromOldestBatch() and addPartStock() instead
// This function is kept for backward compatibility but should not be used for new code
export async function adjustPartQuantity(
  partId: string, 
  newQuantity: number, 
  type: 'adjustment' | 'use' | 'return',
  notes?: string,
  jobId?: string
): Promise<{ success: boolean; error?: string; costPrice?: number }> {
  console.warn('adjustPartQuantity is deprecated. Use consumePartFromOldestBatch() and addPartStock() instead.');
  
  if (!isConfigured) {
    return { success: false, error: 'Firebase is not configured.' };
  }

  try {
    const partResult = await getPart(partId);
    if (!partResult.success || !partResult.part) {
      return { success: false, error: 'Part not found.' };
    }

    const part = partResult.part;
    const currentQuantity = part.totalQuantityInStock;
    const quantityDiff = newQuantity - currentQuantity;

    if (quantityDiff < 0) {
      // Consumption - use FIFO
      const consumeResult = await consumePartFromOldestBatch(partId, Math.abs(quantityDiff), jobId, notes);
      return {
        success: consumeResult.success,
        error: consumeResult.error,
        costPrice: consumeResult.costPrice
      };
    } else if (quantityDiff > 0) {
      // Addition - create new batch with average cost
      const addResult = await addPartStock(partId, quantityDiff, part.avgCost, undefined, notes);
      return {
        success: addResult.success,
        error: addResult.error,
        costPrice: part.avgCost
      };
    }

    // No change
    return { success: true, costPrice: part.avgCost };
  } catch (error) {
    console.error('Error adjusting part quantity:', error);
    return { success: false, error: 'Failed to adjust part quantity.' };
  }
}

export async function createPartHistory(historyData: Omit<PartHistory, 'id' | 'createdAt'>): Promise<{ success: boolean; error?: string }> {
  if (!isConfigured) {
    return { success: false, error: 'Firebase is not configured.' };
  }

  try {
    const history: Omit<PartHistory, 'id'> = {
      ...historyData,
      createdAt: new Date().toISOString(),
    };

    const dataDocRef = doc(db, DATA_PATH);
    const historyRef = collection(dataDocRef, PARTS_HISTORY_COLLECTION);
    
    await addDoc(historyRef, {
      ...history,
      createdAt: serverTimestamp(),
    });

    return { success: true };
  } catch (error) {
    console.error('Error creating part history:', error);
    return { success: false, error: 'Failed to create part history.' };
  }
}

export async function getPartHistory(partId?: string): Promise<PartHistory[]> {
  if (!isConfigured) {
    return [];
  }

  try {
    const dataDocRef = doc(db, DATA_PATH);
    const historyRef = collection(dataDocRef, PARTS_HISTORY_COLLECTION);
    
    let q = query(historyRef, orderBy('createdAt', 'desc'));
    if (partId) {
      q = query(historyRef, where('partId', '==', partId), orderBy('createdAt', 'desc'));
    }
    
    const snapshot = await getDocs(q);
    const history: PartHistory[] = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        ...data,
        id: doc.id,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
      } as PartHistory;
    });

    return history;
  } catch (error) {
    console.error('Error fetching part history:', error);
    return [];
  }
}

export async function getLowStockParts(): Promise<Part[]> {
  try {
    const parts = await getParts();
    return parts.filter(part => part.totalQuantityInStock <= part.minQuantity);
  } catch (error) {
    console.error('Error fetching low stock parts:', error);
    return [];
  }
}

export async function getPartsStats() {
  try {
    const parts = await getParts();
    const lowStock = await getLowStockParts();
    
    const stats = {
      totalParts: parts.length,
      totalValue: parts.reduce((sum, part) => sum + (part.totalQuantityInStock * part.avgCost), 0),
      lowStock: lowStock.length,
      outOfStock: parts.filter(part => part.totalQuantityInStock === 0).length,
      categories: parts.reduce((acc, part) => {
        const category = part.category || 'Uncategorized';
        acc[category] = (acc[category] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
    };

    return stats;
  } catch (error) {
    console.error('Error getting parts stats:', error);
    return {
      totalParts: 0,
      totalValue: 0,
      lowStock: 0,
      outOfStock: 0,
      categories: {},
    };
  }
}