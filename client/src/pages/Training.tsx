
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrainingRecord } from "@/components/training/TrainingRecord";

export default function Training() {
  const [showNewTrainingForm, setShowNewTrainingForm] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Training Management</h1>
        <Button onClick={() => setShowNewTrainingForm(true)}>
          Add Training Record
        </Button>
      </div>

      {showNewTrainingForm && (
        <Card>
          <CardHeader>
            <CardTitle>New Training Record</CardTitle>
          </CardHeader>
          <CardContent>
            <TrainingRecord />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
