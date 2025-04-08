import { Switch, Route } from "wouter";
import { lazy, Suspense } from "react";
import { useLocation } from "wouter";

// Simple layout component
const Layout = ({ children }: { children: React.ReactNode }) => {
  const [location] = useLocation();
  
  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Sidebar */}
      <aside className="hidden md:flex md:w-64 md:flex-col">
        <div className="flex flex-col flex-grow bg-white pt-5 pb-4 overflow-y-auto border-r">
          <div className="flex items-center flex-shrink-0 px-4 mb-5">
            <div className="h-8 w-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold mr-2">
              DG
            </div>
            <span className="text-xl font-semibold">Devgiri HR</span>
          </div>
          <nav className="mt-5 flex-1 px-2 space-y-1">
            <a 
              href="/dashboard" 
              className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${location === '/dashboard' || location === '/' ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50'}`}
            >
              <span className="mr-3">📊</span>
              Dashboard
            </a>
            <a 
              href="/employees" 
              className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${location === '/employees' ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50'}`}
            >
              <span className="mr-3">👥</span>
              Employees
            </a>
            <a 
              href="/attendance" 
              className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${location === '/attendance' ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50'}`}
            >
              <span className="mr-3">⏰</span>
              Attendance
            </a>
            <a 
              href="/leaves" 
              className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${location === '/leaves' ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50'}`}
            >
              <span className="mr-3">📅</span>
              Leave Management
            </a>
          </nav>
        </div>
      </aside>

      {/* Mobile & Content area */}
      <div className="flex flex-col w-0 flex-1 overflow-hidden">
        <main className="flex-1 relative z-0 overflow-y-auto focus:outline-none">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              <h1 className="text-2xl font-semibold text-gray-900">
                {location === '/' ? 'Dashboard' : 
                 location.charAt(1).toUpperCase() + location.slice(2)}
              </h1>
            </div>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 mt-4">
              {children}
            </div>
          </div>
        </main>

        {/* Mobile Nav */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t flex justify-around py-2">
          <a href="/dashboard" className={`flex flex-col items-center px-3 py-1 ${location === '/dashboard' || location === '/' ? 'text-blue-600' : 'text-gray-500'}`}>
            <span className="text-xl">📊</span>
            <span className="text-xs">Dashboard</span>
          </a>
          <a href="/employees" className={`flex flex-col items-center px-3 py-1 ${location === '/employees' ? 'text-blue-600' : 'text-gray-500'}`}>
            <span className="text-xl">👥</span>
            <span className="text-xs">Employees</span>
          </a>
          <a href="/attendance" className={`flex flex-col items-center px-3 py-1 ${location === '/attendance' ? 'text-blue-600' : 'text-gray-500'}`}>
            <span className="text-xl">⏰</span>
            <span className="text-xs">Attendance</span>
          </a>
          <a href="/leaves" className={`flex flex-col items-center px-3 py-1 ${location === '/leaves' ? 'text-blue-600' : 'text-gray-500'}`}>
            <span className="text-xl">📅</span>
            <span className="text-xs">Leaves</span>
          </a>
        </div>
      </div>
    </div>
  );
};

// Simplified page components
const Dashboard = () => (
  <div className="bg-white shadow rounded-lg p-6">
    <h2 className="text-lg font-medium mb-4">Welcome to Devgiri HR Management System</h2>
    <p>This is the dashboard page. Soon it will be filled with statistics and reports.</p>
  </div>
);

const Employees = () => (
  <div className="bg-white shadow rounded-lg p-6">
    <h2 className="text-lg font-medium mb-4">Employee Management</h2>
    <p>Here you will be able to add, edit, and manage employee records.</p>
  </div>
);

const Attendance = () => (
  <div className="bg-white shadow rounded-lg p-6">
    <h2 className="text-lg font-medium mb-4">Attendance Tracking</h2>
    <p>Track employee attendance, check-ins, and check-outs.</p>
  </div>
);

const Leaves = () => (
  <div className="bg-white shadow rounded-lg p-6">
    <h2 className="text-lg font-medium mb-4">Leave Management</h2>
    <p>Manage employee leave requests and approvals.</p>
  </div>
);

const NotFound = () => (
  <div className="bg-white shadow rounded-lg p-6 text-center">
    <h2 className="text-lg font-medium mb-4">404 - Page Not Found</h2>
    <p>The page you are looking for doesn't exist.</p>
    <a href="/" className="text-blue-600 hover:underline mt-4 inline-block">Return to Dashboard</a>
  </div>
);

function App() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/employees" component={Employees} />
        <Route path="/attendance" component={Attendance} />
        <Route path="/leaves" component={Leaves} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

export default App;