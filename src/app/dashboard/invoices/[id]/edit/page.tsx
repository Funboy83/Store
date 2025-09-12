
import { getInvoiceById } from "@/lib/actions/invoice";
import { getInventory } from "@/lib/actions/inventory";
import { getCustomers } from "@/lib/actions/customers";
import { notFound } from 'next/navigation';
import { InvoiceForm } from "@/components/invoices/invoice-form";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default async function EditInvoicePage({ params }: { params: { id: string } }) {
  const [invoice, inventory, customers] = await Promise.all([
    getInvoiceById(params.id),
    getInventory(),
    getCustomers(),
  ]);

  if (!invoice) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-4 h-full">
       <div className="flex items-center gap-4 print:hidden">
        <Link href={`/dashboard/invoices/${invoice.id}`} passHref>
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Back to Invoice</span>
          </Button>
        </Link>
      </div>

      <InvoiceForm 
        invoice={invoice} 
        inventory={inventory} 
        customers={customers} 
      />
    </div>
  );
}
