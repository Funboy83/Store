import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { DataTable } from '@/components/inventory/data-table';
import { columns } from './columns';
import { getInventoryHistory } from '@/lib/actions/inventory-history';

export default async function InventoryHistoryPage() {
  const history = await getInventoryHistory();

  return (
    <div className="flex flex-col gap-4">
       <div className="flex items-center gap-4">
        <Link href="/dashboard/inventory" passHref>
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">Inventory History</h1>
      </div>
      <DataTable columns={columns} data={history} />
    </div>
  );
}
