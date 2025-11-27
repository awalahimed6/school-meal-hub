import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Camera, CameraOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface QRScannerProps {
  onStudentIdScanned: (studentId: string) => void;
}

export const QRScanner = ({ onStudentIdScanned }: QRScannerProps) => {
  const { toast } = useToast();
  const [isScanning, setIsScanning] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const qrCodeRegionId = "qr-reader";

  const startScanning = async () => {
    try {
      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode(qrCodeRegionId);
      }

      const config = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
      };

      await scannerRef.current.start(
        { facingMode: "environment" },
        config,
        (decodedText) => {
          console.log("QR Code scanned:", decodedText);
          onStudentIdScanned(decodedText);
          toast({
            title: "QR Code Scanned",
            description: `Student ID: ${decodedText}`,
          });
        },
        (errorMessage) => {
          // Ignore continuous scanning errors
          console.debug("QR scan error:", errorMessage);
        }
      );

      setIsScanning(true);
    } catch (error) {
      console.error("Error starting scanner:", error);
      toast({
        title: "Camera Error",
        description: "Could not access camera. Please check permissions.",
        variant: "destructive",
      });
    }
  };

  const stopScanning = async () => {
    if (scannerRef.current && isScanning) {
      try {
        await scannerRef.current.stop();
        setIsScanning(false);
      } catch (error) {
        console.error("Error stopping scanner:", error);
      }
    }
  };

  useEffect(() => {
    return () => {
      if (scannerRef.current && isScanning) {
        scannerRef.current.stop().catch(console.error);
      }
    };
  }, [isScanning]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>QR Code Scanner</CardTitle>
        <CardDescription>
          Scan a student's QR code for quick lookup
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div
          id={qrCodeRegionId}
          className="rounded-xl overflow-hidden border-2 border-border"
          style={{ minHeight: isScanning ? "300px" : "0px" }}
        />
        
        <Button
          onClick={isScanning ? stopScanning : startScanning}
          variant={isScanning ? "destructive" : "default"}
          className="w-full"
        >
          {isScanning ? (
            <>
              <CameraOff className="mr-2 h-4 w-4" />
              Stop Scanner
            </>
          ) : (
            <>
              <Camera className="mr-2 h-4 w-4" />
              Start Scanner
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};
