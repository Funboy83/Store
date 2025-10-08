'use server';

import { db, isConfigured } from '@/lib/firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

const DATA_PATH = 'app-data/cellsmart-data';
const CUSTOMERS_COLLECTION = 'customers';
const WALK_IN_CUSTOMER_ID = 'Aj0l1O2kJcvlF3J0uVMX';

export async function initializeWalkInCustomer(): Promise<{ success: boolean; message: string }> {
  if (!isConfigured) {
    return { success: false, message: 'Firebase is not configured.' };
  }

  try {
    const dataDocRef = doc(db, DATA_PATH);
    const walkInCustomerRef = doc(dataDocRef, `${CUSTOMERS_COLLECTION}/${WALK_IN_CUSTOMER_ID}`);
    
    // Check if walk-in customer already exists
    const walkInCustomerSnap = await getDoc(walkInCustomerRef);
    
    if (walkInCustomerSnap.exists()) {
      return { success: true, message: 'Walk-in customer already exists.' };
    }

    // Create the walk-in customer
    await setDoc(walkInCustomerRef, {
      name: 'Walk-In Customer',
      phone: '0000000000',
      email: '',
      notes: 'Default walk-in customer for cash sales and anonymous transactions',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return { success: true, message: 'Walk-in customer created successfully!' };
  } catch (error) {
    console.error('Error initializing walk-in customer:', error);
    return { success: false, message: 'Failed to initialize walk-in customer.' };
  }
}