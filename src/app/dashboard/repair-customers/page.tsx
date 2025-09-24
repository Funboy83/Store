import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { getRepairCustomers } from '@/lib/repair-customer-integration';
import { getJobsByCustomer } from '@/lib/mock-repair-data';
import { Search, Phone, Plus, Eye, Users } from 'lucide-react';
import Link from 'next/link';

export default async function RepairCustomersPage() {
  // Get all repair customers
  const repairCustomers = await getRepairCustomers();
  
  // Get customers with their job counts
  const customers = repairCustomers.map(customer => ({
    ...customer,
    jobHistory: getJobsByCustomer(customer.id),
  }));

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Customers</h1>
          <p className="text-muted-foreground">
            Manage repair customers and view job history
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/jobs/new">
            <Plus className="h-4 w-4 mr-2" />
            New Job
          </Link>
        </Button>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center space-x-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search customers by name or phone..." 
              className="flex-1"
            />
          </div>
        </CardContent>
      </Card>

      {/* Customers Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {customers.map((customer) => (
          <Card key={customer.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{customer.name}</CardTitle>
                <Badge variant="outline">
                  {customer.jobHistory.length} jobs
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center text-sm text-muted-foreground">
                  <Phone className="h-4 w-4 mr-2" />
                  {customer.phone}
                </div>
                {customer.email && (
                  <div className="text-sm text-muted-foreground">
                    📧 {customer.email}
                  </div>
                )}
              </div>

              {/* Recent Jobs */}
              <div className="space-y-2">
                <div className="text-sm font-medium">Recent Jobs:</div>
                {customer.jobHistory.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No jobs yet</p>
                ) : (
                  <div className="space-y-1">
                    {customer.jobHistory.slice(0, 2).map((job) => (
                      <div key={job.id} className="flex items-center justify-between text-xs">
                        <span>{job.jobId} - {job.deviceMake} {job.deviceModel}</span>
                        <Badge 
                          variant={
                            job.status === 'Completed' || job.status === 'Paid' ? 'secondary' :
                            job.status === 'Ready for Pickup' ? 'default' :
                            job.status === 'In Progress' ? 'outline' : 'destructive'
                          }
                          className="text-xs"
                        >
                          {job.status}
                        </Badge>
                      </div>
                    ))}
                    {customer.jobHistory.length > 2 && (
                      <p className="text-xs text-muted-foreground">
                        +{customer.jobHistory.length - 2} more...
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex space-x-2">
                <Button variant="outline" size="sm" className="flex-1">
                  <Phone className="h-3 w-3 mr-1" />
                  Call
                </Button>
                <Button variant="outline" size="sm" className="flex-1" asChild>
                  <Link href={`/dashboard/customers/${customer.id}`}>
                    <Eye className="h-3 w-3 mr-1" />
                    View
                  </Link>
                </Button>
              </div>

              <Button className="w-full" size="sm" asChild>
                <Link href={`/dashboard/jobs/new?customerId=${customer.id}`}>
                  Create New Job
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {customers.length === 0 && (
        <Card>
          <CardContent className="pt-6 text-center py-12">
            <div className="text-muted-foreground mb-4">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No customers found</p>
              <p className="text-sm">Customers are automatically created when you create jobs</p>
            </div>
            <Button asChild>
              <Link href="/dashboard/jobs/new">
                Create First Job
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}