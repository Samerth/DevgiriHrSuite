import { useMemo } from "react";
import { 
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useState } from "react";

interface AttendanceOverviewProps {
  isLoading?: boolean;
}

export default function AttendanceOverview({ isLoading = false }: AttendanceOverviewProps) {
  const [timeRange, setTimeRange] = useState("week");
  
  const chartData = useMemo(() => {
    // Sample data - In a real app, this would come from the backend
    if (timeRange === "week") {
      return [
        { date: "Mon", present: 150, late: 20, absent: 10, onLeave: 7 },
        { date: "Tue", present: 145, late: 15, absent: 12, onLeave: 8 },
        { date: "Wed", present: 148, late: 18, absent: 8, onLeave: 6 },
        { date: "Thu", present: 142, late: 22, absent: 11, onLeave: 5 },
        { date: "Fri", present: 130, late: 25, absent: 15, onLeave: 10 },
        { date: "Sat", present: 80, late: 10, absent: 5, onLeave: 2 },
        { date: "Sun", present: 20, late: 5, absent: 2, onLeave: 0 },
      ];
    } else if (timeRange === "month") {
      return [
        { date: "Week 1", present: 670, late: 80, absent: 30, onLeave: 20 },
        { date: "Week 2", present: 680, late: 75, absent: 35, onLeave: 25 },
        { date: "Week 3", present: 675, late: 85, absent: 32, onLeave: 18 },
        { date: "Week 4", present: 690, late: 70, absent: 28, onLeave: 22 },
      ];
    } else {
      return [
        { date: "Jan", present: 2800, late: 350, absent: 120, onLeave: 80 },
        { date: "Feb", present: 2750, late: 320, absent: 130, onLeave: 90 },
        { date: "Mar", present: 2900, late: 300, absent: 100, onLeave: 70 },
        { date: "Apr", present: 2850, late: 330, absent: 110, onLeave: 85 },
        { date: "May", present: 2950, late: 290, absent: 90, onLeave: 65 },
        { date: "Jun", present: 2920, late: 310, absent: 95, onLeave: 75 },
      ];
    }
  }, [timeRange]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-lg font-semibold">Attendance Overview</CardTitle>
          <Skeleton className="h-8 w-32" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full mb-4" />
          <div className="flex justify-center space-x-6">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-5 w-20" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-semibold">Attendance Overview</CardTitle>
        <div className="flex space-x-2">
          <Select
            value={timeRange}
            onValueChange={setTimeRange}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Select range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="year">This Year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="ghost" size="icon">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{
                top: 20,
                right: 30,
                left: 0,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="present" stackId="a" fill="hsl(var(--chart-1))" name="Present" />
              <Bar dataKey="late" stackId="a" fill="hsl(var(--chart-2))" name="Late" />
              <Bar dataKey="absent" stackId="a" fill="hsl(var(--chart-3))" name="Absent" />
              <Bar dataKey="onLeave" stackId="a" fill="hsl(var(--chart-4))" name="On Leave" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        
        <div className="flex justify-center space-x-6 mt-4">
          <div className="flex items-center">
            <span className="w-3 h-3 bg-primary rounded-full mr-2"></span>
            <span className="text-sm text-neutral-700">Present</span>
          </div>
          <div className="flex items-center">
            <span className="w-3 h-3 bg-yellow-400 rounded-full mr-2"></span>
            <span className="text-sm text-neutral-700">Late</span>
          </div>
          <div className="flex items-center">
            <span className="w-3 h-3 bg-red-400 rounded-full mr-2"></span>
            <span className="text-sm text-neutral-700">Absent</span>
          </div>
          <div className="flex items-center">
            <span className="w-3 h-3 bg-purple-400 rounded-full mr-2"></span>
            <span className="text-sm text-neutral-700">On Leave</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
