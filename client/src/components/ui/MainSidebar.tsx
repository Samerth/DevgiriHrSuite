import { useLocation } from 'wouter';
import { useAuth } from '@/lib/auth';
import { LucideIcon } from 'lucide-react';
import { 
  LayoutDashboard, 
  Users, 
  Clock, 
  CalendarX, 
  BarChart3, 
  Settings, 
  MoreVertical,
  LogOut
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

interface NavItemProps {
  href: string;
  icon: LucideIcon;
  label: string;
  isActive?: boolean;
}

function NavItem({ href, icon: Icon, label, isActive }: NavItemProps) {
  return (
    <a 
      href={href} 
      className={cn(
        "flex items-center px-3 py-2.5 rounded-md mb-1 transition-colors", 
        isActive 
          ? "bg-primary bg-opacity-10 text-primary border-l-3 border-primary" 
          : "text-neutral-700 hover:bg-gray-100"
      )}
    >
      <Icon className="h-5 w-5 mr-3" />
      <span>{label}</span>
    </a>
  );
}

export default function MainSidebar() {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  
  const currentPath = location === '/' ? '/dashboard' : location;
  
  const navItems = [
    { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { href: '/employees', icon: Users, label: 'Employees' },
    { href: '/attendance', icon: Clock, label: 'Attendance' },
    { href: '/leaves', icon: CalendarX, label: 'Leave Management' },
    { href: '/reports', icon: BarChart3, label: 'Reports' },
    { href: '/settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <aside className="fixed inset-y-0 left-0 z-10 w-60 bg-white shadow-lg overflow-y-auto hidden md:block">
      <div className="p-4 border-b">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center text-white font-bold">
            DG
          </div>
          <div>
            <h1 className="font-bold text-lg text-neutral-800">Devgiri HR</h1>
            <p className="text-neutral-500 text-xs">HR Management System</p>
          </div>
        </div>
      </div>
      
      <nav className="p-2">
        <div className="mb-4 mt-2">
          <p className="text-xs text-neutral-500 uppercase px-3 mb-2">Main</p>
          {navItems.slice(0, 4).map((item) => (
            <NavItem
              key={item.href}
              href={item.href}
              icon={item.icon}
              label={item.label}
              isActive={currentPath === item.href}
            />
          ))}
        </div>
        
        <div className="mb-4">
          <p className="text-xs text-neutral-500 uppercase px-3 mb-2">Admin</p>
          {navItems.slice(4).map((item) => (
            <NavItem
              key={item.href}
              icon={item.icon}
              label={item.label}
              href={item.href}
              isActive={currentPath === item.href}
            />
          ))}
        </div>
      </nav>
      
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t">
        <div className="flex items-center">
          <Avatar className="w-9 h-9 mr-3">
            <AvatarImage src="" />
            <AvatarFallback className="bg-gray-200">
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </AvatarFallback>
          </Avatar>
          <div>
            <h4 className="text-sm font-medium">{user?.firstName} {user?.lastName}</h4>
            <p className="text-xs text-neutral-500">{user?.position}</p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="ml-auto">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => logout()}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Logout</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </aside>
  );
}
