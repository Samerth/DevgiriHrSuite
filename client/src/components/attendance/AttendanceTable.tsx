import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { format, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, addDays } from "date-fns";
import { useAuth } from "@/lib/auth";

interface AttendanceTableProps {
  data: any[];
  isLoading: boolean;
  selectedDate: Date;
  period?: "day" | "week" | "month";
}

export default function AttendanceTable({ 
  data, 
  isLoading,
  selectedDate,
  period = "day"
}: AttendanceTableProps) {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin' || user?.role === 'manager';
  
  // Determine date range based on period
  const getDateRange = () => {
    if (period === "day") {
      return { startDate: selectedDate, endDate: selectedDate };
    } else if (period === "week") {
      const start = startOfWeek(selectedDate, { weekStartsOn: 1 });
      const end = endOfWeek(selectedDate, { weekStartsOn: 1 });
      return { startDate: start, endDate: end };
    } else if (period === "month") {
      const start = startOfMonth(selectedDate);
      const end = endOfMonth(selectedDate);
      return { startDate: start, endDate: end };
    }
    return { startDate: selectedDate, endDate: selectedDate };
  };
  
  const { startDate, endDate } = getDateRange();
  
  // Fetch attendance data for the selected period if admin
  const { data: periodAttendance, isLoading: isPeriodLoading } = useQuery({
    queryKey: ['/api/attendance/user', user?.id, { 
      startDate: format(startDate, 'yyyy-MM-dd'),
      endDate: format(endDate, 'yyyy-MM-dd')
    }],
    enabled: period !== "day" && !!user?.id,
  });

  // For demo purposes, we'll simulate having attendance data
  // In a real application, this would come from the backend
  const attendanceData = periodAttendance || data;
  
  // Status badge component
  const StatusBadge = ({ status }: { status: string }) => {
    const colorMap: Record<string, { bg: string; text: string }> = {
      present: { bg: 'bg-green-100', text: 'text-green-800' },
      absent: { bg: 'bg-red-100', text: 'text-red-800' },
      late: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
      on_leave: { bg: 'bg-purple-100', text: 'text-purple-800' },
      half_day: { bg: 'bg-blue-100', text: 'text-blue-800' },
    };
  
    const colors = colorMap[status] || { bg: 'bg-gray-100', text: 'text-gray-800' };
    const displayStatus = status === 'on_leave' ? 'On Leave' : 
                          status.split('_').map(word => 
                            word.charAt(0).toUpperCase() + word.slice(1)
                          ).join(' ');
  
    return (
      <Badge className={`${colors.bg} ${colors.text}`}>
        {displayStatus}
      </Badge>
    );
  };

  if (isLoading || isPeriodLoading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }
  
  // Display message if no data
  if (!attendanceData || attendanceData.length === 0) {
    let message = "No attendance records found";
    if (period === "day") {
      message = `No attendance records for ${format(selectedDate, 'MMMM d, yyyy')}`;
    } else if (period === "week") {
      message = `No attendance records for the week of ${format(startDate, 'MMMM d')} to ${format(endDate, 'MMMM d, yyyy')}`;
    } else if (period === "month") {
      message = `No attendance records for ${format(selectedDate, 'MMMM yyyy')}`;
    }
    
    return (
      <div className="text-center py-8 text-neutral-500">
        <p>{message}</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            {isAdmin && <TableHead>Employee</TableHead>}
            <TableHead>{period !== "day" ? "Date" : "Check In"}</TableHead>
            <TableHead>Check {period === "day" ? "Out" : "In"}</TableHead>
            {period === "day" && <TableHead>Check Out</TableHead>}
            <TableHead>Status</TableHead>
            {period === "day" && <TableHead>Method</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {attendanceData.map((record: any, index: number) => (
            <TableRow key={record.id || index}>
              {isAdmin && (
                <TableCell>
                  <div className="flex items-center">
                    <Avatar className="h-8 w-8 mr-3">
                      <AvatarFallback className="bg-primary/10 text-primary text-xs">
                        {record.user?.firstName?.[0] || 'U'}{record.user?.lastName?.[0] || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">
                        {record.user ? `${record.user.firstName} ${record.user.lastName}` : "Unknown"}
                      </div>
                      <div className="text-sm text-neutral-500">{record.user?.position || ""}</div>
                    </div>
                  </div>
                </TableCell>
              )}
              <TableCell>
                {period !== "day" 
                  ? format(new Date(record.date), 'MMM d, yyyy') 
                  : record.checkInTime || '-'}
              </TableCell>
              <TableCell>
                {period !== "day" 
                  ? record.checkInTime || '-'
                  : record.checkOutTime || '-'}
              </TableCell>
              {period === "day" && (
                <TableCell>{record.checkOutTime || '-'}</TableCell>
              )}
              <TableCell>
                <StatusBadge status={record.status} />
              </TableCell>
              {period === "day" && (
                <TableCell>{record.checkInMethod || '-'}</TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
