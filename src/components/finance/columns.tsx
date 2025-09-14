
"use client"

import { useState, useEffect } from "react"
import Link from "next/link";
import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { PaymentDetail, InvoiceDetail } from "@/lib/types"
import { MoreHorizontal, StickyNote, Undo2 } from "lucide-react"
import { Button } from "../ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { InvoiceQuickView } from '../invoices/invoice-quick-view';
import { cn } from "@/lib/utils";

// New component to handle client-side date rendering
function DateCell({ dateString }: { dateString: string }) {
  const [formattedDate, setFormattedDate] = useState('');

  useEffect(() => {
    // This code will only run on the client after hydration
    const date = new Date(dateString);
    const datePart = date.toLocaleDateString();
    const timePart = date.toLocaleTimeString();
    setFormattedDate(`${datePart} ${timePart}`);
  }, [dateString]);
  
  // Render a placeholder or nothing on the server and initial client render
  return <span>{formattedDate || 'Loading date...'}</span>;
}

export const columns: ColumnDef<PaymentDetail>[] = [
  {
    accessorKey: "paymentDate",
    header: "Date",
    cell: ({ row }) => {
      const dateString = row.getValue("paymentDate") as string;
      return <DateCell dateString={dateString} />;
    },
  },
  {
    accessorKey: "customerName",
    header: "Customer",
  },
  {
    accessorKey: "tenderDetails",
    header: "Payment Method",
    cell: ({ row }) => {
        const tenderDetails = row.getValue("tenderDetails") as PaymentDetail['tenderDetails'];
        const isRefund = (row.original as PaymentDetail).type === 'refund';
        return (
            <div className="flex flex-col gap-1">
                {tenderDetails.map((tender, index) => (
                    <Badge key={index} variant={isRefund ? "destructive" : "outline"} className="w-fit">
                        {tender.method}: {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(tender.amount)}
                    </Badge>
                ))}
            </div>
        )
    }
  },
  {
    accessorKey: "amountPaid",
    header: () => <div className="text-right">Amount Paid</div>,
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue("amountPaid"))
      const formatted = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      }).format(amount)
      const isRefund = (row.original as PaymentDetail).type === 'refund';

      return <div className={cn("text-right font-medium", isRefund ? "text-destructive" : "text-green-600")}>{formatted}</div>
    },
  },
  {
    id: "appliedTo",
    header: "Applied to",
    cell: function AppliedToCell({ row }) {
        const payment = row.original as PaymentDetail;
        const [quickViewInvoice, setQuickViewInvoice] = useState<InvoiceDetail | null>(null);

        return (
             <>
                {payment.type === 'refund' && payment.sourceCreditNoteId ? (
                     <Link href={`/dashboard/credit-notes/${payment.sourceCreditNoteId}`} passHref>
                        <Badge variant="destructive" className="cursor-pointer hover:bg-destructive/80">
                            <Undo2 className="mr-1.5 h-3 w-3"/>
                            Refund
                        </Badge>
                    </Link>
                ) : (
                    <div className="flex flex-col items-start gap-1">
                        {(payment.appliedToInvoices || []).map(inv => (
                            <Button 
                                key={inv.id}
                                variant="link" 
                                className="p-0 h-auto font-normal"
                                onClick={() => setQuickViewInvoice(inv)}
                            >
                                {inv.invoiceNumber}
                            </Button>
                        ))}
                    </div>
                )}
                 <Dialog open={!!quickViewInvoice} onOpenChange={(isOpen) => !isOpen && setQuickViewInvoice(null)}>
                    <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0">
                        {quickViewInvoice && (
                        <>
                            <DialogHeader className="p-6 pb-0">
                            <DialogTitle>Quick View: Invoice {quickViewInvoice.invoiceNumber}</DialogTitle>
                            </DialogHeader>
                            <div className="flex-1 overflow-y-auto px-6">
                                <InvoiceQuickView invoice={quickViewInvoice} />
                            </div>
                        </>
                        )}
                    </DialogContent>
                </Dialog>
            </>
        )
    },
  },
  {
    accessorKey: "notes",
    header: "",
    cell: ({ row }) => {
        const notes = row.getValue("notes") as string | undefined;
        if (!notes) return null;

        return (
            <Popover>
                <PopoverTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                        <StickyNote className="h-4 w-4 text-muted-foreground" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent>
                     <div className="space-y-2">
                        <p className="font-semibold text-sm">Payment Note</p>
                        <p className="text-sm text-muted-foreground">{notes}</p>
                    </div>
                </PopoverContent>
            </Popover>
        )
    }
  },
  {
      id: "actions",
      cell: () => {
          return (
                <Button variant="ghost" className="h-8 w-8 p-0">
                    <span className="sr-only">Open menu</span>
                    <MoreHorizontal className="h-4 w-4" />
                </Button>
          )
      }
  }
]
