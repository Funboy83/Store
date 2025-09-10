import { CreateInvoiceForm } from "@/components/invoices/create-form";
import { getInventory } from "@/lib/actions/inventory";
import { getCustomers } from "@/lib/actions/customers";

export default async function CreateInvoicePage() {
  const inventory = await getInventory();
  const customers = await getCustomers();

  return (
    <div className="flex flex-col gap-4 h-full">
      <CreateInvoiceForm inventory={inventory} customers={customers} />
    </div>
  );
}
