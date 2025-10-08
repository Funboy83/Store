"use client"

import { ColumnDef } from "@tanstack/react-table"
import { MoreHorizontal, Package } from "lucide-react"
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
import { GeneralItem } from "@/lib/types"
import { deleteGeneralItem } from "@/lib/actions/general-inventory"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { useState } from "react"

function DeleteButton({ item }: { item: GeneralItem }) {
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const result = await deleteGeneralItem(item.id);
      if (result.success) {
        toast({
          title: "Success",
          description: "Item deleted successfully",
        });
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to delete item",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
          Delete Item
        </DropdownMenuItem>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete the item
            &quot;{item.name}&quot; and all its history from your inventory.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            disabled={isDeleting}
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export const columns: ColumnDef<GeneralItem>[] = [
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
    accessorKey: "name",
    header: "Item",
    cell: ({ row }) => {
      const item = row.original;
      return (
        <div className="flex items-center gap-2">
          <Package className="h-4 w-4 text-muted-foreground" />
          <div>
            <div className="font-medium">{item.name}</div>
            {item.sku && (
              <div className="text-sm text-muted-foreground">SKU: {item.sku}</div>
            )}
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "brand",
    header: "Brand/Model",
    cell: ({ row }) => {
      const item = row.original;
      if (!item.brand && !item.model) return <span className="text-muted-foreground">-</span>;
      return (
        <div>
          {item.brand && <div className="font-medium">{item.brand}</div>}
          {item.model && <div className="text-sm text-muted-foreground">{item.model}</div>}
        </div>
      );
    },
  },
  {
    id: "category",
    header: "Category",
    cell: ({ row }) => {
      const item = row.original;
      if (!item.categoryId) return <span className="text-muted-foreground">-</span>;
      
      // For now, we'll pass the category names through a different approach
      // The names will be resolved in the server component
      return (
        <div>
          <Badge variant="outline">{(item as any).categoryName || item.categoryId}</Badge>
          {item.subCategoryId && (
            <div className="mt-1">
              <Badge variant="secondary" className="text-xs">
                {(item as any).subCategoryName || item.subCategoryId}
              </Badge>
            </div>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "condition",
    header: "Condition",
    cell: ({ row }) => {
      const condition = row.getValue("condition") as string;
      const getConditionColor = (condition: string) => {
        switch (condition) {
          case "New":
            return "bg-green-100 text-green-800";
          case "Refurbished":
            return "bg-blue-100 text-blue-800";
          case "Used - Excellent":
            return "bg-emerald-100 text-emerald-800";
          case "Used - Good":
            return "bg-yellow-100 text-yellow-800";
          case "Used - Fair":
            return "bg-orange-100 text-orange-800";
          case "Damaged":
            return "bg-red-100 text-red-800";
          default:
            return "bg-gray-100 text-gray-800";
        }
      };
      
      return (
        <Badge variant="outline" className={cn("text-xs", getConditionColor(condition))}>
          {condition}
        </Badge>
      );
    },
  },
  {
    accessorKey: "totalQuantityInStock",
    header: "Stock",
    cell: ({ row }) => {
      const item = row.original;
      const stock = item.totalQuantityInStock;
      const isLowStock = stock <= item.minQuantity;
      const isOutOfStock = stock === 0;
      
      return (
        <div className="text-right">
          <span className={cn(
            "font-medium",
            isOutOfStock ? "text-red-600" : isLowStock ? "text-orange-600" : "text-green-600"
          )}>
            {stock}
          </span>
          {isLowStock && !isOutOfStock && (
            <Badge variant="outline" className="ml-2 text-xs bg-orange-50 text-orange-600">
              Low
            </Badge>
          )}
          {isOutOfStock && (
            <Badge variant="outline" className="ml-2 text-xs bg-red-50 text-red-600">
              Out
            </Badge>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "avgCost",
    header: "Avg Cost",
    cell: ({ row }) => {
      const cost = row.getValue("avgCost") as number;
      return <div className="text-right font-mono">${cost.toFixed(2)}</div>;
    },
  },
  {
    accessorKey: "price",
    header: "Price",
    cell: ({ row }) => {
      const price = row.getValue("price") as number;
      return <div className="text-right font-mono">${price.toFixed(2)}</div>;
    },
  },
  {
    id: "profit",
    header: "Margin",
    cell: ({ row }) => {
      const item = row.original;
      const margin = item.price - item.avgCost;
      const marginPercent = item.avgCost > 0 ? (margin / item.avgCost) * 100 : 0;
      
      return (
        <div className="text-right">
          <div className="font-mono text-sm">${margin.toFixed(2)}</div>
          <div className={cn(
            "text-xs",
            marginPercent > 20 ? "text-green-600" : marginPercent > 0 ? "text-orange-600" : "text-red-600"
          )}>
            {marginPercent.toFixed(1)}%
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "location",
    header: "Location",
    cell: ({ row }) => {
      const location = row.getValue("location") as string;
      return location ? (
        <Badge variant="outline" className="text-xs">
          {location}
        </Badge>
      ) : (
        <span className="text-muted-foreground">-</span>
      );
    },
  },
  {
    accessorKey: "createdAt",
    header: "Added",
    cell: ({ row }) => {
      const dateString = row.getValue("createdAt") as string;
      const date = new Date(dateString);
      const formattedDate = date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
      return <span className="text-sm text-muted-foreground">{formattedDate}</span>;
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const item = row.original;

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
              onClick={() => navigator.clipboard.writeText(item.id)}
            >
              Copy item ID
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>View details</DropdownMenuItem>
            <DropdownMenuItem>Edit item</DropdownMenuItem>
            <DropdownMenuItem>Add stock</DropdownMenuItem>
            <DropdownMenuItem>View history</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DeleteButton item={item} />
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];

