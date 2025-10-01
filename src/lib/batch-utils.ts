import { PartBatch } from '@/lib/types';

// FIFO Batch Management Utilities (Non-async helper functions)
export function generateBatchId(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substr(2, 5);
  return `BATCH-${timestamp}-${random}`.toUpperCase();
}

export function createBatch(
  quantity: number, 
  costPrice: number, 
  supplier?: string, 
  notes?: string
): PartBatch {
  return {
    batchId: generateBatchId(),
    purchaseDate: new Date().toISOString(),
    quantity,
    costPrice,
    supplier,
    notes
  };
}

export function calculateTotalQuantity(batches: PartBatch[]): number {
  return batches.reduce((total, batch) => total + batch.quantity, 0);
}

export function calculateAverageCost(batches: PartBatch[]): number {
  const totalQuantity = calculateTotalQuantity(batches);
  if (totalQuantity === 0) return 0;
  
  const totalCost = batches.reduce((total, batch) => total + (batch.quantity * batch.costPrice), 0);
  return totalCost / totalQuantity;
}

export function findOldestAvailableBatch(batches: PartBatch[]): PartBatch | null {
  const availableBatches = batches
    .filter(batch => batch.quantity > 0)
    .sort((a, b) => new Date(a.purchaseDate).getTime() - new Date(b.purchaseDate).getTime());
  
  return availableBatches.length > 0 ? availableBatches[0] : null;
}