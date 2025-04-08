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
    mutationFn: async (data: { userId: number; checkInMethod: string }) => {
      const res = await apiRequest('POST', '/api/attendance', {
        userId: data.userId,
        date: new Date().toISOString().split('T')[0],
        checkInTime: new Date().toTimeString().split(' ')[0],
        checkInMethod: data.checkInMethod,
        status: 'present'
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

  const handleSuccessfulScan = (qrData: string) => {
    // In a real app, the QR data would contain user ID or other identifiable information
    const userId = parseInt(qrData);
    
    if (isNaN(userId)) {
      toast({
        variant: "destructive",
        title: "Invalid QR code",
        description: "The QR code doesn't contain valid employee information.",
      });
      return;
    }
    
    markAttendanceMutation.mutate({ 
      userId, 
      checkInMethod: 'qr_code' 
    });
  };

  const handleBiometricVerification = () => {
    // In a real app, this would integrate with a biometric system
    // For demo purposes, we'll just simulate a successful verification
    if (user) {
      markAttendanceMutation.mutate({ 
        userId: user.id, 
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
    
    // In a real app, we would validate the employee ID against the database
    // For demo, we'll just use the current user's ID
    if (user) {
      markAttendanceMutation.mutate({ 
        userId: user.id, 
        checkInMethod: 'manual_id' 
      });
    }
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
