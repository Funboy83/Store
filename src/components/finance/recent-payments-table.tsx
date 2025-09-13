
'use client';

import { DataTable } from '@/components/inventory/data-table';
import { columns } from './columns';
import { PaymentDetail } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

interface RecentPaymentsTableProps {
    payments: PaymentDetail[];
}

export function RecentPaymentsTable({ payments }: RecentPaymentsTableProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Recent Payments</CardTitle>
                <CardDescription>A log of all financial transactions.</CardDescription>
            </CardHeader>
            <CardContent>
                <DataTable columns={columns} data={payments} />
            </CardContent>
        </Card>
    )
}
