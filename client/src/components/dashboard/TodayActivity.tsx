import { useQuery } from "@tanstack/react-query";
import { formatTime } from "@/utils/date";
import { getAttendanceStatusColor, getAttendanceStatusLabel } from "@/utils/attendance";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export default function TodayActivity() {
  const today = new Date().toISOString().split('T')[0];

  const { data: attendanceData, isLoading } = useQuery({
    queryKey: ["/api/attendance", { date: today }],
  });

  const { data: employeesData, isLoading: employeesLoading } = useQuery({
    queryKey: ["/api/employees"],
  });

  // Create a map of employee IDs to employee objects for easy lookup
  const employeeMap = employeesData?.reduce((acc: Record<number, any>, employee: any) => {
    acc[employee.id] = employee;
    return acc;
  }, {});

  // Merge attendance data with employee data
  const activities = attendanceData?.map((attendance: any) => {
    const employee = employeeMap?.[attendance.employeeId];
    return {
      ...attendance,
      employee: employee || { firstName: 'Unknown', lastName: 'Employee', position: '-' }
    };
  });

  return (
    <Card className="mt-6">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-semibold">Today's Activity</CardTitle>
        <Button variant="link" className="text-primary p-0">View All</Button>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Employee</th>
                <th className="text-left py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Check In</th>
                <th className="text-left py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Check Out</th>
                <th className="text-left py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody>
              {isLoading || employeesLoading ? (
                Array(4).fill(0).map((_, index) => (
                  <tr className="border-b" key={index}>
                    <td className="py-3 whitespace-nowrap">
                      <div className="flex items-center">
                        <Skeleton className="w-8 h-8 rounded-full mr-3" />
                        <div>
                          <Skeleton className="h-4 w-24 mb-1" />
                          <Skeleton className="h-3 w-16" />
                        </div>
                      </div>
                    </td>
                    <td className="py-3 whitespace-nowrap"><Skeleton className="h-4 w-16" /></td>
                    <td className="py-3 whitespace-nowrap"><Skeleton className="h-4 w-16" /></td>
                    <td className="py-3 whitespace-nowrap"><Skeleton className="h-6 w-20 rounded-full" /></td>
                  </tr>
                ))
              ) : activities?.length > 0 ? (
                activities.map((activity: any) => {
                  const { bg, text } = getAttendanceStatusColor(activity.status);

                  return (
                    <tr className="border-b" key={activity.id}>
                      <td className="py-3 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-8 h-8 rounded-full bg-gray-200 mr-3">
                            <div className="rounded-full w-full h-full bg-gray-300 flex items-center justify-center">
                              <span className="material-icons text-gray-500">person</span>
                            </div>
                          </div>
                          <div>
                            <p className="font-medium text-sm text-neutral">
                              {activity.employee.firstName} {activity.employee.lastName}
                            </p>
                            <p className="text-xs text-muted-foreground">{activity.employee.position}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 whitespace-nowrap text-sm text-neutral">
                        {activity.checkIn ? formatTime(new Date(activity.checkIn)) : '-'}
                      </td>
                      <td className="py-3 whitespace-nowrap text-sm text-neutral">
                        {activity.checkOut ? formatTime(new Date(activity.checkOut)) : '-'}
                      </td>
                      <td className="py-3 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${bg} ${text}`}>
                          {getAttendanceStatusLabel(activity.status)}
                        </span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={4} className="text-center py-4 text-muted-foreground">
                    No activity data for today
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}