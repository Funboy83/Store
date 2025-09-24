import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import Link from 'next/link';
import { getRepairJobs } from '@/lib/actions/repair-jobs';
import { JobsTable } from '@/components/repairs/jobs-table';

export default async function JobsPage() {
  const jobs = await getRepairJobs();

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">All Jobs</h1>
          <p className="text-muted-foreground">
            View and manage all repair jobs ({jobs.length} total)
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/jobs/new">
            <Plus className="h-4 w-4 mr-2" />
            New Job
          </Link>
        </Button>
      </div>

      <JobsTable jobs={jobs} />
    </div>
  );
}