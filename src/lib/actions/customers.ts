'use server';

import { db, isConfigured } from '@/lib/firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { MOCK_CUSTOMERS } from '../mock-data';
import type { Customer } from '../types';

const CUSTOMERS_PATH = 'cellphone-inventory-system/data/customers';

export async function getCustomers(): Promise<Customer[]> {
  if (!isConfigured) {
    console.log('Firebase not configured, returning mock customers.');
    return Promise.resolve(MOCK_CUSTOMERS);
  }

  try {
    const customersCollection = collection(db, CUSTOMERS_PATH);
    const q = query(customersCollection, orderBy('name'));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return { 
        id: doc.id,
        ...data,
      } as Customer
    });
  } catch (error) {
    console.error('Error fetching customers:', error);
    // Fallback to mock data on error
    return MOCK_CUSTOMERS;
  }
}
