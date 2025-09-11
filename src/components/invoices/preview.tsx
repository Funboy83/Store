

"use client"

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import type { InvoiceDetail } from "@/lib/types"
import { Printer } from "lucide-react"
import { Logo } from "../logo"
import { Badge } from "../ui/badge"

interface InvoicePreviewProps {
  invoice: InvoiceDetail;
  isEdited?: boolean;
}

export function InvoicePreview({ invoice, isEdited = false }: InvoicePreviewProps) {
  const handlePrint = () => {
    window.print();
  };

  const getStatusVariant = (status?: InvoiceDetail['status']) => {
    switch (status) {
      case 'Paid':
        return 'default';
      case 'Partial':
        return 'secondary';
      case 'Unpaid':
      case 'Overdue':
        return 'destructive';
      default:
        return 'outline';
    }
  }

  const isActive = invoice.status !== 'Voided';

  return (
    <>
      <div className="flex items-center gap-4 print:hidden">
        <div className="flex-1" />
        <Button onClick={handlePrint} variant="outline">
          <Printer className="mr-2 h-4 w-4" />
          Print / Save PDF
        </Button>
      </div>

      <Card className="w-full max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 print:shadow-none print:border-0 print:p-0">
        <CardHeader>
          <div className="flex items-start justify-between">
            <Logo isCollapsed={false} />
            <div className="text-right">
              <h1 className="text-2xl font-bold">Invoice</h1>
              <p className="text-muted-foreground">{invoice.invoiceNumber}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-2">
            {isActive && <Badge variant="default" className="bg-green-600">Active</Badge>}
            {isEdited && <Badge variant="secondary">Edited</Badge>}
          </div>
          <Separator className="my-4" />
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="font-semibold text-muted-foreground">Bill To:</h3>
              <p>{invoice.customer.name}</p>
              <p>{invoice.customer.email}</p>
              {invoice.customer.address && <p>{invoice.customer.address}</p>}
            </div>
            <div className="text-right grid gap-1">
              <p><span className="font-semibold text-muted-foreground">Issue Date:</span> {invoice.issueDate}</p>
              <p><span className="font-semibold text-muted-foreground">Due Date:</span> {invoice.dueDate}</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead className="text-center">Quantity</TableHead>
                <TableHead className="text-right">Unit Price</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoice.items.map((item, index) => (
                <TableRow key={index}>
                  <TableCell>
                      <p className="font-medium">{item.productName}</p>
                      {item.description && <p className="text-xs text-muted-foreground">{item.description}</p>}
                  </TableCell>
                  <TableCell className="text-center">{item.quantity}</TableCell>
                  <TableCell className="text-right">${item.unitPrice.toFixed(2)}</TableCell>
                  <TableCell className="text-right">${item.total.toFixed(2)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
         <CardFooter className="flex flex-col items-end gap-4 p-6">
            <Separator />
             <div className="w-full max-w-xs space-y-2">
                <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>${invoice.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-muted-foreground">Discount</span>
                    <span>-${invoice.discount?.toFixed(2) || '0.00'}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-muted-foreground">Tax</span>
                    <span>${invoice.tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span>${invoice.total.toFixed(2)}</span>
                </div>
            </div>
            {invoice.summary && (
              <div className="w-full pt-4 text-left">
                  <h3 className="font-semibold">Summary</h3>
                  <p className="text-sm text-muted-foreground p-4 bg-muted rounded-md">{invoice.summary}</p>
              </div>
            )}
             <div className="w-full pt-8 text-center text-xs text-muted-foreground">
                Thank you for your business!
            </div>
        </CardFooter>
      </Card>
    </>
  );
}
