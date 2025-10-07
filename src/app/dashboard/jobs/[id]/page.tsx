import { JobDetailWrapper } from './job-detail-wrapper';
import { getRepairJobById } from '@/lib/actions/repair-jobs';
import { notFound } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface JobDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function JobDetailPage({ params }: JobDetailPageProps) {
  const { id } = await params;
  const job = await getRepairJobById(id);

  if (!job) {
    notFound();
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <Button variant="ghost" asChild>
          <Link href="/dashboard/jobs">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Jobs
          </Link>
        </Button>
      </div>
      
      <JobDetailWrapper 
        initialJob={job}
      />
    </div>
  );
}