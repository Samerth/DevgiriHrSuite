import { useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

interface QRCodeScannerProps {
  onScan: (result: string) => void;
  fps?: number;
  qrbox?: number;
}

export default function QRCodeScanner({ onScan, fps = 10, qrbox = 250 }: QRCodeScannerProps) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Initialize scanner
    scannerRef.current = new Html5Qrcode('qr-scanner');
    
    // Start scanning
    const constraints = {
      fps,
      qrbox
    };
    
    scannerRef.current
      .start(
        { facingMode: 'environment' },
        constraints,
        (decodedText) => {
          onScan(decodedText);
          // Optionally stop scanning after successful scan
          if (scannerRef.current) {
            scannerRef.current.stop();
          }
        },
        (errorMessage) => {
          // Handle error silently
          console.log(errorMessage);
        }
      )
      .catch((err) => {
        console.error('Failed to start QR code scanner: ', err);
      });

    // Cleanup function
    return () => {
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current
          .stop()
          .catch((err) => console.error('Failed to stop QR code scanner: ', err));
      }
    };
  }, [onScan, fps, qrbox]);

  return <div id="qr-scanner" ref={containerRef} className="w-full h-full"></div>;
}
