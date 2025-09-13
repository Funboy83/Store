
import { getCustomers } from '@/lib/actions/customers';
import { CustomerTable } from './customer-table';
import { CustomerStats } from '@/components/customers/stats-cards';

export default async function CustomersPage() {
  const customers = await getCustomers();

  // Calculate stats
  const totalCustomers = customers.length;
  const activeCustomers = customers.filter(c => c.status === 'active').length;
  const totalDebt = customers.reduce((acc, c) => acc + (c.debt || 0), 0);
  const totalSales = customers.reduce((acc, c) => acc + (c.totalSpent || 0), 0);

  return (
    <div className="flex flex-col gap-6">
        <h1 className="text-3xl font-bold tracking-tight">Customer Management</h1>
        <CustomerStats
          totalCustomers={totalCustomers}
          activeCustomers={activeCustomers}
          totalDebt={totalDebt}
          totalSales={totalSales}
        />
        <CustomerTable customers={customers} />
    </div>
  );
}
