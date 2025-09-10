'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { db, isConfigured } from '@/lib/firebase';
import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { MOCK_PRODUCTS } from '@/lib/mock-data';
import type { Product } from '@/lib/types';

const ProductSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters'),
  brand: z.string().min(2, 'Brand must be at least 2 characters'),
  model: z.string().min(2, 'Model must be at least 2 characters'),
  price: z.coerce.number().positive('Price must be a positive number'),
  stock: z.coerce.number().int().min(0, 'Stock cannot be negative'),
  imageUrl: z.string().url('Must be a valid image URL'),
});

const INVENTORY_PATH = 'cellphone-inventory-system/data/inventory';

export async function getInventory(): Promise<Product[]> {
  if (!isConfigured) {
    console.log('Firebase not configured, returning mock data.');
    return Promise.resolve(MOCK_PRODUCTS);
  }

  try {
    const inventoryCollection = collection(db, INVENTORY_PATH);
    const snapshot = await getDocs(inventoryCollection);
    if (snapshot.empty) {
        // If firebase is empty, populate with mock data
        for (const product of MOCK_PRODUCTS) {
            const { id, ...productData } = product;
            await addDoc(inventoryCollection, productData);
        }
        const newSnapshot = await getDocs(inventoryCollection);
        return newSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
    }
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
  } catch (error) {
    console.error('Error fetching inventory:', error);
    // Fallback to mock data on error
    return MOCK_PRODUCTS;
  }
}

export async function addProduct(prevState: any, formData: FormData) {
  const validatedFields = ProductSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }
  
  if (!isConfigured) {
    console.log('Firebase not configured, adding to mock data (runtime only).');
    MOCK_PRODUCTS.push({ id: `prod_${Date.now()}`, ...validatedFields.data });
    revalidatePath('/dashboard/inventory');
    return { success: true };
  }

  try {
    const inventoryCollection = collection(db, INVENTORY_PATH);
    await addDoc(inventoryCollection, validatedFields.data);
    revalidatePath('/dashboard/inventory');
    return { success: true };
  } catch (error) {
    console.error('Error adding product:', error);
    return { errors: { _form: ['Failed to add product.'] } };
  }
}

export async function updateProduct(id: string, data: Partial<Product>) {
    if (!isConfigured) {
        console.log("Firebase not configured, cannot update.");
        return;
    }
    try {
        const productRef = doc(db, INVENTORY_PATH, id);
        await updateDoc(productRef, data);
        revalidatePath('/dashboard/inventory');
    } catch (error) {
        console.error('Error updating product:', error);
    }
}

export async function deleteProduct(id: string) {
    if (!isConfigured) {
        console.log("Firebase not configured, cannot delete.");
        return;
    }
    try {
        const productRef = doc(db, INVENTORY_PATH, id);
        await deleteDoc(productRef);
        revalidatePath('/dashboard/inventory');
    } catch (error) {
        console.error('Error deleting product:', error);
    }
}
