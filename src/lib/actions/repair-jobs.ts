'use server';

import { db, isConfigured } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, doc, getDocs, query, orderBy, updateDoc, getDoc } from 'firebase/firestore';
import { RepairJob, JobStatus, DeviceCondition } from '@/lib/types';
import { revalidatePath } from 'next/cache';

const DATA_PATH = 'cellphone-inventory-system/data';
const REPAIR_JOBS_COLLECTION = 'repair-jobs';

interface CreateRepairJobData {
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  deviceMake: string;
  deviceModel: string;
  imei?: string;
  serialNumber?: string;
  problemDescription: string;
  estimatedCost: number;
  deviceConditions: DeviceCondition[];
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
}

export async function createRepairJob(data: CreateRepairJobData): Promise<{ success: boolean; jobId?: string; error?: string }> {
  if (!isConfigured) {
    return { success: false, error: 'Firebase is not configured.' };
  }

  try {
    // Generate job ID (format: REP-YYYYMMDD-XXXX)
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const jobId = `REP-${dateStr}-${randomNum}`;

    // Create the repair job document
    const repairJob: Omit<RepairJob, 'id'> = {
      jobId,
      customerId: '', // We'll update this if we link to existing customer
      customerName: data.customerName,
      customerPhone: data.customerPhone,
      deviceMake: data.deviceMake,
      deviceModel: data.deviceModel,
      imei: data.imei || '',
      serialNumber: data.serialNumber || '',
      problemDescription: data.problemDescription,
      deviceConditions: data.deviceConditions,
      status: 'Pending' as JobStatus,
      priority: data.priority,
      estimatedCost: data.estimatedCost,
      actualCost: 0,
      technicianNotes: [],
      internalNotes: [],
      usedParts: [],
      laborCost: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      estimatedCompletion: '',
      completedAt: '',
      invoiceGenerated: false,
      isPaid: false,
    };

    // Add to Firebase
    const dataDocRef = doc(db, DATA_PATH);
    const repairJobsRef = collection(dataDocRef, REPAIR_JOBS_COLLECTION);
    
    await addDoc(repairJobsRef, {
      ...repairJob,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      dateReceived: serverTimestamp(),
    });

    // Revalidate relevant pages
    revalidatePath('/dashboard/repairs');
    revalidatePath('/dashboard/jobs');
    revalidatePath('/dashboard/repair-customers');

    return { success: true, jobId };
  } catch (error) {
    console.error('Error creating repair job:', error);
    return { success: false, error: 'Failed to create repair job.' };
  }
}

export async function getRepairJobs(): Promise<RepairJob[]> {
  if (!isConfigured) {
    // Return mock data for development
    return [];
  }

  try {
    const dataDocRef = doc(db, DATA_PATH);
    const repairJobsRef = collection(dataDocRef, REPAIR_JOBS_COLLECTION);
    const q = query(repairJobsRef, orderBy('createdAt', 'desc'));
    
    const snapshot = await getDocs(q);
    const jobs: RepairJob[] = snapshot.docs.map(doc => {
      const data = doc.data();
      
      // Create a deep copy and convert all timestamps
      const cleanData = JSON.parse(JSON.stringify(data, (key, value) => {
        // Convert any Firestore timestamp to ISO string
        if (value && typeof value === 'object' && value.seconds && value.nanoseconds) {
          return new Date(value.seconds * 1000 + value.nanoseconds / 1000000).toISOString();
        }
        return value;
      }));
      
      const convertedData = {
        ...cleanData,
        id: doc.id,
        // Ensure all date fields are strings
        createdAt: data.createdAt?.toDate?.()?.toISOString() || cleanData.createdAt || new Date().toISOString(),
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || cleanData.updatedAt || new Date().toISOString(),
        completedAt: data.completedAt?.toDate?.()?.toISOString() || cleanData.completedAt || '',
        dateReceived: data.dateReceived?.toDate?.()?.toISOString() || cleanData.dateReceived || new Date().toISOString(),
      };
      
      return convertedData as unknown as RepairJob;
    });

    return jobs;
  } catch (error) {
    console.error('Error fetching repair jobs:', error);
    return [];
  }
}

export async function updateRepairJobStatus(jobId: string, status: JobStatus): Promise<{ success: boolean; error?: string }> {
  if (!isConfigured) {
    return { success: false, error: 'Firebase is not configured.' };
  }

  try {
    const dataDocRef = doc(db, DATA_PATH);
    const jobRef = doc(dataDocRef, `${REPAIR_JOBS_COLLECTION}/${jobId}`);
    
    const updateData: any = {
      status,
      updatedAt: serverTimestamp(),
    };

    // Set completion date if marking as completed
    if (status === 'Completed') {
      updateData.completedAt = serverTimestamp();
    }

    await updateDoc(jobRef, updateData);

    // Revalidate pages
    revalidatePath('/dashboard/repairs');
    revalidatePath('/dashboard/jobs');

    return { success: true };
  } catch (error) {
    console.error('Error updating repair job status:', error);
    return { success: false, error: 'Failed to update job status.' };
  }
}

export async function getRepairJobStats() {
  try {
    const jobs = await getRepairJobs();
    console.log('Retrieved jobs for stats:', jobs.length);
    
    const jobStats = {
      total: jobs.length,
      waitingForParts: jobs.filter(job => job.status === 'Waiting for Parts').length,
      inProgress: jobs.filter(job => job.status === 'In Progress').length,
      readyForPickup: jobs.filter(job => job.status === 'Ready for Pickup').length,
      completed: jobs.filter(job => job.status === 'Completed').length,
      paid: jobs.filter(job => job.status === 'Paid').length,
    };

    // Calculate revenue
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thisWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const paidJobs = jobs.filter(job => job.isPaid && job.completedAt);
    
    const revenue = {
      today: paidJobs
        .filter(job => job.completedAt && new Date(job.completedAt) >= today)
        .reduce((sum, job) => sum + (job.estimatedCost || 0), 0),
      thisWeek: paidJobs
        .filter(job => job.completedAt && new Date(job.completedAt) >= thisWeek)
        .reduce((sum, job) => sum + (job.estimatedCost || 0), 0),
      thisMonth: paidJobs
        .filter(job => job.completedAt && new Date(job.completedAt) >= thisMonth)
        .reduce((sum, job) => sum + (job.estimatedCost || 0), 0),
    };

    return {
      jobs: jobStats,
      revenue,
      recentJobs: jobs.slice(0, 10),
      pendingPickups: jobs.filter(job => job.status === 'Ready for Pickup').slice(0, 5),
    };
  } catch (error) {
    console.error('Error getting repair job stats:', error);
    
    // Return empty stats as fallback
    return {
      jobs: {
        total: 0,
        waitingForParts: 0,
        inProgress: 0,
        readyForPickup: 0,
        completed: 0,
        paid: 0,
      },
      revenue: {
        today: 0,
        thisWeek: 0,
        thisMonth: 0,
      },
      recentJobs: [],
      pendingPickups: [],
    };
  }
}

export async function getRepairJobById(jobId: string): Promise<RepairJob | null> {
  try {
    const jobs = await getRepairJobs();
    const job = jobs.find(j => j.id === jobId);
    return job || null;
  } catch (error) {
    console.error('Error fetching repair job by ID:', error);
    return null;
  }
}