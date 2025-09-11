
import { getCustomerDetails } from '@/lib/actions/customers';
import { notFound } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Mail, Phone, Edit } from 'lucide-react';
import Link from 'next/link';
import { InvoiceTable } from '@/components/invoices/invoice-table';

export default async function CustomerDetailsPage({ params }: { params: { id: string } }) {
  const data = await getCustomerDetails(params.id);

  if (!data) {
    notFound();
  }

  const { customer, invoices } = data;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/customers" passHref>
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Back to Customers</span>
          </Button>
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">Customer Details</h1>
        <Button variant="outline" className="ml-auto">
          <Edit className="mr-2 h-4 w-4" />
          Edit Customer
        </Button>
      </div>
      
      <Card>
        <CardHeader className="flex flex-row items-start gap-4 space-y-0">
          <Avatar className="w-16 h-16 text-2xl">
            <AvatarFallback>{customer.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <CardTitle className="text-3xl">{customer.name}</CardTitle>
            <CardDescription className="mt-1">
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5"><Mail className="h-4 w-4" /> {customer.email}</span>
                <span className="flex items-center gap-1.5"><Phone className="h-4 w-4" /> {customer.phone}</span>
              </div>
            </CardDescription>
          </div>
          <div className="text-right">
              <p className="text-sm text-muted-foreground">Total Spent</p>
              <p className="text-2xl font-bold">
                {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(customer.totalSpent)}
              </p>
              <p className="text-sm text-muted-foreground">{customer.totalInvoices} invoices</p>
          </div>
        </CardHeader>
        {customer.notes && (
          <CardContent>
            <h3 className="font-semibold text-sm mb-1">Notes</h3>
            <p className="text-sm text-muted-foreground bg-secondary/50 p-3 rounded-md">{customer.notes}</p>
          </CardContent>
        )}
      </Card>
      
      <InvoiceTable invoices={invoices} title={`Invoices for ${customer.name}`} />
    </div>
  );
}
