'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { linkUnlinkedRepairJobs } from '@/lib/actions/customers';
import { Link } from 'lucide-react';

export function LinkJobsButton() {
  const [isLinking, setIsLinking] = useState(false);
  const { toast } = useToast();

  const handleLinkJobs = async () => {
    setIsLinking(true);
    
    try {
      const result = await linkUnlinkedRepairJobs();
      
      if (result.success) {
        toast({
          title: 'Success!',
          description: `Linked ${result.linkedCount} repair jobs to customers.`,
        });
        
        // Refresh the page to see updated counts
        window.location.reload();
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to link jobs.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error linking jobs:', error);
      toast({
        title: 'Error',
        description: 'Failed to link jobs.',
        variant: 'destructive',
      });
    } finally {
      setIsLinking(false);
    }
  };

  return (
    <Button 
      onClick={handleLinkJobs}
      disabled={isLinking}
      variant="outline"
      size="sm"
    >
      <Link className="h-4 w-4 mr-2" />
      {isLinking ? 'Linking...' : 'Link Unlinked Jobs'}
    </Button>
  );
}