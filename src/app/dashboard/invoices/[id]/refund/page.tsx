
import { getInvoiceById } from "@/lib/actions/invoice";
import { notFound } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { InvoicePreview } from "@/components/invoices/preview";

export default async function RefundPage({ params }: { params: { id: string } }) {
    const invoice = await getInvoiceById(params.id);

    if (!invoice) {
        notFound();
    }

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center gap-4">
                <Link href={`/dashboard/invoices/${params.id}`} passHref>
                    <Button variant="outline" size="icon">
                        <ArrowLeft className="h-4 w-4" />
                        <span className="sr-only">Back to Invoice</span>
                    </Button>
                </Link>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Process Refund or Exchange</h1>
                    <p className="text-muted-foreground">For Invoice {invoice.invoiceNumber}</p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Refund & Exchange Workspace</CardTitle>
                    <CardDescription>
                        This is the area where you will select items to return, add new items for an exchange, and finalize the transaction.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-12 border-2 border-dashed rounded-lg">
                        <p className="text-muted-foreground">Full refund & exchange UI coming soon.</p>
                    </div>
                </CardContent>
            </Card>

            <div>
                <h2 className="text-lg font-semibold mb-2">Original Invoice Preview</h2>
                <InvoicePreview invoice={invoice} />
            </div>
        </div>
    );
}
