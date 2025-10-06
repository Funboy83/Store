

import { getInvoiceById } from "@/lib/actions/invoice";
import { getInvoiceEditHistory } from "@/lib/actions/edit-history";
import { notFound } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { ArrowLeft, Edit, History, Undo2 } from "lucide-react";
import Link from "next/link";
import { InvoicePreview } from "@/components/invoices/preview";

export default async function InvoiceDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [invoice, history] = await Promise.all([
    getInvoiceById(id),
    getInvoiceEditHistory(id)
  ]);

  if (!invoice) {
    notFound();
  }

  const isEdited = history.length > 1;
  const canEdit = invoice.status === 'Unpaid' || invoice.status === 'Draft';
  const canRefund = invoice.status === 'Paid';

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-4 print:hidden">
        <Link href="/dashboard/invoices" passHref>
            <Button variant="outline" size="icon">
                <ArrowLeft className="h-4 w-4" />
                <span className="sr-only">Back to Invoices</span>
            </Button>
        </Link>
        <h1 className="text-2xl font-bold tracking-tight flex-1">Invoice Details</h1>
        <div className="flex items-center gap-2">
            <Link href={`/dashboard/invoices/${id}/history`} passHref>
                <Button variant="outline">
                    <History className="mr-2 h-4 w-4" />
                    View History
                </Button>
            </Link>
            {canEdit && (
                <Link href={`/dashboard/invoices/${id}/edit`} passHref>
                    <Button>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit Invoice
                    </Button>
                </Link>
            )}
             <Link href={`/dashboard/invoices/${id}/refund`} passHref>
                <Button variant="destructive" disabled={!canRefund}>
                    <Undo2 className="mr-2 h-4 w-4" />
                    Refund / Exchange
                </Button>
            </Link>
        </div>
      </div>
      <InvoicePreview invoice={invoice} isEdited={isEdited} />
    </div>
  );
}
