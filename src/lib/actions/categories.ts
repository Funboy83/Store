'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { db, isConfigured } from '@/lib/firebase';
import { 
  collection, 
  getDocs, 
  query, 
  orderBy, 
  addDoc, 
  updateDoc,
  deleteDoc,
  doc, 
  getDoc,
  serverTimestamp,
  where
} from 'firebase/firestore';
import type { Category, SubCategory, CategoryWithSubCategories } from '@/lib/types';

const DATA_PATH = 'app-data/cellsmart-data';
const CATEGORIES_COLLECTION = 'categories';
const SUBCATEGORIES_COLLECTION = 'subcategories';

// Helper function to get the data document reference
function getDataDocRef() {
  return doc(db, DATA_PATH);
}

// Validation schemas
const CategorySchema = z.object({
  name: z.string().min(1, 'Category name is required').max(50, 'Name must be less than 50 characters'),
  description: z.string().optional(),
});

const SubCategorySchema = z.object({
  categoryId: z.string().min(1, 'Category is required'),
  name: z.string().min(1, 'Sub-category name is required').max(50, 'Name must be less than 50 characters'),
  description: z.string().optional(),
});

// Get all categories
export async function getCategories(): Promise<Category[]> {
  if (!isConfigured) {
    return [];
  }

  try {
    const dataDocRef = getDataDocRef();
    const categoriesRef = collection(dataDocRef, CATEGORIES_COLLECTION);
    const categoriesQuery = query(categoriesRef, orderBy('name'));
    const snapshot = await getDocs(categoriesQuery);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Category));
  } catch (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
}

// Get all subcategories
export async function getSubCategories(): Promise<SubCategory[]> {
  if (!isConfigured) {
    return [];
  }

  try {
    const dataDocRef = getDataDocRef();
    const subCategoriesRef = collection(dataDocRef, SUBCATEGORIES_COLLECTION);
    const subCategoriesQuery = query(subCategoriesRef, orderBy('name'));
    const snapshot = await getDocs(subCategoriesQuery);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as SubCategory));
  } catch (error) {
    console.error('Error fetching subcategories:', error);
    return [];
  }
}

// Get subcategories by category ID
export async function getSubCategoriesByCategoryId(categoryId: string): Promise<SubCategory[]> {
  if (!isConfigured) {
    return [];
  }

  try {
    const dataDocRef = getDataDocRef();
    const subCategoriesRef = collection(dataDocRef, SUBCATEGORIES_COLLECTION);
    const subCategoriesQuery = query(
      subCategoriesRef, 
      where('categoryId', '==', categoryId),
      orderBy('name')
    );
    const snapshot = await getDocs(subCategoriesQuery);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as SubCategory));
  } catch (error) {
    console.error('Error fetching subcategories by category:', error);
    return [];
  }
}

// Get categories with their subcategories
export async function getCategoriesWithSubCategories(): Promise<CategoryWithSubCategories[]> {
  if (!isConfigured) {
    return [];
  }

  try {
    const [categories, subCategories] = await Promise.all([
      getCategories(),
      getSubCategories()
    ]);

    return categories.map(category => ({
      ...category,
      subCategories: subCategories.filter(sub => sub.categoryId === category.id)
    }));
  } catch (error) {
    console.error('Error fetching categories with subcategories:', error);
    return [];
  }
}

