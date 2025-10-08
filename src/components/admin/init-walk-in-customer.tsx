'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { initializeWalkInCustomer } from '@/lib/actions/init-walk-in-customer';
import { useToast } from '@/hooks/use-toast';
import { Loader2, UserPlus } from 'lucide-react';

export function InitWalkInCustomer() {
  const [isInitializing, setIsInitializing] = useState(false);
  const { toast } = useToast();

  const handleInitialize = async () => {
    setIsInitializing(true);
    try {
      const result = await initializeWalkInCustomer();
      
      if (result.success) {
        toast({
          title: 'Success',
          description: result.message,
        });
      } else {
        toast({
          title: 'Error',
          description: result.message,
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsInitializing(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserPlus className="h-5 w-5" />
          Initialize Walk-In Customer
        </CardTitle>
        <CardDescription>
          Create the required walk-in customer record for invoice system functionality.
          This customer is used for cash sales and anonymous transactions.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="text-sm text-muted-foreground">
            <p><strong>Customer Details:</strong></p>
            <ul className="mt-2 space-y-1">
              <li>• Name: Walk-In Customer</li>
              <li>• Phone: 0000000000</li>
              <li>• Email: (empty)</li>
              <li>• ID: Aj0l1O2kJcvlF3J0uVMX</li>
            </ul>
          </div>
          
          <Button 
            onClick={handleInitialize}
            disabled={isInitializing}
            className="w-full"
          >
            {isInitializing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Initializing...
              </>
            ) : (
              <>
                <UserPlus className="mr-2 h-4 w-4" />
                Initialize Walk-In Customer
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}