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
  startDate: z.string(),
  endDate: z.string(),
  department: z.string(),
  trainerId: z.string(),
  duration: z.string(),
  attendees: z.array(z.string()), // Changed to array of strings
  venue: z.string(),
  objectives: z.string(),
  materials: z.string(),
  evaluation: z.string(),
  feedback: z.string(),
  effectiveness: z.string(),
  notes: z.string().optional(),
});

export function TrainingRecord() {
  const { toast } = useToast();
  const form = useForm<z.infer<typeof trainingFormSchema>>({
    resolver: zodResolver(trainingFormSchema),
  });

  const onSubmit = async (data: z.infer<typeof trainingFormSchema>) => {
    try {
      // Submit training record using apiRequest helper
      await apiRequest('POST', '/api/training-records', {
        ...data,
        userId: user?.id, // Add current user ID
        status: 'pending',
      });

      toast({
        title: "Training record created",
        description: "The training record has been successfully saved.",
      });
      
      // Reset form after successful submission
      form.reset();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: (error as Error).message || "Failed to create training record",
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

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
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
                  </FormItem>
                )}
              />
            </div>

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
                    <Input {...field} placeholder="Enter trainer name" />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="duration"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Duration</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Enter duration (e.g., 2 hours)" />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="attendees"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Attendees</FormLabel>
                  <FormControl>
                    <div>
                      <EmployeeCombobox 
                        value={field.value} 
                        onValueChange={field.onChange}
                      />
                    </div>
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