

'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { PlusCircle, ListFilter } from 'lucide-react';
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
import type { InvoiceDetail } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { InvoiceTable } from '@/components/invoices/invoice-table';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

type FilterStatus = 'all' | 'paid' | 'unpaid';

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<InvoiceDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceDetail | null>(null);
  const { toast } = useToast();
  const [filter, setFilter] = useState<FilterStatus>('all');

  const fetchAndSetInvoices = async () => {
    setLoading(true);
    const fetchedInvoices = await getInvoices();
    setInvoices(fetchedInvoices);
    setLoading(false);
  };

  useEffect(() => {
    fetchAndSetInvoices();
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
        title: 'Invoice Voided',
        description: `Invoice ${selectedInvoice.invoiceNumber} has been voided and inventory was restocked.`,
      });
      // Refetch invoices to update the list
      await fetchAndSetInvoices();
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

  const filteredInvoices = useMemo(() => {
    if (filter === 'paid') {
      return invoices.filter(inv => inv.status === 'Paid');
    }
    if (filter === 'unpaid') {
      return invoices.filter(inv => inv.status === 'Unpaid' || inv.status === 'Partial');
    }
    return invoices;
  }, [invoices, filter]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between">
        <div>
            <h1 className="text-3xl font-bold tracking-tight">Invoice Dashboard</h1>
            <p className="text-muted-foreground mt-1">Filter and manage your invoices below.</p>
        </div>
        <Link href="/dashboard/invoices/create" passHref>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              New Invoice
            </Button>
        </Link>
      </div>

       <div className="flex items-center gap-2">
            <Button 
                variant={filter === 'all' ? 'default' : 'outline'}
                onClick={() => setFilter('all')}
            >
                All Invoices
            </Button>
             <Button 
                variant={filter === 'paid' ? 'default' : 'outline'}
                onClick={() => setFilter('paid')}
            >
                Paid
            </Button>
             <Button 
                variant={filter === 'unpaid' ? 'default' : 'outline'}
                onClick={() => setFilter('unpaid')}
            >
                Unpaid & Partial
            </Button>
            <Button 
                variant="outline" 
                className="ml-auto"
                onClick={() => toast({ title: 'Coming Soon!', description: 'Advanced filtering will be available in a future update.'})}
            >
              <ListFilter className="mr-2 h-4 w-4" />
              Filters
            </Button>
        </div>


      {loading ? (
        <Card>
          <CardHeader><Skeleton className="h-6 w-48" /></CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      ) : (
        <InvoiceTable invoices={filteredInvoices} onArchive={handleArchiveRequest} />
      )}
      
      <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to void this invoice?</AlertDialogTitle>
            <AlertDialogDescription>
              This will mark the invoice as 'Voided'. This action will also restock the sold items back into active inventory and reverse any customer debt associated with this invoice. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmArchive}>
              Yes, Void Invoice
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
