import { RepairInvoiceView } from '@/components/repairs/repair-invoice-view';
import { getJobById } from '@/lib/mock-repair-data';
import { notFound } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface InvoicePageProps {
  params: {
    id: string;
  };
}

export default function InvoicePage({ params }: InvoicePageProps) {
  const job = getJobById(params.id);

  if (!job) {
    notFound();
  }

  return (
    <div>
      <div className="p-6 print:hidden">
        <Button variant="ghost" asChild>
          <Link href={`/dashboard/jobs/${job.id}`}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Job
          </Link>
        </Button>
      </div>
      
      <RepairInvoiceView job={job} />
    </div>
  );
}