import { useState } from "react";
import { Button } from "@/components/ui/button";
import LeaveTable from "@/components/leaves/LeaveTable";
import LeaveForm from "@/components/leaves/LeaveForm";

export default function Leaves() {
  const [isLeaveFormOpen, setIsLeaveFormOpen] = useState(false);
  
  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Leave Management</h1>
          <p className="text-muted-foreground">Manage employee leave requests and approvals</p>
        </div>
        <Button onClick={() => setIsLeaveFormOpen(true)}>
          <span className="material-icons mr-2 text-sm">add</span>
          Apply Leave
        </Button>
      </div>
      
      <LeaveTable />
      
      {isLeaveFormOpen && (
        <LeaveForm
          isOpen={isLeaveFormOpen}
          onClose={() => setIsLeaveFormOpen(false)}
        />
      )}
    </>
  );
}
