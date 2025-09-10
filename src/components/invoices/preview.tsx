"use client"

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
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
import type { Invoice } from "@/lib/types"
import { ArrowLeft, Printer } from "lucide-react"
import { Logo } from "../logo"

interface InvoicePreviewProps {
  invoice: Invoice;
  onBack: () => void;
}

export function InvoicePreview({ invoice, onBack }: InvoicePreviewProps) {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex flex-col gap-4">
       <div className="flex items-center gap-4 print:hidden">
        <Button variant="outline" size="icon" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold tracking-tight">Invoice Preview</h1>
        <Button onClick={handlePrint} className="ml-auto">
          <Printer className="mr-2 h-4 w-4" />
          Print / Save PDF
        </Button>
      </div>

      <Card className="w-full max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 print:shadow-none print:border-0 print:p-0">
        <CardHeader>
          <div className="flex items-center justify-between">
            <Logo />
            <div className="text-right">
              <h1 className="text-2xl font-bold">Invoice</h1>
              <p className="text-muted-foreground">{invoice.invoiceNumber}</p>
            </div>
          </div>
          <Separator className="my-4" />
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="font-semibold">Bill To:</h3>
              <p>{invoice.customer.name}</p>
              <p>{invoice.customer.email}</p>
              <p>{invoice.customer.address}</p>
            </div>
            <div className="text-right">
              <p><span className="font-semibold">Issue Date:</span> {invoice.issueDate}</p>
              <p><span className="font-semibold">Due Date:</span> {invoice.dueDate}</p>
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
                  <TableCell>{item.productName}</TableCell>
                  <TableCell className="text-center">{item.quantity}</TableCell>
                  <TableCell className="text-right">${item.unitPrice.toFixed(2)}</TableCell>
                  <TableCell className="text-right">${item.total.toFixed(2)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell colSpan={3} className="text-right font-semibold">Subtotal</TableCell>
                <TableCell className="text-right">${invoice.subtotal.toFixed(2)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell colSpan={3} className="text-right font-semibold">Tax</TableCell>
                <TableCell className="text-right">${invoice.tax.toFixed(2)}</TableCell>
              </TableRow>
              <TableRow className="font-bold text-lg">
                <TableCell colSpan={3} className="text-right">Total</TableCell>
                <TableCell className="text-right">${invoice.total.toFixed(2)}</TableCell>
              </TableRow>
            </TableFooter>
          </Table>
          {invoice.summary && (
            <div className="mt-6">
                <h3 className="font-semibold">Summary</h3>
                <p className="text-sm text-muted-foreground p-4 bg-muted rounded-md">{invoice.summary}</p>
            </div>
          )}
        </CardContent>
        <CardFooter className="text-center text-xs text-muted-foreground">
            Thank you for your business!
        </CardFooter>
      </Card>
    </div>
  );
}
