'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RepairJob } from '@/lib/types';
import { formatDistanceToNow } from 'date-fns';
import { Phone, FileText, CheckCircle } from 'lucide-react';
import Link from 'next/link';

interface PendingPickupsProps {
  jobs: RepairJob[];
}

export function PendingPickups({ jobs }: PendingPickupsProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <span>Ready for Pickup</span>
          </CardTitle>
          <Badge variant="secondary" className="text-sm">
            {jobs.length} waiting
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {jobs.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              <CheckCircle className="h-12 w-12 mx-auto mb-2 text-muted-foreground/50" />
              <p>No jobs ready for pickup</p>
            </div>
          ) : (
            jobs.map((job) => (
              <div
                key={job.id}
                className="flex items-center justify-between p-4 border border-green-200 bg-green-50 rounded-lg"
              >
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-green-800">{job.jobId}</span>
                    <Badge variant="outline" className="text-green-700 border-green-300">
                      Ready
                    </Badge>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="text-sm font-medium text-green-900">
                      {job.customerName}
                    </div>
                    <div className="text-sm text-green-700">
                      📱 {job.deviceMake} {job.deviceModel}
                    </div>
                    <div className="text-xs text-green-600">
                      Ready {formatDistanceToNow(new Date(job.updatedAt), { addSuffix: true })}
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-col items-end space-y-2">
                  <div className="text-lg font-bold text-green-800">
                    ${job.actualCost || job.estimatedCost}
                  </div>
                  
                  <div className="flex space-x-1">
                    <Button variant="outline" size="sm" className="text-green-700 border-green-300">
                      <Phone className="h-3 w-3 mr-1" />
                      Call
                    </Button>
                    
                    {job.invoiceGenerated ? (
                      <Button variant="outline" size="sm" className="text-green-700 border-green-300" asChild>
                        <Link href={`/dashboard/jobs/${job.id}/invoice`}>
                          <FileText className="h-3 w-3 mr-1" />
                          Invoice
                        </Link>
                      </Button>
                    ) : (
                      <Button variant="outline" size="sm" className="text-green-700 border-green-300" asChild>
                        <Link href={`/dashboard/jobs/${job.id}/generate-invoice`}>
                          <FileText className="h-3 w-3 mr-1" />
                          Generate
                        </Link>
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
        
        {jobs.length > 0 && (
          <div className="mt-4 pt-4 border-t">
            <Button className="w-full" variant="outline" asChild>
              <Link href="/dashboard/jobs?status=ready-for-pickup">
                View All Ready for Pickup
              </Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}