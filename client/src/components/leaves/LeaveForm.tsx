import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EmployeeCombobox } from "@/components/common/EmployeeCombobox";

interface LeaveFormProps {
  isOpen: boolean;
  onClose: () => void;
}

const formSchema = z.object({
  employeeId: z.string().min(1, "Employee is required"),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  type: z.string().min(1, "Leave type is required"),
  reason: z.string().min(5, "Reason is required"),
})
.refine(
  (data) => new Date(data.startDate) <= new Date(data.endDate),
  {
    message: "End date must be after start date",
    path: ["endDate"],
  }
);

type FormValues = z.infer<typeof formSchema>;

export default function LeaveForm({ isOpen, onClose }: LeaveFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { data: employeesData } = useQuery({
    queryKey: ["/api/users"],
  });
  
  const { data: enumsData } = useQuery({
    queryKey: ["/api/enums"],
  });
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      employeeId: "",
      startDate: new Date().toISOString().split("T")[0],
      endDate: new Date().toISOString().split("T")[0],
      type: "",
      reason: "",
    },
  });
  
  const createLeaveMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", "/api/leave-requests", data);
    },
    onSuccess: () => {
      toast({
        title: "Leave request submitted",
        description: "Leave request has been submitted successfully.",
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/leave-requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      form.reset();
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Error submitting leave request",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    }
  });
  
  const onSubmit = (values: FormValues) => {
    // Convert string values to appropriate types and format dates
    const startDate = new Date(values.startDate);
    const endDate = new Date(values.endDate);
    
    const payload = {
      userId: parseInt(values.employeeId),
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      type: values.type,
      reason: values.reason,
    };
    
    createLeaveMutation.mutate(payload);
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Apply for Leave</DialogTitle>
          <DialogDescription>
            Submit a new leave request
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="employeeId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Employee</FormLabel>
                  <EmployeeCombobox
                    value={field.value}
                    onValueChange={field.onChange}
                    placeholder="Search for employee..."
                    disabled={createLeaveMutation.isPending}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Leave Type</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select leave type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {enumsData?.leaveTypes ? (
                        enumsData.leaveTypes.map((type: string) => (
                          <SelectItem key={type} value={type}>
                            {type.charAt(0).toUpperCase() + type.slice(1)} Leave
                          </SelectItem>
                        ))
                      ) : (
                        ["annual", "sick", "personal", "unpaid", "maternity", "paternity"].map((type: string) => (
                          <SelectItem key={type} value={type}>
                            {type.charAt(0).toUpperCase() + type.slice(1)} Leave
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reason</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Please provide a detailed reason for your leave request"
                      className="min-h-[100px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose}
                disabled={createLeaveMutation.isPending}
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                disabled={createLeaveMutation.isPending}
              >
                {createLeaveMutation.isPending ? "Submitting..." : "Submit Request"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
