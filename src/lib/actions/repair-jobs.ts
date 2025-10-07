'use server';

import { db, isConfigured } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, doc, getDocs, query, orderBy, updateDoc, getDoc, where } from 'firebase/firestore';
import { RepairJob, JobStatus, DeviceCondition, UsedPart } from '@/lib/types';
import { revalidatePath } from 'next/cache';
import { getLatestInvoiceNumber } from '@/lib/actions/invoice';

const DATA_PATH = 'app-data/cellsmart-data';
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

export async function getNextJobNumber(): Promise<number> {
  if (!isConfigured) {
    return 100; // Start from 100
  }

  try {
    const dataDocRef = doc(db, DATA_PATH);
    const repairJobsRef = collection(dataDocRef, REPAIR_JOBS_COLLECTION);
    const snapshot = await getDocs(repairJobsRef);

    if (snapshot.empty) {
      return 100; // Start from 100 for first job
    }

    let maxNumber = 99; // Start below 100
    snapshot.docs.forEach(docSnapshot => {
      const jobData = docSnapshot.data();
      if (jobData.jobId) {
        const currentNumber = parseInt(jobData.jobId, 10);
        if (!isNaN(currentNumber) && currentNumber > maxNumber) {
          maxNumber = currentNumber;
        }
      }
    });

    return maxNumber + 1;
  } catch (error) {
    console.error('Error fetching latest job number:', error);
    return 100; // Fallback to starting number
  }
}

export async function getNextJobPaymentNumber(): Promise<string> {
  if (!isConfigured) {
    return 'Job-100'; // Start from Job-100
  }

  try {
    // Check existing payment records in the finance system
    const dataDocRef = doc(db, DATA_PATH);
    const paymentsRef = collection(dataDocRef, 'payments');
    const snapshot = await getDocs(paymentsRef);

    if (snapshot.empty) {
      return 'Job-100'; // Start from Job-100 for first payment
    }

    let maxNumber = 99; // Start below 100
    snapshot.docs.forEach(docSnapshot => {
      const paymentData = docSnapshot.data();
      if (paymentData.paymentId && paymentData.paymentId.startsWith('Job-')) {
        // Extract number from Job-XXX format
        const numberPart = paymentData.paymentId.replace('Job-', '');
        const currentNumber = parseInt(numberPart, 10);
        if (!isNaN(currentNumber) && currentNumber > maxNumber) {
          maxNumber = currentNumber;
        }
      }
    });

    return `Job-${maxNumber + 1}`;
  } catch (error) {
    console.error('Error fetching latest job payment number:', error);
    return 'Job-100'; // Fallback to starting number
  }
}

export async function getNextRepairInvoiceNumber(): Promise<string> {
  if (!isConfigured) {
    return 'REP-100'; // Start from REP-100
  }

  try {
    const dataDocRef = doc(db, DATA_PATH);
    const invoicesCollectionRef = collection(dataDocRef, 'invoices');
    const snapshot = await getDocs(invoicesCollectionRef);

    if (snapshot.empty) {
      return 'REP-100'; // Start from REP-100 for first repair invoice
    }

    let maxNumber = 99; // Start below 100
    snapshot.docs.forEach(docSnapshot => {
      const invoiceData = docSnapshot.data();
      if (invoiceData.invoiceNumber && invoiceData.invoiceNumber.startsWith('REP-')) {
        // Extract number from REP-XXX format
        const numberPart = invoiceData.invoiceNumber.replace('REP-', '');
        const currentNumber = parseInt(numberPart, 10);
        if (!isNaN(currentNumber) && currentNumber > maxNumber) {
          maxNumber = currentNumber;
        }
      }
    });

    return `REP-${maxNumber + 1}`;
  } catch (error) {
    console.error('Error fetching latest repair invoice number:', error);
    return 'REP-100'; // Fallback to starting number
  }
}

