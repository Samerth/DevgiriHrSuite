import { useEffect, useRef } from 'react';
import QRCode from 'qrcode';

interface QRCodeGeneratorProps {
  value: string;
  size?: number;
  level?: 'L' | 'M' | 'Q' | 'H';
  includeMargin?: boolean;
  className?: string;
}

export default function QRCodeGenerator({
  value,
  size = 200,
  level = 'M',
  includeMargin = true,
  className = '',
}: QRCodeGeneratorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    // Generate QR code
    QRCode.toCanvas(
      canvasRef.current,
      value,
      {
        width: size,
        margin: includeMargin ? 4 : 0,
        errorCorrectionLevel: level,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      },
      (error) => {
        if (error) console.error('Error generating QR code:', error);
      }
    );
  }, [value, size, level, includeMargin]);

  return (
    <div className={`flex justify-center items-center ${className}`}>
      <canvas ref={canvasRef} />
    </div>
  );
}
