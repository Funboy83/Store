'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import Link from 'next/link';
import { getRepairJobs } from '@/lib/actions/repair-jobs';
import { JobsTable } from '@/components/repairs/jobs-table';
import { RepairJob } from '@/lib/types';

export default function JobsPage() {
  const [jobs, setJobs] = useState<RepairJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'unpaid' | 'paid' | 'ready'>('unpaid');

  useEffect(() => {
    const loadJobs = async () => {
      try {
        const jobsData = await getRepairJobs();
        setJobs(jobsData);
      } catch (error) {
        console.error('Error loading jobs:', error);
      } finally {
        setLoading(false);
      }
    };

    loadJobs();
  }, []);

  // Filter jobs based on selected filter
  const filteredJobs = jobs.filter(job => {
    switch (filter) {
      case 'paid':
        return job.isPaid;
      case 'ready':
        return job.status === 'Ready for Pickup';
      case 'unpaid':
      default:
        return !job.isPaid;
    }
  });

  const getFilterTitle = () => {
    switch (filter) {
      case 'paid':
        return 'Paid Jobs';
      case 'ready':
        return 'Ready for Pickup';
      case 'unpaid':
      default:
        return 'Unpaid Jobs';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading jobs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{getFilterTitle()}</h1>
          <p className="text-muted-foreground">
            {filteredJobs.length} of {jobs.length} total jobs
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/jobs/new">
            <Plus className="h-4 w-4 mr-2" />
            New Job
          </Link>
        </Button>
      </div>

      {/* Filter Buttons */}
      <div className="flex gap-2">
        <Button
          variant={filter === 'unpaid' ? 'default' : 'outline'}
          onClick={() => setFilter('unpaid')}
        >
          Unpaid Jobs
        </Button>
        <Button
          variant={filter === 'paid' ? 'default' : 'outline'}
          onClick={() => setFilter('paid')}
        >
          Paid Jobs
        </Button>
        <Button
          variant={filter === 'ready' ? 'default' : 'outline'}
          onClick={() => setFilter('ready')}
        >
          Ready for Pickup
        </Button>
      </div>

      <JobsTable jobs={filteredJobs} />
    </div>
  );
}