import { StatsCards } from '@/components/dashboard/stats-cards';
import { SalesChart } from '@/components/dashboard/sales-chart';
import { RecentSales } from '@/components/dashboard/recent-sales';
import { getDashboardStats, getRecentSales, getSalesChartData } from '@/lib/actions/dashboard';

export default async function DashboardPage() {
  const [stats, recentSales, salesChartData] = await Promise.all([
    getDashboardStats(),
    getRecentSales(5),
    getSalesChartData()
  ]);

  return (
    <div className="flex flex-col gap-4">
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <StatsCards stats={stats} />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <div className="lg:col-span-4">
                <SalesChart data={salesChartData} />
            </div>
            <div className="lg:col-span-3">
                <RecentSales sales={recentSales} totalSalesCount={stats.totalSales} />
            </div>
        </div>
    </div>
  );
}
