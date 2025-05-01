import { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Search, UserPlus, Upload, Database, Trash2 } from "lucide-react";
import EmployeeTable from "@/components/employees/EmployeeTable";
import AddEmployeeModal from "@/components/employees/AddEmployeeModal";
import EmployeeProfile from "@/components/employees/EmployeeProfile";
import BulkImportForm from "@/components/employees/BulkImportForm";
import { User } from "@shared/schema";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

// Default employee data for development
const defaultEmployees: User[] = [
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
  },
  {
    id: 3,
    username: "bob.johnson",
    password: "password123",
    firstName: "Bob",
    lastName: "Johnson",
    email: "bob.johnson@example.com",
    role: "manager",
    position: "Marketing Director",
    department: "marketing",
    joinDate: new Date("2019-06-22"),
    phoneNumber: "+1122334455",
    address: "789 Pine St, Village",
    createdAt: new Date("2019-06-20"),
    updatedAt: new Date("2023-01-10"),
  },
  {
    id: 4,
    username: "alice.williams",
    password: "password123",
    firstName: "Alice",
    lastName: "Williams",
    email: "alice.williams@example.com",
    role: "employee",
    position: "Financial Analyst",
    department: "finance",
    joinDate: new Date("2022-01-05"),
    phoneNumber: "+5566778899",
    address: "101 Elm St, County",
    createdAt: new Date("2022-01-03"),
    updatedAt: new Date("2023-03-22"),
  },
  {
    id: 5,
    username: "charlie.brown",
    password: "password123",
    firstName: "Charlie",
    lastName: "Brown",
    email: "charlie.brown@example.com",
    role: "employee",
    position: "UX Designer",
    department: "design",
    joinDate: new Date("2021-09-15"),
    phoneNumber: "+1029384756",
    address: "202 Maple Dr, District",
    createdAt: new Date("2021-09-10"),
    updatedAt: new Date("2023-02-28"),
  }
];

export default function Employees() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [department, setDepartment] = useState("");
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [bulkImportOpen, setBulkImportOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState("all");
  // State to store locally added employees
  const [localEmployees, setLocalEmployees] = useState<User[]>([]);

  // Separate state to track if we're using API data or local data
  const [usingLocalData, setUsingLocalData] = useState(false);
  
  const { data: apiUsers, isLoading, isError } = useQuery<User[]>({
    queryKey: ['/api/users', searchQuery, department, localEmployees.length],
    queryFn: async () => {
      try {
        const url = `/api/users/search?q=${encodeURIComponent(searchQuery)}${department && department !== "all" ? `&department=${encodeURIComponent(department)}` : ''}`;
        const response = await apiRequest('GET', url);
        if (!response.ok) throw new Error('Failed to fetch employees');
        setUsingLocalData(false);
        return response.json();
      } catch (error) {
        console.error("Error fetching employees:", error);
        setUsingLocalData(true);
        throw error;
      }
    },
  });
  
  // Combine and filter employees for display
  const filteredLocalEmployees = useMemo(() => {
    // Combine default employees with locally added employees
    const combinedEmployees = [...defaultEmployees, ...localEmployees];
    
    // Filter based on search and department
    return combinedEmployees.filter(employee => {
      const matchesSearch = searchQuery === "" || 
        `${employee.firstName} ${employee.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
        employee.email?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesDepartment = department === "all" || employee.department === department;
      
      return matchesSearch && matchesDepartment;
    });
  }, [searchQuery, department, localEmployees]);
  
  // Use API data if available, otherwise use local data
  const users = useMemo(() => {
    let filteredUsers = isError || usingLocalData ? filteredLocalEmployees : (apiUsers || filteredLocalEmployees);
    
    // Filter based on active tab
    if (activeTab === 'active') {
      filteredUsers = filteredUsers.filter(user => user.isActive);
    } else if (activeTab === 'inactive') {
      filteredUsers = filteredUsers.filter(user => !user.isActive);
    } else if (activeTab === 'on-leave') {
      // TODO: Implement on-leave filtering when leave status is available
      filteredUsers = filteredUsers.filter(user => user.isActive);
    }
    // For 'all' tab, we don't filter by isActive status
    
    return filteredUsers;
  }, [apiUsers, filteredLocalEmployees, isError, usingLocalData, activeTab]);

  const handleEmployeeSelect = (employee: User) => {
    setSelectedEmployee(employee);
  };

  const handleCloseProfile = () => {
    setSelectedEmployee(null);
  };

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-neutral-800">Employees</h1>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => setBulkImportOpen(true)}>
            <Database className="mr-2 h-4 w-4" />
            Bulk Import
          </Button>
          <Button onClick={() => setAddModalOpen(true)}>
            <UserPlus className="mr-2 h-4 w-4" />
            Add Employee
          </Button>
        </div>
      </div>

      {/* Employee Profile View */}
      {selectedEmployee ? (
        <EmployeeProfile employee={selectedEmployee} onClose={handleCloseProfile} />
      ) : (
        <>
          {/* Search and Filter Bar */}
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-neutral-400" />
                  <Input
                    placeholder="Search employees..."
                    className="pl-9"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Select value={department} onValueChange={setDepartment}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="All Departments" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Departments</SelectItem>
                    <SelectItem value="engineering">Engineering</SelectItem>
                    <SelectItem value="marketing">Marketing</SelectItem>
                    <SelectItem value="sales">Sales</SelectItem>
                    <SelectItem value="hr">Human Resources</SelectItem>
                    <SelectItem value="finance">Finance</SelectItem>
                    <SelectItem value="operations">Operations</SelectItem>
                    <SelectItem value="design">Design</SelectItem>
                    <SelectItem value="product">Product</SelectItem>
                    <SelectItem value="customer_support">Customer Support</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Employee Listing */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <CardTitle>Employee Directory</CardTitle>
                  {usingLocalData && (
                    <span className="text-xs px-2 py-1 rounded-full bg-yellow-100 text-yellow-800">
                      Using Local Data
                    </span>
                  )}
                </div>
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-auto">
                  <TabsList>
                    <TabsTrigger value="all">All</TabsTrigger>
                    <TabsTrigger value="active">Active</TabsTrigger>
                    <TabsTrigger value="inactive">Inactive</TabsTrigger>
                    <TabsTrigger value="on-leave">On Leave</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : (
                <EmployeeTable 
                  employees={users || []} 
                  onSelect={handleEmployeeSelect} 
                />
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* Add Employee Modal */}
      <AddEmployeeModal 
        open={addModalOpen} 
        onClose={() => setAddModalOpen(false)} 
        onEmployeeAdded={(newEmployee) => {
          setLocalEmployees(prev => [...prev, newEmployee]);
        }}
      />

      {/* Bulk Import Modal */}
      <BulkImportForm
        isOpen={bulkImportOpen}
        onClose={() => setBulkImportOpen(false)}
      />
    </>
  );
}
