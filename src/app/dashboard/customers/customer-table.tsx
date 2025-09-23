
'use client';

import { Button } from '@/components/ui/button';
import { PlusCircle, Users, CreditCard } from 'lucide-react';
import { DataTable } from '@/components/inventory/data-table';
import { columns } from './columns';
import { Customer } from '@/lib/types';
import { AddCustomerForm } from '@/components/customers/add-customer-form';
import { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { useRouter } from 'next/navigation';

interface CustomerTableProps {
    customers: Customer[];
    showAddCustomerButton?: boolean;
    onRowClick?: (customer: Customer) => void;
    hideActions?: boolean;
}

export function CustomerTable({ customers, showAddCustomerButton = true, onRowClick, hideActions }: CustomerTableProps) {
    const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false);
    const [filter, setFilter] = useState<'all' | 'debt'>('all');
    const router = useRouter();

    const filteredCustomers = useMemo(() => {
        if (filter === 'debt') {
            return customers.filter(customer => customer.debt > 0);
        }
        return customers;
    }, [customers, filter]);

    const handleRowClick = (customer: Customer) => {
        if (onRowClick) {
            onRowClick(customer);
        } else {
            router.push(`/dashboard/customers/${customer.id}`);
        }
    };

    return (
        <>
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-semibold tracking-tight">Customer List</h2>
                {showAddCustomerButton && (
                    <Button onClick={() => setIsAddCustomerOpen(true)}>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Add Customer
                    </Button>
                )}
            </div>
            
            {/* Filter Buttons */}
            <div className="flex items-center gap-2">
                <Button
                    variant={filter === 'all' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilter('all')}
                >
                    <Users className="mr-2 h-4 w-4" />
                    All Customers ({customers.length})
                </Button>
                <Button
                    variant={filter === 'debt' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilter('debt')}
                >
                    <CreditCard className="mr-2 h-4 w-4" />
                    Debt Customers ({customers.filter(c => c.debt > 0).length})
                </Button>
            </div>
            
            <Card>
                <CardContent className="p-0">
                    <DataTable 
                        columns={columns} 
                        data={filteredCustomers} 
                        onRowClick={handleRowClick}
                        hideActions={hideActions}
                    />
                </CardContent>
            </Card>
            <AddCustomerForm isOpen={isAddCustomerOpen} onOpenChange={setIsAddCustomerOpen} />
        </>
    )
}
