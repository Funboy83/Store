
import { getCustomerDetails } from '@/lib/actions/customers';
import { notFound } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import type { Invoice } from '@/lib/types';
import { PaymentForm } from '@/components/customers/payment-form';

export default async function CustomerPaymentPage({ params }: { params: { id: string } }) {
  const data = await getCustomerDetails(params.id);

  if (!data) {
    notFound();
  }

  const { customer, invoices } = data;

  const outstandingInvoices = invoices
    .filter(inv => inv.status === 'Unpaid' || inv.status === 'Partial')
    .sort((a, b) => new Date(a.issueDate).getTime() - new Date(b.issueDate).getTime());


  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <Link href={`/dashboard/customers/${params.id}`} passHref>
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Back to Customer</span>
          </Button>
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">Process Payment</h1>
      </div>
      
      <PaymentForm customer={customer} invoices={outstandingInvoices} />

    </div>
  );
}
