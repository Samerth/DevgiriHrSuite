import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { TrainingView } from "@/components/training/TrainingView";
import { TrainingQRCode } from "@/components/training/TrainingQRCode";
import { useToast } from "@/hooks/use-toast";
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
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowUpDown } from "lucide-react";

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

type SortField = 'trainingTitle' | 'date' | 'department' | 'status';
type SortOrder = 'asc' | 'desc';

export default function Training() {
  const { toast } = useToast();
  const [showNewTrainingForm, setShowNewTrainingForm] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [showQRDialog, setShowQRDialog] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [trainingRecords, setTrainingRecords] = useState<TrainingRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

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

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const filteredAndSortedRecords = trainingRecords
    .filter(record => {
      const matchesSearch = record.trainingTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          record.trainingType.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesDepartment = departmentFilter === 'all' || record.department === departmentFilter;
      const matchesStatus = statusFilter === 'all' || record.status === statusFilter;
      return matchesSearch && matchesDepartment && matchesStatus;
    })
    .sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];
      const modifier = sortOrder === 'asc' ? 1 : -1;

      if (sortField === 'date') {
        return modifier * (new Date(aValue).getTime() - new Date(bValue).getTime());
      }
      return modifier * String(aValue).localeCompare(String(bValue));
    });

  const uniqueDepartments = Array.from(new Set(trainingRecords.map(record => record.department).filter(Boolean)));
  const uniqueStatuses = Array.from(new Set(trainingRecords.map(record => record.status).filter(Boolean)));

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
          <div className="flex flex-col gap-4 mb-4">
            <div className="flex gap-4">
              <Input
                placeholder="Search by title or type..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
              <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  {uniqueDepartments.map(dept => (
                    <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {uniqueStatuses.map(status => (
                    <SelectItem key={status} value={status}>{status}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading training records...</p>
          ) : filteredAndSortedRecords.length === 0 ? (
            <p className="text-sm text-muted-foreground">No training records found.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead 
                    className="cursor-pointer" 
                    onClick={() => handleSort('trainingTitle')}
                  >
                    <div className="flex items-center">
                      Title
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </div>
                  </TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead 
                    className="cursor-pointer" 
                    onClick={() => handleSort('date')}
                  >
                    <div className="flex items-center">
                      Date
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer" 
                    onClick={() => handleSort('department')}
                  >
                    <div className="flex items-center">
                      Department
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer" 
                    onClick={() => handleSort('status')}
                  >
                    <div className="flex items-center">
                      Status
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </div>
                  </TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAndSortedRecords.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell>{record.trainingTitle}</TableCell>
                    <TableCell className="capitalize">{record.trainingType}</TableCell>
                    <TableCell>{new Date(record.date).toLocaleDateString()}</TableCell>
                    <TableCell>{record.department}</TableCell>
                    <TableCell className="capitalize">{record.status}</TableCell>
                    <TableCell>{record.notes || '-'}</TableCell>
                    <TableCell className="space-x-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          setSelectedId(record.id);
                          setShowViewDialog(true);
                        }}
                      >
                        View
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedId(record.id);
                          setShowQRDialog(true);
                        }}
                      >
                        QR Code
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={async () => {
                          try {
                            await apiRequest('DELETE', `/api/training-records/${record.id}`);
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

      {selectedId && (
        <>
          <TrainingView
            id={selectedId}
            open={showViewDialog}
            onOpenChange={setShowViewDialog}
          />
          <TrainingQRCode
            trainingId={selectedId}
            open={showQRDialog}
            onOpenChange={setShowQRDialog}
          />
        </>
      )}
    </div>
  );
}
