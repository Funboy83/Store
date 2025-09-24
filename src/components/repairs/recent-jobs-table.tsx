'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RepairJob } from '@/lib/types';
import { formatDistanceToNow } from 'date-fns';
import { Eye, Phone } from 'lucide-react';
import Link from 'next/link';

interface RecentJobsTableProps {
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

const getStatusIcon = (status: RepairJob['status']) => {
  switch (status) {
    case 'Waiting for Parts':
      return '⏳';
    case 'In Progress':
      return '🔧';
    case 'Ready for Pickup':
      return '✅';
    case 'Completed':
      return '📦';
    case 'Paid':
      return '💰';
    default:
      return '❓';
  }
};

export function RecentJobsTable({ jobs }: RecentJobsTableProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Recent Jobs</CardTitle>
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/jobs">View All Jobs</Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {jobs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No recent jobs found
            </div>
          ) : (
            jobs.map((job) => (
              <div
                key={job.id}
                className="flex items-center justify-between border-b border-border pb-4 last:border-b-0 last:pb-0"
              >
                <div className="flex items-start space-x-4">
                  <div className="text-2xl">
                    {getStatusIcon(job.status)}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">{job.jobId}</span>
                      <Badge variant={getStatusColor(job.status)} className="text-xs">
                        {job.status}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      <strong>{job.customerName}</strong> • {job.deviceMake} {job.deviceModel}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {job.problemDescription.length > 50 
                        ? `${job.problemDescription.slice(0, 50)}...`
                        : job.problemDescription
                      }
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Created {formatDistanceToNow(new Date(job.createdAt), { addSuffix: true })}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2 text-right">
                  <div className="text-sm">
                    <div className="font-medium">
                      ${job.actualCost || job.estimatedCost}
                    </div>
                    {job.actualCost && job.actualCost !== job.estimatedCost && (
                      <div className="text-xs text-muted-foreground">
                        Est: ${job.estimatedCost}
                      </div>
                    )}
                  </div>
                  <div className="flex space-x-1">
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/dashboard/jobs/${job.id}`}>
                        <Eye className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Phone className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}