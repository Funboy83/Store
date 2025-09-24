import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import Link from 'next/link';
import { getParts, getPartsStats } from '@/lib/actions/parts';
import { PartsTable, PartsStatsCards } from '@/components/parts';

export default async function PartsPage() {
  const parts = await getParts();
  const stats = await getPartsStats();

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Parts Inventory</h1>
          <p className="text-muted-foreground">
            Manage repair parts and components ({parts.length} total)
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/parts/new">
            <Plus className="h-4 w-4 mr-2" />
            Add Part
          </Link>
        </Button>
      </div>

      {/* Stats Cards */}
      <PartsStatsCards stats={stats} />

      {/* Parts Table */}
      <PartsTable parts={parts} />
    </div>
  );
}