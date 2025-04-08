import { Attendance } from "@shared/schema";

export function getAttendanceStatusLabel(status: string): string {
  switch (status) {
    case 'present':
      return 'Present';
    case 'absent':
      return 'Absent';
    case 'late':
      return 'Late';
    case 'half_day':
      return 'Half Day';
    case 'leave':
      return 'On Leave';
    default:
      return status;
  }
}

export function getAttendanceStatusColor(status: string): {
  bg: string;
  text: string;
} {
  switch (status) {
    case 'present':
      return { bg: 'bg-green-100', text: 'text-green-800' };
    case 'absent':
      return { bg: 'bg-red-100', text: 'text-red-800' };
    case 'late':
      return { bg: 'bg-yellow-100', text: 'text-yellow-800' };
    case 'half_day':
      return { bg: 'bg-orange-100', text: 'text-orange-800' };
    case 'leave':
      return { bg: 'bg-purple-100', text: 'text-purple-800' };
    default:
      return { bg: 'bg-gray-100', text: 'text-gray-800' };
  }
}

export function calculateAttendanceSummary(attendances: Attendance[]) {
  const totalDays = attendances.length;
  const present = attendances.filter(a => a.status === 'present').length;
  const late = attendances.filter(a => a.status === 'late').length;
  const absent = attendances.filter(a => a.status === 'absent').length;
  const leave = attendances.filter(a => a.status === 'leave').length;
  const halfDay = attendances.filter(a => a.status === 'half_day').length;
  
  const presentPercentage = totalDays > 0 ? (present / totalDays) * 100 : 0;
  const latePercentage = totalDays > 0 ? (late / totalDays) * 100 : 0;
  const absentPercentage = totalDays > 0 ? (absent / totalDays) * 100 : 0;
  const leavePercentage = totalDays > 0 ? (leave / totalDays) * 100 : 0;
  const halfDayPercentage = totalDays > 0 ? (halfDay / totalDays) * 100 : 0;
  
  return {
    totalDays,
    present,
    late,
    absent,
    leave,
    halfDay,
    presentPercentage,
    latePercentage,
    absentPercentage,
    leavePercentage,
    halfDayPercentage
  };
}

export function getAttendanceMethodLabel(method: string): string {
  switch (method) {
    case 'qr':
      return 'QR Code';
    case 'biometric':
      return 'Biometric';
    case 'manual':
      return 'Manual Entry';
    default:
      return method;
  }
}

export function getWorkingHours(checkIn: Date | null, checkOut: Date | null): string {
  if (!checkIn || !checkOut) return '-';
  
  const checkInTime = new Date(checkIn).getTime();
  const checkOutTime = new Date(checkOut).getTime();
  const diffMs = checkOutTime - checkInTime;
  const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  
  return `${diffHrs}h ${diffMins}m`;
}
