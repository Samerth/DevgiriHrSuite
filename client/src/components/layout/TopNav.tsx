import { useLocation } from "wouter";

interface TopNavProps {
  onMenuToggle: () => void;
}

export default function TopNav({ onMenuToggle }: TopNavProps) {
  const [location] = useLocation();
  
  const getPageTitle = () => {
    switch (location) {
      case "/":
        return "Dashboard";
      case "/employees":
        return "Employees";
      case "/attendance":
        return "Attendance";
      case "/leaves":
        return "Leave Management";
      case "/reports":
        return "Reports";
      case "/settings":
        return "Settings";
      default:
        return "Dashboard";
    }
  };
  
  return (
    <header className="bg-white shadow-sm py-3 px-6 flex items-center justify-between sticky top-0 z-10">
      <div className="flex items-center">
        <button 
          className="mr-4 lg:hidden text-neutral"
          onClick={onMenuToggle}
        >
          <span className="material-icons">menu</span>
        </button>
        <h2 className="text-lg font-semibold text-neutral">{getPageTitle()}</h2>
      </div>
      
      <div className="flex items-center space-x-3">
        <div className="relative">
          <input 
            type="text" 
            placeholder="Search..." 
            className="border border-gray-200 rounded-lg py-2 pl-9 pr-4 text-sm w-48 lg:w-64 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary" 
          />
          <span className="material-icons absolute left-2 top-2 text-muted-foreground">search</span>
        </div>
        
        <div className="relative">
          <button className="relative p-1 rounded-full text-neutral hover:bg-gray-100">
            <span className="material-icons">notifications</span>
            <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>
        </div>
        
        <div className="w-8 h-8 rounded-full bg-gray-200 lg:hidden">
          <div className="rounded-full w-full h-full bg-gray-300 flex items-center justify-center">
            <span className="material-icons text-gray-500">person</span>
          </div>
        </div>
      </div>
    </header>
  );
}
