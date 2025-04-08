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

export default function Employees() {
  const [searchQuery, setSearchQuery] = useState("");
  const [department, setDepartment] = useState("");
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState("all");

  const { data: users, isLoading } = useQuery<User[]>({
    queryKey: ['/api/users', searchQuery, department],
    queryFn: async () => {
      const url = `/api/users/search?q=${encodeURIComponent(searchQuery)}${department ? `&department=${encodeURIComponent(department)}` : ''}`;
      const res = await fetch(url, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch employees');
      return res.json();
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
