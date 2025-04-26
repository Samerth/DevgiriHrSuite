import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiRequest } from "@/lib/queryClient";
import { TrainingAssessment } from "./TrainingAssessment";
import { TrainingFeedbackForm } from "./TrainingFeedbackForm";

interface TrainingRecord {
  id: number;
  trainingTitle: string;
  trainingType: string;
  date: string;
  end_date: string;
  department: string;
  status: string;
  trainerId: number | null;
  venue?: string;
  objectives?: string;
  materials?: string;
  evaluation?: string;
  effectiveness?: string;
  notes?: string;
  attendees?: number[];
  assessmentScore?: number;
  start_time?: string;
  end_time?: string;
  scopeOfTraining?: string[];
  trainer?: {
    firstName: string;
    lastName: string;
  } | null;
  guestSpeaker?: string;
}

interface Assessment {
  assessment: {
    id: number;
    trainingId: number;
    userId: number;
    assessorId: number;
    assessmentDate: string;
    frequency: string;
    totalScore: number;
    status: string;
    comments?: string;
  };
  user: {
    id: number;
    firstName: string;
    lastName: string;
  } | null;
  assessor: {
    id: number;
    firstName: string;
    lastName: string;
  } | null;
  scores: {
    id: number;
    assessmentId: number;
    parameterId: number;
    score: number;
  }[];
}

interface Feedback {
  id: number;
  trainingId: number;
  userId: number;
  isEffective: boolean;
  trainingAidsGood: boolean;
  durationSufficient: boolean;
  contentExplained: boolean;
  conductedProperly: boolean;
  learningEnvironment: boolean;
  helpfulForWork: boolean;
  additionalTopics: string | null;
  keyLearnings: string | null;
  specialObservations: string | null;
  user: {
    id: number;
    firstName: string;
    lastName: string;
  } | null;
}

interface TrainingViewProps {
  id: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const parameterNames = {
  1: 'Operating process for different products',
  2: 'Knowledge regarding his Tools & Equipments',
  3: 'Awareness regarding products defects',
  4: 'Knowledge regarding Procedure for Broken Needle',
  5: 'Awareness regarding waste control',
  6: 'Use of refrence/approved samples',
  7: 'Knowledge regarding Buyers product protocol',
  8: 'Effective communication skills',
  9: 'Knowledge of safe working methods',
  10: 'Knowledge regarding machine setting'
};

export function TrainingView({ id, open, onOpenChange }: TrainingViewProps) {
  const [activeTab, setActiveTab] = useState("details");
  const [showAssessmentForm, setShowAssessmentForm] = useState(false);
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);

