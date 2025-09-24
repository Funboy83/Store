import { JobDetailView } from '@/components/repairs/job-detail-view';
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
          <Link href="/dashboard/repairs">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Link>
        </Button>
      </div>
      
      <JobDetailView 
        job={job}
      />
    </div>
  );
}