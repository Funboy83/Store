'use client';

import { Button } from '@/components/ui/button';
import { PlusCircle, Users, UserCheck } from 'lucide-react';
import { DataTable } from '@/components/inventory/data-table';
import { columns } from './columns';
import { Supplier } from '@/lib/types';
import { AddSupplierForm } from '@/components/suppliers';
import { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { useRouter } from 'next/navigation';

interface SupplierTableProps {
    suppliers: Supplier[];
    showAddSupplierButton?: boolean;
    onRowClick?: (supplier: Supplier) => void;
    hideActions?: boolean;
}

export function SupplierTable({ suppliers, showAddSupplierButton = true, onRowClick, hideActions }: SupplierTableProps) {
    const [isAddSupplierOpen, setIsAddSupplierOpen] = useState(false);
    const [filter, setFilter] = useState<'all' | 'active'>('all');
    const router = useRouter();

    const filteredSuppliers = useMemo(() => {
        if (filter === 'active') {
            return suppliers.filter(supplier => supplier.status === 'active');
        }
        return suppliers;
    }, [suppliers, filter]);

    const handleRowClick = (supplier: Supplier) => {
        if (onRowClick) {
            onRowClick(supplier);
        } else {
            router.push(`/dashboard/suppliers/${supplier.id}`);
        }
    };

    return (
        <>
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-semibold tracking-tight">Supplier List</h2>
                {showAddSupplierButton && (
                    <Button onClick={() => setIsAddSupplierOpen(true)}>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Add Supplier
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
                    All Suppliers ({suppliers.length})
                </Button>
                <Button
                    variant={filter === 'active' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilter('active')}
                >
                    <UserCheck className="mr-2 h-4 w-4" />
                    Active Suppliers ({suppliers.filter(s => s.status === 'active').length})
                </Button>
            </div>
            
            <Card>
                <CardContent className="p-0">
                    <DataTable 
                        columns={columns} 
                        data={filteredSuppliers} 
                        onRowClick={handleRowClick}
                        hideActions={hideActions}
                    />
                </CardContent>
            </Card>

            <AddSupplierForm 
                open={isAddSupplierOpen}
                onOpenChange={setIsAddSupplierOpen}
            />
        </>
    );
}