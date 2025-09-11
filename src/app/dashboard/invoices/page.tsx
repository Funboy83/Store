
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { PlusCircle, History } from 'lucide-react';
import { getInvoices, archiveInvoice } from '@/lib/actions/invoice';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useAsyncEffect } from '@/hooks/use-async-effect';
import type { InvoiceDetail } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { InvoiceTable } from '@/components/invoices/invoice-table';

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<InvoiceDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceDetail | null>(null);
  const { toast } = useToast();

  useAsyncEffect(async () => {
    setLoading(true);
    const fetchedInvoices = await getInvoices();
    setInvoices(fetchedInvoices);
    setLoading(false);
  }, []);

  const handleArchiveRequest = (invoice: InvoiceDetail) => {
    setSelectedInvoice(invoice);
    setDialogOpen(true);
  };

  const handleConfirmArchive = async () => {
    if (!selectedInvoice) return;

    const result = await archiveInvoice(selectedInvoice);

    if (result.success) {
      toast({
        title: 'Invoice Archived',
        description: `Invoice ${selectedInvoice.invoiceNumber} has been moved to history and inventory was restocked.`,
      });
      setInvoices(prev => prev.filter(inv => inv.id !== selectedInvoice.id));
    } else {
      toast({
        title: 'Error',
        description: result.error,
        variant: 'destructive',
      });
    }
    setDialogOpen(false);
    setSelectedInvoice(null);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Invoices</h1>
        <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => toast({ title: 'Coming Soon!', description: 'Invoice history will be available in a future update.'})}>
              <History className="mr-2 h-4 w-4" />
              History
            </Button>
          <Link href="/dashboard/invoices/create" passHref>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Create Invoice
            </Button>
          </Link>
        </div>
      </div>

      {loading ? (
        <p>Loading invoices...</p>
      ) : (
        <InvoiceTable invoices={invoices} onArchive={handleArchiveRequest} />
      )}
      
      <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to archive this invoice?</AlertDialogTitle>
            <AlertDialogDescription>
              This action will move the invoice to history and restock the sold items back into active inventory. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmArchive}>
              Yes, Archive Invoice
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
