import { AddInventoryForm } from '@/components/inventory/add-form';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function AddInventoryPage() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/inventory" passHref>
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">Add New Product</h1>
      </div>
      <div className="max-w-2xl mx-auto w-full">
        <AddInventoryForm />
      </div>
    </div>
  );
}
