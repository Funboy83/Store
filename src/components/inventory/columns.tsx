
"use client"

import { ColumnDef } from "@tanstack/react-table"
import { MoreHorizontal } from "lucide-react"
import { Badge } from "@/components/ui/badge"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Checkbox } from "@/components/ui/checkbox"
import { Product } from "@/lib/types"
import { deleteProduct } from "@/lib/actions/inventory"
import { useToast } from "@/hooks/use-toast"

async function handleDelete(product: Product) {
    const { toast } = useToast();
    const result = await deleteProduct(product);
    if (result.success) {
        toast({
            title: "Product Deleted",
            description: "The product has been moved to the inventory history.",
        });
    } else {
        toast({
            title: "Error",
            description: result.error,
            variant: "destructive",
        });
    }
}

export const columns: ColumnDef<Product>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
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
    accessorKey: "storage",
    header: "Storage",
  },
    {
    accessorKey: "grade",
    header: "Grade",
    cell: ({ row }) => {
      return <Badge variant="outline">{row.getValue("grade")}</Badge>
    }
  },
  {
    accessorKey: "price",
    header: () => <div className="text-right">Price</div>,
    cell: ({ row }) => {
      const price = parseFloat(row.getValue("price"))
      const formatted = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      }).format(price)

      return <div className="text-right font-medium">{formatted}</div>
    },
  },
  {
    accessorKey: "carrier",
    header: "Carrier",
  },
  {
    accessorKey: "battery",
    header: "Battery",
    cell: ({ row }) => {
        const battery = row.getValue("battery") as number;
        const colorStyle = battery > 80 
            ? { backgroundColor: 'hsl(var(--chart-2))' } 
            : battery > 50 
            ? { backgroundColor: 'hsl(var(--chart-5))' } 
            : { backgroundColor: 'hsl(var(--destructive))' };
        return (
            <div className="flex items-center gap-2">
                <div className="h-2.5 w-2.5 rounded-full" style={colorStyle}></div>
                {battery}%
            </div>
        )
    }
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const product = row.original

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => navigator.clipboard.writeText(product.id)}
            >
              Copy product ID
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Edit Product</DropdownMenuItem>
            <DropdownMenuItem 
                onClick={() => handleDelete(product)}
                className="text-destructive"
            >
                Delete Product
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]
