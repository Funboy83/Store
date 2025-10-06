
"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { ProductHistory } from "@/lib/types"

export const columns: ColumnDef<ProductHistory>[] = [
  {
    accessorKey: "movedAt",
    header: "Date Moved",
    cell: ({ row }) => {
      const date = new Date(row.getValue("movedAt"))
      return <span>{date.toLocaleDateString()}</span>
    },
  },
  {
    accessorKey: "imei",
    header: "IMEI",
  },
  {
    accessorKey: "model",
    header: "Product",
    cell: ({ row }) => {
      const product = row.original
      return (
        <div>
          <div className="font-medium">{product.model}</div>
          <div className="text-sm text-muted-foreground">{product.brand}</div>
        </div>
      )
    }
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
        const status = row.getValue("status") as string;
        const getStatusVariant = (status: string) => {
          switch (status) {
            case 'Sold': return 'default';
            case 'Returned': return 'outline';
            case 'Voided': return 'destructive';
            case 'Deleted': return 'secondary';
            default: return 'secondary';
          }
        };
        return <Badge variant={getStatusVariant(status)}>{status}</Badge>
    }
  },
  {
    accessorKey: "amount",
    header: () => <div className="text-right">Amount</div>,
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue("amount"))
      const formatted = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      }).format(amount)

      return <div className="text-right font-medium">{formatted}</div>
    },
  },
  {
    accessorKey: "customerName",
    header: "Customer",
  },
  {
    accessorKey: "storage",
    header: "Storage",
  },
    {
    accessorKey: "grade",
    header: "Grade",
  },
]
