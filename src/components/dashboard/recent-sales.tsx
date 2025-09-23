import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { RecentSale } from '@/lib/actions/dashboard';

interface RecentSalesProps {
  sales: RecentSale[];
  totalSalesCount?: number;
}

export function RecentSales({ sales, totalSalesCount }: RecentSalesProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Sales</CardTitle>
        <CardDescription>
          {totalSalesCount ? `You made ${totalSalesCount} sales this month.` : 'Recent customer transactions.'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-8">
          {sales.length === 0 ? (
            <p className="text-sm text-muted-foreground">No recent sales found.</p>
          ) : (
            sales.map((sale) => (
              <div key={sale.id} className="flex items-center">
                <Avatar className="h-9 w-9">
                  <AvatarFallback>{sale.customerName.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="ml-4 space-y-1">
                  <p className="text-sm font-medium leading-none">{sale.customerName}</p>
                  <p className="text-sm text-muted-foreground">
                    {sale.customerEmail || formatDate(sale.date)}
                  </p>
                </div>
                <div className="ml-auto font-medium">{formatCurrency(sale.amount)}</div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
