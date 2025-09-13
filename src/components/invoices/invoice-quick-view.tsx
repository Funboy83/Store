
'use client';

import { InvoicePreview } from './preview';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ExternalLink, Repeat } from 'lucide-react';
import type { InvoiceDetail } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

interface InvoiceQuickViewProps {
  invoice: InvoiceDetail;
}

export function InvoiceQuickView({ invoice }: InvoiceQuickViewProps) {
  const { toast } = useToast();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-end gap-2">
        <Button 
            variant="outline"
            onClick={() => toast({ title: "Coming Soon!", description: "The refund & exchange flow will be implemented in a future step."})}
            disabled={invoice.status === 'Voided'}
        >
            <Repeat className="mr-2 h-4 w-4" />
            Refund / Exchange
        </Button>
        <Link href={`/dashboard/invoices/${invoice.id}`} passHref>
          <Button variant="outline">
            <ExternalLink className="mr-2 h-4 w-4" />
            Open Full Details
          </Button>
        </Link>
      </div>
      <InvoicePreview invoice={invoice} />
    </div>
  );
}
