
import { getInvoiceById } from "@/lib/actions/invoice";
import { notFound } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { ArrowLeft, Edit } from "lucide-react";
import Link from "next/link";
import { InvoicePreview } from "@/components/invoices/preview";

export default async function InvoiceDetailsPage({ params }: { params: { id: string } }) {
  const invoice = await getInvoiceById(params.id);

  if (!invoice) {
    notFound();
  }

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
        <Link href={`/dashboard/invoices/${invoice.id}/edit`} passHref>
            <Button>
                <Edit className="mr-2 h-4 w-4" />
                Edit Invoice
            </Button>
        </Link>
      </div>
      <InvoicePreview invoice={invoice} />
    </div>
  );
}
