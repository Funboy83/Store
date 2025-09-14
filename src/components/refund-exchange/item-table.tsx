
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import type { InvoiceItem } from '@/lib/types';

interface ItemTableProps {
  items: InvoiceItem[];
  onRemove?: (itemId: string) => void;
}

export function ItemTable({ items, onRemove }: ItemTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Product</TableHead>
          <TableHead className="text-right">Total</TableHead>
          {onRemove && <TableHead className="w-[50px]"></TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.length === 0 ? (
          <TableRow>
            <TableCell colSpan={onRemove ? 3 : 2} className="text-center h-24">
              No items yet.
            </TableCell>
          </TableRow>
        ) : (
          items.map(item => (
            <TableRow key={item.id}>
              <TableCell>
                <p className="font-medium">{item.productName}</p>
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </TableCell>
              <TableCell className="text-right font-medium">
                {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(item.total)}
              </TableCell>
              {onRemove && (
                <TableCell>
                  <Button variant="ghost" size="icon" onClick={() => onRemove(item.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </TableCell>
              )}
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}
