
import Link from 'next/link';
import { Building, Store } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export default function DashboardPage() {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="flex gap-8">
        <Link href="/dashboard/wholesale">
          <Card className="w-64 h-64 flex flex-col items-center justify-center cursor-pointer hover:shadow-lg hover:border-primary transition-all group">
            <CardContent className="flex flex-col items-center justify-center text-center p-6">
              <Building className="w-20 h-20 mb-4 text-gray-500 group-hover:text-primary transition-colors" />
              <h2 className="text-2xl font-bold text-gray-800">Wholesale</h2>
              <p className="text-sm text-gray-500 mt-1">Manage bulk orders and partners.</p>
            </CardContent>
          </Card>
        </Link>
        <div className="cursor-not-allowed">
            <Card className="w-64 h-64 flex flex-col items-center justify-center bg-gray-50 text-gray-400">
                <CardContent className="flex flex-col items-center justify-center text-center p-6">
                <Store className="w-20 h-20 mb-4" />
                <h2 className="text-2xl font-bold">Retail</h2>
                <p className="text-sm mt-1">Coming Soon</p>
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}