export async function createRepairJob(data: CreateRepairJobData): Promise<{ success: boolean; jobId?: string; error?: string }> {
  if (!isConfigured) {
    return { success: false, error: 'Firebase is not configured.' };
  }

  try {
    // Generate sequential job ID starting from 100
    const jobNumber = await getNextJobNumber();
    const jobId = `${jobNumber}`;

    // Look for existing customer by phone number
    let customerId = '';
    try {
      const { getCustomers } = await import('./customers');
      const customers = await getCustomers();
      const existingCustomer = customers.find(c => c.phone === data.customerPhone);
      if (existingCustomer) {
        customerId = existingCustomer.id;
        console.log(`🔗 Linked repair job to existing customer: ${existingCustomer.name} (${existingCustomer.id})`);
      }
    } catch (error) {
      console.warn('Error looking up customer by phone:', error);
    }

    // Create the repair job document
    const repairJob: Omit<RepairJob, 'id'> = {
      jobId,
      customerId, // Now properly linked to existing customer if found
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
      usedServices: [], // Initialize empty services array
      laborCost: 0, // Legacy field - will be replaced by usedServices
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
    revalidatePath('/dashboard/customers'); // Update customer job counts

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
    
    const snapshot = await getDocs(repairJobsRef);
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

    // Sort by createdAt descending (newest first) client-side
    jobs.sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return dateB - dateA;
    });

    return jobs;
  } catch (error) {
    console.error('Error fetching repair jobs:', error);
    return [];
  }
}

