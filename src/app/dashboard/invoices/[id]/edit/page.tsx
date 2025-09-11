import { getInvoiceById } from "@/lib/actions/invoice";
import { getInventory } from "@/lib/actions/inventory";
import { getCustomers } from "@/lib/actions/customers";
import { notFound } from 'next/navigation';
import { EditInvoiceForm } from "@/components/invoices/edit-form";

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
      <EditInvoiceForm 
        invoice={invoice} 
        inventory={inventory} 
        customers={customers} 
      />
    </div>
  );
}
