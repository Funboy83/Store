

'use client';

import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { DataTable } from '@/components/inventory/data-table';
import { columns } from './columns';
import { Customer } from '@/lib/types';
import { AddCustomerForm } from '@/components/customers/add-customer-form';
import { useState } from 'react';

interface CustomerTableProps {
    customers: Customer[];
}

export function CustomerTable({ customers }: CustomerTableProps) {
    const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false);

    return (
        <>
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold tracking-tight">Customers</h1>
                <Button onClick={() => setIsAddCustomerOpen(true)}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add Customer
                </Button>
            </div>
            <DataTable columns={columns} data={customers} />
            <AddCustomerForm isOpen={isAddCustomerOpen} onOpenChange={setIsAddCustomerOpen} />
        </>
    )
}
