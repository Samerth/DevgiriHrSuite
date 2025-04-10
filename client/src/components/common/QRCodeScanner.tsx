import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

interface QRCodeScannerProps {
  onScan: (result: string) => void;
  fps?: number;
  qrbox?: number;
}

export default function QRCodeScanner({ onScan, fps = 10, qrbox = 250 }: QRCodeScannerProps) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastScannedData, setLastScannedData] = useState<string | null>(null);

  // Initialize scanner
  useEffect(() => {
    if (!containerRef.current || isInitialized) return;

    try {
      // Create a new instance
      const scanner = new Html5Qrcode('qr-scanner');
      scannerRef.current = scanner;
      
      // Configure scanner with square QR box
      const config = {
        fps,
        qrbox: {
          width: qrbox,
          height: qrbox
        },
        aspectRatio: 1.0,
        formatsToSupport: ['QR_CODE']
      };
      
      // Start scanning
      scanner.start(
        { facingMode: 'environment' },
        config,
        (decodedText) => {
          // Log the raw QR code data
          console.log('QR Code Data:', decodedText);
          setLastScannedData(decodedText);
          
          // Success callback
          onScan(decodedText);
          stopScanner();
        },
        (errorMessage) => {
          // Error callback - only log non-critical errors
          if (!errorMessage.includes('No MultiFormat Readers were able to detect the code')) {
            console.warn('QR Scanner warning:', errorMessage);
          }
        }
      )
      .then(() => {
        setIsInitialized(true);
        setError(null);
      })
      .catch((err) => {
        console.error('Failed to start QR code scanner:', err);
        setError('Failed to start camera. Please check permissions.');
      });
    } catch (err) {
      console.error('Error initializing QR scanner:', err);
      setError('Failed to initialize scanner.');
    }

    // Cleanup function
    return () => {
      stopScanner();
    };
  }, [onScan, fps, qrbox, isInitialized]);

  // Separate function to stop scanner
  const stopScanner = () => {
    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) {
          scannerRef.current.stop()
            .then(() => {
              console.log('Scanner stopped successfully');
              // Clear the scanner element
              const scannerElement = document.getElementById('qr-scanner');
              if (scannerElement) {
                scannerElement.innerHTML = '';
              }
            })
            .catch((err) => {
              console.error('Error stopping scanner:', err);
            });
        }
      } catch (err) {
        console.error('Error during scanner cleanup:', err);
      }
    }
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-center">
      <div 
        id="qr-scanner" 
        ref={containerRef} 
        className="w-full h-full relative flex items-center justify-center"
        style={{ minHeight: '300px' }}
      />
      {error && (
        <div className="mt-2 text-red-500 text-sm">
          {error}
        </div>
      )}
      {lastScannedData && (
        <div className="mt-2 text-sm">
          <p className="font-medium">Last scanned data:</p>
          <p className="text-xs bg-gray-100 p-2 rounded mt-1 break-all">
            {lastScannedData}
          </p>
        </div>
      )}
    </div>
  );
}
