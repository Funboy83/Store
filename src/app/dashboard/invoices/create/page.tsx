import { InvoiceForm } from "@/components/invoices/invoice-form";
import { getInventory } from "@/lib/actions/inventory";
import { getCustomers } from "@/lib/actions/customers";

export default async function CreateInvoicePage() {
  const [inventory, customers] = await Promise.all([
    getInventory(),
    getCustomers(),
  ]);

  return (
    <div className="flex flex-col gap-4 h-full">
      <InvoiceForm inventory={inventory} customers={customers} />
    </div>
  );
}
