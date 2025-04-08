import { Link, useLocation } from "wouter";

interface NavItem {
  name: string;
  icon: string;
  href: string;
}

const navItems: NavItem[] = [
  { name: "Dashboard", icon: "dashboard", href: "/" },
  { name: "Employees", icon: "people", href: "/employees" },
  { name: "Attendance", icon: "schedule", href: "/attendance" },
  { name: "Leaves", icon: "event_busy", href: "/leaves" },
  { name: "More", icon: "more_horiz", href: "/settings" },
];

export default function MobileNav() {
  const [location] = useLocation();
  
  return (
    <div className="mobile-nav fixed bottom-0 left-0 right-0 bg-white border-t flex items-center justify-around py-2 z-20">
      {navItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={`flex flex-col items-center px-3 py-1 ${
            location === item.href ? "text-primary" : "text-muted-foreground"
          }`}
        >
          <span className="material-icons text-lg">{item.icon}</span>
          <span className="text-xs mt-1">{item.name}</span>
        </Link>
      ))}
    </div>
  );
}
