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
  getDoc
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { FieldTemplate, FieldType } from '@/lib/types';
import { revalidatePath } from 'next/cache';

const DATA_PATH = 'app-data/cellsmart-data';
const FIELD_TEMPLATES_COLLECTION = 'fieldTemplates';

// Check if Firebase is configured
const isConfigured = !!db;

export async function createFieldTemplate(
  templateData: Omit<FieldTemplate, 'id' | 'createdAt' | 'updatedAt'>
): Promise<{ success: boolean; error?: string; templateId?: string }> {
  if (!isConfigured) {
    return { success: false, error: 'Firebase is not configured.' };
  }

  try {
    // Validate required fields
    if (!templateData.label?.trim()) {
      return { success: false, error: 'Field label is required.' };
    }

    if (!templateData.fieldType) {
      return { success: false, error: 'Field type is required.' };
    }

    // Generate fieldName from label if not provided
    const fieldName = templateData.fieldName?.trim() || 
      templateData.label.toLowerCase()
        .replace(/\s+/g, '_')
        .replace(/[^a-z0-9_]/g, '');

    // Validate dropdown options
    if (templateData.fieldType === 'Dropdown' && (!templateData.options || templateData.options.length === 0)) {
      return { success: false, error: 'Dropdown fields must have at least one option.' };
    }

    const template: Omit<FieldTemplate, 'id'> = {
      ...templateData,
      fieldName,
      label: templateData.label.trim(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const dataDocRef = doc(db, DATA_PATH);
    const templatesRef = collection(dataDocRef, FIELD_TEMPLATES_COLLECTION);
    
    const docRef = await addDoc(templatesRef, {
      ...template,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    revalidatePath('/dashboard/settings/custom-fields');

    return { success: true, templateId: docRef.id };
  } catch (error) {
    console.error('Error creating field template:', error);
    return { success: false, error: 'Failed to create field template.' };
  }
}

export async function getFieldTemplates(): Promise<FieldTemplate[]> {
  if (!isConfigured) {
    console.log('Firebase not configured, returning empty array');
    return [];
  }

  try {
    const dataDocRef = doc(db, DATA_PATH);
    const templatesRef = collection(dataDocRef, FIELD_TEMPLATES_COLLECTION);
    const q = query(templatesRef, orderBy('fieldName', 'asc'));
    
    const snapshot = await getDocs(q);
    const templates: FieldTemplate[] = snapshot.docs.map(doc => {
      const data = doc.data();
      
      // Convert timestamps to ISO strings
      const convertedData = {
        ...data,
        id: doc.id,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt,
      };
      
      return convertedData as unknown as FieldTemplate;
    });

    return templates;
  } catch (error) {
    console.error('Error fetching field templates:', error);
    return [];
  }
}

export async function getFieldTemplate(id: string): Promise<{ success: boolean; template?: FieldTemplate; error?: string }> {
  if (!isConfigured) {
    return { success: false, error: 'Firebase is not configured.' };
  }

  try {
    const dataDocRef = doc(db, DATA_PATH);
    const templateDocRef = doc(dataDocRef, `${FIELD_TEMPLATES_COLLECTION}/${id}`);
    
    const docSnap = await getDoc(templateDocRef);
    
    if (!docSnap.exists()) {
      return { success: false, error: 'Field template not found.' };
    }

    const data = docSnap.data();
    const template: FieldTemplate = {
      ...data,
      id: docSnap.id,
      createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
      updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt,
    } as FieldTemplate;

    return { success: true, template };
  } catch (error) {
    console.error('Error fetching field template:', error);
    return { success: false, error: 'Failed to fetch field template.' };
  }
}

export async function updateFieldTemplate(
  id: string, 
  templateData: Omit<FieldTemplate, 'id' | 'createdAt' | 'updatedAt'>
): Promise<{ success: boolean; error?: string }> {
  if (!isConfigured) {
    return { success: false, error: 'Firebase is not configured.' };
  }

  try {
    // Validate required fields
    if (!templateData.fieldName?.trim()) {
      return { success: false, error: 'Field name is required.' };
    }

    if (!templateData.fieldType) {
      return { success: false, error: 'Field type is required.' };
    }

    // Validate dropdown options
    if (templateData.fieldType === 'Dropdown' && (!templateData.options || templateData.options.length === 0)) {
      return { success: false, error: 'Dropdown fields must have at least one option.' };
    }

    const dataDocRef = doc(db, DATA_PATH);
    const templateDocRef = doc(dataDocRef, `${FIELD_TEMPLATES_COLLECTION}/${id}`);
    
    await updateDoc(templateDocRef, {
      ...templateData,
      fieldName: templateData.fieldName.trim(),
      updatedAt: serverTimestamp(),
    });

    revalidatePath('/dashboard/settings/custom-fields');

    return { success: true };
  } catch (error) {
    console.error('Error updating field template:', error);
    return { success: false, error: 'Failed to update field template.' };
  }
}

export async function deleteFieldTemplate(id: string): Promise<{ success: boolean; error?: string }> {
  if (!isConfigured) {
    return { success: false, error: 'Firebase is not configured.' };
  }

  try {
    const dataDocRef = doc(db, DATA_PATH);
    const templateDocRef = doc(dataDocRef, `${FIELD_TEMPLATES_COLLECTION}/${id}`);
    
    await deleteDoc(templateDocRef);

    revalidatePath('/dashboard/settings/custom-fields');

    return { success: true };
  } catch (error) {
    console.error('Error deleting field template:', error);
    return { success: false, error: 'Failed to delete field template.' };
  }
}