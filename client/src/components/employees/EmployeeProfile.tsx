import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardFooter
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  Avatar, 
  AvatarFallback, 
  AvatarImage 
} from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  ArrowLeft, 
  Mail, 
  Phone, 
  MapPin, 
  Briefcase, 
  Calendar, 
  Edit, 
  Clock,
  File,
  CalendarDays,
  Building,
  User
} from "lucide-react";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { User as UserType } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface EmployeeProfileProps {
  employee: UserType;
  onClose: () => void;
}

export default function EmployeeProfile({ employee, onClose }: EmployeeProfileProps) {
  const [activeTab, setActiveTab] = useState("overview");
  const [editMode, setEditMode] = useState(false);
  const [editedEmployee, setEditedEmployee] = useState<Partial<UserType>>({});
  const { toast } = useToast();

  // Fetch attendance records
  const { data: attendanceRecords, isLoading: isAttendanceLoading } = useQuery({
    queryKey: ['/api/attendance/user', employee.id],
    enabled: activeTab === "attendance",
  });

  // Fetch leave requests
  const { data: leaveRequests, isLoading: isLeaveLoading } = useQuery({
    queryKey: ['/api/leave-requests/user', employee.id],
    enabled: activeTab === "leaves",
  });

  const updateMutation = useMutation({
    mutationFn: async (data: Partial<UserType>) => {
      const res = await apiRequest('PUT', `/api/users/${employee.id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      toast({
        title: "Employee updated",
        description: "Employee information has been updated successfully.",
      });
      setEditMode(false);
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Update failed",
        description: (error as Error).message || "Failed to update employee information.",
      });
    }
  });

  const handleEdit = () => {
    setEditedEmployee({
      firstName: employee.firstName,
      lastName: employee.lastName,
      email: employee.email,
      phone: employee.phone,
      department: employee.department,
      position: employee.position,
      employeeId: employee.employeeId,
      address: employee.address,
    });
    setEditMode(true);
  };

  const handleSave = () => {
    updateMutation.mutate(editedEmployee);
  };

  const handleCancel = () => {
    setEditMode(false);
  };

  const handleInputChange = (field: string, value: string) => {
    setEditedEmployee({
      ...editedEmployee,
      [field]: value,
    });
  };

  return (
    <>
      <div className="mb-6 flex items-center">
        <Button variant="outline" onClick={onClose} className="mr-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <h1 className="text-2xl font-bold text-neutral-800">Employee Profile</h1>
        <Button variant="outline" onClick={handleEdit} className="ml-auto">
          <Edit className="h-4 w-4 mr-2" />
          Edit
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Employee Profile Card */}
        <Card>
          <CardContent className="pt-6 text-center">
            <Avatar className="h-24 w-24 mx-auto mb-4">
              <AvatarFallback className="text-lg">
                {employee.firstName[0]}{employee.lastName[0]}
              </AvatarFallback>
            </Avatar>
            <h2 className="text-xl font-bold text-neutral-800 mb-1">
              {employee.firstName} {employee.lastName}
            </h2>
            <p className="text-neutral-500 mb-4">{employee.position}</p>
            
            <Badge className={employee.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
              {employee.isActive ? "Active" : "Inactive"}
            </Badge>
            
            <div className="mt-6 space-y-3 text-left">
              <div className="flex items-center">
                <Mail className="h-4 w-4 text-neutral-500 mr-3" />
                <span className="text-sm text-neutral-600">{employee.email}</span>
              </div>
              <div className="flex items-center">
                <Phone className="h-4 w-4 text-neutral-500 mr-3" />
                <span className="text-sm text-neutral-600">{employee.phone || "Not provided"}</span>
              </div>
              <div className="flex items-center">
                <MapPin className="h-4 w-4 text-neutral-500 mr-3" />
                <span className="text-sm text-neutral-600">{employee.address || "Not provided"}</span>
              </div>
              <div className="flex items-center">
                <Building className="h-4 w-4 text-neutral-500 mr-3" />
                <span className="text-sm text-neutral-600">
                  {employee.department 
                    ? employee.department.charAt(0).toUpperCase() + employee.department.slice(1) 
                    : "Not assigned"}
                </span>
              </div>
              <div className="flex items-center">
                <Briefcase className="h-4 w-4 text-neutral-500 mr-3" />
                <span className="text-sm text-neutral-600">ID: {employee.employeeId || "Not assigned"}</span>
              </div>
              <div className="flex items-center">
                <Calendar className="h-4 w-4 text-neutral-500 mr-3" />
                <span className="text-sm text-neutral-600">
                  Joined: {employee.joinDate ? format(new Date(employee.joinDate), 'dd MMM yyyy') : "Not provided"}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Employee Details Tabs */}
        <Card className="md:col-span-2">
          <CardHeader className="pb-2">
            <h3 className="text-lg font-medium">Employee Details</h3>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="attendance">Attendance</TabsTrigger>
                <TabsTrigger value="leaves">Leave History</TabsTrigger>
              </TabsList>
              <TabsContent value="overview" className="mt-0">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-neutral-800 mb-3">Employee Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="border rounded-lg p-4">
                      <p className="text-sm text-neutral-500 mb-1">Full Name</p>
                      <p className="font-medium">{employee.firstName} {employee.lastName}</p>
                    </div>
                    <div className="border rounded-lg p-4">
                      <p className="text-sm text-neutral-500 mb-1">Employee ID</p>
                      <p className="font-medium">{employee.employeeId || "Not assigned"}</p>
                    </div>
                    <div className="border rounded-lg p-4">
                      <p className="text-sm text-neutral-500 mb-1">Email</p>
                      <p className="font-medium">{employee.email}</p>
                    </div>
                    <div className="border rounded-lg p-4">
                      <p className="text-sm text-neutral-500 mb-1">Phone</p>
                      <p className="font-medium">{employee.phone || "Not provided"}</p>
                    </div>
                    <div className="border rounded-lg p-4">
                      <p className="text-sm text-neutral-500 mb-1">Department</p>
                      <p className="font-medium">
                        {employee.department 
                          ? employee.department.charAt(0).toUpperCase() + employee.department.slice(1) 
                          : "Not assigned"}
                      </p>
                    </div>
                    <div className="border rounded-lg p-4">
                      <p className="text-sm text-neutral-500 mb-1">Position</p>
                      <p className="font-medium">{employee.position || "Not assigned"}</p>
                    </div>
                    <div className="border rounded-lg p-4">
                      <p className="text-sm text-neutral-500 mb-1">Join Date</p>
                      <p className="font-medium">
                        {employee.joinDate ? format(new Date(employee.joinDate), 'dd MMM yyyy') : "Not provided"}
                      </p>
                    </div>
                    <div className="border rounded-lg p-4">
                      <p className="text-sm text-neutral-500 mb-1">Status</p>
                      <p className="font-medium">{employee.isActive ? "Active" : "Inactive"}</p>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium text-neutral-800 mb-3">Additional Information</h3>
                  <div className="border rounded-lg p-4">
                    <p className="text-sm text-neutral-500 mb-1">Address</p>
                    <p className="font-medium">{employee.address || "Not provided"}</p>
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="attendance" className="mt-0">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-neutral-800">Attendance History</h3>
                <Select defaultValue="thisMonth">
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="This Month" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="thisWeek">This Week</SelectItem>
                    <SelectItem value="thisMonth">This Month</SelectItem>
                    <SelectItem value="lastMonth">Last Month</SelectItem>
                    <SelectItem value="custom">Custom Range</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {isAttendanceLoading ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : attendanceRecords && attendanceRecords.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Check In</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Check Out</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Method</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {attendanceRecords.map((record: any) => (
                        <tr key={record.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {format(new Date(record.date), 'dd MMM yyyy')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {record.checkInTime || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {record.checkOutTime || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Badge className={
                              record.status === 'present' ? 'bg-green-100 text-green-800' :
                              record.status === 'absent' ? 'bg-red-100 text-red-800' :
                              record.status === 'late' ? 'bg-yellow-100 text-yellow-800' :
                              record.status === 'on_leave' ? 'bg-purple-100 text-purple-800' :
                              'bg-gray-100 text-gray-800'
                            }>
                              {record.status === 'on_leave' ? 'On Leave' : 
                               record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {record.checkInMethod || '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Clock className="h-12 w-12 text-neutral-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-neutral-800 mb-1">No Attendance Records</h3>
                  <p className="text-neutral-500">There are no attendance records for this employee.</p>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="leaves" className="mt-0">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-neutral-800">Leave History</h3>
                <Select defaultValue="all">
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="All Leaves" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Leaves</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {isLeaveLoading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-24 w-full" />
                  ))}
                </div>
              ) : leaveRequests && leaveRequests.length > 0 ? (
                <div className="space-y-4">
                  {leaveRequests.map((leave: any) => (
                    <div key={leave.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <div className="flex items-center">
                            <CalendarDays className="h-4 w-4 text-neutral-500 mr-2" />
                            <p className="text-sm font-medium text-neutral-800">
                              {format(new Date(leave.startDate), 'dd MMM yyyy')} - {format(new Date(leave.endDate), 'dd MMM yyyy')}
                            </p>
                          </div>
                          <p className="text-sm text-neutral-500 mt-1">
                            Type: <span className="font-medium capitalize">{leave.type}</span>
                          </p>
                        </div>
                        <Badge className={
                          leave.status === 'approved' ? 'bg-green-100 text-green-800' :
                          leave.status === 'rejected' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }>
                          {leave.status.charAt(0).toUpperCase() + leave.status.slice(1)}
                        </Badge>
                      </div>
                      <p className="text-sm text-neutral-600 mt-2">
                        <span className="font-medium">Reason:</span> {leave.reason || "No reason provided"}
                      </p>
                      {leave.responseNotes && (
                        <p className="text-sm text-neutral-600 mt-2">
                          <span className="font-medium">Response:</span> {leave.responseNotes}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <File className="h-12 w-12 text-neutral-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-neutral-800 mb-1">No Leave Records</h3>
                  <p className="text-neutral-500">There are no leave records for this employee.</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* Edit Employee Dialog */}
      <Dialog open={editMode} onOpenChange={setEditMode}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Employee</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  value={editedEmployee.firstName || ''}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  value={editedEmployee.lastName || ''}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                value={editedEmployee.email || ''}
                onChange={(e) => handleInputChange('email', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={editedEmployee.phone || ''}
                onChange={(e) => handleInputChange('phone', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="department">Department</Label>
              <Select
                value={editedEmployee.department || ''}
                onValueChange={(value) => handleInputChange('department', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
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
            <div className="space-y-2">
              <Label htmlFor="position">Position</Label>
              <Input
                id="position"
                value={editedEmployee.position || ''}
                onChange={(e) => handleInputChange('position', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="employeeId">Employee ID</Label>
              <Input
                id="employeeId"
                value={editedEmployee.employeeId || ''}
                onChange={(e) => handleInputChange('employeeId', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={editedEmployee.address || ''}
                onChange={(e) => handleInputChange('address', e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCancel}>Cancel</Button>
            <Button onClick={handleSave} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
