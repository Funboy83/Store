'use client';

import { useState } from 'react';
import { JobDetailView } from '@/components/repairs/job-detail-view';
import { RepairJob } from '@/lib/types';
import { useRouter } from 'next/navigation';

interface JobDetailWrapperProps {
  initialJob: RepairJob;
}

export function JobDetailWrapper({ initialJob }: JobDetailWrapperProps) {
  const [job, setJob] = useState<RepairJob>(initialJob);
  const router = useRouter();

  const handleJobUpdate = (updatedJob: RepairJob) => {
    // Update the local job state
    setJob(updatedJob);
    
    // Refresh the page data to get latest from server
    router.refresh();
  };

  return (
    <JobDetailView 
      job={job}
      onUpdate={handleJobUpdate}
    />
  );
}