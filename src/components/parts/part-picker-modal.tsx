'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search } from 'lucide-react';
import { Part } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

interface PartPickerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  parts: Part[];
  onPartSelected: (part: Part) => void;
  title?: string;
  description?: string;
}

export function PartPickerModal({ 
  open, 
  onOpenChange, 
  parts, 
  onPartSelected,
  title = "Select Part",
  description = "Choose a part from your inventory"
}: PartPickerModalProps) {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredParts = parts.filter(part => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    const matchesBasic = 
      part.name.toLowerCase().includes(searchLower) ||
      part.partNumber?.toLowerCase().includes(searchLower) ||
      part.brand?.toLowerCase().includes(searchLower) ||
      part.model?.toLowerCase().includes(searchLower);
    
    const matchesCustomFields = part.customFields && 
      Object.values(part.customFields).some(value => 
        value.toLowerCase().includes(searchLower)
      );
    
    return matchesBasic || matchesCustomFields;
  });

  const handlePartSelect = (part: Part) => {
    if (part.totalQuantityInStock === 0) {
      toast({
        title: 'Out of Stock',
        description: 'This part is currently out of stock',
        variant: 'destructive',
      });
      return;
    }
    
    onPartSelected(part);
    setSearchTerm('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col">
          {/* Search Input */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search parts by name, part number, brand, model, or custom fields..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Parts List */}
          <div className="flex-1 overflow-y-auto border rounded-md">
            {filteredParts.length > 0 ? (
              <div className="space-y-0">
                {filteredParts.map((part) => (
                  <button
                    key={part.id}
                    onClick={() => handlePartSelect(part)}
                    className="w-full p-4 text-left hover:bg-gray-50 border-b border-border last:border-0 focus:bg-gray-50 focus:outline-none transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="font-medium">{part.name}</div>
                        {part.partNumber && (
                          <div className="text-sm text-muted-foreground">PN: {part.partNumber}</div>
                        )}
                        <div className="text-sm text-muted-foreground">
                          {part.brand && part.model ? `${part.brand} ${part.model}` : part.brand || part.model || 'No brand/model'}
                        </div>
                        {part.condition && (
                          <div className="text-sm text-muted-foreground">
                            Condition: {part.condition}
                          </div>
                        )}
                        {part.customFields && Object.keys(part.customFields).length > 0 && (
                          <div className="mt-1 space-y-0.5">
                            {Object.entries(part.customFields).map(([key, value]) => (
                              <div key={key} className="text-xs text-muted-foreground">
                                <span className="font-medium">{key}:</span> {value}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="text-right ml-4">
                        <Badge 
                          variant={part.totalQuantityInStock === 0 ? "destructive" : part.totalQuantityInStock <= part.minQuantity ? "secondary" : "outline"} 
                          className="text-xs"
                        >
                          {part.totalQuantityInStock} in stock
                        </Badge>
                        <div className="text-sm text-muted-foreground mt-1">
                          Cost: ${part.avgCost ? part.avgCost.toFixed(2) : '0.00'}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Price: ${part.price ? part.price.toFixed(2) : '0.00'}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-muted-foreground">
                {searchTerm ? (
                  <>
                    <p>No parts found matching "{searchTerm}"</p>
                    <p className="text-sm mt-1">Try adjusting your search terms</p>
                  </>
                ) : (
                  <p>No parts available in inventory</p>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}