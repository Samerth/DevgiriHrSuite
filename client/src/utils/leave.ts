import { Leave } from "@shared/schema";

export function getLeaveTypeLabel(type: string): string {
  switch (type) {
    case 'sick':
      return 'Sick Leave';
    case 'annual':
      return 'Annual Leave';
    case 'casual':
      return 'Casual Leave';
    case 'maternity':
      return 'Maternity Leave';
    case 'paternity':
      return 'Paternity Leave';
    case 'unpaid':
      return 'Unpaid Leave';
    case 'other':
      return 'Other';
    default:
      return type;
  }
}

export function getLeaveTypeColor(type: string): {
  bg: string;
  text: string;
} {
  switch (type) {
    case 'sick':
      return { bg: 'bg-blue-100', text: 'text-blue-800' };
    case 'annual':
      return { bg: 'bg-green-100', text: 'text-green-800' };
    case 'casual':
      return { bg: 'bg-yellow-100', text: 'text-yellow-800' };
    case 'maternity':
      return { bg: 'bg-pink-100', text: 'text-pink-800' };
    case 'paternity':
      return { bg: 'bg-indigo-100', text: 'text-indigo-800' };
    case 'unpaid':
      return { bg: 'bg-red-100', text: 'text-red-800' };
    case 'other':
      return { bg: 'bg-gray-100', text: 'text-gray-800' };
    default:
      return { bg: 'bg-gray-100', text: 'text-gray-800' };
  }
}

export function getLeaveStatusLabel(status: string): string {
  switch (status) {
    case 'pending':
      return 'Pending';
    case 'approved':
      return 'Approved';
    case 'rejected':
      return 'Rejected';
    case 'cancelled':
      return 'Cancelled';
    default:
      return status;
  }
}

export function getLeaveStatusColor(status: string): {
  bg: string;
  text: string;
} {
  switch (status) {
    case 'pending':
      return { bg: 'bg-yellow-100', text: 'text-yellow-800' };
    case 'approved':
      return { bg: 'bg-green-100', text: 'text-green-800' };
    case 'rejected':
      return { bg: 'bg-red-100', text: 'text-red-800' };
    case 'cancelled':
      return { bg: 'bg-gray-100', text: 'text-gray-800' };
    default:
      return { bg: 'bg-gray-100', text: 'text-gray-800' };
  }
}

export function calculateLeaveDays(leaves: Leave[]) {
  // Group leaves by type
  const leavesByType: Record<string, number> = {};
  
  leaves.forEach(leave => {
    const startDate = new Date(leave.startDate);
    const endDate = new Date(leave.endDate);
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    
    if (!leavesByType[leave.type]) {
      leavesByType[leave.type] = 0;
    }
    
    if (leave.status === 'approved') {
      leavesByType[leave.type] += diffDays;
    }
  });
  
  return leavesByType;
}

export function calculatePendingLeaves(leaves: Leave[]) {
  return leaves.filter(leave => leave.status === 'pending').length;
}

export function calculateRemainingLeaves(usedLeaves: Record<string, number>, totalLeaves: Record<string, number>) {
  const remainingLeaves: Record<string, number> = {};
  
  Object.keys(totalLeaves).forEach(type => {
    remainingLeaves[type] = totalLeaves[type] - (usedLeaves[type] || 0);
  });
  
  return remainingLeaves;
}
