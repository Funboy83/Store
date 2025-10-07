'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { RepairJob } from '@/lib/types';
import { formatDistanceToNow } from 'date-fns';
import { Eye, Phone, Edit } from 'lucide-react';
import Link from 'next/link';

interface JobsTableProps {
  jobs: RepairJob[];
}

const getStatusColor = (status: RepairJob['status']) => {
  switch (status) {
    case 'Waiting for Parts':
      return 'destructive';
    case 'In Progress':
      return 'default';
    case 'Ready for Pickup':
      return 'secondary';
    case 'Completed':
      return 'outline';
    case 'Paid':
      return 'secondary';
    default:
      return 'outline';
  }
};

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'High':
      return 'destructive';
    case 'Medium':
      return 'default';
    case 'Low':
      return 'secondary';
    default:
      return 'outline';
  }
};

export function JobsTable({ jobs }: JobsTableProps) {
  if (jobs.length === 0) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center text-muted-foreground">
            <p>No repair jobs found</p>
            <Button variant="outline" className="mt-4" asChild>
              <Link href="/dashboard/jobs/new">
                Create your first job
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>All Repair Jobs ({jobs.length})</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Job ID</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Device</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Cost</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {jobs.map((job) => (
              <TableRow key={job.id}>
                <TableCell className="font-medium">
                  {job.jobId}
                </TableCell>
                <TableCell>
                  <div>
                    <div className="font-medium">{job.customerName}</div>
                    <div className="text-sm text-muted-foreground">{job.customerPhone}</div>
                  </div>
                </TableCell>
                <TableCell>
                  <div>
                    <div className="font-medium">{job.deviceMake} {job.deviceModel}</div>
                    <div className="text-sm text-muted-foreground">
                      {job.imei ? `IMEI: ${job.imei}` : 'No IMEI'}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={getStatusColor(job.status)}>
                    {job.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={getPriorityColor(job.priority || 'Medium')}>
                    {job.priority || 'Medium'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div>
                    <div className="font-medium">
                      ${job.actualCost || job.estimatedCost}
                    </div>
                    {job.actualCost && job.actualCost !== job.estimatedCost && (
                      <div className="text-xs text-muted-foreground">
                        Est: ${job.estimatedCost}
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    {formatDistanceToNow(new Date(job.createdAt), { addSuffix: true })}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex space-x-1">
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/dashboard/jobs/${job.id}`}>
                        <Eye className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      disabled={job.isPaid}
                      className={job.isPaid ? "opacity-50 cursor-not-allowed" : ""}
                      title={job.isPaid ? "Cannot edit paid jobs" : "Edit job"}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Phone className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}