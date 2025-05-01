import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { apiRequest } from "@/lib/queryClient";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormDescription,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { EmployeeCombobox } from "@/components/common/EmployeeCombobox";
import { User } from "@shared/schema";

const trainingFormSchema = z.object({
  userId: z.string().min(1, "User is required"),
  trainingTitle: z.string().min(1, "Training title is required"),
  trainingType: z.string().min(1, "Training type is required"),
  date: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  trainerId: z.string().nullable(),
  department: z.string().optional(),
  venue: z.string().optional(),
  objectives: z.string().optional(),
  materials: z.string().optional(),
  evaluation: z.string().optional(),
  effectiveness: z.string().optional(),
  notes: z.string().optional(),
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().min(1, "End time is required"),
  attendees: z.array(z.string()).optional(),
  scopeOfTraining: z.array(z.string()).min(1, "At least one training scope is required"),
  guestSpeaker: z.string().optional(),
});

interface TrainingRecordProps {
  onSuccess?: () => void;
}

export function TrainingRecord({ onSuccess }: TrainingRecordProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { authState } = useAuth();
  const user = authState.user;

  const form = useForm<z.infer<typeof trainingFormSchema>>({
    resolver: zodResolver(trainingFormSchema),
    defaultValues: {
      userId: '',
      trainingTitle: '',
      trainingType: 'internal',
      date: '',
      endDate: '',
      trainerId: null,
      department: '',
      venue: 'Default Venue',
      objectives: 'Standard Training Objectives',
      materials: 'Standard Training Materials',
      evaluation: 'written',
      effectiveness: 'effective',
      notes: '',
      startTime: '',
      endTime: '',
      attendees: [],
      scopeOfTraining: [],
      guestSpeaker: ''
    }
  });

  const { data: users = [], isLoading: isLoadingUsers, error: usersError } = useQuery<User[]>({
    queryKey: ['users'],
    queryFn: async () => {
      try {
        const response = await apiRequest('GET', '/api/users');
        if (!response.ok) {
          throw new Error('Failed to fetch users');
        }
        const data = await response.json();
        console.log('Fetched users:', data);
        return data;
      } catch (error) {
        console.error('Error fetching users:', error);
        throw error;
      }
    }
  });

  const onSubmit = async (data: z.infer<typeof trainingFormSchema>) => {
    try {
      setIsSubmitting(true);
      
      if (!data.startTime || !data.endTime) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Start time and end time are required",
        });
        return;
      }

      console.log('Form data before formatting:', data);
      console.log('Available employees:', users);
      console.log('Looking for employee with ID:', data.userId);
      
      const employee = users.find(u => u.id === parseInt(data.userId));
      console.log('Found employee:', employee);
      
      if (!employee) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Selected employee not found in database",
        });
        return;
      }

      const formattedData = {
        userId: employee.id,
        trainingTitle: data.trainingTitle,
        trainingType: 'internal',
        date: new Date(data.date).toISOString().split('T')[0],
        end_date: new Date(data.endDate).toISOString().split('T')[0],
        trainerId: data.trainerId ? parseInt(data.trainerId) : null,
        department: data.department || null,
        venue: 'Default Venue',
        objectives: 'Standard Training Objectives',
        materials: 'Standard Training Materials',
        evaluation: 'written',
        effectiveness: 'effective',
        notes: data.notes || null,
        start_time: data.startTime,
        end_time: data.endTime,
        attendees: data.attendees || [],
        scope_of_training: data.scopeOfTraining || []
      };

      console.log('Formatted data before submission:', formattedData);

      const createResponse = await apiRequest('POST', '/api/training-records', formattedData);

      toast({
        title: "Success",
        description: "Training record has been saved.",
      });

      form.reset();
      onSuccess?.();
    } catch (error) {
      console.error('Training record error:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: (error as Error).message || "Failed to save training record",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingUsers) {
    return <div>Loading employees...</div>;
  }

  if (usersError) {
    console.error('Error loading employees:', usersError);
    return <div>Error loading employees. Please try again later.</div>;
  }

  if (users.length === 0) {
    return <div>No employees found. Please add employees first.</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Training Record</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Employee Selection */}
            <FormField
              control={form.control}
              name="userId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="required">Employee</FormLabel>
                  <FormControl>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select an employee" />
                      </SelectTrigger>
                      <SelectContent>
                        {users.map((user) => (
                          <SelectItem key={user.id} value={user.id.toString()}>
                            {user.firstName} {user.lastName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Training Title */}
            <FormField
              control={form.control}
              name="trainingTitle"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="required">Training Title</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Enter training title" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Date */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="required">Start Date</FormLabel>
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
                    <FormLabel className="required">End Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Time */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="required">Start Time</FormLabel>
                    <FormControl>
                      <Input 
                        type="time" 
                        required
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="endTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="required">End Time</FormLabel>
                    <FormControl>
                      <Input 
                        type="time" 
                        required
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Scope of Training */}
            <FormField
              control={form.control}
              name="scopeOfTraining"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Scope of Training</FormLabel>
                  <FormControl>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            value="initiatory"
                            checked={field.value.includes('initiatory')}
                            onChange={(e) => {
                              const value = e.target.value;
                              field.onChange(
                                e.target.checked
                                  ? [...field.value, value]
                                  : field.value.filter((v) => v !== value)
                              );
                            }}
                          />
                          <span>Initiatory/Periodic</span>
                        </label>
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            value="onTheJob"
                            checked={field.value.includes('onTheJob')}
                            onChange={(e) => {
                              const value = e.target.value;
                              field.onChange(
                                e.target.checked
                                  ? [...field.value, value]
                                  : field.value.filter((v) => v !== value)
                              );
                            }}
                          />
                          <span>On-The-Job</span>
                        </label>
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            value="qualityControl"
                            checked={field.value.includes('qualityControl')}
                            onChange={(e) => {
                              const value = e.target.value;
                              field.onChange(
                                e.target.checked
                                  ? [...field.value, value]
                                  : field.value.filter((v) => v !== value)
                              );
                            }}
                          />
                          <span>Quality Control</span>
                        </label>
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            value="firstAid"
                            checked={field.value.includes('firstAid')}
                            onChange={(e) => {
                              const value = e.target.value;
                              field.onChange(
                                e.target.checked
                                  ? [...field.value, value]
                                  : field.value.filter((v) => v !== value)
                              );
                            }}
                          />
                          <span>First-Aid</span>
                        </label>
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            value="fireFighting"
                            checked={field.value.includes('fireFighting')}
                            onChange={(e) => {
                              const value = e.target.value;
                              field.onChange(
                                e.target.checked
                                  ? [...field.value, value]
                                  : field.value.filter((v) => v !== value)
                              );
                            }}
                          />
                          <span>Fire-Fighting</span>
                        </label>
                      </div>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Department */}
            <FormField
              control={form.control}
              name="department"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Department</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Enter department" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Trainer */}
            <FormField
              control={form.control}
              name="trainerId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Trainer</FormLabel>
                  <FormControl>
                    <EmployeeCombobox
                      value={field.value || ''}
                      onValueChange={(value) => field.onChange(value || null)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Guest Speaker */}
            <FormField
              control={form.control}
              name="guestSpeaker"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Guest Speakers / Trainers</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Enter guest speaker name" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea {...field} placeholder="Enter notes" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Attendees */}
            <FormField
              control={form.control}
              name="attendees"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Attendees</FormLabel>
                  <FormControl>
                    <div className="space-y-4">
                      <EmployeeCombobox
                        value={field.value?.[field.value.length - 1] || ''}
                        onValueChange={(value) => {
                          if (value && !field.value?.includes(value)) {
                            field.onChange([...(field.value || []), value]);
                          }
                        }}
                      />
                      <div className="border rounded-md">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b">
                              <th className="px-4 py-2 text-left">S.No.</th>
                              <th className="px-4 py-2 text-left">Name</th>
                              <th className="px-4 py-2 text-left">Emp Code</th>
                              <th className="px-4 py-2 text-left">Department</th>
                              <th className="px-4 py-2 text-left">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {field.value?.map((userId, index) => {
                              const user = users.find((u: any) => u.id.toString() === userId);
                              return user ? (
                                <tr key={userId} className="border-b">
                                  <td className="px-4 py-2">{index + 1}</td>
                                  <td className="px-4 py-2">{user.firstName} {user.lastName}</td>
                                  <td className="px-4 py-2">{user.employeeId}</td>
                                  <td className="px-4 py-2">{user.department}</td>
                                  <td className="px-4 py-2">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                          onClick={() => {
                                        field.onChange(field.value?.filter((id) => id !== userId));
                                      }}
                                    >
                                      Remove
                                    </Button>
                                  </td>
                                </tr>
                      ) : null;
                    })}
                          </tbody>
                        </table>
                      </div>
                  </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save Training Record'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

// Add this CSS somewhere in your styles
const styles = `
  .required:after {
    content: " *";
    color: red;
  }
`;