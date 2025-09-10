
'use server';

import { db, isConfigured } from '@/lib/firebase';
import { collection, getDocs, query, orderBy, addDoc, serverTimestamp } from 'firebase/firestore';
import { MOCK_CUSTOMERS } from '../mock-data';
import type { Customer } from '../types';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';

const CUSTOMERS_PATH = 'cellphone-inventory-system/data/customers';

const CustomerSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  email: z.string().email({ message: "Invalid email address." }),
  phone: z.string().min(10, { message: "Phone number must be at least 10 digits." }),
});

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

export async function addCustomer(prevState: any, formData: FormData) {
  const validatedFields = CustomerSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  if (!isConfigured) {
    return { errors: { _form: ['Firebase is not configured.'] } };
  }

  try {
    const customersCollection = collection(db, CUSTOMERS_PATH);
    await addDoc(customersCollection, {
      ...validatedFields.data,
      createdAt: serverTimestamp(),
    });
    revalidatePath('/dashboard/customers');
    return { success: true };
  } catch (error) {
    console.error('Error adding customer:', error);
    return { errors: { _form: ['Failed to add customer.'] } };
  }
}
