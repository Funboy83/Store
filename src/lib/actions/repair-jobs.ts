'use server';

import { db, isConfigured } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, doc, getDocs, query, orderBy, updateDoc, getDoc } from 'firebase/firestore';
import { RepairJob, JobStatus, DeviceCondition, UsedPart } from '@/lib/types';
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
    
    // Get the current job data to check previous status and parts used
    const jobDoc = await getDoc(jobRef);
    if (!jobDoc.exists()) {
      return { success: false, error: 'Job not found.' };
    }

    const currentJob = jobDoc.data() as RepairJob;
    const previousStatus = currentJob.status;

    const updateData: any = {
      status,
      updatedAt: serverTimestamp(),
    };

    // Set completion date if marking as completed
    if (status === 'Completed') {
      updateData.completedAt = serverTimestamp();
    }

    // Set paid date if marking as paid
    if (status === 'Paid') {
      updateData.paidAt = serverTimestamp();
      updateData.isPaid = true;
    }

    await updateDoc(jobRef, updateData);

    // AUTOMATIC INVENTORY DEDUCTION
    // Trigger inventory deduction when job status changes to 'Completed' or 'Paid'
    const shouldDeductInventory = (status === 'Completed' || status === 'Paid') && 
                                 previousStatus !== 'Completed' && 
                                 previousStatus !== 'Paid';

    if (shouldDeductInventory && currentJob.usedParts && currentJob.usedParts.length > 0) {
      console.log(`🔄 FIFO Inventory Deduction for job ${currentJob.jobId} - ${currentJob.usedParts.length} parts used`);
      
      // Import FIFO consumption function
      const { consumePartFromOldestBatch } = await import('./parts');
      
      const inventoryErrors: string[] = [];
      const actualCosts: Array<{ partId: string; actualCost: number; batchId: string }> = [];
      
      for (const usedPart of currentJob.usedParts) {
        try {
          console.log(`📦 Processing ${usedPart.quantity} x ${usedPart.partName} (ID: ${usedPart.partId})`);
          
          // Use FIFO consumption to deduct from oldest batch first
          const consumeResult = await consumePartFromOldestBatch(
            usedPart.partId,
            usedPart.quantity,
            currentJob.id,
            `Used in repair job ${currentJob.jobId} (${currentJob.customerName})`
          );

          if (!consumeResult.success) {
            inventoryErrors.push(`Failed to deduct inventory for ${usedPart.partName}: ${consumeResult.error}`);
          } else {
            // Track the actual cost from the specific batch used
            if (consumeResult.costPrice && consumeResult.batchId) {
              actualCosts.push({
                partId: usedPart.partId,
                actualCost: consumeResult.costPrice,
                batchId: consumeResult.batchId
              });
            }
            
            console.log(`✅ FIFO Deducted ${usedPart.quantity} x ${usedPart.partName} from batch ${consumeResult.batchId} at cost $${consumeResult.costPrice}`);
            console.log(`📊 Remaining inventory: ${consumeResult.remainingQuantity} units`);
          }
        } catch (error) {
          console.error(`Error deducting inventory for part ${usedPart.partName}:`, error);
          inventoryErrors.push(`Error processing ${usedPart.partName}: ${error}`);
        }
      }

      // Log any inventory errors but don't fail the status update
      if (inventoryErrors.length > 0) {
        console.error('Inventory deduction errors:', inventoryErrors);
        // You could optionally return a warning here, but we'll let the status update succeed
      }
    }

    // Revalidate pages
    revalidatePath('/dashboard/repairs');
    revalidatePath('/dashboard/jobs');
    revalidatePath('/dashboard/parts'); // Also revalidate parts page since inventory changed

    return { success: true };
  } catch (error) {
    console.error('Error updating repair job status:', error);
    return { success: false, error: 'Failed to update job status.' };
  }
}

