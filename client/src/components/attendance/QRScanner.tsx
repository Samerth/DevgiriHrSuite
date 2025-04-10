import { useState, useEffect, useRef } from "react";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { QrCode, CameraIcon, Fingerprint, Badge } from "lucide-react";
import { Input } from "@/components/ui/input";
import QRCodeScanner from "@/components/common/QRCodeScanner";

interface QRScannerProps {
  open: boolean;
  onClose: () => void;
}

export default function QRScanner({ open, onClose }: QRScannerProps) {
  const [activeTab, setActiveTab] = useState("qr");
  const [isScanning, setIsScanning] = useState(false);
  const [employeeId, setEmployeeId] = useState("");
  const { toast } = useToast();
  const { authState } = useAuth();
  const user = authState.user;

  const markAttendanceMutation = useMutation({
    mutationFn: async (data: { employeeId: string; checkInMethod: string }) => {
      // First, find the user by employee ID
      const searchResponse = await apiRequest('GET', `/api/users/search?q=${data.employeeId}`);
      const users = await searchResponse.json();

      // Find the user with the exact employee ID match
      const user = users.find((u: any) => u.employeeId === data.employeeId);

      if (!user) {
        throw new Error("Employee not found");
      }

      const now = new Date();

      // Create a proper ISO timestamp for the check-in time
      const checkInTime = now.toISOString();

      // Now use the user's ID for attendance
      const res = await apiRequest('POST', '/api/attendance', {
        userId: user.id,
        date: checkInTime, // Use the same timestamp for date
        checkInTime: checkInTime,
        checkInMethod: data.checkInMethod,
        status: 'present',
        checkOutTime: null,
        checkOutMethod: null,
        notes: null
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/attendance/today'] });
      toast({
        title: "Attendance marked!",
        description: "Your attendance has been successfully recorded.",
      });
      stopScanner();
      onClose();
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Failed to mark attendance",
        description: (error as Error).message || "Please try again later",
      });
      stopScanner();
    }
  });

  // Control the QR scanner state
  const startScanner = () => {
    setIsScanning(true);
  };

  const stopScanner = () => {
    setIsScanning(false);
  };

  const handleSuccessfulScan = async (qrData: string) => {
    try {
      // Parse the JSON data from the QR code
      const qrDataObj = JSON.parse(qrData);
      console.log("Parsed QR data:", qrDataObj);

      // Extract the employee ID from the QR data
      const scannedEmployeeId = qrDataObj.id;
      console.log("Employee ID from QR:", scannedEmployeeId);

      if (!scannedEmployeeId) {
        toast({
          variant: "destructive",
          title: "Invalid QR code",
          description: "The QR code doesn't contain a valid employee ID.",
        });
        return;
      }

      // First search for the user
      const searchResponse = await apiRequest('GET', `/api/users/search?q=${scannedEmployeeId}`);
      const users = await searchResponse.json();
      const user = users.find((u: any) => u.employeeId === scannedEmployeeId);

      if (!user) {
        toast({
          variant: "destructive",
          title: "Employee not found",
          description: "Could not find employee with this QR code.",
        });
        return;
      }

      // Check if already checked in today
      const now = new Date();
      const todayDate = now.toISOString().split('T')[0];
      const attendanceResponse = await apiRequest('GET', `/api/attendance/user/${user.id}?date=${todayDate}`);
      const existingAttendance = await attendanceResponse.json();

      if (existingAttendance && !existingAttendance.checkOutTime) {
        // Update with check-out
        const checkOutTime = now.toISOString().split('.')[0] + 'Z'; // Format as ISO string without milliseconds
        await apiRequest('PUT', `/api/attendance/${existingAttendance.id}`, {
          checkOutTime,
          checkOutMethod: 'qr_code'
        });

        toast({
          title: "Check-out recorded!",
          description: "Your check-out has been successfully recorded.",
        });
        queryClient.invalidateQueries({ queryKey: ['/api/attendance/today'] });
      } else {
        // New check-in
        markAttendanceMutation.mutate({ 
          employeeId: scannedEmployeeId, 
          checkInMethod: 'qr_code',
          date: todayDate,
          checkInTime: now.toTimeString().split(' ')[0],
          status: 'present'
        }, {
          onSuccess: () => {
            toast({
              title: "Check-in recorded!",
              description: "Your check-in has been successfully recorded.",
            });
          }
        });
      }
    } catch (error) {
      console.error("Error parsing QR code:", error);
      toast({
        variant: "destructive",
        title: "Invalid QR code",
        description: "The QR code format is not recognized.",
      });
    }
  };

  const handleBiometricVerification = () => {
    // In a real app, this would integrate with a biometric system
    // For demo purposes, we'll just simulate a successful verification
    if (user) {
      markAttendanceMutation.mutate({ 
        employeeId: user.employeeId, 
        checkInMethod: 'biometric' 
      });
    }
  };

  const handleEmployeeIdSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!employeeId.trim()) {
      toast({
        variant: "destructive",
        title: "Employee ID required",
        description: "Please enter a valid employee ID.",
      });
      return;
    }

    // Mark attendance using the employee ID
    markAttendanceMutation.mutate({ 
      employeeId: employeeId.trim(), 
      checkInMethod: 'manual'
    });
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, []);

  // Start/stop scanner when tab changes
  useEffect(() => {
    if (open && activeTab === 'qr') {
      startScanner();
    } else {
      stopScanner();
    }
  }, [open, activeTab]);

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Mark Attendance</DialogTitle>
          <DialogDescription>
            Use any of the methods below to mark your attendance.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="qr">QR Code</TabsTrigger>
            <TabsTrigger value="biometric">Biometric</TabsTrigger>
            <TabsTrigger value="id">Employee ID</TabsTrigger>
          </TabsList>

          <TabsContent value="qr" className="flex flex-col items-center">
            <div 
              className={`w-full h-48 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center relative overflow-hidden ${isScanning ? 'border-primary' : ''}`}
            >
              {isScanning ? (
                <div className="w-full h-full">
                  <QRCodeScanner onScan={handleSuccessfulScan} />
                </div>
              ) : (
                <div className="text-center">
                  <CameraIcon className="h-12 w-12 text-neutral-300 mx-auto mb-2" />
                  <p className="text-sm text-neutral-500">Camera access required for QR scanning</p>
                </div>
              )}
            </div>

            <p className="text-sm text-center mt-4 mb-2">
              {isScanning 
                ? "Scanning... Please position your QR code in the camera view." 
                : "Click below to start the QR code scanner."}
            </p>

            <Button 
              onClick={isScanning ? stopScanner : startScanner}
              variant={isScanning ? "outline" : "default"}
              className="mt-2"
            >
              {isScanning ? "Cancel Scan" : "Start Scanning"}
            </Button>
          </TabsContent>

          <TabsContent value="biometric" className="flex flex-col items-center">
            <div className="w-full h-48 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <Fingerprint className="h-16 w-16 text-neutral-300 mx-auto mb-2" />
                <p className="text-sm text-neutral-500">Use biometric verification</p>
              </div>
            </div>

            <p className="text-sm text-center mt-4 mb-2">
              Click below to initiate biometric verification.
            </p>

            <Button 
              onClick={handleBiometricVerification}
              disabled={markAttendanceMutation.isPending}
              className="mt-2"
            >
              {markAttendanceMutation.isPending ? "Verifying..." : "Verify Biometric"}
            </Button>
          </TabsContent>

          <TabsContent value="id" className="flex flex-col items-center">
            <div className="w-full">
              <form onSubmit={handleEmployeeIdSubmit} className="space-y-4">
                <div className="flex flex-col items-center justify-center h-48 border-2 border-dashed border-gray-300 rounded-lg">
                  <Badge className="h-16 w-16 text-neutral-300 mx-auto mb-4" />
                  <div className="text-center mb-4">
                    <p className="font-medium text-neutral-800">Enter Employee ID</p>
                    <p className="text-sm text-neutral-500">Please enter your employee ID number</p>
                  </div>
                  <Input
                    value={employeeId}
                    onChange={(e) => setEmployeeId(e.target.value)}
                    placeholder="e.g. EMP001"
                    className="max-w-xs"
                  />
                </div>

                <Button 
                  type="submit"
                  disabled={markAttendanceMutation.isPending || !employeeId}
                  className="w-full"
                >
                  {markAttendanceMutation.isPending ? "Submitting..." : "Submit ID"}
                </Button>
              </form>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="flex flex-col sm:flex-row sm:justify-between sm:space-x-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}