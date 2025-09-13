
import { getCustomers } from '@/lib/actions/customers';
import { CustomerTable } from '@/app/dashboard/customers/customer-table';
import { RefundStats } from '@/components/refund-exchange/stats-cards';

export default async function RefundExchangePage() {
  // Using getCustomers as placeholder data for the table for now.
  const customers = await getCustomers();

  // Placeholder stats for the new cards.
  const stats = {
    totalRefunds: 24,
    totalExchanges: 18,
    pendingActions: 5,
    refundedValue: 4892.50,
  };

  return (
    <div className="flex flex-col gap-6">
        <h1 className="text-3xl font-bold tracking-tight">Refund & Exchange</h1>
        <RefundStats
          totalRefunds={stats.totalRefunds}
          totalExchanges={stats.totalExchanges}
          pendingActions={stats.pendingActions}
          refundedValue={stats.refundedValue}
        />
        <CustomerTable customers={customers} />
    </div>
  );
}
