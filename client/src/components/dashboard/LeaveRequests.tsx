import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { LeaveRequestWithUser } from "@/lib/types";
import { Calendar, FileText } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format, parseISO, differenceInDays } from "date-fns";

interface LeaveRequestsProps {
  pendingLeaves: LeaveRequestWithUser[];
  isLoading?: boolean;
}

export default function LeaveRequests({ pendingLeaves, isLoading = false }: LeaveRequestsProps) {
  const { toast } = useToast();

  const respondToLeaveMutation = useMutation({
    mutationFn: async (data: { id: number; status: 'approved' | 'rejected'; notes?: string }) => {
      const res = await apiRequest('PUT', `/api/leave-requests/${data.id}/respond`, {
        status: data.status,
        notes: data.notes
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/leave-requests/pending'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
      toast({
        title: "Leave request updated",
        description: "The leave request has been processed successfully.",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Failed to process request",
        description: (error as Error).message || "Please try again later",
      });
    }
  });

  const handleApprove = (id: number) => {
    respondToLeaveMutation.mutate({ id, status: 'approved' });
  };

  const handleReject = (id: number) => {
    respondToLeaveMutation.mutate({ id, status: 'rejected' });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-lg font-semibold">Pending Leave Requests</CardTitle>
          <Skeleton className="h-5 w-16" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(2)].map((_, i) => (
              <Skeleton key={i} className="h-36 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-semibold">Pending Leave Requests</CardTitle>
        <a href="/leaves" className="text-primary text-sm font-medium">View All</a>
      </CardHeader>
      <CardContent>
        {pendingLeaves.length > 0 ? (
          <div className="space-y-4">
            {pendingLeaves.slice(0, 3).map((leave) => (
              <div key={leave.id} className="p-3 border border-gray-100 rounded-lg hover:border-gray-300 transition duration-200">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center">
                    <Avatar className="w-8 h-8 mr-3">
                      <AvatarFallback className="bg-gray-200 text-sm">
                        {leave.user.firstName[0]}{leave.user.lastName[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-sm text-neutral-800">
                        {leave.user.firstName} {leave.user.lastName}
                      </p>
                      <p className="text-xs text-neutral-500">
                        {leave.user.department ? leave.user.department.charAt(0).toUpperCase() + leave.user.department.slice(1) : 'Department'}
                      </p>
                    </div>
                  </div>
                  <LeaveTypeBadge type={leave.type} />
                </div>
                
                <div className="text-xs text-neutral-700 mb-3">
                  <div className="flex items-center mb-1">
                    <Calendar className="text-neutral-400 mr-1 h-3.5 w-3.5" />
                    <span>
                      {format(parseISO(leave.startDate.toString()), 'MMM d, yyyy')} - {format(parseISO(leave.endDate.toString()), 'MMM d, yyyy')} 
                      ({differenceInDays(parseISO(leave.endDate.toString()), parseISO(leave.startDate.toString())) + 1} days)
                    </span>
                  </div>
                  <div className="flex items-start">
                    <FileText className="text-neutral-400 mr-1 h-3.5 w-3.5 mt-0.5" />
                    <span className="line-clamp-2">{leave.reason || 'No reason provided'}</span>
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  <Button 
                    size="sm" 
                    className="flex-1" 
                    onClick={() => handleApprove(leave.id)}
                    disabled={respondToLeaveMutation.isPending}
                  >
                    Approve
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="flex-1" 
                    onClick={() => handleReject(leave.id)}
                    disabled={respondToLeaveMutation.isPending}
                  >
                    Reject
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-neutral-500">
            <p>No pending leave requests</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function LeaveTypeBadge({ type }: { type: string }) {
  const colorMap: Record<string, { bg: string; text: string }> = {
    annual: { bg: 'bg-green-100', text: 'text-green-800' },
    sick: { bg: 'bg-blue-100', text: 'text-blue-800' },
    personal: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
    maternity: { bg: 'bg-pink-100', text: 'text-pink-800' },
    paternity: { bg: 'bg-indigo-100', text: 'text-indigo-800' },
    bereavement: { bg: 'bg-purple-100', text: 'text-purple-800' },
    unpaid: { bg: 'bg-gray-100', text: 'text-gray-800' },
  };

  const colors = colorMap[type] || { bg: 'bg-gray-100', text: 'text-gray-800' };
  const displayType = type.charAt(0).toUpperCase() + type.slice(1) + ' Leave';

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors.bg} ${colors.text}`}>
      {displayType}
    </span>
  );
}
