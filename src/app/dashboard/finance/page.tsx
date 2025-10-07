
import { getPayments } from '@/lib/actions/payment';
import { RecentPaymentsTable } from '@/components/finance/recent-payments-table';

export default async function FinancePage() {
  const payments = await getPayments();

  // Ensure all data is properly serialized by converting to JSON and back
  const serializedPayments = JSON.parse(JSON.stringify(payments));

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold tracking-tight">Finance Dashboard</h1>
      <RecentPaymentsTable payments={serializedPayments} />
    </div>
  );
}
