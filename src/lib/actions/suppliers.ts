'use server';

import { db, isConfigured } from '@/lib/firebase';
import { collection, getDocs, query, orderBy, addDoc, serverTimestamp, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import type { Supplier } from '../types';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';

const DATA_PATH = 'app-data/cellsmart-data';
const SUPPLIERS_COLLECTION = 'suppliers';

const SupplierSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  phone: z.string().optional().or(z.literal('')),
  email: z.string().email({ message: "Invalid email address." }).optional().or(z.literal('')),
  address: z.string().optional().or(z.literal('')),
  contactPerson: z.string().optional().or(z.literal('')),
  website: z.string().optional().or(z.literal('')),
  paymentTerms: z.string().optional().or(z.literal('')),
  taxId: z.string().optional().or(z.literal('')),
  notes: z.string().optional().or(z.literal('')),
});

export async function getSuppliers(): Promise<Supplier[]> {
  if (!isConfigured) {
    return [];
  }

  try {
    const dataDocRef = doc(db, DATA_PATH);
    const suppliersCollectionRef = collection(dataDocRef, SUPPLIERS_COLLECTION);
    
    const suppliersQuery = query(suppliersCollectionRef, orderBy('name'));
    const suppliersSnapshot = await getDocs(suppliersQuery);
    
    const suppliers: Supplier[] = suppliersSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name || '',
        email: data.email || undefined,
        phone: data.phone || undefined,
        address: data.address || undefined,
        contactPerson: data.contactPerson || undefined,
        website: data.website || undefined,
        notes: data.notes || undefined,
        paymentTerms: data.paymentTerms || undefined,
        taxId: data.taxId || undefined,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt || new Date().toISOString(),
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt || new Date().toISOString(),
        totalOrders: data.totalOrders || 0,
        totalSpent: data.totalSpent || 0,
        status: data.status || 'active'
      } as Supplier;
    });

    return suppliers;
  } catch (error) {
    console.error('Error fetching suppliers:', error);
    return [];
  }
}

export async function createSupplier(supplierData: {
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  contactPerson?: string;
  website?: string;
  paymentTerms?: string;
  taxId?: string;
  notes?: string;
}): Promise<{ success: boolean; error?: string; supplierId?: string }> {
  if (!isConfigured) {
    return { success: false, error: 'Firebase is not configured.' };
  }

  try {
    // Validate input data
    const validatedData = SupplierSchema.parse(supplierData);
    
    const dataDocRef = doc(db, DATA_PATH);
    const suppliersCollectionRef = collection(dataDocRef, SUPPLIERS_COLLECTION);
    
    const newSupplier = {
      ...validatedData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      totalOrders: 0,
      totalSpent: 0,
      status: 'active' as const
    };

    const docRef = await addDoc(suppliersCollectionRef, newSupplier);
    
    revalidatePath('/dashboard/suppliers');
    revalidatePath('/dashboard/parts/new');
    revalidatePath('/dashboard/parts');
    
    return { success: true, supplierId: docRef.id };
  } catch (error) {
    console.error('Error creating supplier:', error);
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors.map(e => e.message).join(', ') };
    }
    return { success: false, error: 'Failed to create supplier' };
  }
}

export async function updateSupplier(
  supplierId: string,
  supplierData: {
    name?: string;
    phone?: string;
    email?: string;
    address?: string;
    contactPerson?: string;
    website?: string;
    paymentTerms?: string;
    taxId?: string;
    notes?: string;
    status?: 'active' | 'inactive';
  }
): Promise<{ success: boolean; error?: string }> {
  if (!isConfigured) {
    return { success: false, error: 'Firebase is not configured.' };
  }

  try {
    const dataDocRef = doc(db, DATA_PATH);
    const supplierDocRef = doc(dataDocRef, SUPPLIERS_COLLECTION, supplierId);
    
    const updateData = {
      ...supplierData,
      updatedAt: serverTimestamp()
    };

    await updateDoc(supplierDocRef, updateData);
    
    revalidatePath('/dashboard/suppliers');
    revalidatePath('/dashboard/parts/new');
    revalidatePath('/dashboard/parts');
    
    return { success: true };
  } catch (error) {
    console.error('Error updating supplier:', error);
    return { success: false, error: 'Failed to update supplier' };
  }
}

export async function deleteSupplier(supplierId: string): Promise<{ success: boolean; error?: string }> {
  if (!isConfigured) {
    return { success: false, error: 'Firebase is not configured.' };
  }

  try {
    const dataDocRef = doc(db, DATA_PATH);
    const supplierDocRef = doc(dataDocRef, SUPPLIERS_COLLECTION, supplierId);
    
    await deleteDoc(supplierDocRef);
    
    revalidatePath('/dashboard/suppliers');
    revalidatePath('/dashboard/parts/new');
    revalidatePath('/dashboard/parts');
    
    return { success: true };
  } catch (error) {
    console.error('Error deleting supplier:', error);
    return { success: false, error: 'Failed to delete supplier' };
  }
}

export async function getSupplier(supplierId: string): Promise<{ success: boolean; supplier?: Supplier; error?: string }> {
  if (!isConfigured) {
    return { success: false, error: 'Firebase is not configured.' };
  }

  try {
    const suppliers = await getSuppliers();
    const supplier = suppliers.find(s => s.id === supplierId);
    
    if (!supplier) {
      return { success: false, error: 'Supplier not found.' };
    }
    
    return { success: true, supplier };
  } catch (error) {
    console.error('Error fetching supplier:', error);
    return { success: false, error: 'Failed to fetch supplier.' };
  }
}

export async function getSuppliersStats() {
  if (!isConfigured) {
    return {
      totalSuppliers: 0,
      activeSuppliers: 0,
      inactiveSuppliers: 0,
      totalOrders: 0
    };
  }

  try {
    const suppliers = await getSuppliers();
    
    const stats = {
      totalSuppliers: suppliers.length,
      activeSuppliers: suppliers.filter(s => s.status === 'active').length,
      inactiveSuppliers: suppliers.filter(s => s.status === 'inactive').length,
      totalOrders: suppliers.reduce((sum, s) => sum + s.totalOrders, 0)
    };
    
    return stats;
  } catch (error) {
    console.error('Error calculating suppliers stats:', error);
    return {
      totalSuppliers: 0,
      activeSuppliers: 0,
      inactiveSuppliers: 0,
      totalOrders: 0
    };
  }
}