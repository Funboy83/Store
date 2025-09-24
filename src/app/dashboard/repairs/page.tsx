import { RepairStatsCards } from '@/components/repairs/repair-stats-cards';
import { RecentJobsTable } from '@/components/repairs/recent-jobs-table';
import { PendingPickups } from '@/components/repairs/pending-pickups';
import { InventoryStatsCard } from '@/components/repairs/inventory-stats-card';
import { getRepairJobStats } from '@/lib/actions/repair-jobs';
import { Button } from '@/components/ui/button';
import { Plus, Search, Filter } from 'lucide-react';
import Link from 'next/link';

export default async function RepairDashboardPage() {
  const stats = await getRepairJobStats();

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Repair Dashboard</h1>
          <p className="text-muted-foreground">
            Manage and track all repair jobs
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <Search className="h-4 w-4 mr-2" />
            Search Jobs
          </Button>
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
          <Button asChild>
            <Link href="/dashboard/jobs/new">
              <Plus className="h-4 w-4 mr-2" />
              New Job
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <RepairStatsCards stats={stats.jobs} />

      {/* Revenue Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="bg-card border rounded-lg p-6">
          <div className="flex items-center space-x-2">
            <div className="text-2xl">💰</div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Today</p>
              <p className="text-2xl font-bold">${stats.revenue.today}</p>
            </div>
          </div>
        </div>
        <div className="bg-card border rounded-lg p-6">
          <div className="flex items-center space-x-2">
            <div className="text-2xl">📊</div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">This Week</p>
              <p className="text-2xl font-bold">${stats.revenue.thisWeek}</p>
            </div>
          </div>
        </div>
        <div className="bg-card border rounded-lg p-6">
          <div className="flex items-center space-x-2">
            <div className="text-2xl">📈</div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">This Month</p>
              <p className="text-2xl font-bold">${stats.revenue.thisMonth}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-4">
        {/* Recent Jobs - Takes 2 columns */}
        <div className="lg:col-span-2">
          <RecentJobsTable jobs={stats.recentJobs} />
        </div>

        {/* Sidebar - Takes 2 columns */}
        <div className="lg:col-span-2 space-y-6">
          {/* Pending Pickups */}
          <PendingPickups jobs={stats.pendingPickups} />
          
          {/* Inventory Integration */}
          <InventoryStatsCard />
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-muted/50 rounded-lg p-6">
        <h3 className="font-semibold mb-4">Quick Actions</h3>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          <Button variant="outline" className="justify-start" asChild>
            <Link href="/dashboard/jobs/new">
              <Plus className="h-4 w-4 mr-2" />
              Create New Job
            </Link>
          </Button>
          <Button variant="outline" className="justify-start" asChild>
            <Link href="/dashboard/jobs?status=in-progress">
              <Search className="h-4 w-4 mr-2" />
              View In Progress
            </Link>
          </Button>
          <Button variant="outline" className="justify-start" asChild>
            <Link href="/dashboard/customers">
              <Search className="h-4 w-4 mr-2" />
              Customer Lookup
            </Link>
          </Button>
          <Button variant="outline" className="justify-start" asChild>
            <Link href="/dashboard/jobs?status=ready-for-pickup">
              <Search className="h-4 w-4 mr-2" />
              Ready for Pickup
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}