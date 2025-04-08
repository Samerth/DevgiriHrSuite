import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
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
import { Plus, Search, UserPlus } from "lucide-react";
import EmployeeTable from "@/components/employees/EmployeeTable";
import AddEmployeeModal from "@/components/employees/AddEmployeeModal";
import EmployeeProfile from "@/components/employees/EmployeeProfile";
import { User } from "@shared/schema";

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
  const [searchQuery, setSearchQuery] = useState("");
  const [department, setDepartment] = useState("");
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState("all");

  const { data: users, isLoading } = useQuery<User[]>({
    queryKey: ['/api/users', searchQuery, department],
    queryFn: async () => {
      try {
        const url = `/api/users/search?q=${encodeURIComponent(searchQuery)}${department ? `&department=${encodeURIComponent(department)}` : ''}`;
        const res = await fetch(url, { credentials: 'include' });
        if (!res.ok) throw new Error('Failed to fetch employees');
        return res.json();
      } catch (error) {
        console.error("Error fetching employees:", error);
        // Filter default data based on search and department
        return defaultEmployees.filter(employee => {
          const matchesSearch = searchQuery === "" || 
            `${employee.firstName} ${employee.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
            employee.email?.toLowerCase().includes(searchQuery.toLowerCase());
          
          const matchesDepartment = department === "" || employee.department === department;
          
          return matchesSearch && matchesDepartment;
        });
      }
    },
  });

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
        <Button onClick={() => setAddModalOpen(true)}>
          <UserPlus className="mr-2 h-4 w-4" />
          Add Employee
        </Button>
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
                    <SelectItem value="">All Departments</SelectItem>
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
                <CardTitle>Employee Directory</CardTitle>
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-auto">
                  <TabsList>
                    <TabsTrigger value="all">All</TabsTrigger>
                    <TabsTrigger value="active">Active</TabsTrigger>
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
      <AddEmployeeModal open={addModalOpen} onClose={() => setAddModalOpen(false)} />
    </>
  );
}
