
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

interface TrainingViewProps {
  id: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TrainingView({ id, open, onOpenChange }: TrainingViewProps) {
  const { data: training, isLoading: isTrainingLoading } = useQuery({
    queryKey: [`/api/training-records/${id}`],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/training-records/${id}`);
      return response;
    },
    enabled: open && !!id,
  });

  const { data: users = [], isLoading: isUsersLoading } = useQuery({
    queryKey: ['/api/users'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/users');
      return Array.isArray(response) ? response : [];
    },
    enabled: open,
  });

  const getUser = (userId: number) => {
    if (!Array.isArray(users)) return null;
    return users.find((user: any) => user.id === userId);
  };

  console.log('Training data:', training);
  console.log('Users data:', users);

  if (isTrainingLoading || isUsersLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl">
          <div className="p-4 text-center">Loading...</div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!training) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl">
          <div className="p-4 text-center">No training record found</div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{training.trainingTitle}</DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-6">
          <Card>
            <CardContent className="pt-6">
              <h3 className="font-semibold mb-4">Basic Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Training Type</p>
                  <p className="font-medium">{training.trainingType}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Date</p>
                  <p className="font-medium">{new Date(training.date).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Department</p>
                  <p className="font-medium">{training.department}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <p className="font-medium">
                    <Badge>{training.status}</Badge>
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <h3 className="font-semibold mb-4">Details</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Venue</p>
                  <p className="font-medium">{training.venue || 'Not specified'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Objectives</p>
                  <p className="font-medium">{training.objectives || 'No objectives specified'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Materials</p>
                  <p className="font-medium">{training.materials || 'No materials specified'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Evaluation Method</p>
                  <p className="font-medium">{training.evaluation || 'Not specified'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Effectiveness</p>
                  <p className="font-medium">{training.effectiveness || 'Not evaluated'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <h3 className="font-semibold mb-4">People</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Trainer</p>
                  <p className="font-medium">
                    {training.trainerId && getUser(training.trainerId)
                      ? `${getUser(training.trainerId)?.firstName} ${getUser(training.trainerId)?.lastName}`
                      : 'Not assigned'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Attendees</p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {training.attendees?.map((attendeeId: number) => {
                      const attendee = getUser(attendeeId);
                      return attendee ? (
                        <Badge key={attendeeId} variant="outline">
                          {attendee.firstName} {attendee.lastName}
                        </Badge>
                      ) : null;
                    })}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {training.notes && (
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-4">Notes</h3>
                <p className="text-sm">{training.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
