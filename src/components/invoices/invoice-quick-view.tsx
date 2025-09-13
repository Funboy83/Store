
'use client';

import { InvoicePreview } from './preview';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ExternalLink } from 'lucide-react';
import type { InvoiceDetail } from '@/lib/types';

interface InvoiceQuickViewProps {
  invoice: InvoiceDetail;
}

export function InvoiceQuickView({ invoice }: InvoiceQuickViewProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-end gap-2">
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
