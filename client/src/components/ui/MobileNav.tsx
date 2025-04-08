import { useLocation } from 'wouter';
import { 
  LayoutDashboard, 
  Users, 
  Clock, 
  CalendarX, 
  MoreHorizontal 
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function MobileNav() {
  const [location] = useLocation();
  const currentPath = location === '/' ? '/dashboard' : location;

  const navItems = [
    { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { href: '/employees', icon: Users, label: 'Employees' },
    { href: '/attendance', icon: Clock, label: 'Attendance' },
    { href: '/leaves', icon: CalendarX, label: 'Leaves' },
    { href: '#more', icon: MoreHorizontal, label: 'More' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t flex items-center justify-around py-2 z-20 md:hidden">
      {navItems.map((item) => (
        <a
          key={item.href}
          href={item.href}
          className={cn(
            "flex flex-col items-center px-3 py-1",
            currentPath === item.href ? "text-primary" : "text-neutral-500"
          )}
        >
          <item.icon className="h-5 w-5" />
          <span className="text-xs mt-1">{item.label}</span>
        </a>
      ))}
    </div>
  );
}
