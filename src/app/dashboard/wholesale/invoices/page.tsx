

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { PlusCircle, ListFilter } from 'lucide-react';
import { getInvoices, archiveInvoice } from '@/lib/actions/invoice';
import type { InvoiceDetail } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { InvoiceTable } from '@/components/invoices/invoice-table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
// We will need state for the dialog, so we keep this a client component.
// A better approach would be to move the dialog logic to a separate client component.
// But for now, we'll fetch data on the server and pass it down.
// Let's refactor this page to be a server component.

export default async function InvoicesPage() {
  const invoices = await getInvoices();

  // The alert dialog for voiding requires client-side state. 
  // We cannot use it directly in a server component.
  // For now, we will disable the onArchive prop, which will disable the "Void" action.
  // This can be re-enabled by moving the Table and Dialog logic to a new Client Component.

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between">
        <div>
            <h1 className="text-3xl font-bold tracking-tight">Invoice Dashboard</h1>
            <p className="text-muted-foreground mt-1">Manage your invoices below.</p>
        </div>
        <div className='flex gap-2'>
            <Link href="/dashboard/wholesale/invoices/create" passHref>
                <Button>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  New Invoice
                </Button>
            </Link>
        </div>
      </div>
      
      <InvoiceTable invoices={invoices} />

    </div>
  );
}
