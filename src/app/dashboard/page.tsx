
import { StatsCards } from '@/components/dashboard/stats-cards';
import { RecentSales } from '@/components/dashboard/recent-sales';
import { SalesChart } from '@/components/dashboard/sales-chart';

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-8">
      <StatsCards />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <SalesChart />
        <RecentSales />
      </div>
    </div>
  );
}