export async function getJobsByCustomerId(customerId: string): Promise<RepairJob[]> {
  if (!isConfigured) {
    // Return mock data for development
    return [];
  }

  try {
    const dataDocRef = doc(db, DATA_PATH);
    const repairJobsRef = collection(dataDocRef, REPAIR_JOBS_COLLECTION);
    
    // Query for jobs where customerId matches
    const q = query(repairJobsRef, where("customerId", "==", customerId));
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
        createdAt: data.createdAt?.toDate?.()?.toISOString() || cleanData.createdAt || new Date().toISOString(),
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || cleanData.updatedAt || new Date().toISOString(),
        completedAt: data.completedAt?.toDate?.()?.toISOString() || cleanData.completedAt || '',
        dateReceived: data.dateReceived?.toDate?.()?.toISOString() || cleanData.dateReceived || new Date().toISOString(),
      };
      
      return convertedData as unknown as RepairJob;
    });

    // Sort by createdAt descending (newest first)
    jobs.sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return dateB - dateA;
    });

    return jobs;
  } catch (error) {
    console.error('Error fetching repair jobs for customer:', error);
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
    
    // Prevent editing paid jobs (unless transitioning to paid status)
    if (currentJob.isPaid && status !== 'Paid') {
      return { success: false, error: 'Cannot modify status of a paid job.' };
    }
    
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

// Function to update general job details (not just status)
export async function updateRepairJob(
  jobId: string, 
  updates: Partial<Pick<RepairJob, 'problemDescription' | 'estimatedCost' | 'actualCost' | 'laborCost' | 'status' | 'technicianNotes' | 'internalNotes' | 'usedServices'>>
): Promise<{ success: boolean; error?: string }> {
  if (!isConfigured) {
    return { success: false, error: 'Firebase is not configured.' };
  }

  try {
    const dataDocRef = doc(db, DATA_PATH);
    const jobRef = doc(dataDocRef, `${REPAIR_JOBS_COLLECTION}/${jobId}`);
    
    // Get current job to check status change
    const jobDoc = await getDoc(jobRef);
    if (!jobDoc.exists()) {
      return { success: false, error: 'Job not found.' };
    }

    const currentJob = jobDoc.data() as RepairJob;
    
    // Prevent editing paid jobs
    if (currentJob.isPaid) {
      return { success: false, error: 'Cannot edit a paid job.' };
    }
    const previousStatus = currentJob.status;

    const updateData: any = {
      ...updates,
      updatedAt: serverTimestamp(),
    };

    // Set completion date if status is being changed to completed
    if (updates.status === 'Completed' && previousStatus !== 'Completed') {
      updateData.completedAt = serverTimestamp();
    }

    // Set paid date if status is being changed to paid
    if (updates.status === 'Paid' && previousStatus !== 'Paid') {
      updateData.paidAt = serverTimestamp();
      updateData.isPaid = true;
    }

    await updateDoc(jobRef, updateData);

    // Handle inventory deduction if status changed to Completed or Paid
    if (updates.status && (updates.status === 'Completed' || updates.status === 'Paid') && 
        previousStatus !== 'Completed' && previousStatus !== 'Paid') {
      
      if (currentJob.usedParts && currentJob.usedParts.length > 0) {
        console.log(`🔄 FIFO Inventory Deduction for job ${currentJob.jobId} - ${currentJob.usedParts.length} parts used`);
        
        const { consumePartFromOldestBatch } = await import('./parts');
        const inventoryErrors: string[] = [];
        
        for (const usedPart of currentJob.usedParts) {
          try {
            console.log(`📦 Processing ${usedPart.quantity} x ${usedPart.partName} (ID: ${usedPart.partId})`);
            
            const consumeResult = await consumePartFromOldestBatch(
              usedPart.partId,
              usedPart.quantity,
              currentJob.id,
              `Used in repair job ${currentJob.jobId} (${currentJob.customerName})`
            );

            if (!consumeResult.success) {
              inventoryErrors.push(`Failed to deduct inventory for ${usedPart.partName}: ${consumeResult.error}`);
            } else {
              console.log(`✅ FIFO Deducted ${usedPart.quantity} x ${usedPart.partName} from batch ${consumeResult.batchId} at cost $${consumeResult.costPrice}`);
            }
          } catch (error) {
            console.error(`Error deducting inventory for part ${usedPart.partName}:`, error);
            inventoryErrors.push(`Error processing ${usedPart.partName}: ${error}`);
          }
        }

        if (inventoryErrors.length > 0) {
          console.error('Inventory deduction errors:', inventoryErrors);
        }
      }
    }

    revalidatePath('/dashboard/repairs');
    revalidatePath('/dashboard/jobs');
    revalidatePath(`/dashboard/jobs/${jobId}`);

    return { success: true };
  } catch (error) {
    console.error('Error updating repair job:', error);
    return { success: false, error: 'Failed to update job.' };
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

    // Deduct inventory using FIFO method
    console.log(`🔄 FIFO Inventory Deduction - Adding ${quantity} x ${part.name} to Job ${job.jobId}`);
    
    const { consumePartFromOldestBatch } = await import('./parts');
    const consumeResult = await consumePartFromOldestBatch(
      partId,
      quantity,
      job.id,
      `Added to repair job ${job.jobId} - ${job.customerName}`
    );

    if (!consumeResult.success) {
      console.error(`❌ Failed to deduct inventory for ${part.name}: ${consumeResult.error}`);
      return { 
        success: false, 
        error: `Cannot add part: ${consumeResult.error}` 
      };
    }

    console.log(`✅ Successfully deducted ${quantity} x ${part.name} from batch ${consumeResult.batchId}`);
    console.log(`📊 Remaining inventory: ${consumeResult.remainingQuantity} units`);

    // Update the job with the new parts list
    const dataDocRef = doc(db, DATA_PATH);
    const jobRef = doc(dataDocRef, `${REPAIR_JOBS_COLLECTION}/${jobId}`);
    
    await updateDoc(jobRef, {
      usedParts: updatedUsedParts,
      updatedAt: serverTimestamp(),
    });

    revalidatePath('/dashboard/jobs');
    revalidatePath(`/dashboard/jobs/${jobId}`);
    revalidatePath('/dashboard/inventory');
    revalidatePath('/dashboard/parts');

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
    
    // Determine actual quantity to remove
    const actualQuantityToRemove = Math.min(currentPart.quantity, quantityToRemove);
    
    // Restore inventory before updating job
    console.log(`🔄 Restoring Inventory - Removing ${actualQuantityToRemove} x ${currentPart.partName} from Job ${job.jobId}`);
    
    const { addPartStock } = await import('./parts');
    const restoreResult = await addPartStock(
      partId,
      actualQuantityToRemove,
      currentPart.cost, // Use the cost that was recorded when the part was added
      'Job Return', // Supplier field to indicate this is a return
      `Removed from repair job ${job.jobId} - ${job.customerName}`
    );

    if (!restoreResult.success) {
      console.error(`❌ Failed to restore inventory for ${currentPart.partName}: ${restoreResult.error}`);
      return { 
        success: false, 
        error: `Cannot remove part: ${restoreResult.error}` 
      };
    }

    console.log(`✅ Successfully restored ${actualQuantityToRemove} x ${currentPart.partName} to inventory`);

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
    revalidatePath('/dashboard/inventory');
    revalidatePath('/dashboard/parts');

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

// Interface for repair invoice data
interface RepairInvoiceData {
  jobId: string;
  customerName: string;
  customerPhone: string;
  deviceMake: string;
  deviceModel: string;
  problemDescription: string;
  laborCost: number;
  partsCost: number;
  totalAmount: number;
  paymentMethod: 'cash' | 'credit_card' | 'zelle' | 'venmo';
  cashAmount?: number;
  cardAmount?: number;
}

export async function generateRepairInvoice(
  jobId: string,
  paymentData: {
    paymentMethod: 'cash' | 'credit_card' | 'zelle' | 'venmo';
    cashAmount?: number;
    cardAmount?: number;
  }
): Promise<{ success: boolean; invoiceId?: string; error?: string }> {
  if (!isConfigured) {
    return { success: false, error: 'Firebase is not configured.' };
  }

  try {
    // Get the repair job
    const dataDocRef = doc(db, DATA_PATH);
    const repairJobRef = doc(dataDocRef, `${REPAIR_JOBS_COLLECTION}/${jobId}`);
    const jobDoc = await getDoc(repairJobRef);
    
    if (!jobDoc.exists()) {
      return { success: false, error: 'Repair job not found.' };
    }
    
    const job = { id: jobDoc.id, ...jobDoc.data() } as RepairJob;
    
    // Check if job status is "Ready for Pickup"
    if (job.status !== 'Ready for Pickup') {
      return { success: false, error: 'Invoice can only be generated for jobs with status "Ready for Pickup".' };
    }
    
    // Calculate costs - Use selling price, not cost
    const partsPrice = job.usedParts?.reduce((total, part) => total + (part.price * part.quantity), 0) || 0;
    const partsCost = job.usedParts?.reduce((total, part) => total + (part.cost * part.quantity), 0) || 0; // Keep for profit calculation
    const servicesCost = job.usedServices?.reduce((total, service) => total + service.total, 0) || 0;
    const laborCost = servicesCost || job.laborCost || 0; // Use services first, fallback to old laborCost
    const totalAmount = partsPrice + laborCost;
    const totalPayment = (paymentData.cashAmount || 0) + (paymentData.cardAmount || 0);
    
    // Validate payment amount
    if (totalPayment < totalAmount) {
      return { success: false, error: `Insufficient payment. Total due: $${totalAmount.toFixed(2)}, Received: $${totalPayment.toFixed(2)}` };
    }
    
    // Create invoice data for finance system
    const invoiceData = {
      customerId: job.customerId || 'walk-in',
      customerName: job.customerName,
      customerPhone: job.customerPhone,
      jobId: job.jobId,
      deviceInfo: `${job.deviceMake} ${job.deviceModel}`,
      problemDescription: job.problemDescription,
      laborCost: laborCost,
      partsCost: partsPrice, // Use selling price for customer invoice
      subtotal: totalAmount,
      tax: 0, // Add tax calculation if needed
      total: totalAmount,
      paymentMethod: paymentData.paymentMethod,
      cashAmount: paymentData.cashAmount || 0,
      cardAmount: paymentData.cardAmount || 0,
      profit: totalAmount - partsCost - laborCost, // Profit = selling price - wholesale cost - labor
      type: 'repair_service',
      createdAt: new Date().toISOString(),
    };
    
    // Generate repair invoice number with REP- prefix
    const repairInvoiceNumber = await getNextRepairInvoiceNumber();
    
    // Add to invoices collection (finance system)
    const invoicesRef = collection(dataDocRef, 'invoices');
    const invoiceDoc = await addDoc(invoicesRef, {
      ...invoiceData,
      invoiceNumber: repairInvoiceNumber,
      issueDate: new Date().toISOString().split('T')[0],
      dueDate: new Date().toISOString().split('T')[0], // Same day for repair jobs
      createdAt: serverTimestamp(),
      status: 'Paid',
      amountPaid: totalAmount,
      paymentIds: [], // Will be updated after payment record creation
      items: [
        // Add services as individual line items
        ...job.usedServices?.map((service, index) => ({
          id: `service_${index + 1}`,
          productName: service.serviceName,
          description: service.serviceDescription,
          quantity: service.quantity,
          unitPrice: service.price,
          total: service.total,
          isCustom: true,
        })) || [],
        // Fallback to generic labor if no services
        ...((!job.usedServices || job.usedServices.length === 0) && laborCost > 0 ? [{
          id: '1',
          productName: `Repair Service - ${job.deviceMake} ${job.deviceModel}`,
          description: job.problemDescription,
          quantity: 1,
          unitPrice: laborCost,
          total: laborCost,
          isCustom: true,
        }] : []),
        // Add parts
        ...job.usedParts?.map((part, index) => ({
          id: `part_${index + 2}`,
          productName: part.partName,
          description: `Replacement part`,
          quantity: part.quantity,
          unitPrice: part.price, // Use selling price for customer invoice
          total: part.price * part.quantity,
          isCustom: false,
        })) || []
      ]
    });
    
    // Create payment record in finance system with proper structure
    const paymentId = await getNextJobPaymentNumber();
    const paymentsRef = collection(dataDocRef, 'payments');
    
    // Build tender details based on payment method
    const tenderDetails: { method: 'Cash' | 'Check' | 'Card/Zelle/Wire' | 'StoreCredit'; amount: number }[] = [];
    if (paymentData.paymentMethod === 'cash' && (paymentData.cashAmount || 0) > 0) {
      tenderDetails.push({ method: 'Cash', amount: paymentData.cashAmount || 0 });
    }
    if (paymentData.paymentMethod === 'credit_card' && (paymentData.cardAmount || 0) > 0) {
      tenderDetails.push({ method: 'Card/Zelle/Wire', amount: paymentData.cardAmount || 0 });
    }
    if (paymentData.paymentMethod === 'zelle' || paymentData.paymentMethod === 'venmo') {
      tenderDetails.push({ method: 'Card/Zelle/Wire', amount: totalAmount });
    }
    
    const paymentRecord = await addDoc(paymentsRef, {
      customerId: job.customerId || 'Aj0l1O2kJcvlF3J0uVMX', // Use walk-in customer ID if no customer
      paymentDate: serverTimestamp(),
      recordedBy: 'system_repair', // Indicate this is from repair system
      amountPaid: totalAmount,
      type: 'payment',
      appliedToInvoices: [invoiceDoc.id],
      tenderDetails: tenderDetails,
      notes: `${paymentId}: Repair service payment for Job ${job.jobId} - ${job.deviceMake} ${job.deviceModel}`,
      jobPaymentId: paymentId, // Custom field to track job payment ID
      repairJobId: job.id // Link back to repair job
    });
    
    // Update the invoice with the payment ID
    await updateDoc(invoiceDoc, {
      paymentIds: [paymentRecord.id]
    });
    
    // NOTE: Inventory deduction now happens when parts are added to jobs, not during invoice generation
    // This prevents double deduction and ensures parts are reserved as soon as they're assigned to a job
    console.log(`📋 Invoice generation for Job ${job.jobId} - Parts inventory was already deducted when parts were added to job`);
    
    // Update repair job status to Paid and mark as invoiced
    await updateDoc(repairJobRef, {
      status: 'Paid',
      invoiceGenerated: true,
      isPaid: true,
      completedAt: serverTimestamp(),
      invoiceId: invoiceDoc.id,
      paymentId: paymentId,
      updatedAt: serverTimestamp(),
    });
    
    // Revalidate pages
    revalidatePath('/dashboard/jobs');
    revalidatePath('/dashboard/repair-customers');
    revalidatePath('/dashboard/invoices');
    revalidatePath('/dashboard/finance');
    
    return { 
      success: true, 
      invoiceId: repairInvoiceNumber, // Return the proper REP-XXX number instead of document ID
    };
  } catch (error) {
    console.error('Error generating repair invoice:', error);
    return { success: false, error: 'Failed to generate invoice.' };
  }
}