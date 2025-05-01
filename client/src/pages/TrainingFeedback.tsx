import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { TrainingFeedbackForm } from "@/components/training/TrainingFeedbackForm";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/lib/auth";

export default function TrainingFeedback() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const { authState } = useAuth();
  const trainingId = parseInt(id || "0");
  
  console.log("TrainingFeedback component rendered");
  console.log("Current location:", location);
  console.log("Route params:", useParams());
  console.log("ID from params:", id, "parsed to:", trainingId);

  const { data: training, isLoading, error } = useQuery({
    queryKey: ["training", trainingId],
    queryFn: async () => {
      console.log("Fetching training data for ID:", trainingId);
      const response = await fetch(`/api/training-records/${trainingId}/feedback`);
      console.log("API response status:", response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("API error response:", errorText);
        throw new Error(`Failed to fetch training record: ${errorText}`);
      }
      
      const data = await response.json();
      console.log("Training data received:", data);
      return data;
    },
    enabled: !!trainingId,
  });

  console.log("Query state - isLoading:", isLoading, "error:", error, "data:", training);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (error) {
    console.error("Error in TrainingFeedback component:", error);
    return <div>Error: {error instanceof Error ? error.message : "Unknown error"}</div>;
  }

  if (!training) {
    return <div>Training not found</div>;
  }

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>Training Feedback - {training.trainingTitle}</CardTitle>
        </CardHeader>
        <CardContent>
          <TrainingFeedbackForm 
            trainingId={trainingId} 
            onSuccess={() => {
              // Show success message and redirect
              alert("Thank you for your feedback!");
              if (!authState.isAuthenticated) {
                window.close();
              }
            }} 
          />
        </CardContent>
      </Card>
    </div>
  );
} 