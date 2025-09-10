import { Smartphone } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LogoProps {
    isCollapsed: boolean;
}

export function Logo({ isCollapsed }: LogoProps) {
  return (
    <div className={cn("flex items-center gap-2 font-bold text-lg", isCollapsed ? 'justify-center' : '')}>
      <div className="bg-indigo-500 text-white p-2 rounded-lg">
        <Smartphone className="h-6 w-6" />
      </div>
      {!isCollapsed && (
        <span className="text-xl font-bold text-gray-200">CellSmart</span>
      )}
    </div>
  );
}
