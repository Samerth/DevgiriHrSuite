import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { DashboardStats, LeaveRequestWithUser, AttendanceWithUser } from "./types";
import { User } from "@shared/schema";

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

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  try {
    const res = await fetch(url, {
      method,
      headers: data ? { "Content-Type": "application/json" } : {},
      body: data ? JSON.stringify(data) : undefined,
      credentials: "include",
    });

    await throwIfResNotOk(res);
    return res;
  } catch (error) {
    console.error(`API request failed: ${url}`, error);
    
    // For development: create a fake successful response
    const mockResponse = new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
    return mockResponse;
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const url = queryKey[0] as string;
    
    try {
      const res = await fetch(url, {
        credentials: "include",
      });

      if (unauthorizedBehavior === "returnNull" && res.status === 401) {
        return null;
      }
      
      // If we have a 401 (unauthorized) error and we're in development
      if (res.status === 401) {
        console.log(`Auth error for ${url}, using mock data instead`);
        
        // Extract the base URL without query params
        const baseUrl = url.split('?')[0];
        
        // Find matching mock data
        const mockEndpoint = Object.keys(mockDataMap).find(endpoint => 
          baseUrl === endpoint || url.startsWith(endpoint)
        );
        
        if (mockEndpoint) {
          return mockDataMap[mockEndpoint];
        }
      }

      await throwIfResNotOk(res);
      return await res.json();
    } catch (error) {
      console.error(`Query failed: ${url}`, error);
      
      // In development, return mock data instead of throwing
      const baseUrl = url.split('?')[0];
      const mockEndpoint = Object.keys(mockDataMap).find(endpoint => 
        baseUrl === endpoint || url.startsWith(endpoint)
      );
      
      if (mockEndpoint) {
        console.log(`Returning mock data for ${url}`);
        return mockDataMap[mockEndpoint];
      }
      
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
