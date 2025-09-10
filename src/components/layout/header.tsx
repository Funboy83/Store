import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Menu } from 'lucide-react';

interface HeaderProps {
  onToggleSidebar: () => void;
}

export function Header({ onToggleSidebar }: HeaderProps) {
  return (
    <header className="bg-card shadow-sm h-20 flex items-center justify-between px-6 sm:px-10 flex-shrink-0">
      <Button
        variant="ghost"
        size="icon"
        onClick={onToggleSidebar}
        className="text-foreground/70 hover:text-foreground"
      >
        <Menu className="h-7 w-7" />
        <span className="sr-only">Toggle Sidebar</span>
      </Button>
      <div className="flex items-center gap-4">
        <span className="font-semibold text-foreground/80 hidden sm:inline">Welcome, Admin!</span>
         <Avatar>
            <AvatarImage src="https://picsum.photos/seed/user/40/40" />
            <AvatarFallback>AD</AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}
