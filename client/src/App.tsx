import { Switch, Route, useLocation, Redirect } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider, useAuth } from "@/lib/auth";
import { useEffect } from "react";

// Import the actual page components
import Dashboard from "@/pages/Dashboard";
import Employees from "@/pages/Employees";
import Attendance from "@/pages/Attendance";
import Leaves from "@/pages/Leaves";
import LeaveManagement from "@/pages/LeaveManagement";
import NotFound from "@/pages/not-found";
import { default as Training } from "@/pages/Training";
import Login from "@/pages/Login";
import TrainingFeedback from "@/pages/TrainingFeedback";

// Protected Route component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { authState } = useAuth();
  const [location, setLocation] = useLocation();

  useEffect(() => {
    if (!authState.isAuthenticated && location !== '/login') {
      setLocation('/login');
    }
  }, [authState.isAuthenticated, location, setLocation]);

  if (!authState.isAuthenticated) {
    return null;
  }

  return <>{children}</>;
};

// Layout component
const Layout = ({ children }: { children: React.ReactNode }) => {
  const [location] = useLocation();
  const { authState, logout } = useAuth();

  // Don't show layout for login page
  if (location === '/login') {
    return <>{children}</>;
  }

  if (!authState.isAuthenticated) {
    return <>{children}</>;
  }

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
              className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${location === '/dashboard' || location === '/' ? 'bg-primary/10 text-primary' : 'text-gray-600 hover:bg-gray-50'}`}
            >
              <span className="mr-3">📊</span>
              Dashboard
            </a>
            <a 
              href="/employees" 
              className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${location === '/employees' ? 'bg-primary/10 text-primary' : 'text-gray-600 hover:bg-gray-50'}`}
            >
              <span className="mr-3">👥</span>
              Employees
            </a>
            <a 
              href="/attendance" 
              className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${location === '/attendance' ? 'bg-primary/10 text-primary' : 'text-gray-600 hover:bg-gray-50'}`}
            >
              <span className="mr-3">⏰</span>
              Attendance
            </a>
            <a 
              href="/leaves" 
              className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${location === '/leaves' ? 'bg-primary/10 text-primary' : 'text-gray-600 hover:bg-gray-50'}`}
            >
              <span className="mr-3">📅</span>
              Leave Management
            </a>
            <a 
              href="/training" 
              className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${location === '/training' ? 'bg-primary/10 text-primary' : 'text-gray-600 hover:bg-gray-50'}`}
            >
              <span className="mr-3">📚</span>
              Training
            </a>
          </nav>
          <div className="flex-shrink-0 flex border-t p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <span className="inline-block h-8 w-8 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center">
                  {authState.user?.firstName?.[0]}{authState.user?.lastName?.[0]}
                </span>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-700">
                  {authState.user?.firstName} {authState.user?.lastName}
                </p>
                <button
                  onClick={() => logout()}
                  className="text-xs font-medium text-gray-500 hover:text-gray-700"
                >
                  Sign out
                </button>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile & Content area */}
      <div className="flex flex-col w-0 flex-1 overflow-hidden">
        <main className="flex-1 relative z-0 overflow-y-auto focus:outline-none">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              <h1 className="text-2xl font-semibold text-gray-900">
                {location === '/' ? 'Dashboard' : 
                 location.charAt(1).toUpperCase() + location.slice(2).replace('-', ' ')}
              </h1>
            </div>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 mt-4">
              {children}
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
          <a href="/training" className={`flex flex-col items-center px-3 py-1 ${location === '/training' ? 'text-primary' : 'text-gray-500'}`}>
            <span className="text-xl">📚</span>
            <span className="text-xs">Training</span>
          </a>
        </div>
      </div>
    </div>
  );
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Layout>
          <Switch>
            <Route path="/login" component={Login} />
            <Route path="/">
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            </Route>
            <Route path="/dashboard">
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            </Route>
            <Route path="/employees">
              <ProtectedRoute>
                <Employees />
              </ProtectedRoute>
            </Route>
            <Route path="/attendance">
              <ProtectedRoute>
                <Attendance />
              </ProtectedRoute>
            </Route>
            <Route path="/leaves">
              <ProtectedRoute>
                <Leaves />
              </ProtectedRoute>
            </Route>
            <Route path="/leave-management">
              <ProtectedRoute>
                <LeaveManagement />
              </ProtectedRoute>
            </Route>
            <Route path="/training">
              <ProtectedRoute>
                <Training />
              </ProtectedRoute>
            </Route>
            <Route path="/training-feedback/:id" component={TrainingFeedback} />
            <Route component={NotFound} />
          </Switch>
        </Layout>
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;