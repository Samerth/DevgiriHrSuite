import { Link, useLocation } from "wouter";

interface SidebarItem {
  name: string;
  icon: string;
  href: string;
}

interface SidebarSection {
  title: string;
  items: SidebarItem[];
}

const sidebarSections: SidebarSection[] = [
  {
    title: "Main",
    items: [
      { name: "Dashboard", icon: "dashboard", href: "/" },
      { name: "Employees", icon: "people", href: "/employees" },
      { name: "Attendance", icon: "schedule", href: "/attendance" },
      { name: "Leave Management", icon: "event_busy", href: "/leaves" },
    ],
  },
  {
    title: "Admin",
    items: [
      { name: "Reports", icon: "bar_chart", href: "/reports" },
      { name: "Settings", icon: "settings", href: "/settings" },
    ],
  },
];

export default function Sidebar() {
  const [location] = useLocation();

  return (
    <aside className="desktop-sidebar fixed inset-y-0 left-0 z-10 w-60 bg-white shadow-lg overflow-y-auto">
      <div className="p-4 border-b">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center text-white font-bold">
            DG
          </div>
          <div>
            <h1 className="font-bold text-lg text-neutral">Devgiri HR</h1>
            <p className="text-muted-foreground text-xs">HR Management System</p>
          </div>
        </div>
      </div>
      
      <nav className="p-2">
        {sidebarSections.map((section) => (
          <div className="mb-4 mt-2" key={section.title}>
            <p className="text-xs text-muted-foreground uppercase px-3 mb-2">
              {section.title}
            </p>
            {section.items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`sidebar-item flex items-center px-3 py-2.5 rounded-md mb-1 ${
                  location === item.href
                    ? "active"
                    : "text-neutral hover:bg-gray-100"
                }`}
              >
                <span className="material-icons text-xl mr-3">{item.icon}</span>
                <span>{item.name}</span>
              </Link>
            ))}
          </div>
        ))}
      </nav>
      
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t">
        <div className="flex items-center">
          <div className="w-9 h-9 rounded-full bg-gray-200 mr-3">
            <div className="rounded-full w-full h-full bg-gray-300 flex items-center justify-center">
              <span className="material-icons text-gray-500">person</span>
            </div>
          </div>
          <div>
            <h4 className="text-sm font-medium">Rajiv Kumar</h4>
            <p className="text-xs text-muted-foreground">HR Administrator</p>
          </div>
          <button className="ml-auto text-muted-foreground">
            <span className="material-icons">more_vert</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
