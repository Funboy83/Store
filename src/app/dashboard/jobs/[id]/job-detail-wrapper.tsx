'use client';

import { useState } from 'react';
import { JobDetailView } from '@/components/repairs/job-detail-view';
import { RepairJob } from '@/lib/types';
import { useRouter } from 'next/navigation';
import { updateRepairJob } from '@/lib/actions/repair-jobs';
import { useToast } from '@/hooks/use-toast';

interface JobDetailWrapperProps {
  initialJob: RepairJob;
}

export function JobDetailWrapper({ initialJob }: JobDetailWrapperProps) {
  const [job, setJob] = useState<RepairJob>(initialJob);
  const router = useRouter();
  const { toast } = useToast();

  const handleJobUpdate = async (updatedJob: RepairJob) => {
    try {
      // Save the changes to the database
      const result = await updateRepairJob(updatedJob.id, {
        status: updatedJob.status,
        problemDescription: updatedJob.problemDescription,
        estimatedCost: updatedJob.estimatedCost,
        actualCost: updatedJob.actualCost,
        technicianNotes: updatedJob.technicianNotes,
        internalNotes: updatedJob.internalNotes,
        usedServices: updatedJob.usedServices
      });

      if (result.success) {
        // Update the local job state
        setJob(updatedJob);
        
        toast({
          title: 'Job Updated',
          description: 'Job details have been saved successfully',
        });
        
        // Refresh the page data to get latest from server
        router.refresh();
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to update job',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error updating job:', error);
      toast({
        title: 'Error', 
        description: 'An unexpected error occurred',
        variant: 'destructive',
      });
    }
  };

  return (
    <JobDetailView 
      job={job}
      onUpdate={handleJobUpdate}
    />
  );
}