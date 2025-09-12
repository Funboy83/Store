
import { getInvoiceEditHistory } from "@/lib/actions/edit-history";
import { getInvoiceById } from "@/lib/actions/invoice";
import { notFound } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

function formatChangeKey(key: string): string {
    if (key.startsWith('itemQty_')) return 'Item Quantity Changed';
    if (key.startsWith('itemPrice_')) return 'Item Price Changed';
    if (key.startsWith('addedItem_')) return 'Item Added';
    if (key.startsWith('removedItem_')) return 'Item Removed';
    return key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
}


export default async function InvoiceHistoryPage({ params }: { params: { id: string } }) {
  const [invoice, history] = await Promise.all([
    getInvoiceById(params.id),
    getInvoiceEditHistory(params.id)
  ]);

  if (!invoice) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto">
       <div className="flex items-center gap-4">
        <Link href={`/dashboard/invoices/${params.id}`} passHref>
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Back to Invoice</span>
          </Button>
        </Link>
        <div className="flex-1">
            <h1 className="text-2xl font-bold tracking-tight">Edit History</h1>
            <p className="text-muted-foreground">Invoice {invoice.invoiceNumber}</p>
        </div>
      </div>
      
      <Card>
        <CardHeader>
            <CardTitle>Invoice Change Log</CardTitle>
            <CardDescription>A chronological record of all modifications made to this invoice.</CardDescription>
        </CardHeader>
        <CardContent>
             <div className="space-y-8">
                {history.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">No edit history found for this invoice.</p>
                ) : (
                    history.map((entry) => (
                    <div key={entry.id} className="relative pl-10">
                        <div className="absolute left-3 top-1 h-full border-l-2 border-border"></div>
                        <div className="absolute left-0 top-1.5 w-6 h-6 bg-primary rounded-full border-4 border-background text-primary-foreground flex items-center justify-center text-xs font-bold">
                           {entry.user.charAt(0).toUpperCase()}
                        </div>
                        <p className="font-semibold text-foreground">
                        {new Date(entry.timestamp).toLocaleString()} by <span className="text-primary">{entry.user}</span>
                        </p>
                        <div className="mt-2 p-4 bg-muted/50 rounded-lg space-y-3">
                        {Object.entries(entry.changes).map(([field, values]) => (
                            <div key={field} className="text-sm">
                            <span className="font-bold text-muted-foreground capitalize">{formatChangeKey(field)}:</span>
                            {field === 'initialCreation' ? (
                                <span className="ml-2 text-green-600">{String(values.to)}</span>
                            ) : (
                                <div className="flex flex-wrap items-center gap-2 mt-1">
                                    <Badge variant="outline" className="line-through">{String(values.from)}</Badge>
                                    <span>&rarr;</span>
                                    <Badge variant="default">{String(values.to)}</Badge>
                                </div>
                            )}
                            </div>
                        ))}
                        </div>
                    </div>
                    ))
                )}
            </div>
        </CardContent>
      </Card>

    </div>
  );
}