  const { data: training, isLoading: isTrainingLoading } = useQuery<TrainingRecord>({
    queryKey: ["training-record", id],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/training-records/${id}`);
      if (!response.ok) {
        throw new Error("Failed to fetch training record");
      }
      const data = await response.json();
      return data;
    },
    enabled: !!id,
  });

  const { data: assessmentsData, isLoading: isAssessmentsLoading } = useQuery<Assessment[]>({
    queryKey: ["training-assessments", id],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/training-assessments/${id}`);
      if (!response.ok) {
        throw new Error("Failed to fetch assessments");
      }
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    },
    enabled: !!id,
  });

  const { data: feedbackData, isLoading: isFeedbackLoading } = useQuery<Feedback[]>({
    queryKey: ["training-feedback", id],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/training-feedback/${id}`);
      if (!response.ok) {
        throw new Error("Failed to fetch feedback");
      }
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    },
    enabled: !!id,
  });

  const assessments = assessmentsData || [];
  const feedback = feedbackData || [];

  if (isTrainingLoading || !training) {
    return null;
  }

  const handleAssessmentSuccess = () => {
    setShowAssessmentForm(false);
  };

  const handleFeedbackSuccess = () => {
    setShowFeedbackForm(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" aria-describedby="training-view-description">
        <DialogHeader>
          <DialogTitle>{training.trainingTitle}</DialogTitle>
          <p id="training-view-description" className="text-sm text-muted-foreground">
            View and manage training details and assessments
          </p>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="overflow-hidden">
          <TabsList>
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="assessments">Assessments</TabsTrigger>
            <TabsTrigger value="feedback">Feedback</TabsTrigger>
          </TabsList>

          <TabsContent value="details">
            <div className="grid gap-6">
              <Card>
                <CardContent className="pt-6">
                  <h3 className="font-semibold mb-4">Training Details</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Training Title</p>
                      <p className="font-medium">{training.trainingTitle}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Start Date</p>
                      <p className="font-medium">{new Date(training.date).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">End Date</p>
                      <p className="font-medium">{new Date(training.end_date).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Start Time</p>
                      <p className="font-medium">{training.start_time}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">End Time</p>
                      <p className="font-medium">{training.end_time}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Department</p>
                      <p className="font-medium">{training.department || 'Not specified'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Status</p>
                      <div className="font-medium">
                        <Badge>{training.status}</Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <h3 className="font-semibold mb-4">Training Scope</h3>
                  <div className="space-y-2">
                    {training.scopeOfTraining?.map((scope: string) => (
                      <div key={scope} className="flex items-center">
                        <Badge variant="secondary" className="mr-2">✓</Badge>
                        <span>{scope}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <h3 className="font-semibold mb-4">Additional Information</h3>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Trainer</p>
                      <p className="font-medium">{training.trainer ? `${training.trainer.firstName} ${training.trainer.lastName}` : 'Not specified'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Guest Speakers / Trainers</p>
                      <p className="font-medium">{training.guestSpeaker || 'None'}</p>
                    </div>
                    {training.notes && (
                      <div>
                        <p className="text-sm text-muted-foreground">Notes</p>
                        <p className="font-medium">{training.notes}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <h3 className="font-semibold mb-4">Attendees</h3>
                  <div className="border rounded-md">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="px-4 py-2 text-left">S.No.</th>
                          <th className="px-4 py-2 text-left">Name</th>
                          <th className="px-4 py-2 text-left">Emp Code</th>
                          <th className="px-4 py-2 text-left">Department</th>
                        </tr>
                      </thead>
                      <tbody>
                        {training.attendees?.map((attendee: any, index: number) => (
                          <tr key={attendee.id} className="border-b">
                            <td className="px-4 py-2">{index + 1}</td>
                            <td className="px-4 py-2">{attendee.firstName} {attendee.lastName}</td>
                            <td className="px-4 py-2">{attendee.employeeCode}</td>
                            <td className="px-4 py-2">{attendee.department}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="assessments">
            <div className="space-y-6">
              {!showAssessmentForm && (
                <div className="flex justify-end">
                  <Button onClick={() => setShowAssessmentForm(true)}>
                    Add Assessment
                  </Button>
                </div>
              )}

              {showAssessmentForm ? (
                <TrainingAssessment
                  trainingId={id}
                  onSuccess={handleAssessmentSuccess}
                />
              ) : (
                <div className="space-y-4">
                  {assessments.map((assessment) => (
                    <Card key={assessment.assessment.id}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base">
                            Assessment on {new Date(assessment.assessment.assessmentDate).toLocaleDateString()}
                          </CardTitle>
                          <Badge>
                            {assessment.assessment.status}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-sm text-muted-foreground">Employee</p>
                              <p className="font-medium">
                                {assessment.user ? 
                                  `${assessment.user.firstName} ${assessment.user.lastName}` : 
                                  'Unknown'}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Assessor</p>
                              <p className="font-medium">
                                {assessment.assessor ? 
                                  `${assessment.assessor.firstName} ${assessment.assessor.lastName}` : 
                                  'Unknown'}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Total Score</p>
                              <p className="font-medium">{assessment.assessment.totalScore}</p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Frequency</p>
                              <p className="font-medium">{assessment.assessment.frequency}</p>
                            </div>
                          </div>

                          {assessment.assessment.comments && (
                            <div>
                              <p className="text-sm text-muted-foreground">Comments</p>
                              <p className="font-medium">{assessment.assessment.comments}</p>
                            </div>
                          )}

                          <div>
                            <p className="text-sm font-medium mb-2">Work Performance</p>
                            <div className="space-y-2">
                              {assessment.scores.map((score) => (
                                <div key={score.id} className="flex items-center justify-between">
                                  <span className="text-sm">{parameterNames[score.parameterId as keyof typeof parameterNames]}</span>
                                  <span className="font-medium">{score.score}</span>
                                </div>
                              ))}
                              <div className="flex items-center justify-between pt-2 border-t">
                                <span className="text-sm font-medium">TOTAL</span>
                                <span className="font-medium">{assessment.assessment.totalScore}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="feedback">
            <div className="space-y-6">
              {!showFeedbackForm && (
                <div className="flex justify-end">
                  <Button onClick={() => setShowFeedbackForm(true)}>
                    Add Feedback
                  </Button>
                </div>
              )}

              {showFeedbackForm ? (
                <TrainingFeedbackForm
                  trainingId={id}
                  onSuccess={handleFeedbackSuccess}
                />
              ) : (
                <div className="space-y-4">
                  {feedback.map((item) => (
                    <Card key={item.id}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base">
                            Feedback from {item.user ? `${item.user.firstName} ${item.user.lastName}` : 'Unknown'}
                          </CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-sm text-muted-foreground">Course Effective</p>
                              <p className="font-medium">{item.isEffective ? "Yes" : "No"}</p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Training Aids Good</p>
                              <p className="font-medium">{item.trainingAidsGood ? "Yes" : "No"}</p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Duration Sufficient</p>
                              <p className="font-medium">{item.durationSufficient ? "Yes" : "No"}</p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Content Explained Well</p>
                              <p className="font-medium">{item.contentExplained ? "Yes" : "No"}</p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Conducted Properly</p>
                              <p className="font-medium">{item.conductedProperly ? "Yes" : "No"}</p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Good Learning Environment</p>
                              <p className="font-medium">{item.learningEnvironment ? "Yes" : "No"}</p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Helpful for Work</p>
                              <p className="font-medium">{item.helpfulForWork ? "Yes" : "No"}</p>
                            </div>
                          </div>

                          {item.additionalTopics && (
                            <div>
                              <p className="text-sm text-muted-foreground">Additional Topics Suggested</p>
                              <p className="font-medium">{item.additionalTopics}</p>
                            </div>
                          )}

                          {item.keyLearnings && (
                            <div>
                              <p className="text-sm text-muted-foreground">Key Learnings</p>
                              <p className="font-medium">{item.keyLearnings}</p>
                            </div>
                          )}

                          {item.specialObservations && (
                            <div>
                              <p className="text-sm text-muted-foreground">Special Observations</p>
                              <p className="font-medium">{item.specialObservations}</p>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
