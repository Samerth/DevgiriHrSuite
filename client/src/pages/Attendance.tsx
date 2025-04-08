import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, Download, QrCode, UserPlus } from "lucide-react";
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useAuth } from "@/lib/auth";
import { format } from "date-fns";
import QRScanner from "@/components/attendance/QRScanner";
import AttendanceTable from "@/components/attendance/AttendanceTable";
import { cn } from "@/lib/utils";

export default function Attendance() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("daily");
  const { user } = useAuth();

  const formattedDate = format(selectedDate, 'yyyy-MM-dd');
  
  const { data: todayAttendance = [], isLoading: isAttendanceLoading } = useQuery({
    queryKey: ['/api/attendance/today'],
  });

  const { data: selectedDateAttendance = {}, isLoading: isSelectedDateLoading } = useQuery({
    queryKey: ['/api/attendance/user', user?.id, { date: formattedDate }],
    enabled: !!user?.id,
  });

  const downloadReport = () => {
    // This would typically generate a CSV or PDF
    alert("Downloading attendance report");
  };

  const manualEntryEnabled = user?.role === 'admin' || user?.role === 'manager';

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-neutral-800">Attendance Management</h1>
        <div className="flex gap-3">
          <Button variant="outline" onClick={downloadReport}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button onClick={() => setQrModalOpen(true)}>
            <QrCode className="mr-2 h-4 w-4" />
            Mark Attendance
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {/* Calendar Card */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Select Date</CardTitle>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && setSelectedDate(date)}
              className="border rounded-md"
            />
            <div className="mt-4">
              <h3 className="font-medium mb-2">Your Status - {format(selectedDate, 'dd MMM yyyy')}</h3>
              {isSelectedDateLoading ? (
                <Skeleton className="h-6 w-full" />
              ) : selectedDateAttendance ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-neutral-600">Status:</span>
                    <Badge className={
                      selectedDateAttendance.status === 'present' ? 'bg-green-100 text-green-800' :
                      selectedDateAttendance.status === 'absent' ? 'bg-red-100 text-red-800' :
                      selectedDateAttendance.status === 'late' ? 'bg-yellow-100 text-yellow-800' :
                      selectedDateAttendance.status === 'on_leave' ? 'bg-purple-100 text-purple-800' :
                      'bg-gray-100 text-gray-800'
                    }>
                      {selectedDateAttendance.status === 'on_leave' ? 'On Leave' : 
                       (selectedDateAttendance.status ? selectedDateAttendance.status.charAt(0).toUpperCase() + selectedDateAttendance.status.slice(1) : 'Unknown')}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-neutral-600">Check in:</span>
                    <span className="text-sm font-medium">{selectedDateAttendance.checkInTime || '-'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-neutral-600">Check out:</span>
                    <span className="text-sm font-medium">{selectedDateAttendance.checkOutTime || '-'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-neutral-600">Method:</span>
                    <span className="text-sm font-medium">{selectedDateAttendance.checkInMethod || '-'}</span>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4 text-neutral-500">
                  <p>No attendance record found</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Attendance Overview */}
        <Card className="md:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle>Attendance Records</CardTitle>
            <div className="inline-block">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList>
                  <TabsTrigger value="daily">Daily</TabsTrigger>
                  <TabsTrigger value="weekly">Weekly</TabsTrigger>
                  <TabsTrigger value="monthly">Monthly</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardHeader>
          <CardContent>
            {activeTab === "daily" && (
              <AttendanceTable 
                data={todayAttendance || []} 
                isLoading={isAttendanceLoading} 
                selectedDate={selectedDate}
              />
            )}
            {activeTab === "weekly" && (
              <AttendanceTable 
                data={todayAttendance || []} 
                isLoading={isAttendanceLoading}
                selectedDate={selectedDate}
                period="week"
              />
            )}
            {activeTab === "monthly" && (
              <AttendanceTable 
                data={todayAttendance || []} 
                isLoading={isAttendanceLoading}
                selectedDate={selectedDate}
                period="month"
              />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Manual Attendance Entry (Admin Only) */}
      {manualEntryEnabled && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Manual Attendance Entry</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Employee</label>
                <Select defaultValue="1">
                  <SelectTrigger>
                    <SelectValue placeholder="Select employee" />
                  </SelectTrigger>
                  <SelectContent>
                    {/* We would map through employees here */}
                    <SelectItem value="1">Aditya Sharma</SelectItem>
                    <SelectItem value="2">Priya Patel</SelectItem>
                    <SelectItem value="3">Vikram Khanna</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Date</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !selectedDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={(date) => date && setSelectedDate(date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Status</label>
                <Select defaultValue="present">
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="present">Present</SelectItem>
                    <SelectItem value="absent">Absent</SelectItem>
                    <SelectItem value="late">Late</SelectItem>
                    <SelectItem value="half_day">Half Day</SelectItem>
                    <SelectItem value="on_leave">On Leave</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-end">
                <Button className="w-full">Add Entry</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Bulk Attendance Upload (Admin Only) */}
      {manualEntryEnabled && (
        <Card>
          <CardHeader>
            <CardTitle>Bulk Attendance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4 items-end">
              <div className="flex-1">
                <label className="block text-sm font-medium text-neutral-700 mb-1">CSV File</label>
                <input 
                  type="file" 
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary file:text-white hover:file:bg-primary/90"
                />
                <p className="mt-1 text-xs text-neutral-500">Upload a CSV file with employee ID, date, status, and time.</p>
              </div>
              <Button>Upload and Process</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* QR Scanner Modal */}
      <QRScanner open={qrModalOpen} onClose={() => setQrModalOpen(false)} />
    </>
  );
}
