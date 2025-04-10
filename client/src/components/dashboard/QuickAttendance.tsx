import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Fingerprint, QrCode, BadgeCheck, Info } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import QRCodeScanner from "@/components/common/QRCodeScanner";

export default function QuickAttendance() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isScanning, setIsScanning] = useState(false);
  const scannerRef = useRef<HTMLDivElement>(null);

  const markAttendanceMutation = useMutation({
    mutationFn: async (data: { userId: number; checkInMethod: string }) => {
      const now = new Date();
      const formattedDate = now.toISOString().split('T')[0];
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const seconds = String(now.getSeconds()).padStart(2, '0');
      const formattedTime = `${hours}:${minutes}:${seconds}`;

      const res = await apiRequest('POST', '/api/attendance', {
        userId: data.userId,
        date: formattedDate,
        checkInTime: formattedTime,
        checkInMethod: data.checkInMethod,
        status: 'present'
      });
      return res.json();
    },
    onSuccess: () => {
      // Invalidate all relevant queries
      queryClient.invalidateQueries({ queryKey: ['/api/attendance/today'] });
      queryClient.invalidateQueries({ queryKey: ['/api/attendance/statistics'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
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
        markAttendanceMutation.mutate({ 
          userId: user.id, 
          checkInMethod: 'qr_code' 
        });
      }
    }, 2000);
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
          <div 
            ref={scannerRef}
            className={`w-32 h-32 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center mb-4 bg-gray-50 ${isScanning ? 'animate-pulse' : ''}`}
          >
            {isScanning ? (
              <QRCodeScanner onScan={(result) => {
                try {
                  const qrData = JSON.parse(result);
                  if (qrData.id) {
                    markAttendanceMutation.mutate({ 
                      userId: parseInt(qrData.id.replace('EMP', '')), 
                      checkInMethod: 'qr_code' 
                    },
                    {
                      onSuccess: () => {
                        setIsScanning(false);
                      }
                    });
                  }
                } catch (error) {
                  console.error('Error parsing QR code:', error);
                  toast({
                    variant: "destructive",
                    title: "Invalid QR code",
                    description: "The QR code format is not recognized."
                  });
                  setIsScanning(false);
                }
              }} />
            ) : (
              <QrCode className="h-12 w-12 text-neutral-400" />
            )}
          </div>
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