// Create a new category
export async function createCategory(data: z.infer<typeof CategorySchema>): Promise<{ success: boolean; error?: string; id?: string }> {
  if (!isConfigured) {
    return { success: false, error: 'Firebase not configured' };
  }

  try {
    const result = CategorySchema.safeParse(data);
    if (!result.success) {
      return { 
        success: false, 
        error: result.error.errors.map(e => e.message).join(', ') 
      };
    }

    // Check if category name already exists
    const dataDocRef = getDataDocRef();
    const categoriesRef = collection(dataDocRef, CATEGORIES_COLLECTION);
    const existingQuery = query(categoriesRef, where('name', '==', result.data.name.trim()));
    const existingSnapshot = await getDocs(existingQuery);
    
    if (!existingSnapshot.empty) {
      return { success: false, error: 'A category with this name already exists' };
    }

    const categoryData = {
      ...result.data,
      name: result.data.name.trim(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const docRef = await addDoc(categoriesRef, categoryData);
    
    revalidatePath('/dashboard/settings/categories');
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('Error creating category:', error);
    return { success: false, error: 'Failed to create category' };
  }
}

// Update a category
export async function updateCategory(
  id: string, 
  data: z.infer<typeof CategorySchema>
): Promise<{ success: boolean; error?: string }> {
  if (!isConfigured) {
    return { success: false, error: 'Firebase not configured' };
  }

  try {
    const result = CategorySchema.safeParse(data);
    if (!result.success) {
      return { 
        success: false, 
        error: result.error.errors.map(e => e.message).join(', ') 
      };
    }

    // Check if category name already exists (excluding current category)
    const dataDocRef = getDataDocRef();
    const categoriesRef = collection(dataDocRef, CATEGORIES_COLLECTION);
    const existingQuery = query(categoriesRef, where('name', '==', result.data.name.trim()));
    const existingSnapshot = await getDocs(existingQuery);
    
    const existingCategory = existingSnapshot.docs.find(doc => doc.id !== id);
    if (existingCategory) {
      return { success: false, error: 'A category with this name already exists' };
    }

    const categoryRef = doc(dataDocRef, CATEGORIES_COLLECTION, id);
    
    const updateData = {
      ...result.data,
      name: result.data.name.trim(),
      updatedAt: serverTimestamp(),
    };

    await updateDoc(categoryRef, updateData);
    
    revalidatePath('/dashboard/settings/categories');
    return { success: true };
  } catch (error) {
    console.error('Error updating category:', error);
    return { success: false, error: 'Failed to update category' };
  }
}

// Delete a category (only if it has no subcategories)
export async function deleteCategory(id: string): Promise<{ success: boolean; error?: string }> {
  if (!isConfigured) {
    return { success: false, error: 'Firebase not configured' };
  }

  try {
    // Check if category has subcategories
    const subCategories = await getSubCategoriesByCategoryId(id);
    if (subCategories.length > 0) {
      return { 
        success: false, 
        error: 'Cannot delete category that contains sub-categories. Please delete all sub-categories first.' 
      };
    }

    const categoryRef = doc(getDataDocRef(), CATEGORIES_COLLECTION, id);
    await deleteDoc(categoryRef);
    
    revalidatePath('/dashboard/settings/categories');
    return { success: true };
  } catch (error) {
    console.error('Error deleting category:', error);
    return { success: false, error: 'Failed to delete category' };
  }
}

// Create a new subcategory
export async function createSubCategory(data: z.infer<typeof SubCategorySchema>): Promise<{ success: boolean; error?: string; id?: string }> {
  if (!isConfigured) {
    return { success: false, error: 'Firebase not configured' };
  }

  try {
    const result = SubCategorySchema.safeParse(data);
    if (!result.success) {
      return { 
        success: false, 
        error: result.error.errors.map(e => e.message).join(', ') 
      };
    }

    // Check if subcategory name already exists within the same category
    const subCategoriesRef = collection(getDataDocRef(), SUBCATEGORIES_COLLECTION);
    const existingQuery = query(
      subCategoriesRef, 
      where('categoryId', '==', result.data.categoryId),
      where('name', '==', result.data.name.trim())
    );
    const existingSnapshot = await getDocs(existingQuery);
    
    if (!existingSnapshot.empty) {
      return { success: false, error: 'A sub-category with this name already exists in this category' };
    }

    const subCategoryData = {
      ...result.data,
      name: result.data.name.trim(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const docRef = await addDoc(subCategoriesRef, subCategoryData);
    
    revalidatePath('/dashboard/settings/categories');
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('Error creating subcategory:', error);
    return { success: false, error: 'Failed to create sub-category' };
  }
}

// Update a subcategory
export async function updateSubCategory(
  id: string, 
  data: z.infer<typeof SubCategorySchema>
): Promise<{ success: boolean; error?: string }> {
  if (!isConfigured) {
    return { success: false, error: 'Firebase not configured' };
  }

  try {
    const result = SubCategorySchema.safeParse(data);
    if (!result.success) {
      return { 
        success: false, 
        error: result.error.errors.map(e => e.message).join(', ') 
      };
    }

    // Check if subcategory name already exists within the same category (excluding current subcategory)
    const subCategoriesRef = collection(getDataDocRef(), SUBCATEGORIES_COLLECTION);
    const existingQuery = query(
      subCategoriesRef,
      where('categoryId', '==', result.data.categoryId),
      where('name', '==', result.data.name.trim())
    );
    const existingSnapshot = await getDocs(existingQuery);
    
    const existingSubCategory = existingSnapshot.docs.find(doc => doc.id !== id);
    if (existingSubCategory) {
      return { success: false, error: 'A sub-category with this name already exists in this category' };
    }

    const subCategoryRef = doc(getDataDocRef(), SUBCATEGORIES_COLLECTION, id);
    
    const updateData = {
      ...result.data,
      name: result.data.name.trim(),
      updatedAt: serverTimestamp(),
    };

    await updateDoc(subCategoryRef, updateData);
    
    revalidatePath('/dashboard/settings/categories');
    return { success: true };
  } catch (error) {
    console.error('Error updating subcategory:', error);
    return { success: false, error: 'Failed to update sub-category' };
  }
}

// Delete a subcategory
export async function deleteSubCategory(id: string): Promise<{ success: boolean; error?: string }> {
  if (!isConfigured) {
    return { success: false, error: 'Firebase not configured' };
  }

  try {
    const subCategoryRef = doc(getDataDocRef(), SUBCATEGORIES_COLLECTION, id);
    await deleteDoc(subCategoryRef);
    
    revalidatePath('/dashboard/settings/categories');
    return { success: true };
  } catch (error) {
    console.error('Error deleting subcategory:', error);
    return { success: false, error: 'Failed to delete sub-category' };
  }
}

// Get a single category by ID
export async function getCategoryById(id: string): Promise<Category | null> {
  if (!isConfigured) {
    return null;
  }

  try {
    const categoryRef = doc(getDataDocRef(), CATEGORIES_COLLECTION, id);
    const categoryDoc = await getDoc(categoryRef);
    
    if (!categoryDoc.exists()) {
      return null;
    }
    
    return {
      id: categoryDoc.id,
      ...categoryDoc.data()
    } as Category;
  } catch (error) {
    console.error('Error fetching category:', error);
    return null;
  }
}

// Get a single subcategory by ID
export async function getSubCategoryById(id: string): Promise<SubCategory | null> {
  if (!isConfigured) {
    return null;
  }

  try {
    const subCategoryRef = doc(getDataDocRef(), SUBCATEGORIES_COLLECTION, id);
    const subCategoryDoc = await getDoc(subCategoryRef);
    
    if (!subCategoryDoc.exists()) {
      return null;
    }
    
    return {
      id: subCategoryDoc.id,
      ...subCategoryDoc.data()
    } as SubCategory;
  } catch (error) {
    console.error('Error fetching subcategory:', error);
    return null;
  }
}
