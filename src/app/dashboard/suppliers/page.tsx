import { getSuppliers } from '@/lib/actions/suppliers';
import { SupplierTable } from './supplier-table';
import { SupplierStats } from '@/components/suppliers';

export default async function SuppliersPage() {
  const suppliers = await getSuppliers();

  // Calculate stats
  const totalSuppliers = suppliers.length;
  const activeSuppliers = suppliers.filter(s => s.status === 'active').length;
  const totalOrders = suppliers.reduce((acc, s) => acc + (s.totalOrders || 0), 0);
  const totalSpent = suppliers.reduce((acc, s) => acc + (s.totalSpent || 0), 0);

  return (
    <div className="flex flex-col gap-6">
        <h1 className="text-3xl font-bold tracking-tight">Supplier Management</h1>
        <SupplierStats
          totalSuppliers={totalSuppliers}
          activeSuppliers={activeSuppliers}
          totalOrders={totalOrders}
          totalSpent={totalSpent}
        />
        <SupplierTable suppliers={suppliers} />
    </div>
  );
}