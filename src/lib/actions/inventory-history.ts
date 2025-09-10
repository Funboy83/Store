
'use server';

import { db, isConfigured } from '@/lib/firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import type { ProductHistory } from '../types';

const INVENTORY_HISTORY_PATH = 'cellphone-inventory-system/data/inventory_history';

export async function getInventoryHistory(): Promise<ProductHistory[]> {
  if (!isConfigured) {
    console.log('Firebase not configured, returning empty history.');
    return [];
  }

  try {
    const historyCollection = collection(db, INVENTORY_HISTORY_PATH);
    const q = query(historyCollection, orderBy('movedAt', 'desc'));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return { 
        id: doc.id, 
        ...data,
        createdAt: data.createdAt?.toDate()?.toISOString() || null,
        updatedAt: data.updatedAt?.toDate()?.toISOString() || null,
        movedAt: data.movedAt?.toDate()?.toISOString() || null,
      } as ProductHistory
    });
  } catch (error) {
    console.error('Error fetching inventory history:', error);
    return [];
  }
}