// Function to add a part to a repair job
export async function addPartToJob(
  jobId: string, 
  partId: string, 
  quantity: number = 1
): Promise<{ success: boolean; error?: string }> {
  if (!isConfigured) {
    return { success: false, error: 'Firebase is not configured.' };
  }

  try {
    // Get the job and part data
    const job = await getRepairJobById(jobId);
    if (!job) {
      return { success: false, error: 'Job not found.' };
    }

    // Import getPart function
    const { getPart } = await import('./parts');
    const partResult = await getPart(partId);
    if (!partResult.success || !partResult.part) {
      return { success: false, error: 'Part not found.' };
    }
    const part = partResult.part;

    // Check if part is already added to this job
    const existingPartIndex = job.usedParts?.findIndex((up: UsedPart) => up.partId === partId) ?? -1;
    
    let updatedUsedParts: UsedPart[];
    
    if (existingPartIndex >= 0) {
      // Update existing part quantity
      updatedUsedParts = [...(job.usedParts || [])];
      updatedUsedParts[existingPartIndex].quantity += quantity;
      updatedUsedParts[existingPartIndex].total = updatedUsedParts[existingPartIndex].quantity * updatedUsedParts[existingPartIndex].price;
    } else {
      // Add new part
      const newUsedPart: UsedPart = {
        partId: part.id,
        partName: part.name,
        quantity: quantity,
        cost: part.avgCost, // Use average cost for estimation
        price: part.price,
        total: quantity * part.price,
      };
      updatedUsedParts = [...(job.usedParts || []), newUsedPart];
    }

    // Update the job with the new parts list
    const dataDocRef = doc(db, DATA_PATH);
    const jobRef = doc(dataDocRef, `${REPAIR_JOBS_COLLECTION}/${jobId}`);
    
    await updateDoc(jobRef, {
      usedParts: updatedUsedParts,
      updatedAt: serverTimestamp(),
    });

    revalidatePath('/dashboard/jobs');
    revalidatePath(`/dashboard/jobs/${jobId}`);

    return { success: true };
  } catch (error) {
    console.error('Error adding part to job:', error);
    return { success: false, error: 'Failed to add part to job.' };
  }
}

// Function to remove a part from a repair job
export async function removePartFromJob(
  jobId: string, 
  partId: string, 
  quantityToRemove: number = 1
): Promise<{ success: boolean; error?: string }> {
  if (!isConfigured) {
    return { success: false, error: 'Firebase is not configured.' };
  }

  try {
    const job = await getRepairJobById(jobId);
    if (!job) {
      return { success: false, error: 'Job not found.' };
    }
    const existingPartIndex = job.usedParts?.findIndex((up: UsedPart) => up.partId === partId) ?? -1;
    
    if (existingPartIndex === -1) {
      return { success: false, error: 'Part not found in job.' };
    }

    let updatedUsedParts = [...(job.usedParts || [])];
    const currentPart = updatedUsedParts[existingPartIndex];
    
    if (currentPart.quantity <= quantityToRemove) {
      // Remove part entirely
      updatedUsedParts.splice(existingPartIndex, 1);
    } else {
      // Reduce quantity
      updatedUsedParts[existingPartIndex].quantity -= quantityToRemove;
      updatedUsedParts[existingPartIndex].total = updatedUsedParts[existingPartIndex].quantity * updatedUsedParts[existingPartIndex].price;
    }

    // Update the job
    const dataDocRef = doc(db, DATA_PATH);
    const jobRef = doc(dataDocRef, `${REPAIR_JOBS_COLLECTION}/${jobId}`);
    
    await updateDoc(jobRef, {
      usedParts: updatedUsedParts,
      updatedAt: serverTimestamp(),
    });

    revalidatePath('/dashboard/jobs');
    revalidatePath(`/dashboard/jobs/${jobId}`);

    return { success: true };
  } catch (error) {
    console.error('Error removing part from job:', error);
    return { success: false, error: 'Failed to remove part from job.' };
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