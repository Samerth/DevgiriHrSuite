import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrainingRecord } from "@/components/training/TrainingRecord";
import { apiRequest } from "@/lib/queryClient";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface TrainingRecord {
  id: number;
  trainingTitle: string;
  trainingType: string;
  date: string;
  department: string;
  status: string;
  trainerId: number | null;
  notes: string | null;
}

export default function Training() {
  const [showNewTrainingForm, setShowNewTrainingForm] = useState(false);
  const [trainingRecords, setTrainingRecords] = useState<TrainingRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchTrainingRecords = async () => {
    try {
      const response = await apiRequest('GET', '/api/training-records');
      
      // Check if the response is JSON
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const data = await response.json();
        setTrainingRecords(data);
      } else {
        // Handle non-JSON response (likely HTML error page)
        const text = await response.text();
        console.error('Received non-JSON response:', text.substring(0, 200) + '...');
        setTrainingRecords([]);
      }
    } catch (error) {
      console.error('Error fetching training records:', error);
      setTrainingRecords([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTrainingRecords();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Training Management</h1>
        <Button onClick={() => setShowNewTrainingForm(true)}>
          Add Training Record
        </Button>
      </div>

      {showNewTrainingForm && (
        <TrainingRecord onSuccess={() => {
          setShowNewTrainingForm(false);
          fetchTrainingRecords();
        }} />
      )}

      <Card>
        <CardHeader>
          <CardTitle>Training Records</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading training records...</p>
          ) : trainingRecords.length === 0 ? (
            <p className="text-sm text-muted-foreground">No training records found.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {trainingRecords.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell>{record.trainingTitle}</TableCell>
                    <TableCell className="capitalize">{record.trainingType}</TableCell>
                    <TableCell>{new Date(record.date).toLocaleDateString()}</TableCell>
                    <TableCell>{record.department}</TableCell>
                    <TableCell className="capitalize">{record.status}</TableCell>
                    <TableCell>{record.notes || '-'}</TableCell>
                    <TableCell>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={async () => {
                          try {
                            await fetch(`/api/training-records/${record.id}`, {
                              method: 'DELETE',
                            });
                            toast({
                              title: "Success",
                              description: "Training record deleted successfully",
                            });
                            fetchTrainingRecords();
                          } catch (error) {
                            toast({
                              variant: "destructive",
                              title: "Error",
                              description: "Failed to delete training record",
                            });
                          }
                        }}
                      >
                        Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
