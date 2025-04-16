import { useState, useEffect, ChangeEvent } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { EmployeeCombobox } from "@/components/common/EmployeeCombobox";

interface Parameter {
  id: number;
  name: string;
  maxScore: number;
}

interface AssessmentFormData {
  userId: string;
  assessorId: string;
  assessmentDate: string;
  frequency: string;
  comments: string;
  scores: Record<string, number>;
}

const assessmentFormSchema = z.object({
  userId: z.string().min(1, "Employee is required"),
  assessorId: z.string().min(1, "Assessor is required"),
  assessmentDate: z.string().min(1, "Assessment date is required"),
  frequency: z.string().min(1, "Frequency is required"),
  comments: z.string().optional(),
  scores: z.record(z.string(), z.number().min(0).max(2)),
});

interface TrainingAssessmentProps {
  trainingId: number;
  onSuccess?: () => void;
}

const defaultParameters = [
  { id: 1, name: 'Operating process for different products', maxScore: 2 },
  { id: 2, name: 'Knowledge regarding his Tools & Equipments', maxScore: 2 },
  { id: 3, name: 'Awareness regarding products defects', maxScore: 2 },
  { id: 4, name: 'Knowledge regarding Procedure for Broken Needle', maxScore: 2 },
  { id: 5, name: 'Awareness regarding waste control', maxScore: 2 },
  { id: 6, name: 'Use of refrence/approved samples', maxScore: 2 },
  { id: 7, name: 'Knowledge regarding Buyers product protocol (SPI, Tolerance, GSM & etc.)', maxScore: 2 },
  { id: 8, name: 'Effective communication skills', maxScore: 2 },
  { id: 9, name: 'Knowledge of safe working methods', maxScore: 2 },
  { id: 10, name: 'Knowledge regarding machine setting', maxScore: 2 }
];

export function TrainingAssessment({ trainingId, onSuccess }: TrainingAssessmentProps) {
  const { toast } = useToast();
  const [parameters, setParameters] = useState<Parameter[]>(defaultParameters);

  const form = useForm<AssessmentFormData>({
    resolver: zodResolver(assessmentFormSchema),
    defaultValues: {
      userId: "",
      assessorId: "",
      assessmentDate: new Date().toISOString().split("T")[0],
      frequency: "Monthly",
      comments: "",
      scores: defaultParameters.reduce((acc, param) => {
        acc[param.id.toString()] = 0;
        return acc;
      }, {} as Record<string, number>),
    },
  });

  // Watch scores for real-time total calculation
  const scores = form.watch('scores');
  const currentTotalScore = Object.values(scores).reduce((sum, score) => sum + (score || 0), 0);

  // Fetch assessment parameters
  const { data: fetchedParameters } = useQuery<Parameter[]>({
    queryKey: ["assessment-parameters"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/training-assessment-parameters");
      if (!response.ok) {
        throw new Error("Failed to fetch assessment parameters");
      }
      return response.json();
    },
  });

  useEffect(() => {
    if (fetchedParameters && Array.isArray(fetchedParameters)) {
      setParameters(fetchedParameters);
      // Initialize scores object with parameter IDs
      const initialScores = fetchedParameters.reduce<Record<string, number>>((acc, param) => {
        acc[param.id.toString()] = 0;
        return acc;
      }, {});
      form.setValue("scores", initialScores);
    }
  }, [fetchedParameters, form]);

  const onSubmit = async (data: AssessmentFormData) => {
    try {
      const totalScore = Object.values(data.scores).reduce((sum, score) => sum + (score || 0), 0);
      const maxPossibleScore = parameters.length * 2; // Each parameter has max score of 2
      const status = totalScore >= 11 ? "satisfactory" : "unsatisfactory";

      const formattedData = {
        trainingId,
        userId: parseInt(data.userId),
        assessorId: parseInt(data.assessorId),
        assessmentDate: data.assessmentDate,
        frequency: data.frequency,
        comments: data.comments,
        totalScore,
        status,
        scores: Object.entries(data.scores).map(([parameterId, score]) => ({
          parameterId: parseInt(parameterId),
          score: score || 0,
        })),
      };

      await apiRequest("POST", "/api/training-assessments", formattedData);

      toast({
        title: "Success",
        description: "Training assessment has been saved.",
      });

      onSuccess?.();
    } catch (error) {
      console.error("Error saving assessment:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save assessment",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Training Assessment</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="userId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Employee</FormLabel>
                    <FormControl>
                      <EmployeeCombobox
                        value={field.value}
                        onValueChange={field.onChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="assessorId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Assessor</FormLabel>
                    <FormControl>
                      <EmployeeCombobox
                        value={field.value}
                        onValueChange={field.onChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="assessmentDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Assessment Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="frequency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Frequency</FormLabel>
                    <FormControl>
                      <Input {...field} defaultValue="Monthly" readOnly />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-4">Work Performance</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-12 gap-4 font-medium text-sm mb-2">
                  <div className="col-span-8">Parameter</div>
                  <div className="col-span-2 text-center">Max. Marks</div>
                  <div className="col-span-2 text-center">Marks Obtained</div>
                </div>
                {parameters.map((param) => (
                  <FormField
                    key={param.id}
                    control={form.control}
                    name={`scores.${param.id}`}
                    render={({ field }) => (
                      <FormItem>
                        <div className="grid grid-cols-12 gap-4 items-center">
                          <FormLabel className="col-span-8">{param.name}</FormLabel>
                          <div className="col-span-2 text-center">{param.maxScore}</div>
                          <FormControl>
                            <Input
                              type="number"
                              min={0}
                              max={2}
                              className="w-full col-span-2"
                              value={field.value || 0}
                              onChange={(e: ChangeEvent<HTMLInputElement>) => {
                                const value = e.target.valueAsNumber;
                                field.onChange(isNaN(value) ? 0 : Math.min(2, Math.max(0, value)));
                              }}
                            />
                          </FormControl>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ))}
                <div className="grid grid-cols-12 gap-4 font-medium pt-4 border-t">
                  <div className="col-span-8">TOTAL</div>
                  <div className="col-span-2 text-center">20</div>
                  <div className="col-span-2 text-center">
                    {currentTotalScore}
                  </div>
                </div>
              </div>
            </div>

            <FormField
              control={form.control}
              name="comments"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Assessor's Comments</FormLabel>
                  <FormControl>
                    <Textarea {...field} placeholder="Enter any additional comments" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="text-sm text-muted-foreground mt-4">
              <p>If an employee fails to utilize the acquired skills from the training course, put the comments accordingly:</p>
              <p>(a) Satisfactory Score- 11 or above</p>
              <p>(b) Un-satisfactory score- 10 or &lt;10</p>
            </div>

            <Button type="submit" className="w-full">Submit Assessment</Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
} 