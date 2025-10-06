'use server';

import { db, isConfigured } from '@/lib/firebase';
import { collection, doc, getDocs, writeBatch } from 'firebase/firestore';

const OLD_PATH = 'cellphone-inventory-system/data';
const NEW_PATH = 'app-data/cellsmart-data';
const INVENTORY_COLLECTION = 'inventory';

export async function checkBothInventoryPaths() {
  if (!isConfigured) {
    console.log('Firebase not configured');
    return { old: [], new: [] };
  }

  try {
    // Check old path
    const oldDataDocRef = doc(db, OLD_PATH);
    const oldInventoryCollectionRef = collection(oldDataDocRef, INVENTORY_COLLECTION);
    const oldSnapshot = await getDocs(oldInventoryCollectionRef);
    
    // Check new path
    const newDataDocRef = doc(db, NEW_PATH);
    const newInventoryCollectionRef = collection(newDataDocRef, INVENTORY_COLLECTION);
    const newSnapshot = await getDocs(newInventoryCollectionRef);
    
    const oldItems = oldSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const newItems = newSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    console.log('🔍 OLD PATH items:', oldItems.length);
    console.log('🔍 NEW PATH items:', newItems.length);
    
    return { old: oldItems, new: newItems };
  } catch (error) {
    console.error('Error checking inventory paths:', error);
    return { old: [], new: [] };
  }
}

export async function migrateInventoryToNewPath() {
  if (!isConfigured) {
    return { success: false, error: 'Firebase not configured' };
  }

  try {
    // Get items from old path
    const oldDataDocRef = doc(db, OLD_PATH);
    const oldInventoryCollectionRef = collection(oldDataDocRef, INVENTORY_COLLECTION);
    const oldSnapshot = await getDocs(oldInventoryCollectionRef);
    
    if (oldSnapshot.empty) {
      return { success: true, message: 'No items to migrate from old path' };
    }

    // Prepare batch write to new path
    const batch = writeBatch(db);
    const newDataDocRef = doc(db, NEW_PATH);
    const newInventoryCollectionRef = collection(newDataDocRef, INVENTORY_COLLECTION);
    
    let migratedCount = 0;
    oldSnapshot.docs.forEach(oldDoc => {
      const newDocRef = doc(newInventoryCollectionRef, oldDoc.id);
      batch.set(newDocRef, oldDoc.data());
      migratedCount++;
    });
    
    await batch.commit();
    
    console.log(`✅ Successfully migrated ${migratedCount} items to new path`);
    return { 
      success: true, 
      message: `Successfully migrated ${migratedCount} items to new path` 
    };
    
  } catch (error) {
    console.error('Error migrating inventory:', error);
    return { success: false, error: 'Failed to migrate inventory' };
  }
}