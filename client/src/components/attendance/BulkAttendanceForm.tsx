import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { CalendarIcon, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { User } from "@/lib/auth";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { queryClient } from "@/lib/queryClient";

interface BulkAttendanceFormProps {
  isOpen: boolean;
  onClose: () => void;
  employees: User[];
}

const formSchema = z.object({
  date: z.date(),
  employeeIds: z.array(z.number()).min(1, "Select at least one employee"),
  status: z.enum(["present", "absent", "late", "half_day", "on_leave"]),
  checkInTime: z.string().optional(),
  checkOutTime: z.string().optional(),
  checkInMethod: z.enum(["qr_code", "biometric", "manual", "geo_location"]).optional(),
  checkOutMethod: z.enum(["qr_code", "biometric", "manual", "geo_location"]).optional(),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function BulkAttendanceForm({ isOpen, onClose, employees }: BulkAttendanceFormProps) {
  const { toast } = useToast();
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    processed: number;
    successful: number;
    failed: number;
    results: any[];
    errors: any[];
  } | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      date: new Date(),
      employeeIds: [],
      status: "present",
      checkInTime: "09:00",
      checkInMethod: "manual",
    },
  });

  const selectedStatus = form.watch("status");
  const showCheckInFields = ["present", "late", "half_day"].includes(selectedStatus);
  const showCheckOutFields = showCheckInFields;

  const onSubmit = async (values: FormValues) => {
    setProcessing(true);
    setResult(null);
    try {
      // Format the date and times for the API
      const formattedDate = format(values.date, "yyyy-MM-dd");
      
      // Prepare check-in and check-out times if they exist
      let checkInTime = null;
      let checkOutTime = null;
      
      if (values.checkInTime && showCheckInFields) {
        checkInTime = `${formattedDate}T${values.checkInTime}:00Z`;
      }
      
      if (values.checkOutTime && showCheckOutFields) {
        checkOutTime = `${formattedDate}T${values.checkOutTime}:00Z`;
      }
      
      const data = {
        date: formattedDate,
        employeeIds: values.employeeIds,
        status: values.status,
        checkInTime,
        checkOutTime,
        checkInMethod: values.checkInMethod,
        checkOutMethod: values.checkOutMethod,
        notes: values.notes,
      };
      
      const response = await fetch("/api/attendance/bulk", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      
      const responseData = await response.json();
      setResult(responseData);
      
      if (responseData.successful > 0) {
        toast({
          title: "Attendance Marked",
          description: `Successfully marked attendance for ${responseData.successful} employees.`,
        });
        
        // Invalidate queries to refresh data
        queryClient.invalidateQueries({ queryKey: ['/api/attendance/today'] });
        queryClient.invalidateQueries({ queryKey: ['/api/attendance/statistics'] });
        queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
      }
      
      if (responseData.failed > 0) {
        toast({
          title: "Some Entries Failed",
          description: `${responseData.failed} entries couldn't be processed.`,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to mark attendance. Please try again.",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleClose = () => {
    if (!processing) {
      setResult(null);
      form.reset();
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Mark Attendance in Bulk</DialogTitle>
          <DialogDescription>
            Mark attendance for multiple employees at once.
          </DialogDescription>
        </DialogHeader>

        {result ? (
          <div className="space-y-4">
            <div className="bg-muted p-4 rounded-lg">
              <h3 className="text-lg font-medium mb-2">Result Summary</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-primary/10 p-3 rounded-md text-center">
                  <p className="text-sm text-muted-foreground">Processed</p>
                  <p className="text-xl font-semibold">{result.processed}</p>
                </div>
                <div className="bg-green-100 p-3 rounded-md text-center">
                  <p className="text-sm text-muted-foreground">Successful</p>
                  <p className="text-xl font-semibold text-green-600">{result.successful}</p>
                </div>
                <div className="bg-red-100 p-3 rounded-md text-center">
                  <p className="text-sm text-muted-foreground">Failed</p>
                  <p className="text-xl font-semibold text-red-600">{result.failed}</p>
                </div>
              </div>
            </div>

            {result.failed > 0 && (
              <div>
                <h4 className="font-medium mb-2">Errors:</h4>
                <div className="max-h-40 overflow-y-auto space-y-2">
                  {result.errors.map((error, index) => (
                    <div key={index} className="text-sm bg-red-50 p-2 rounded flex items-start">
                      <XCircle className="h-4 w-4 text-red-500 mr-2 mt-0.5" />
                      <div>
                        <span className="font-medium">User ID {error.userId}:</span> {error.error}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <DialogFooter>
              <Button 
                onClick={() => setResult(null)} 
                variant="outline" 
                className="mr-2"
              >
                Mark More
              </Button>
              <Button onClick={handleClose}>Close</Button>
            </DialogFooter>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-4">
                <FormLabel>Select Employees</FormLabel>
                <div className="border rounded-md p-4 max-h-40 overflow-y-auto">
                  <div className="space-y-2">
                    {employees.map((employee) => (
                      <div key={employee.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`employee-${employee.id}`}
                          checked={form.watch("employeeIds").includes(employee.id)}
                          onCheckedChange={(checked) => {
                            const currentIds = form.getValues("employeeIds");
                            if (checked) {
                              form.setValue("employeeIds", [...currentIds, employee.id]);
                            } else {
                              form.setValue(
                                "employeeIds",
                                currentIds.filter((id) => id !== employee.id)
                              );
                            }
                          }}
                        />
                        <Label htmlFor={`employee-${employee.id}`} className="flex-1">
                          {employee.firstName} {employee.lastName}
                          {employee.department && (
                            <span className="text-xs text-muted-foreground ml-2">
                              ({employee.department})
                            </span>
                          )}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
                {form.formState.errors.employeeIds && (
                  <p className="text-sm font-medium text-destructive">
                    {form.formState.errors.employeeIds.message}
                  </p>
                )}
              </div>

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem className="space-y-1">
                    <FormLabel>Status</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex flex-wrap gap-4"
                      >
                        <FormItem className="flex items-center space-x-1 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="present" />
                          </FormControl>
                          <FormLabel className="font-normal">Present</FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-1 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="late" />
                          </FormControl>
                          <FormLabel className="font-normal">Late</FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-1 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="absent" />
                          </FormControl>
                          <FormLabel className="font-normal">Absent</FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-1 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="half_day" />
                          </FormControl>
                          <FormLabel className="font-normal">Half Day</FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-1 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="on_leave" />
                          </FormControl>
                          <FormLabel className="font-normal">On Leave</FormLabel>
                        </FormItem>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {showCheckInFields && (
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="checkInTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Check-in Time</FormLabel>
                        <FormControl>
                          <Input type="time" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="checkInMethod"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Check-in Method</FormLabel>
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
                            <SelectItem value="qr_code">QR Code</SelectItem>
                            <SelectItem value="biometric">Biometric</SelectItem>
                            <SelectItem value="manual">Manual</SelectItem>
                            <SelectItem value="geo_location">Geo Location</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {showCheckOutFields && (
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="checkOutTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Check-out Time</FormLabel>
                        <FormControl>
                          <Input type="time" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="checkOutMethod"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Check-out Method</FormLabel>
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
                            <SelectItem value="qr_code">QR Code</SelectItem>
                            <SelectItem value="biometric">Biometric</SelectItem>
                            <SelectItem value="manual">Manual</SelectItem>
                            <SelectItem value="geo_location">Geo Location</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Optional notes" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button variant="outline" type="button" onClick={handleClose} className="mr-2">
                  Cancel
                </Button>
                <Button type="submit" disabled={processing}>
                  {processing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    "Mark Attendance"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}