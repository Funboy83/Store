
import { getPayments } from '@/lib/actions/payment';
import { RecentPaymentsTable } from '@/components/finance/recent-payments-table';

export default async function FinancePage() {
  const payments = await getPayments();

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold tracking-tight">Finance Dashboard</h1>
      <RecentPaymentsTable payments={payments} />
    </div>
  );
}
