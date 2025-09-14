
import { getInvoiceById } from "@/lib/actions/invoice";
import { getInventory } from "@/lib/actions/inventory";
import { notFound } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { RefundWorkspace } from "@/components/refund-exchange/refund-workspace";

export default async function RefundPage({ params }: { params: { id: string } }) {
    const [invoice, inventory] = await Promise.all([
        getInvoiceById(params.id),
        getInventory(),
    ]);

    if (!invoice || !invoice.customer) {
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
            
            <RefundWorkspace 
                originalInvoice={invoice}
                customer={invoice.customer}
                inventory={inventory}
            />
        </div>
    );
}
