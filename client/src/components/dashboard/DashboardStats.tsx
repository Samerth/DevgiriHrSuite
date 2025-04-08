import { DashboardStats as DashboardStatsType } from "@/lib/types";
import { 
  Users, 
  CheckSquare, 
  CalendarX, 
  Clock, 
  TrendingUp,
  TrendingDown,
  User 
} from "lucide-react";

interface DashboardStatsProps {
  stats: DashboardStatsType;
}

export default function DashboardStats({ stats }: DashboardStatsProps) {
  const statItems = [
    {
      title: "Total Employees",
      value: stats.totalEmployees,
      icon: Users,
      bgColor: "bg-blue-100",
      textColor: "text-primary",
      change: { value: "4.3%", isPositive: true, text: "from last month" }
    },
    {
      title: "Present Today",
      value: stats.presentToday,
      icon: CheckSquare,
      bgColor: "bg-green-100",
      textColor: "text-green-600",
      change: { 
        value: `${stats.totalEmployees ? Math.round((stats.presentToday / stats.totalEmployees) * 100) : 0}%`, 
        isNeutral: true, 
        text: "attendance rate" 
      }
    },
    {
      title: "On Leave",
      value: stats.onLeave,
      icon: CalendarX,
      bgColor: "bg-yellow-100",
      textColor: "text-yellow-600",
      change: { value: "2.7%", isPositive: false, text: "from last week" }
    },
    {
      title: "Pending Requests",
      value: stats.pendingRequests,
      icon: Clock,
      bgColor: "bg-red-100",
      textColor: "text-red-600",
      change: { value: "12%", isPositive: true, text: "from yesterday" }
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
      {statItems.map((item, index) => (
        <div key={index} className="bg-white rounded-lg shadow-sm p-5">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-neutral-500 text-sm">{item.title}</p>
              <h3 className="text-2xl font-bold mt-1 text-neutral-800">{item.value}</h3>
              <p className={`text-xs mt-2 flex items-center ${
                item.change.isPositive 
                  ? "text-green-600" 
                  : item.change.isNeutral 
                    ? "text-neutral-500" 
                    : "text-red-600"
              }`}>
                {!item.change.isNeutral && (
                  item.change.isPositive 
                  ? <TrendingUp className="h-3 w-3 mr-1" /> 
                  : <TrendingDown className="h-3 w-3 mr-1" />
                )}
                {item.change.isNeutral && (
                  <User className="h-3 w-3 mr-1" />
                )}
                <span>{item.change.value} {item.change.text}</span>
              </p>
            </div>
            <div className={`w-10 h-10 rounded-full ${item.bgColor} flex items-center justify-center ${item.textColor}`}>
              <item.icon size={20} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
