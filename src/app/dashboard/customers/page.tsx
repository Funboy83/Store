
import { getCustomers } from '@/lib/actions/customers';
import { CustomerTable } from './customer-table';

export default async function CustomersPage() {
  const customers = await getCustomers();

  return (
    <div className="flex flex-col gap-4">
        <CustomerTable customers={customers} />
    </div>
  );
}
