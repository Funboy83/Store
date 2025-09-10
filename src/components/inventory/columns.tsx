
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Product } from "@/lib/types"
import { deleteProduct } from "@/lib/actions/inventory"
import { useToast } from "@/hooks/use-toast"

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
        return (
            <div className="flex items-center gap-2">
                <div className="h-2.5 w-2.5 rounded-full" style={{ 
                    backgroundColor: battery > 80 ? 'hsl(var(--primary))' : battery > 50 ? 'hsl(var(--yellow-500))' : 'hsl(var(--destructive))' 
                }}></div>
                {battery}%
            </div>
        )
    }
  },
  {
    id: "actions",
    cell: function Actions({ row }) {
      const product = row.original
      const { toast } = useToast()

      const handleDelete = async () => {
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

      return (
        <AlertDialog>
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
              <DropdownMenuItem onSelect={() => toast({ title: "Coming Soon!", description: "Editing products will be available in a future update."})}>
                Edit Product
              </DropdownMenuItem>
              <AlertDialogTrigger asChild>
                <DropdownMenuItem className="text-destructive">
                  Delete Product
                </DropdownMenuItem>
              </AlertDialogTrigger>
            </DropdownMenuContent>
          </DropdownMenu>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the product
                and move it to the inventory history.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete}>Continue</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )
    },
  },
]
