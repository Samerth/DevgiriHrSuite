import { ReactNode } from 'react';
import { useLocation } from 'wouter';

interface MainLayoutProps {
  children: ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const [location] = useLocation();
  
  const getPageTitle = () => {
    const path = location.split('/')[1] || 'dashboard';
    return path.charAt(0).toUpperCase() + path.slice(1);
  };
  
  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Sidebar */}
      <aside className="hidden md:flex md:w-64 md:flex-col">
        <div className="flex flex-col flex-grow bg-white pt-5 pb-4 overflow-y-auto border-r">
          <div className="flex items-center flex-shrink-0 px-4 mb-5">
            <div className="h-8 w-8 rounded-full bg-primary text-white flex items-center justify-center font-bold mr-2">
              DG
            </div>
            <span className="text-xl font-semibold">Devgiri HR</span>
          </div>
          <nav className="mt-5 flex-1 px-2 space-y-1">
            <a 
              href="/dashboard" 
              className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${location === '/dashboard' || location === '/' ? 'bg-primary bg-opacity-10 text-primary' : 'text-gray-600 hover:bg-gray-50'}`}
            >
              <span className="mr-3">📊</span>
              Dashboard
            </a>
            <a 
              href="/employees" 
              className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${location === '/employees' ? 'bg-primary bg-opacity-10 text-primary' : 'text-gray-600 hover:bg-gray-50'}`}
            >
              <span className="mr-3">👥</span>
              Employees
            </a>
            <a 
              href="/attendance" 
              className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${location === '/attendance' ? 'bg-primary bg-opacity-10 text-primary' : 'text-gray-600 hover:bg-gray-50'}`}
            >
              <span className="mr-3">⏰</span>
              Attendance
            </a>
            <a 
              href="/leaves" 
              className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${location === '/leaves' ? 'bg-primary bg-opacity-10 text-primary' : 'text-gray-600 hover:bg-gray-50'}`}
            >
              <span className="mr-3">📅</span>
              Leave Management
            </a>
            <a 
              href="/reports" 
              className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${location === '/reports' ? 'bg-primary bg-opacity-10 text-primary' : 'text-gray-600 hover:bg-gray-50'}`}
            >
              <span className="mr-3">📈</span>
              Reports
            </a>
            <a 
              href="/settings" 
              className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${location === '/settings' ? 'bg-primary bg-opacity-10 text-primary' : 'text-gray-600 hover:bg-gray-50'}`}
            >
              <span className="mr-3">⚙️</span>
              Settings
            </a>
          </nav>
        </div>
      </aside>

      {/* Mobile & Content area */}
      <div className="flex flex-col w-0 flex-1 overflow-hidden">
        <div className="md:hidden pl-1 pt-1 sm:pl-3 sm:pt-3 flex items-center">
          <button 
            className="-ml-0.5 -mt-0.5 h-12 w-12 inline-flex items-center justify-center rounded-md text-gray-500 hover:text-gray-900 focus:outline-none"
          >
            <span className="sr-only">Open sidebar</span>
            <span className="text-xl">☰</span>
          </button>
          <h1 className="ml-2 text-xl font-semibold text-gray-900">{getPageTitle()}</h1>
        </div>

        <main className="flex-1 relative z-0 overflow-y-auto focus:outline-none">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              <h1 className="text-2xl font-semibold text-gray-900 hidden md:block">{getPageTitle()}</h1>
            </div>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              <div className="py-4">
                {children}
              </div>
            </div>
          </div>
        </main>

        {/* Mobile Nav */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t flex justify-around py-2">
          <a href="/dashboard" className={`flex flex-col items-center px-3 py-1 ${location === '/dashboard' || location === '/' ? 'text-primary' : 'text-gray-500'}`}>
            <span className="text-xl">📊</span>
            <span className="text-xs">Dashboard</span>
          </a>
          <a href="/employees" className={`flex flex-col items-center px-3 py-1 ${location === '/employees' ? 'text-primary' : 'text-gray-500'}`}>
            <span className="text-xl">👥</span>
            <span className="text-xs">Employees</span>
          </a>
          <a href="/attendance" className={`flex flex-col items-center px-3 py-1 ${location === '/attendance' ? 'text-primary' : 'text-gray-500'}`}>
            <span className="text-xl">⏰</span>
            <span className="text-xs">Attendance</span>
          </a>
          <a href="/leaves" className={`flex flex-col items-center px-3 py-1 ${location === '/leaves' ? 'text-primary' : 'text-gray-500'}`}>
            <span className="text-xl">📅</span>
            <span className="text-xs">Leaves</span>
          </a>
          <a href="#more" className={`flex flex-col items-center px-3 py-1 text-gray-500`}>
            <span className="text-xl">⋯</span>
            <span className="text-xs">More</span>
          </a>
        </div>
      </div>
    </div>
  );
}