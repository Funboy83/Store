import Link from 'next/link';
import { getInventory } from '@/lib/actions/inventory';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { DataTable } from '@/components/inventory/data-table';
import { columns } from '@/components/inventory/columns';

export default async function InventoryPage() {
  const inventory = await getInventory();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Inventory</h1>
        <Link href="/dashboard/inventory/add" passHref>
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Product
          </Button>
        </Link>
      </div>
      <DataTable columns={columns} data={inventory} />
    </div>
  );
}
