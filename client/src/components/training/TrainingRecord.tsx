import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { apiRequest } from "@/lib/queryClient";
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
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { EmployeeCombobox } from "@/components/common/EmployeeCombobox"; // Added import

const trainingFormSchema = z.object({
  trainingTitle: z.string().min(1, "Training title is required"),
  trainingType: z.string().min(1, "Training type is required"),
  date: z.string().min(1, "Date is required"),
  department: z.string().min(1, "Department is required"),
  trainerId: z.string().nullable(),
  venue: z.string().min(1, "Venue is required"),
  objectives: z.string().min(1, "Objectives are required"),
  materials: z.string().min(1, "Materials are required"),
  evaluation: z.string().min(1, "Evaluation method is required"),
  effectiveness: z.string().min(1, "Effectiveness is required"),
  notes: z.string().optional(),
});

interface TrainingRecordProps {
  onSuccess?: () => void;
}

export function TrainingRecord({ onSuccess }: TrainingRecordProps) {
  const { toast } = useToast();
  const form = useForm<z.infer<typeof trainingFormSchema>>({
    resolver: zodResolver(trainingFormSchema),
    defaultValues: {
      trainingTitle: '',
      trainingType: 'internal',
      date: '',
      department: '',
      trainerId: null,
      venue: '',
      objectives: '',
      materials: '',
      evaluation: '',
      effectiveness: '',
      notes: ''
    }
  });

  const { authState } = useAuth();
  const user = authState.user;

  const onSubmit = async (data: z.infer<typeof trainingFormSchema>) => {
    try {
      // Format date and handle trainerId
      const formattedData = {
        ...data,
        userId: data.trainerId ? parseInt(data.trainerId) : null,
        date: new Date(data.date).toISOString(),
        trainerId: data.trainerId ? parseInt(data.trainerId) : null
      };

      console.log('Submitting training data:', formattedData);
      const response = await apiRequest('POST', '/api/training-records', formattedData);
      console.log('Training record response:', response);

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
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Training Record</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="trainingTitle"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Training Title</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Enter training title" />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="trainingType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Training Type</FormLabel>
                  <FormControl>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select training type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="internal">Internal</SelectItem>
                        <SelectItem value="external">External</SelectItem>
                        <SelectItem value="online">Online</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
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
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="department"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Department</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Enter department" />
                  </FormControl>
                </FormItem>
              )}
            />

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
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="venue"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Venue</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Enter training venue" />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="objectives"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Training Objectives</FormLabel>
                  <FormControl>
                    <Textarea {...field} placeholder="Enter training objectives" />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="materials"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Training Materials</FormLabel>
                  <FormControl>
                    <Textarea {...field} placeholder="List training materials used" />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="evaluation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Evaluation Method</FormLabel>
                  <FormControl>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select evaluation method" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="written">Written Test</SelectItem>
                        <SelectItem value="practical">Practical Assessment</SelectItem>
                        <SelectItem value="observation">Observation</SelectItem>
                        <SelectItem value="feedback">Feedback Form</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="effectiveness"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Training Effectiveness</FormLabel>
                  <FormControl>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select effectiveness level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="highly_effective">Highly Effective</SelectItem>
                        <SelectItem value="effective">Effective</SelectItem>
                        <SelectItem value="moderate">Moderately Effective</SelectItem>
                        <SelectItem value="needs_improvement">Needs Improvement</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Additional Notes</FormLabel>
                  <FormControl>
                    <Textarea {...field} placeholder="Enter any additional notes" />
                  </FormControl>
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full">Save Training Record</Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}