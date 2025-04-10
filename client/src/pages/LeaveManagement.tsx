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
import { Skeleton } from "@/components/ui/skeleton";
import { PlusCircle, FileText } from "lucide-react";
import { useAuth } from "@/lib/auth";
import LeaveTable from "@/components/leave/LeaveTable";
import LeaveRequestForm from "@/components/leave/LeaveRequestForm";
import { 
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

export default function LeaveManagement() {
  const [requestFormOpen, setRequestFormOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("my-leaves");
  const { user } = useAuth();

  // Fetch user's leave requests
  const { data: userLeaves, isLoading: isUserLeavesLoading } = useQuery({
    queryKey: ['/api/leave-requests/user', user?.id],
    enabled: !!user?.id,
  });

  // Fetch pending leave requests (admin only)
  const { data: pendingLeaves, isLoading: isPendingLeavesLoading } = useQuery({
    queryKey: ['/api/leave-requests/pending'],
    enabled: !!user?.id && (user?.role === 'admin' || user?.role === 'manager'),
  });

  const isAdmin = user?.role === 'admin' || user?.role === 'manager';

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-neutral-800">Leave Management</h1>
        <Button onClick={() => setRequestFormOpen(true)}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Apply for Leave
        </Button>
      </div>

      <Card className="mb-6">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle>Leave Overview</CardTitle>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="my-leaves">My Leaves</TabsTrigger>
              {isAdmin && <TabsTrigger value="pending-requests">Pending Requests</TabsTrigger>}
              {isAdmin && <TabsTrigger value="all-leaves">All Leaves</TabsTrigger>}
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent>
          <TabsContent value="my-leaves" className="mt-0">
            {isUserLeavesLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
              </div>
            ) : userLeaves && userLeaves.length > 0 ? (
              <LeaveTable leaves={userLeaves} isAdmin={false} />
            ) : (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-neutral-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-neutral-800 mb-1">No Leave Requests</h3>
                <p className="text-neutral-500">You haven't made any leave requests yet.</p>
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => setRequestFormOpen(true)}
                >
                  Request Leave
                </Button>
              </div>
            )}
          </TabsContent>
          
          {isAdmin && (
            <TabsContent value="pending-requests" className="mt-0">
              {isPendingLeavesLoading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-20 w-full" />
                  ))}
                </div>
              ) : pendingLeaves && pendingLeaves.length > 0 ? (
                <LeaveTable leaves={pendingLeaves} isAdmin={true} />
              ) : (
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 text-neutral-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-neutral-800 mb-1">No Pending Requests</h3>
                  <p className="text-neutral-500">There are no leave requests pending approval.</p>
                </div>
              )}
            </TabsContent>
          )}
          
          {isAdmin && (
            <TabsContent value="all-leaves" className="mt-0">
              {isPendingLeavesLoading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-20 w-full" />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 text-neutral-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-neutral-800 mb-1">Leave History</h3>
                  <p className="text-neutral-500">This feature will be available soon.</p>
                </div>
              )}
            </TabsContent>
          )}
        </CardContent>
      </Card>

      {/* Leave statistics and summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Annual Leave</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold text-neutral-800">12</div>
              <div className="text-sm text-neutral-500">days total</div>
            </div>
            <div className="mt-2 h-2 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full" style={{ width: '25%' }}></div>
            </div>
            <div className="mt-1 flex justify-between text-xs text-neutral-500">
              <span>3 used</span>
              <span>9 remaining</span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Sick Leave</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold text-neutral-800">7</div>
              <div className="text-sm text-neutral-500">days total</div>
            </div>
            <div className="mt-2 h-2 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-red-500 rounded-full" style={{ width: '42%' }}></div>
            </div>
            <div className="mt-1 flex justify-between text-xs text-neutral-500">
              <span>3 used</span>
              <span>4 remaining</span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Other Leave</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold text-neutral-800">5</div>
              <div className="text-sm text-neutral-500">days total</div>
            </div>
            <div className="mt-2 h-2 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-yellow-500 rounded-full" style={{ width: '20%' }}></div>
            </div>
            <div className="mt-1 flex justify-between text-xs text-neutral-500">
              <span>1 used</span>
              <span>4 remaining</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Leave request form modal */}
      <Sheet open={requestFormOpen} onOpenChange={setRequestFormOpen}>
        <SheetContent className="sm:max-w-xl w-full overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Request Leave</SheetTitle>
            <SheetDescription>
              Fill in the form below to submit your leave request
            </SheetDescription>
          </SheetHeader>
          <LeaveRequestForm onSubmitSuccess={() => setRequestFormOpen(false)} />
        </SheetContent>
      </Sheet>
    </>
  );
}
