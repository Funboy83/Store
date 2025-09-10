import { Smartphone } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LogoProps {
    isCollapsed: boolean;
}

export function Logo({ isCollapsed }: LogoProps) {
  return (
    <div className="flex items-center gap-2 font-bold text-lg text-primary">
      <div className="bg-primary text-primary-foreground p-2 rounded-lg">
        <Smartphone className="h-6 w-6" />
      </div>
      {!isCollapsed && (
        <span className="text-xl font-headline tracking-tight text-foreground">CellSmart</span>
      )}
    </div>
  );
}
