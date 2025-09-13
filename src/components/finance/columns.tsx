
"use client"

import { useState, useEffect } from "react"
import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { PaymentDetail, TenderDetail } from "@/lib/types"
import { ArrowRight, MoreHorizontal, StickyNote } from "lucide-react"
import { Button } from "../ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover"

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
        const tenderDetails = row.getValue("tenderDetails") as TenderDetail[]
        return (
            <div className="flex flex-col gap-1">
                {tenderDetails.map((tender, index) => (
                    <Badge key={index} variant="outline" className="w-fit">
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

      return <div className="text-right font-medium text-green-600">{formatted}</div>
    },
  },
  {
    accessorKey: "appliedToInvoices",
    header: "Applied to Invoices",
    cell: ({ row }) => {
        const invoices = row.getValue("appliedToInvoices") as string[]
        return (
             <Popover>
                <PopoverTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8">
                       {invoices.length} Invoice(s) <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent>
                    <div className="space-y-2">
                        <p className="font-semibold text-sm">Applied to:</p>
                        <ul className="list-disc list-inside text-muted-foreground text-sm">
                            {invoices.map(invId => <li key={invId}>{invId}</li>)}
                        </ul>
                    </div>
                </PopoverContent>
            </Popover>
        )
    }
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
