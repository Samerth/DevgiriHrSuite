import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { EmployeeCombobox } from "@/components/common/EmployeeCombobox";
import { apiRequest } from "@/lib/queryClient";
import { useState } from "react";

const feedbackFormSchema = z.object({
  userId: z.string().min(1, "Employee is required"),
  isEffective: z.boolean(),
  trainingAidsGood: z.boolean(),
  durationSufficient: z.boolean(),
  contentExplained: z.boolean(),
  conductedProperly: z.boolean(),
  learningEnvironment: z.boolean(),
  helpfulForWork: z.boolean(),
  additionalTopics: z.string().optional(),
  keyLearnings: z.string().optional(),
  specialObservations: z.string().optional(),
});

export function TrainingFeedbackForm({ trainingId, onSuccess }: { trainingId: number; onSuccess?: () => void }) {
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const form = useForm({
    resolver: zodResolver(feedbackFormSchema),
    defaultValues: {
      userId: "",
      isEffective: false,
      trainingAidsGood: false,
      durationSufficient: false,
      contentExplained: false,
      conductedProperly: false,
      learningEnvironment: false,
      helpfulForWork: false,
      additionalTopics: "",
      keyLearnings: "",
      specialObservations: "",
    },
  });

  const onSubmit = async (data: any) => {
    setSubmitting(true);
    try {
      console.log('Submitting feedback:', { trainingId, ...data });
      
      // Save feedback
      const feedbackResponse = await apiRequest("POST", "/api/training-feedback", {
        trainingId,
        userId: parseInt(data.userId),
        isEffective: data.isEffective,
        trainingAidsGood: data.trainingAidsGood,
        durationSufficient: data.durationSufficient,
        contentExplained: data.contentExplained,
        conductedProperly: data.conductedProperly,
        learningEnvironment: data.learningEnvironment,
        helpfulForWork: data.helpfulForWork,
        additionalTopics: data.additionalTopics,
        keyLearnings: data.keyLearnings,
        specialObservations: data.specialObservations,
      });

      if (!feedbackResponse.ok) {
        const errorText = await feedbackResponse.text();
        throw new Error(`Failed to submit feedback: ${errorText}`);
      }

      console.log('Feedback submitted successfully');

      // Mark attendance as present
      const attendanceResponse = await apiRequest("POST", "/api/training-attendance/mark-present", {
        trainingId,
        userId: parseInt(data.userId),
      });

      if (!attendanceResponse.ok) {
        const errorText = await attendanceResponse.text();
        throw new Error(`Failed to mark attendance: ${errorText}`);
      }

      console.log('Attendance marked successfully');

      toast({ title: "Success", description: "Feedback submitted and attendance marked." });
      onSuccess?.();
    } catch (error) {
      console.error('Error in feedback submission:', error);
      toast({ 
        variant: "destructive", 
        title: "Error", 
        description: error instanceof Error ? error.message : "Failed to submit feedback." 
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Training Feedback</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="userId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Employee</FormLabel>
                  <FormControl>
                    <EmployeeCombobox value={field.value} onValueChange={field.onChange} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="isEffective"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Was the course effective?</FormLabel>
                    <FormControl>
                      <input type="checkbox" checked={field.value} onChange={e => field.onChange(e.target.checked)} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="trainingAidsGood"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Were the training aids good?</FormLabel>
                    <FormControl>
                      <input type="checkbox" checked={field.value} onChange={e => field.onChange(e.target.checked)} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="durationSufficient"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Was the duration of the training sufficient?</FormLabel>
                    <FormControl>
                      <input type="checkbox" checked={field.value} onChange={e => field.onChange(e.target.checked)} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="contentExplained"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Were the course contents explained properly?</FormLabel>
                    <FormControl>
                      <input type="checkbox" checked={field.value} onChange={e => field.onChange(e.target.checked)} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="conductedProperly"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Was the training conducted properly?</FormLabel>
                    <FormControl>
                      <input type="checkbox" checked={field.value} onChange={e => field.onChange(e.target.checked)} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="learningEnvironment"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Did the trainer create and maintain environment for learning?</FormLabel>
                    <FormControl>
                      <input type="checkbox" checked={field.value} onChange={e => field.onChange(e.target.checked)} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="helpfulForWork"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Was this training helpful to enhance your work ability?</FormLabel>
                    <FormControl>
                      <input type="checkbox" checked={field.value} onChange={e => field.onChange(e.target.checked)} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="additionalTopics"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>What other topics could be included?</FormLabel>
                  <FormControl>
                    <Textarea {...field} placeholder="Enter additional topics" />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="keyLearnings"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>What 3 points you have learnt which you found most useful?</FormLabel>
                  <FormControl>
                    <Textarea {...field} placeholder="Enter key learnings" />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="specialObservations"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Any Special Observation</FormLabel>
                  <FormControl>
                    <Textarea {...field} placeholder="Enter any special observation" />
                  </FormControl>
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={submitting}>Submit Feedback</Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
} 