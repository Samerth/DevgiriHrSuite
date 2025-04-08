import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { LeaveRequestWithUser } from "@/lib/types";
import { format, differenceInDays } from "date-fns";

interface LeaveTableProps {
  leaves: any[]; // LeaveRequest[] or LeaveRequestWithUser[]
  isAdmin: boolean;
}

export default function LeaveTable({ leaves, isAdmin }: LeaveTableProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [responseDialog, setResponseDialog] = useState({ open: false, id: 0, status: "" as "approved" | "rejected" });
  const [responseNote, setResponseNote] = useState("");

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
      queryClient.invalidateQueries({ queryKey: ['/api/leave-requests/user'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
      
      toast({
        title: `Leave request ${responseDialog.status}`,
        description: `The leave request has been ${responseDialog.status} successfully.`,
      });
      
      closeResponseDialog();
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Failed to process request",
        description: (error as Error).message || "Please try again later",
      });
    }
  });

  const openResponseDialog = (id: number, status: "approved" | "rejected") => {
    setResponseDialog({ open: true, id, status });
    setResponseNote("");
  };

  const closeResponseDialog = () => {
    setResponseDialog({ open: false, id: 0, status: "" as "approved" | "rejected" });
    setResponseNote("");
  };

  const handleResponse = () => {
    respondToLeaveMutation.mutate({
      id: responseDialog.id,
      status: responseDialog.status,
      notes: responseNote.trim() || undefined
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-800">Approved</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800">Rejected</Badge>;
      default:
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
    }
  };

  const getLeaveTypeBadge = (type: string) => {
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
    const displayType = type.charAt(0).toUpperCase() + type.slice(1);
  
    return <Badge className={`${colors.bg} ${colors.text}`}>{displayType}</Badge>;
  };

  return (
    <>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {isAdmin && <TableHead>Employee</TableHead>}
              <TableHead>Date Range</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Reason</TableHead>
              {isAdmin && <TableHead>Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {leaves.map((leave) => {
              const startDate = new Date(leave.startDate);
              const endDate = new Date(leave.endDate);
              const duration = differenceInDays(endDate, startDate) + 1;
              
              return (
                <TableRow key={leave.id}>
                  {isAdmin && (
                    <TableCell>
                      <div className="font-medium">
                        {leave.user?.firstName} {leave.user?.lastName}
                      </div>
                      <div className="text-sm text-neutral-500">
                        {leave.user?.department 
                          ? leave.user.department.charAt(0).toUpperCase() + leave.user.department.slice(1) 
                          : ""
                        }
                      </div>
                    </TableCell>
                  )}
                  <TableCell>
                    <div className="font-medium">
                      {format(startDate, "MMM d, yyyy")}
                    </div>
                    <div className="text-sm text-neutral-500">
                      to {format(endDate, "MMM d, yyyy")}
                    </div>
                  </TableCell>
                  <TableCell>
                    {getLeaveTypeBadge(leave.type)}
                  </TableCell>
                  <TableCell>
                    {duration} {duration === 1 ? "day" : "days"}
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(leave.status)}
                  </TableCell>
                  <TableCell>
                    <div className="max-w-xs truncate" title={leave.reason || "No reason provided"}>
                      {leave.reason || "No reason provided"}
                    </div>
                  </TableCell>
                  {isAdmin && (
                    <TableCell>
                      {leave.status === 'pending' && (
                        <div className="flex space-x-2">
                          <Button 
                            size="sm" 
                            onClick={() => openResponseDialog(leave.id, "approved")}
                            disabled={respondToLeaveMutation.isPending}
                          >
                            Approve
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => openResponseDialog(leave.id, "rejected")}
                            disabled={respondToLeaveMutation.isPending}
                          >
                            Reject
                          </Button>
                        </div>
                      )}
                      {leave.status !== 'pending' && (
                        <span className="text-sm text-neutral-500">
                          {leave.responseDate ? `Responded: ${format(new Date(leave.responseDate), "MMM d, yyyy")}` : "Processed"}
                        </span>
                      )}
                    </TableCell>
                  )}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Response Dialog */}
      <Dialog open={responseDialog.open} onOpenChange={(open) => !open && closeResponseDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {responseDialog.status === "approved" ? "Approve" : "Reject"} Leave Request
            </DialogTitle>
            <DialogDescription>
              {responseDialog.status === "approved"
                ? "Confirm that you want to approve this leave request."
                : "Please provide a reason for rejecting this leave request."}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Response Notes (Optional)
            </label>
            <Textarea
              value={responseNote}
              onChange={(e) => setResponseNote(e.target.value)}
              placeholder={
                responseDialog.status === "approved"
                  ? "Any additional notes for approving this request..."
                  : "Reason for rejection..."
              }
              className="resize-none"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeResponseDialog}>
              Cancel
            </Button>
            <Button 
              onClick={handleResponse}
              disabled={respondToLeaveMutation.isPending}
              variant={responseDialog.status === "approved" ? "default" : "destructive"}
            >
              {respondToLeaveMutation.isPending 
                ? "Processing..." 
                : responseDialog.status === "approved" 
                  ? "Approve" 
                  : "Reject"
              }
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
