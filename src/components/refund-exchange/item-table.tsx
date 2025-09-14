
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import type { InvoiceItem } from '@/lib/types';
import { Input } from '../ui/input';
import { cn } from '@/lib/utils';

interface ItemTableProps {
  items: InvoiceItem[];
  onRemove?: (itemId: string) => void;
  onItemChange?: (itemId: string, field: keyof InvoiceItem, value: string | number) => void;
}

export function ItemTable({ items, onRemove, onItemChange }: ItemTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Product</TableHead>
          <TableHead className="w-[80px]">Qty</TableHead>
          <TableHead className="w-[120px]">Unit Price</TableHead>
          <TableHead className="text-right w-[120px]">Total</TableHead>
          {onRemove && <TableHead className="w-[50px]"></TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.length === 0 ? (
          <TableRow>
            <TableCell colSpan={onRemove ? 5 : 4} className="text-center h-24">
              No items yet.
            </TableCell>
          </TableRow>
        ) : (
          items.map(item => (
            <TableRow key={item.id}>
              <TableCell className='space-y-1 align-top'>
                 <Input 
                    value={item.productName} 
                    readOnly={!item.isCustom}
                    onChange={e => onItemChange?.(item.id, 'productName', e.target.value)}
                    className={cn("font-medium h-8", !item.isCustom && "bg-transparent border-0 px-0 focus-visible:ring-0 focus-visible:ring-offset-0")}
                    placeholder="Item name"
                />
                {item.description && <p className="text-xs text-muted-foreground">{item.description}</p>}
              </TableCell>
               <TableCell className="align-top">
                {item.isCustom ? (
                  <Input
                    type="number"
                    value={item.quantity}
                    onChange={(e) => onItemChange?.(item.id, 'quantity', e.target.value)}
                    className="text-right h-8"
                    placeholder="1"
                  />
                ) : (
                  <div className="text-right h-8 flex items-center justify-end pr-3">
                    {item.quantity}
                  </div>
                )}
              </TableCell>
               <TableCell className="align-top">
                {item.isCustom ? (
                  <Input
                    type="number"
                    step="0.01"
                    value={item.unitPrice}
                    onChange={(e) => onItemChange?.(item.id, 'unitPrice', e.target.value)}
                    className="text-right h-8"
                    placeholder="0.00"
                  />
                ) : (
                  <div className="text-right h-8 flex items-center justify-end pr-3">
                    {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(item.unitPrice)}
                  </div>
                )}
              </TableCell>
              <TableCell className="text-right font-medium align-top">
                 <div className="h-8 flex items-center justify-end pr-3">
                    {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(item.total)}
                 </div>
              </TableCell>
              {onRemove && (
                <TableCell className='align-top'>
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
