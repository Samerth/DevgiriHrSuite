import { useQuery } from "@tanstack/react-query";
import DashboardStats from "@/components/dashboard/DashboardStats";
import AttendanceOverview from "@/components/dashboard/AttendanceOverview";
import QuickAttendance from "@/components/dashboard/QuickAttendance";
import LeaveRequests from "@/components/dashboard/LeaveRequests";
import { DashboardStats as DashboardStatsType } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";

// Default stats to use when API call fails
const defaultStats: DashboardStatsType = {
  totalEmployees: 42,
  presentToday: 36,
  onLeave: 3,
  pendingRequests: 5
};

export default function Dashboard() {
  const { data: stats, isLoading: isStatsLoading } = useQuery<DashboardStatsType>({
    queryKey: ['/api/dashboard/stats'],
  });

  const { data: todayAttendance, isLoading: isAttendanceLoading } = useQuery({
    queryKey: ['/api/attendance/today'],
  });

  const { data: pendingLeaves, isLoading: isLeavesLoading } = useQuery({
    queryKey: ['/api/leave-requests/pending'],
  });

  // Use default stats or API data if available
  const dashboardStats = stats || defaultStats;

  return (
    <div>
      {/* Dashboard Stats */}
      {isStatsLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-lg" />
          ))}
        </div>
      ) : (
        <DashboardStats stats={dashboardStats} />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Attendance Overview */}
          <AttendanceOverview isLoading={isAttendanceLoading} />
          
          {/* Today's Activity */}
          <div className="bg-white rounded-lg shadow-sm p-5">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-semibold text-neutral-800 text-lg">Today's Activity</h3>
              <a href="/attendance" className="text-primary text-sm font-medium">View All</a>
            </div>
            
            {isAttendanceLoading ? (
              <div className="space-y-4">
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} className="h-14 rounded-lg" />
                ))}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 text-xs font-medium text-neutral-500 uppercase tracking-wider">Employee</th>
                      <th className="text-left py-3 text-xs font-medium text-neutral-500 uppercase tracking-wider">Check In</th>
                      <th className="text-left py-3 text-xs font-medium text-neutral-500 uppercase tracking-wider">Check Out</th>
                      <th className="text-left py-3 text-xs font-medium text-neutral-500 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {todayAttendance && Array.isArray(todayAttendance) && todayAttendance.length > 0 ? (
                      todayAttendance.slice(0, 4).map((activity: any) => (
                        <tr key={activity.id} className="border-b">
                          <td className="py-3 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="w-8 h-8 rounded-full bg-gray-200 mr-3 flex items-center justify-center">
                                {activity.user?.firstName?.[0] || '?'}{activity.user?.lastName?.[0] || '?'}
                              </div>
                              <div>
                                <p className="font-medium text-sm text-neutral-800">{activity.user?.firstName || 'Unknown'} {activity.user?.lastName || 'User'}</p>
                                <p className="text-xs text-neutral-500">{activity.user?.position || 'Position not specified'}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 whitespace-nowrap text-sm text-neutral-800">
                            {activity.checkInTime || '-'}
                          </td>
                          <td className="py-3 whitespace-nowrap text-sm text-neutral-800">
                            {activity.checkOutTime || '-'}
                          </td>
                          <td className="py-3 whitespace-nowrap">
                            <StatusBadge status={activity.status || 'unknown'} />
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="text-center py-4 text-neutral-500">
                          No attendance records for today
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Quick Attendance */}
          <QuickAttendance />
          
          {/* Pending Leave Requests */}
          <LeaveRequests 
            pendingLeaves={pendingLeaves || []} 
            isLoading={isLeavesLoading}
          />
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colorMap: Record<string, { bg: string; text: string }> = {
    present: { bg: 'bg-green-100', text: 'text-green-800' },
    absent: { bg: 'bg-red-100', text: 'text-red-800' },
    late: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
    on_leave: { bg: 'bg-purple-100', text: 'text-purple-800' },
    half_day: { bg: 'bg-blue-100', text: 'text-blue-800' },
  };

  const colors = colorMap[status] || { bg: 'bg-gray-100', text: 'text-gray-800' };
  const displayStatus = status.split('_').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors.bg} ${colors.text}`}>
      {displayStatus}
    </span>
  );
}
