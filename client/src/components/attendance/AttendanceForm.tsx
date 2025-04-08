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

interface AttendanceFormProps {
  isOpen: boolean;
  onClose: () => void;
}

const formSchema = z.object({
  userId: z.string().min(1, "Employee is required"),
  date: z.string().min(1, "Date is required"),
  checkInTime: z.string().optional(),
  checkOutTime: z.string().optional(),
  status: z.string().min(1, "Status is required"),
  checkInMethod: z.string().default("manual"), 
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function AttendanceForm({ isOpen, onClose }: AttendanceFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { data: employeesData } = useQuery({
    queryKey: ["/api/employees"],
  });
  
  const { data: enumsData } = useQuery({
    queryKey: ["/api/enums"],
  });
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      userId: "",
      date: new Date().toISOString().split("T")[0],
      checkInTime: "",
      checkOutTime: "",
      status: "",
      checkInMethod: "manual",
      notes: "",
    },
  });
  
  const createAttendanceMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", "/api/attendance", data);
    },
    onSuccess: () => {
      toast({
        title: "Attendance recorded",
        description: "Attendance has been recorded successfully.",
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/attendance"] });
      form.reset();
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Error recording attendance",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    }
  });
  
  const onSubmit = (values: FormValues) => {
    // Convert string values to appropriate types
    const payload = {
      userId: parseInt(values.userId),
      date: new Date(values.date),
      status: values.status,
      checkInMethod: values.checkInMethod,
      notes: values.notes || "",
      checkInTime: values.checkInTime ? values.checkInTime : null,
      checkOutTime: values.checkOutTime ? values.checkOutTime : null,
    };
    
    createAttendanceMutation.mutate(payload);
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Manual Attendance Entry</DialogTitle>
          <DialogDescription>
            Record attendance for an employee
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="userId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Employee</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select employee" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Array.isArray(employeesData) && employeesData.map((employee: any) => (
                        <SelectItem key={employee.id} value={employee.id.toString()}>
                          {employee.firstName} {employee.lastName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {enumsData && Array.isArray(enumsData.attendanceStatus) && enumsData.attendanceStatus.map((status: string) => (
                          <SelectItem key={status} value={status}>
                            {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="checkInMethod"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Method</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select method" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {enumsData && Array.isArray(enumsData.attendanceMethod) && enumsData.attendanceMethod.map((method: string) => (
                          <SelectItem key={method} value={method}>
                            {method.charAt(0).toUpperCase() + method.slice(1).replace('_', ' ')}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="checkInTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Check In Time</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="checkOutTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Check Out Time</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Additional notes (optional)" {...field} />
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
                disabled={createAttendanceMutation.isPending}
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                disabled={createAttendanceMutation.isPending}
              >
                {createAttendanceMutation.isPending ? "Saving..." : "Save Record"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
