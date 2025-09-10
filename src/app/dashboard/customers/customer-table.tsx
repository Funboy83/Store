
'use client';

import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { DataTable } from '@/components/inventory/data-table';
import { columns } from './columns';
import { useToast } from '@/hooks/use-toast';
import { Customer } from '@/lib/types';

interface CustomerTableProps {
    customers: Customer[];
}

export function CustomerTable({ customers }: CustomerTableProps) {
    const { toast } = useToast();

    return (
        <>
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold tracking-tight">Customers</h1>
                <Button onClick={() => toast({ title: 'Coming Soon!', description: 'Adding customers will be available in a future update.'})}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add Customer
                </Button>
            </div>
            <DataTable columns={columns} data={customers} />
        </>
    )
}
