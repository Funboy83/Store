import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Menu, LogOut } from 'lucide-react';
// import { useAuth } from '@/lib/auth-context'; // Commented out for development

interface HeaderProps {
  onToggleSidebar: () => void;
}

export function Header({ onToggleSidebar }: HeaderProps) {
  // const { user, logout } = useAuth(); // Commented out for development
  
  // Mock user data for development
  const mockUser = {
    displayName: 'John Doe',
    email: 'john@example.com',
    photoURL: null
  };

  const handleLogout = () => {
    // Mock logout for development
    alert('Logout clicked - functionality bypassed for development');
  };

  return (
    <header className="bg-white shadow-sm h-20 flex items-center justify-between px-6 flex-shrink-0">
      <Button
        variant="ghost"
        size="icon"
        onClick={onToggleSidebar}
        className="text-gray-600 hover:text-gray-800"
      >
        <Menu className="h-7 w-7" />
        <span className="sr-only">Toggle Sidebar</span>
      </Button>
      <div className="flex items-center gap-4">
        <span className="font-semibold text-slate-700 hidden sm:inline">
          Welcome, {mockUser?.displayName || mockUser?.email || 'Developer'}!
        </span>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleLogout}
          className="text-gray-600 hover:text-gray-800"
          title="Logout (Development Mode)"
        >
          <LogOut className="h-5 w-5" />
          <span className="sr-only">Logout</span>
        </Button>
         <Avatar>
            <AvatarImage src={mockUser?.photoURL || "https://picsum.photos/seed/user/40/40"} />
            <AvatarFallback>
              {mockUser?.displayName?.charAt(0) || mockUser?.email?.charAt(0) || 'D'}
            </AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}
