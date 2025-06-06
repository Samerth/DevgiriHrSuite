import { LeaveRequest, User, Attendance } from '@shared/schema';

// Dashboard
export interface DashboardStats {
  totalEmployees: number;
  presentToday: number;
  onLeave: number;
  pendingRequests: number;
}

export interface AttendanceWithUser extends Attendance {
  user: User;
}

export interface LeaveRequestWithUser extends LeaveRequest {
  user: User;
}

// For charts
export interface AttendanceChartData {
  date: string;
  present: number;
  late: number;
  absent: number;
  onLeave: number;
}

// QR Code
export interface QRAttendanceData {
  userId: number;
  timestamp: number;
  type: 'checkIn' | 'checkOut';
  token: string; // For security
}

// Attendance Statistics
export interface AttendanceStats {
  totalAttendanceToday: number;
  onTime: number;
  late: number;
  departmentalBreakdown: { department: string; count: number }[];
  attendanceByHour: { hour: number; count: number }[];
  recentActivity: {
    id: number;
    userId: number;
    userName: string;
    time: string;
    type: string;
    status: string;
  }[];
}
