import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Fingerprint, QrCode, BadgeCheck, Info } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { QRCodeScanner } from "@/components/common/QRCodeScanner"; // Added import

export default function QuickAttendance() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient(); // Added useQueryClient
  const [isScanning, setIsScanning] = useState(false);
  const scannerRef = useRef<HTMLDivElement>(null);
  const [scannedData, setScannedData] = useState(''); // Added state for scanned data

  const markAttendanceMutation = useMutation({
    mutationFn: async (data: { userId: number; checkInMethod: string; qrCode?: string }) => { // Added qrCode
      const res = await apiRequest('POST', '/api/attendance', {
        userId: data.userId,
        date: new Date().toISOString().split('T')[0],
        checkInTime: new Date().toTimeString().split(' ')[0],
        checkInMethod: data.checkInMethod,
        status: 'present',
        qrCode: data.qrCode // Added qrCode to the request
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/attendance/today'] });
      toast({
        title: "Attendance marked!",
        description: "Your attendance has been successfully recorded.",
      });
      setIsScanning(false);
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Failed to mark attendance",
        description: (error as Error).message || "Please try again later",
      });
      setIsScanning(false);
    }
  });

  const handleQRScan = () => {
    setIsScanning(true);
    // In a real app, this would initialize a QR scanner
    // For demo, we'll simulate a successful scan after a delay
    setTimeout(() => {
      if (user) {
          //Simulate scan - replace with actual QRCodeScanner component
          const simulatedData = "SimulatedQRCodeData";
          handleScan(simulatedData);
      }
    }, 2000);
  };

  const handleScan = async (data: string) => {
    if (data) {
      try {
        const response = await apiRequest('POST', '/api/attendance', {
          qrCode: data,
          date: new Date().toISOString(),
          checkInMethod: 'qr_code'
        });

        if (!response.ok) {
          throw new Error('Failed to record attendance');
        }

        await queryClient.invalidateQueries({ queryKey: ['/api/attendance/today'] });
        await queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });

        toast({
          title: "Attendance recorded",
          description: "Successfully recorded attendance via QR code",
        });
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Error recording attendance",
          description: (error as Error).message,
        });
      }
    }
    setIsScanning(false); // added to stop scanning animation
  };


  const handleBiometric = () => {
    if (user) {
      markAttendanceMutation.mutate({ 
        userId: user.id, 
        checkInMethod: 'biometric' 
      });
    }
  };

  const handleManualEntry = () => {
    if (user) {
      markAttendanceMutation.mutate({ 
        userId: user.id, 
        checkInMethod: 'manual' 
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Quick Attendance</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center mb-6">
          <QRCodeScanner onScan={handleScan} /> {/* Replaced placeholder with QRCodeScanner */}
          <Button 
            className="w-full mb-2" 
            onClick={handleQRScan}
            disabled={isScanning || markAttendanceMutation.isPending}
          >
            {isScanning ? "Scanning..." : "Scan QR Code"}
          </Button>
          <p className="text-xs text-center text-neutral-500">
            Scan the QR code or use the options below
          </p>
        </div>

        <div className="space-y-3 mb-4">
          <Button 
            variant="outline" 
            className="w-full flex items-center justify-center"
            onClick={handleBiometric}
            disabled={markAttendanceMutation.isPending}
          >
            <Fingerprint className="h-4 w-4 mr-2" />
            <span>Biometric Verification</span>
          </Button>
          <Button 
            variant="outline" 
            className="w-full flex items-center justify-center"
            onClick={handleManualEntry}
            disabled={markAttendanceMutation.isPending}
          >
            <BadgeCheck className="h-4 w-4 mr-2" />
            <span>Employee ID Input</span>
          </Button>
        </div>

        <div className="px-4 py-3 bg-blue-50 rounded-lg flex items-start">
          <Info className="h-4 w-4 text-primary mr-2 mt-0.5" />
          <p className="text-xs text-neutral-700">
            Employees can mark attendance using any of the available methods. 
            For manual entry, please contact HR admin.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}