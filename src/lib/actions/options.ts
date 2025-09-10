
'use server';

import { revalidatePath } from 'next/cache';
import { db, isConfigured } from '@/lib/firebase';
import { collection, getDocs, addDoc, serverTimestamp, query, orderBy } from 'firebase/firestore';

const OPTIONS_BASE_PATH = 'cellphone-inventory-system/data';

async function getOptions(optionType: string): Promise<string[]> {
    if (!isConfigured) return [];
    try {
        const optionsCollection = collection(db, `${OPTIONS_BASE_PATH}/${optionType}`);
        const q = query(optionsCollection, orderBy('value'));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => doc.data().value as string);
    } catch (error) {
        console.error(`Error fetching options for ${optionType}:`, error);
        return [];
    }
}

async function addOption(optionType: string, value: string): Promise<{ success: boolean; error?: string }> {
    if (!isConfigured) {
        return { success: false, error: 'Firebase is not configured.' };
    }
    if (!value || value.trim().length < 1) {
        return { success: false, error: 'Option value cannot be empty.' };
    }

    try {
        const optionsCollection = collection(db, `${OPTIONS_BASE_PATH}/${optionType}`);
        await addDoc(optionsCollection, {
            value: value.trim(),
            createdAt: serverTimestamp(),
        });
        // We can't revalidate from here in the same way, but the client will refetch.
        return { success: true };
    } catch (error) {
        console.error(`Error adding option for ${optionType}:`, error);
        return { success: false, error: `Failed to add new option for ${optionType}.` };
    }
}

export const getBrandOptions = () => getOptions('options_brand');
export const addBrandOption = (value: string) => addOption('options_brand', value);

export const getStorageOptions = () => getOptions('options_storage');
export const addStorageOption = (value: string) => addOption('options_storage', value);

export const getColorOptions = () => getOptions('options_color');
export const addColorOption = (value: string) => addOption('options_color', value);

export const getCarrierOptions = () => getOptions('options_carrier');
export const addCarrierOption = (value: string) => addOption('options_carrier', value);

export const getGradeOptions = () => getOptions('options_grade');
export const addGradeOption = (value: string) => addOption('options_grade', value);
