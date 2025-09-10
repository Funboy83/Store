import { CreateInvoiceForm } from "@/components/invoices/create-form";
import { getInventory } from "@/lib/actions/inventory";
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default async function CreateInvoicePage() {
  const products = await getInventory();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/invoices" passHref>
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">Create New Invoice</h1>
      </div>
      <CreateInvoiceForm products={products} />
    </div>
  );
}
