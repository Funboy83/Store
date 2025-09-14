
import { getCreditNoteById } from "@/lib/actions/credit-note";
import { notFound } from 'next/navigation';
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileText, Undo2, DollarSign, CheckCircle } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export default async function CreditNoteDetailsPage({ params }: { params: { id: string } }) {
  const creditNote = await getCreditNoteById(params.id);

  if (!creditNote) {
    notFound();
  }

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'fully_used':
      case 'refunded':
        return 'default';
      case 'available':
        return 'secondary';
      default:
        return 'outline';
    }
  }

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <Link href={`/dashboard/invoices/${creditNote.originalInvoiceId}`} passHref>
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Back to Original Invoice</span>
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Undo2 className="h-6 w-6 text-primary" />
            Credit Note <span className="text-primary">{creditNote.id}</span>
          </h1>
          <p className="text-muted-foreground">For Customer: <Link href={`/dashboard/customers/${creditNote.customerId}`} className="font-semibold text-primary hover:underline">{creditNote.customerName}</Link></p>
        </div>
      </div>

      <Card>
        <CardHeader>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
                <div className="space-y-1">
                    <p className="text-muted-foreground">Issue Date:</p>
                    <p className="font-semibold text-foreground text-lg">{creditNote.issueDate}</p>
                </div>
                <div className="space-y-1">
                    <p className="text-muted-foreground">Status:</p>
                    <Badge variant={getStatusVariant(creditNote.status)} className="capitalize w-fit">
                        <CheckCircle className="h-3 w-3 mr-1.5" />
                        {creditNote.status.replace('_', ' ')}
                    </Badge>
                </div>
                <div className="space-y-1 text-right">
                    <p className="text-muted-foreground">Total Credit Value</p>
                    <p className="text-3xl font-bold text-destructive">
                        -{new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(creditNote.totalCredit)}
                    </p>
                </div>
            </div>
        </CardHeader>
        <CardContent className="space-y-8">
            <div>
                <h3 className="text-lg font-bold text-foreground mb-4">Items Returned</h3>
                <div className="space-y-3 border rounded-lg p-4">
                    {creditNote.items.map(item => (
                        <div key={item.id} className="flex justify-between items-center">
                            <div>
                                <p className="font-semibold text-foreground">{item.productName}</p>
                                <p className="text-muted-foreground text-xs">{item.quantity} x {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(item.unitPrice)}</p>
                            </div>
                            <p className="font-bold text-lg text-foreground">{new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(item.total)}</p>
                        </div>
                    ))}
                </div>
            </div>

            <div className="pt-6 border-t">
                <h3 className="text-lg font-bold text-foreground mb-4">Related Documents</h3>
                <div className="space-y-3">
                    <Link href={`/dashboard/invoices/${creditNote.originalInvoiceId}`} passHref>
                        <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg hover:bg-muted transition cursor-pointer">
                            <FileText className="h-5 w-5 text-primary" />
                            <div>
                                <p className="text-xs text-muted-foreground">Original Sale</p>
                                <p className="font-semibold text-foreground">{creditNote.originalInvoiceId}</p>
                            </div>
                        </div>
                    </Link>
                    {creditNote.newExchangeInvoiceId && (
                         <Link href={`/dashboard/invoices/${creditNote.newExchangeInvoiceId}`} passHref>
                            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg hover:bg-muted transition cursor-pointer">
                                <FileText className="h-5 w-5 text-green-600" />
                                <div>
                                    <p className="text-xs text-muted-foreground">New Exchange Invoice</p>
                                    <p className="font-semibold text-foreground">{creditNote.newExchangeInvoiceId}</p>
                                </div>
                            </div>
                        </Link>
                    )}
                    {creditNote.refundPaymentId && (
                        // We don't have a payment details page yet, so this won't link anywhere for now
                        <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                            <DollarSign className="h-5 w-5 text-destructive" />
                            <div>
                                <p className="text-xs text-muted-foreground">Resulting Refund Transaction</p>
                                <p className="font-semibold text-foreground">{creditNote.refundPaymentId}</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </CardContent>
      </Card>
    </div>
  );
};
