import { QRCodeSVG } from 'qrcode.react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { config } from "@/config";

interface TrainingQRCodeProps {
  trainingId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TrainingQRCode({ trainingId, open, onOpenChange }: TrainingQRCodeProps) {
  const feedbackUrl = `${config.baseUrl}/training-feedback/${trainingId}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Training Feedback QR Code</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center space-y-4 p-4">
          <QRCodeSVG 
            value={feedbackUrl}
            size={200}
            level="H"
            includeMargin={true}
          />
          <p className="text-sm text-muted-foreground text-center">
            Scan this QR code to submit feedback for this training
          </p>
          <Button
            variant="outline"
            onClick={() => {
              // Create a temporary link to download the QR code
              const svg = document.querySelector('svg');
              if (svg) {
                const svgData = new XMLSerializer().serializeToString(svg);
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                const img = new Image();
                img.onload = () => {
                  canvas.width = img.width;
                  canvas.height = img.height;
                  ctx?.drawImage(img, 0, 0);
                  const pngFile = canvas.toDataURL('image/png');
                  const downloadLink = document.createElement('a');
                  downloadLink.download = `training-feedback-qr-${trainingId}.png`;
                  downloadLink.href = pngFile;
                  downloadLink.click();
                };
                img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
              }
            }}
          >
            Download QR Code
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
} 