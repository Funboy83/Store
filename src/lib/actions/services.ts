'use server';

import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  getDoc, 
  query, 
  where, 
  orderBy, 
  serverTimestamp,
  writeBatch
} from 'firebase/firestore';
import { db, isConfigured } from '@/lib/firebase';
import { Service } from '@/lib/types';

const DATA_PATH = 'app-data/cellsmart-data';
const SERVICES_COLLECTION = 'services';

// Get all services
export async function getServices(): Promise<Service[]> {
  if (!isConfigured) {
    console.warn('Firebase is not configured.');
    return [];
  }

  try {
    const dataDocRef = doc(db, DATA_PATH);
    const servicesRef = collection(dataDocRef, SERVICES_COLLECTION);
    const q = query(servicesRef, orderBy('name'));
    
    const snapshot = await getDocs(q);
    const services: Service[] = [];
    
    snapshot.forEach((doc) => {
      services.push({ id: doc.id, ...doc.data() } as Service);
    });

    return services;
  } catch (error) {
    console.error('Error getting services:', error);
    return [];
  }
}

// Get active services only
export async function getActiveServices(): Promise<Service[]> {
  if (!isConfigured) {
    console.warn('Firebase is not configured.');
    return [];
  }

  try {
    // Get all services first, then filter client-side to handle potential isActive field issues
    const allServices = await getServices();
    
    // Filter for active services (include ones where isActive is true or undefined for backward compatibility)
    const activeServices = allServices.filter(service => service.isActive !== false);
    
    // Sort by category and name
    activeServices.sort((a, b) => {
      const categoryCompare = a.category.localeCompare(b.category);
      if (categoryCompare !== 0) return categoryCompare;
      return a.name.localeCompare(b.name);
    });

    return activeServices;
  } catch (error) {
    console.error('Error getting active services:', error);
    return [];
  }
}

// Get service by ID
export async function getServiceById(serviceId: string): Promise<Service | null> {
  if (!isConfigured) {
    console.warn('Firebase is not configured.');
    return null;
  }

  try {
    const dataDocRef = doc(db, DATA_PATH);
    const serviceRef = doc(dataDocRef, `${SERVICES_COLLECTION}/${serviceId}`);
    const serviceDoc = await getDoc(serviceRef);
    
    if (serviceDoc.exists()) {
      return { id: serviceDoc.id, ...serviceDoc.data() } as Service;
    }
    
    return null;
  } catch (error) {
    console.error('Error getting service by ID:', error);
    return null;
  }
}

// Create new service
export async function createService(serviceData: Omit<Service, 'id' | 'createdAt' | 'updatedAt'>): Promise<{ success: boolean; serviceId?: string; error?: string }> {
  if (!isConfigured) {
    return { success: false, error: 'Firebase is not configured.' };
  }

  try {
    const dataDocRef = doc(db, DATA_PATH);
    const servicesRef = collection(dataDocRef, SERVICES_COLLECTION);
    
    const newService = {
      ...serviceData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const docRef = await addDoc(servicesRef, newService);

    return { 
      success: true, 
      serviceId: docRef.id 
    };
  } catch (error) {
    console.error('Error creating service:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    };
  }
}

// Update service
export async function updateService(serviceId: string, updates: Partial<Omit<Service, 'id' | 'createdAt' | 'updatedAt'>>): Promise<{ success: boolean; error?: string }> {
  if (!isConfigured) {
    return { success: false, error: 'Firebase is not configured.' };
  }

  try {
    const dataDocRef = doc(db, DATA_PATH);
    const serviceRef = doc(dataDocRef, `${SERVICES_COLLECTION}/${serviceId}`);
    
    const updateData = {
      ...updates,
      updatedAt: serverTimestamp(),
    };

    await updateDoc(serviceRef, updateData);

    return { success: true };
  } catch (error) {
    console.error('Error updating service:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    };
  }
}

// Delete service (soft delete by setting isActive to false)
export async function deleteService(serviceId: string): Promise<{ success: boolean; error?: string }> {
  if (!isConfigured) {
    return { success: false, error: 'Firebase is not configured.' };
  }

  try {
    const dataDocRef = doc(db, DATA_PATH);
    const serviceRef = doc(dataDocRef, `${SERVICES_COLLECTION}/${serviceId}`);
    
    await updateDoc(serviceRef, {
      isActive: false,
      updatedAt: serverTimestamp(),
    });

    return { success: true };
  } catch (error) {
    console.error('Error deleting service:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    };
  }
}

// Create default services for new installations
export async function createDefaultServices(): Promise<{ success: boolean; error?: string }> {
  if (!isConfigured) {
    return { success: false, error: 'Firebase is not configured.' };
  }

  try {
    const defaultServices: Omit<Service, 'id' | 'createdAt' | 'updatedAt'>[] = [
      {
        name: 'Hourly Labor',
        description: 'Standard technician labor rate per hour',
        category: 'Labor',
        price: 75.00,
        estimatedTime: 60,
        isActive: true,
      },
      {
        name: 'Diagnostic Fee',
        description: 'Device diagnostic and troubleshooting',
        category: 'Diagnostic',
        price: 50.00,
        estimatedTime: 30,
        isActive: true,
      },
      {
        name: 'Screen Replacement - Phone',
        description: 'Phone screen replacement service including installation',
        category: 'Repair',
        price: 150.00,
        estimatedTime: 45,
        isActive: true,
      },
      {
        name: 'Battery Replacement',
        description: 'Device battery replacement service',
        category: 'Repair',
        price: 80.00,
        estimatedTime: 30,
        isActive: true,
      },
      {
        name: 'Data Transfer',
        description: 'Transfer data from old device to new device',
        category: 'Installation',
        price: 40.00,
        estimatedTime: 60,
        isActive: true,
      },
      {
        name: 'Software Installation',
        description: 'Install and configure software applications',
        category: 'Installation',
        price: 30.00,
        estimatedTime: 30,
        isActive: true,
      },
      {
        name: 'Virus Removal',
        description: 'Remove malware and viruses from device',
        category: 'Repair',
        price: 100.00,
        estimatedTime: 90,
        isActive: true,
      },
      {
        name: 'Water Damage Assessment',
        description: 'Comprehensive water damage diagnostic and cleaning',
        category: 'Diagnostic',
        price: 75.00,
        estimatedTime: 60,
        isActive: true,
      }
    ];

    const dataDocRef = doc(db, DATA_PATH);
    const servicesRef = collection(dataDocRef, SERVICES_COLLECTION);
    const batch = writeBatch(db);

    for (const service of defaultServices) {
      const newDocRef = doc(servicesRef);
      batch.set(newDocRef, {
        ...service,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }

    await batch.commit();

    return { success: true };
  } catch (error) {
    console.error('Error creating default services:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    };
  }
}

// Get services by category
export async function getServicesByCategory(category: Service['category']): Promise<Service[]> {
  if (!isConfigured) {
    console.warn('Firebase is not configured.');
    return [];
  }

  try {
    const dataDocRef = doc(db, DATA_PATH);
    const servicesRef = collection(dataDocRef, SERVICES_COLLECTION);
    const q = query(
      servicesRef, 
      where('category', '==', category),
      where('isActive', '==', true),
      orderBy('name')
    );
    
    const snapshot = await getDocs(q);
    const services: Service[] = [];
    
    snapshot.forEach((doc) => {
      services.push({ id: doc.id, ...doc.data() } as Service);
    });

    return services;
  } catch (error) {
    console.error('Error getting services by category:', error);
    return [];
  }
}