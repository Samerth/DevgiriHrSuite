import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { DashboardStats, LeaveRequestWithUser, AttendanceWithUser } from "./types";
import { User } from "@shared/schema";
import { supabase } from "./supabase";

// Mock data for development purposes (to avoid 401 errors)
const mockDashboardStats: DashboardStats = {
  totalEmployees: 42, 
  presentToday: 36,
  onLeave: 3,
  pendingRequests: 5
};

// Default mock employees
const mockEmployees: User[] = [
  {
    id: 1,
    username: "john.doe",
    password: "password123",
    firstName: "John",
    lastName: "Doe",
    email: "john.doe@example.com",
    role: "admin",
    position: "HR Manager",
    department: "hr",
    joinDate: new Date("2020-01-15"),
    phoneNumber: "+1234567890",
    address: "123 Main St, City",
    createdAt: new Date("2020-01-10"),
    updatedAt: new Date("2023-05-20"),
  },
  {
    id: 2,
    username: "jane.smith",
    password: "password123",
    firstName: "Jane",
    lastName: "Smith",
    email: "jane.smith@example.com",
    role: "employee",
    position: "Software Engineer",
    department: "engineering",
    joinDate: new Date("2021-03-10"),
    phoneNumber: "+0987654321",
    address: "456 Oak Ave, Town",
    createdAt: new Date("2021-03-05"),
    updatedAt: new Date("2023-04-15"),
  }
];

// Mock attendance data
const mockTodayAttendance: AttendanceWithUser[] = [
  {
    id: 1,
    userId: 1,
    date: new Date(),
    checkInTime: "09:05",
    checkOutTime: "18:00",
    status: "present",
    method: "qr_code",
    notes: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    user: mockEmployees[0],
  },
  {
    id: 2,
    userId: 2,
    date: new Date(),
    checkInTime: "09:30",
    checkOutTime: "17:45",
    status: "late",
    method: "manual",
    notes: "Traffic delay",
    createdAt: new Date(),
    updatedAt: new Date(),
    user: mockEmployees[1],
  }
];

// Mock leave requests
const mockPendingLeaves: LeaveRequestWithUser[] = [
  {
    id: 1,
    userId: 2,
    type: "sick",
    startDate: new Date("2025-04-10"),
    endDate: new Date("2025-04-12"),
    reason: "Doctor-recommended rest due to flu symptoms",
    status: "pending",
    approvedById: null,
    notes: null,
    createdAt: new Date("2025-04-08"),
    updatedAt: new Date("2025-04-08"),
    user: mockEmployees[1],
  }
];

// Map endpoints to mock data
const mockDataMap: Record<string, any> = {
  '/api/dashboard/stats': mockDashboardStats,
  '/api/attendance/today': mockTodayAttendance,
  '/api/leave-requests/pending': mockPendingLeaves,
  '/api/users': mockEmployees,
  '/api/users/search': mockEmployees,
};

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

// Create a token provider that can be set from the auth context
let tokenProvider: (() => string | null) | null = null;

export const setTokenProvider = (provider: () => string | null) => {
  tokenProvider = provider;
};

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  // Get the session token using the provider
  const token = tokenProvider?.() || null;
  
  // Prepare headers with authorization if token exists
  const headers: Record<string, string> = {
    "Content-Type": "application/json"
  };
  
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  
  const res = await fetch(url, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
    credentials: 'include'
  });

  if (res.status === 401) {
    console.log('Token expired, attempting to refresh...');
    // Try to refresh the session before redirecting
    const { data: { session }, error } = await supabase.auth.refreshSession();
    
    if (error || !session) {
      console.error('Failed to refresh session:', error);
      // If refresh fails, clear session and redirect
      await supabase.auth.signOut();
      window.location.href = "/login";
      throw new Error("Unauthorized");
    }
    
    console.log('Session refreshed successfully');
    // Retry the request with the new token
    headers["Authorization"] = `Bearer ${session.access_token}`;
    const retryRes = await fetch(url, {
      method,
      headers,
      body: data ? JSON.stringify(data) : undefined,
      credentials: 'include'
    });
    
    if (retryRes.status === 401) {
      console.error('Retry failed with 401');
      // If retry still fails, clear session and redirect
      await supabase.auth.signOut();
      window.location.href = "/login";
      throw new Error("Unauthorized");
    }
    
    return retryRes;
  }

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const url = queryKey[0] as string;
    
    try {
      // Get the session token using the provider
      const token = tokenProvider?.() || null;
      
      // Prepare headers with authorization if token exists
      const headers: Record<string, string> = {};
      
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
      
      const res = await fetch(url, {
        headers,
        credentials: 'include'
      });

      if (res.status === 401) {
        if (unauthorizedBehavior === "returnNull") {
          return null;
        }
        
        // Try to refresh the session before redirecting
        const { data: { session }, error } = await supabase.auth.refreshSession();
        
        if (error || !session) {
          // If refresh fails, clear session and redirect
          await supabase.auth.signOut();
          window.location.href = "/login";
          throw new Error("Unauthorized");
        }
        
        // Retry the request with the new token
        headers["Authorization"] = `Bearer ${session.access_token}`;
        const retryRes = await fetch(url, {
          headers,
          credentials: 'include'
        });
        
        if (retryRes.status === 401) {
          // If retry still fails, clear session and redirect
          await supabase.auth.signOut();
          window.location.href = "/login";
          throw new Error("Unauthorized");
        }
        
        return await retryRes.json();
      }

      await throwIfResNotOk(res);
      return await res.json();
    } catch (error) {
      console.error("API request failed:", error);
      throw error;
    }
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
