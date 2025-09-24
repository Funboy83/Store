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
import { Part, PartHistory } from '@/lib/types';
import { revalidatePath } from 'next/cache';

const DATA_PATH = 'app-data/cellsmart-data';
const PARTS_COLLECTION = 'parts';
const PARTS_HISTORY_COLLECTION = 'parts-history';

// Check if Firebase is configured
const isConfigured = !!db;

export async function createPart(partData: Omit<Part, 'id' | 'createdAt' | 'updatedAt'>): Promise<{ success: boolean; error?: string; partId?: string }> {
  if (!isConfigured) {
    return { success: false, error: 'Firebase is not configured.' };
  }

  try {
    const part: Omit<Part, 'id'> = {
      ...partData,
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
      quantity: partData.quantity,
      cost: partData.cost,
      notes: 'Initial stock',
    });

    revalidatePath('/dashboard/parts');
    revalidatePath('/dashboard/inventory');

    return { success: true, partId: docRef.id };
  } catch (error) {
    console.error('Error creating part:', error);
    return { success: false, error: 'Failed to create part.' };
  }
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
      const data = doc.data();
      
      // Convert timestamps to ISO strings
      const convertedData = {
        ...data,
        id: doc.id,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt,
      };
      
      return convertedData as unknown as Part;
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

export async function adjustPartQuantity(
  partId: string, 
  newQuantity: number, 
  type: 'adjustment' | 'use' | 'return',
  notes?: string,
  jobId?: string
): Promise<{ success: boolean; error?: string }> {
  if (!isConfigured) {
    return { success: false, error: 'Firebase is not configured.' };
  }

  try {
    const part = await getPartById(partId);
    if (!part) {
      return { success: false, error: 'Part not found.' };
    }

    const quantityDiff = newQuantity - part.quantity;

    // Update part quantity
    const updateResult = await updatePart(partId, { quantity: newQuantity });
    if (!updateResult.success) {
      return updateResult;
    }

    // Create history entry
    await createPartHistory({
      partId,
      type,
      quantity: Math.abs(quantityDiff),
      notes: notes || `Quantity ${quantityDiff > 0 ? 'increased' : 'decreased'}`,
      jobId,
    });

    return { success: true };
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
    return parts.filter(part => part.quantity <= part.minQuantity);
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
      totalValue: parts.reduce((sum, part) => sum + (part.quantity * part.cost), 0),
      lowStock: lowStock.length,
      outOfStock: parts.filter(part => part.quantity === 0).length,
      categories: parts.reduce((acc, part) => {
        acc[part.category] = (acc[part.category] || 0) + 1;
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