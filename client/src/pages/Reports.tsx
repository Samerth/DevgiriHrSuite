import { useState } from "react";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { Download, Calendar as CalendarIcon } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";

export default function Reports() {
  const [reportType, setReportType] = useState("attendance");
  const [timeRange, setTimeRange] = useState("week");
  const [startDate, setStartDate] = useState<Date>(subDays(new Date(), 6));
  const [endDate, setEndDate] = useState<Date>(new Date());
  
  // Mock data for charts - in production this would come from an API
  const attendanceData = [
    { date: "Mon", present: 150, late: 20, absent: 10, onLeave: 7 },
    { date: "Tue", present: 145, late: 15, absent: 12, onLeave: 8 },
    { date: "Wed", present: 148, late: 18, absent: 8, onLeave: 6 },
    { date: "Thu", present: 142, late: 22, absent: 11, onLeave: 5 },
    { date: "Fri", present: 130, late: 25, absent: 15, onLeave: 10 },
    { date: "Sat", present: 80, late: 10, absent: 5, onLeave: 2 },
    { date: "Sun", present: 20, late: 5, absent: 2, onLeave: 0 },
  ];
  
  const leaveData = [
    { name: 'Annual Leave', value: 45 },
    { name: 'Sick Leave', value: 25 },
    { name: 'Personal Leave', value: 15 },
    { name: 'Maternity/Paternity', value: 8 },
    { name: 'Bereavement', value: 5 },
    { name: 'Unpaid Leave', value: 2 },
  ];
  
  const departmentData = [
    { department: 'Engineering', count: 45 },
    { department: 'Marketing', count: 25 },
    { department: 'Sales', count: 35 },
    { department: 'HR', count: 15 },
    { department: 'Finance', count: 20 },
    { department: 'Operations', count: 30 },
    { department: 'Design', count: 18 },
  ];

  const COLORS = [
    'hsl(var(--chart-1))', 
    'hsl(var(--chart-2))', 
    'hsl(var(--chart-3))', 
    'hsl(var(--chart-4))', 
    'hsl(var(--chart-5))',
    '#8884d8',
    '#82ca9d'
  ];

  const updateDateRange = (range: string) => {
    setTimeRange(range);
    const today = new Date();
    
    if (range === "week") {
      setStartDate(startOfWeek(today, { weekStartsOn: 1 }));
      setEndDate(endOfWeek(today, { weekStartsOn: 1 }));
    } else if (range === "month") {
      setStartDate(startOfMonth(today));
      setEndDate(endOfMonth(today));
    } else if (range === "quarter") {
      const quarter = Math.floor(today.getMonth() / 3);
      const startMonth = quarter * 3;
      setStartDate(new Date(today.getFullYear(), startMonth, 1));
      setEndDate(new Date(today.getFullYear(), startMonth + 3, 0));
    } else if (range === "year") {
      setStartDate(new Date(today.getFullYear(), 0, 1));
      setEndDate(new Date(today.getFullYear(), 11, 31));
    }
  };

  const handleExport = () => {
    alert(`Exporting ${reportType} report for ${format(startDate, 'PP')} to ${format(endDate, 'PP')}`);
  };

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-neutral-800">Reports</h1>
        <Button onClick={handleExport}>
          <Download className="mr-2 h-4 w-4" />
          Export Report
        </Button>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Report Configuration</CardTitle>
          <CardDescription>
            Customize your report by selecting the type, date range, and other parameters
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Report Type</label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select report type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="attendance">Attendance Report</SelectItem>
                  <SelectItem value="leave">Leave Report</SelectItem>
                  <SelectItem value="department">Department Report</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Time Range</label>
              <Select value={timeRange} onValueChange={updateDateRange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select time range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                  <SelectItem value="quarter">This Quarter</SelectItem>
                  <SelectItem value="year">This Year</SelectItem>
                  <SelectItem value="custom">Custom Range</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">From Date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={(date) => date && setStartDate(date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">To Date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !endDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={(date) => date && setEndDate(date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            {reportType === "attendance" ? "Attendance Report" : 
             reportType === "leave" ? "Leave Report" : "Department Report"}
          </CardTitle>
          <CardDescription>
            {format(startDate, 'PPP')} to {format(endDate, 'PPP')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            {reportType === "attendance" && (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={attendanceData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="present" stackId="a" fill={COLORS[0]} name="Present" />
                  <Bar dataKey="late" stackId="a" fill={COLORS[1]} name="Late" />
                  <Bar dataKey="absent" stackId="a" fill={COLORS[2]} name="Absent" />
                  <Bar dataKey="onLeave" stackId="a" fill={COLORS[3]} name="On Leave" />
                </BarChart>
              </ResponsiveContainer>
            )}
            
            {reportType === "leave" && (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={leaveData}
                    cx="50%"
                    cy="50%"
                    labelLine={true}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {leaveData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
            
            {reportType === "department" && (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={departmentData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="department" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="count" stroke="#8884d8" activeDot={{ r: 8 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Summary Table */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {reportType === "attendance" && (
                    <>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Present</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Late</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Absent</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">On Leave</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                    </>
                  )}
                  
                  {reportType === "leave" && (
                    <>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Leave Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Count</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Percentage</th>
                    </>
                  )}
                  
                  {reportType === "department" && (
                    <>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee Count</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Average Attendance</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Leave Utilization</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {reportType === "attendance" && attendanceData.map((item, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.date}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.present}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.late}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.absent}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.onLeave}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.present + item.late + item.absent + item.onLeave}
                    </td>
                  </tr>
                ))}
                
                {reportType === "leave" && leaveData.map((item, index) => {
                  const total = leaveData.reduce((sum, i) => sum + i.value, 0);
                  const percentage = ((item.value / total) * 100).toFixed(1);
                  return (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.value}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{percentage}%</td>
                    </tr>
                  );
                })}
                
                {reportType === "department" && departmentData.map((item, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.department}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.count}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{Math.floor(Math.random() * 20) + 80}%</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{Math.floor(Math.random() * 40) + 60}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
