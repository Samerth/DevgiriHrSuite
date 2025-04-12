
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

interface TrainingViewProps {
  id: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TrainingView({ id, open, onOpenChange }: TrainingViewProps) {
  const { data: training } = useQuery({
    queryKey: [`/api/training-records/${id}`],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/training-records/${id}`);
      return response;
    },
    enabled: open && !!id,
  });

  const { data: users = [] } = useQuery({
    queryKey: ['/api/users'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/users');
      return Array.isArray(response) ? response : [];
    },
    enabled: open,
  });

  const getUser = (id: number) => {
    return users.find(u => u.id === id);
  };

  if (!training) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{training.trainingTitle}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium mb-2">Basic Information</h4>
              <div className="space-y-2">
                <p><span className="font-medium">Type:</span> {training.trainingType}</p>
                <p><span className="font-medium">Date:</span> {new Date(training.date).toLocaleDateString()}</p>
                <p><span className="font-medium">Department:</span> {training.department}</p>
                <p><span className="font-medium">Status:</span> <Badge>{training.status}</Badge></p>
              </div>
            </div>
            <div>
              <h4 className="font-medium mb-2">Training Details</h4>
              <div className="space-y-2">
                <p><span className="font-medium">Venue:</span> {training.venue}</p>
                <p><span className="font-medium">Evaluation:</span> {training.evaluation}</p>
                <p><span className="font-medium">Effectiveness:</span> {training.effectiveness}</p>
                {training.assessmentScore && (
                  <p><span className="font-medium">Assessment Score:</span> {training.assessmentScore}</p>
                )}
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-medium mb-2">Objectives</h4>
            <p className="text-sm">{training.objectives}</p>
          </div>

          <div>
            <h4 className="font-medium mb-2">Materials</h4>
            <p className="text-sm">{training.materials}</p>
          </div>

          <div>
            <h4 className="font-medium mb-2">People</h4>
            <div className="space-y-2">
              <p>
                <span className="font-medium">Trainer:</span>{" "}
                {training.trainerId && getUser(training.trainerId)
                  ? `${getUser(training.trainerId)?.firstName} ${getUser(training.trainerId)?.lastName}`
                  : "Not assigned"}
              </p>
              <div>
                <span className="font-medium">Attendees:</span>
                <div className="flex flex-wrap gap-2 mt-1">
                  {training.attendees?.map((attendeeId: number) => {
                    const attendee = getUser(attendeeId);
                    return attendee ? (
                      <Badge key={attendeeId} variant="secondary">
                        {attendee.firstName} {attendee.lastName}
                      </Badge>
                    ) : null;
                  })}
                </div>
              </div>
            </div>
          </div>

          {training.notes && (
            <div>
              <h4 className="font-medium mb-2">Notes</h4>
              <p className="text-sm">{training.notes}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
