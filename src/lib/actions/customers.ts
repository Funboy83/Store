
'use server';

import { db, isConfigured } from '@/lib/firebase';
import { collection, getDocs, query, orderBy, addDoc, serverTimestamp, doc } from 'firebase/firestore';
import { MOCK_CUSTOMERS } from '../mock-data';
import type { Customer } from '../types';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { getInvoices } from './invoice';

const DATA_PATH = 'cellphone-inventory-system/data';
const CUSTOMERS_COLLECTION = 'customers';

const CustomerSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  phone: z.string().min(10, { message: "Phone number must be at least 10 digits." }),
  email: z.string().email({ message: "Invalid email address." }).optional().or(z.literal('')),
  notes: z.string().optional(),
});

export async function getCustomers(): Promise<Customer[]> {
  if (!isConfigured) {
    console.log('Firebase not configured, returning mock customers.');
    return Promise.resolve(MOCK_CUSTOMERS.map(c => ({...c, totalInvoices: 0, totalSpent: 0, phone: '', notes: '', createdAt: new Date().toISOString() })));
  }

  try {
    const dataDocRef = doc(db, DATA_PATH);
    const customersCollectionRef = collection(dataDocRef, CUSTOMERS_COLLECTION);
    const q = query(customersCollectionRef, orderBy('name'));
    
    const [customersSnapshot, invoices] = await Promise.all([
      getDocs(q),
      getInvoices()
    ]);
    
    const customerInvoiceData: Record<string, { totalInvoices: number, totalSpent: number }> = {};
    for (const invoice of invoices) {
      if (invoice.customerId === 'walk-in') continue;

      if (!customerInvoiceData[invoice.customerId]) {
        customerInvoiceData[invoice.customerId] = { totalInvoices: 0, totalSpent: 0 };
      }
      customerInvoiceData[invoice.customerId].totalInvoices += 1;
      customerInvoiceData[invoice.customerId].totalSpent += invoice.total;
    }

    return customersSnapshot.docs.map(doc => {
      const data = doc.data();
      const createdAt = data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : new Date().toISOString();
      const stats = customerInvoiceData[doc.id] || { totalInvoices: 0, totalSpent: 0 };
      
      return { 
        id: doc.id,
        name: data.name,
        email: data.email,
        phone: data.phone,
        address: data.address,
        notes: data.notes,
        createdAt: createdAt,
        totalInvoices: stats.totalInvoices,
        totalSpent: stats.totalSpent,
      } as Customer
    });
  } catch (error) {
    console.error('Error fetching customers:', error);
    // Fallback to mock data on error
    return MOCK_CUSTOMERS.map(c => ({...c, totalInvoices: 0, totalSpent: 0, phone: '', notes: '', createdAt: new Date().toISOString() }));
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
    const dataDocRef = doc(db, DATA_PATH);
    const customersCollectionRef = collection(dataDocRef, CUSTOMERS_COLLECTION);
    await addDoc(customersCollectionRef, {
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
