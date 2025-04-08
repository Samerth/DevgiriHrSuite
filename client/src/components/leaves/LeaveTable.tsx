import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { formatDate, formatDateRange } from "@/utils/date";
import { 
  getLeaveTypeLabel, 
  getLeaveTypeColor, 
  getLeaveStatusLabel, 
  getLeaveStatusColor 
} from "@/utils/leave";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function LeaveTable() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const { data: leavesData, isLoading: leavesLoading } = useQuery({
    queryKey: ["/api/leaves"],
  });
  
  const { data: employeesData, isLoading: employeesLoading } = useQuery({
    queryKey: ["/api/employees"],
  });
  
  const approveLeaveMutation = useMutation({
    mutationFn: async (leaveId: number) => {
      return await apiRequest("PUT", `/api/leaves/${leaveId}/approve`, {});
    },
    onSuccess: () => {
      toast({
        title: "Leave approved",
        description: "The leave request has been approved successfully.",
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/leaves"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error approving leave",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    }
  });
  
  const rejectLeaveMutation = useMutation({
    mutationFn: async (leaveId: number) => {
      return await apiRequest("PUT", `/api/leaves/${leaveId}/reject`, {});
    },
    onSuccess: () => {
      toast({
        title: "Leave rejected",
        description: "The leave request has been rejected.",
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/leaves"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error rejecting leave",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    }
  });
  
  // Create a map of employee IDs to employee objects for easy lookup
  const employeeMap = employeesData?.reduce((acc: Record<number, any>, employee: any) => {
    acc[employee.id] = employee;
    return acc;
  }, {});
  
  // Filter leaves by status
  const filteredLeaves = leavesData?.filter((leave: any) => {
    if (statusFilter === "all") return true;
    return leave.status === statusFilter;
  });
  
  // Merge leave data with employee data
  const leavesWithEmployees = filteredLeaves?.map((leave: any) => {
    const employee = employeeMap?.[leave.employeeId];
    return {
      ...leave,
      employee: employee || { firstName: 'Unknown', lastName: 'Employee', department: '-' }
    };
  });
  
  const handleApproveLeave = (id: number) => {
    approveLeaveMutation.mutate(id);
  };
  
  const handleRejectLeave = (id: number) => {
    rejectLeaveMutation.mutate(id);
  };
  
  const isLoading = leavesLoading || employeesLoading;
  
  return (
    <>
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-4 gap-3">
        <div>
          <Select 
            value={statusFilter} 
            onValueChange={setStatusFilter}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Leave Type</TableHead>
                <TableHead>Date Range</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Applied On</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array(5).fill(0).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <div className="flex items-center">
                        <Skeleton className="w-8 h-8 rounded-full mr-3" />
                        <div>
                          <Skeleton className="h-4 w-24 mb-1" />
                          <Skeleton className="h-3 w-16" />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-8 rounded-full float-right" /></TableCell>
                  </TableRow>
                ))
              ) : leavesWithEmployees?.length > 0 ? (
                leavesWithEmployees.map((leave: any) => {
                  const leaveTypeStyle = getLeaveTypeColor(leave.type);
                  const statusStyle = getLeaveStatusColor(leave.status);
                  const duration = Math.ceil(
                    (new Date(leave.endDate).getTime() - new Date(leave.startDate).getTime()) / (1000 * 60 * 60 * 24)
                  ) + 1;
                  
                  return (
                    <TableRow key={leave.id}>
                      <TableCell>
                        <div className="flex items-center">
                          <div className="w-8 h-8 rounded-full bg-gray-200 mr-3">
                            <div className="rounded-full w-full h-full bg-gray-300 flex items-center justify-center">
                              <span className="material-icons text-gray-500">person</span>
                            </div>
                          </div>
                          <div>
                            <p className="font-medium text-sm">
                              {leave.employee.firstName} {leave.employee.lastName}
                            </p>
                            <p className="text-xs text-muted-foreground capitalize">
                              {leave.employee.department}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${leaveTypeStyle.bg} ${leaveTypeStyle.text}`}>
                          {getLeaveTypeLabel(leave.type)}
                        </span>
                      </TableCell>
                      <TableCell>{formatDateRange(leave.startDate, leave.endDate)}</TableCell>
                      <TableCell>{duration} days</TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusStyle.bg} ${statusStyle.text}`}>
                          {getLeaveStatusLabel(leave.status)}
                        </span>
                      </TableCell>
                      <TableCell>{formatDate(leave.appliedOn)}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <span className="material-icons">more_vert</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => {}}>
                              <span className="material-icons text-sm mr-2">visibility</span>
                              View Details
                            </DropdownMenuItem>
                            
                            {leave.status === 'pending' && (
                              <>
                                <DropdownMenuItem onClick={() => handleApproveLeave(leave.id)}>
                                  <span className="material-icons text-sm mr-2">check</span>
                                  Approve
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleRejectLeave(leave.id)}>
                                  <span className="material-icons text-sm mr-2">close</span>
                                  Reject
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No leave requests found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}
