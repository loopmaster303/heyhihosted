
"use client";

import React, { useState, useRef, useCallback, useEffect } from 'react';
import Webcam from 'react-webcam';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { Button } from '@/components/ui/button';
import { Camera, RefreshCcw, Check, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface CameraCaptureDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onCapture: (dataUri: string) => void;
}

const videoConstraints = {
  width: 1280,
  height: 720,
  facingMode: "user",
};

const CameraCaptureDialog: React.FC<CameraCaptureDialogProps> = ({
  isOpen,
  onOpenChange,
  onCapture,
}) => {
  const webcamRef = useRef<Webcam>(null);
  const [imgSrc, setImgSrc] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Reset state when dialog opens
    if (isOpen) {
      setImgSrc(null);
      setHasPermission(null);
      // Check for permission when component mounts and is open
      navigator.mediaDevices.getUserMedia({ video: true })
        .then(() => setHasPermission(true))
        .catch(() => setHasPermission(false));
    }
  }, [isOpen]);

  const capture = useCallback(() => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      setImgSrc(imageSrc);
    }
  }, [webcamRef]);

  const handleConfirm = () => {
    if (imgSrc) {
      onCapture(imgSrc);
      onOpenChange(false);
    }
  };

  const handleRetake = () => {
    setImgSrc(null);
  };
  
  const handleClose = () => {
    onOpenChange(false);
  }

  const renderContent = () => {
    if (hasPermission === false) {
      return (
          <div className="text-center py-8">
            <Camera className="mx-auto h-12 w-12 text-destructive" />
            <h3 className="mt-4 text-lg font-medium">Camera Access Denied</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Please enable camera permissions in your browser settings to use this feature.
            </p>
          </div>
      );
    }

    if (hasPermission === null) {
      return (
        <div className="text-center py-8">
            <p className="text-sm text-muted-foreground">Requesting camera permission...</p>
        </div>
      );
    }

    if (imgSrc) {
      return (
          <>
            <img src={imgSrc} alt="capture" className="rounded-md" />
            <AlertDialogFooter className="sm:justify-between mt-4">
                <Button variant="outline" onClick={handleRetake}>
                    <RefreshCcw className="mr-2 h-4 w-4" />
                    Retake Photo
                </Button>
                <Button onClick={handleConfirm}>
                    <Check className="mr-2 h-4 w-4" />
                    Use Photo
                </Button>
            </AlertDialogFooter>
          </>
      );
    }

    return (
        <>
            <Webcam
                audio={false}
                ref={webcamRef}
                screenshotFormat="image/jpeg"
                videoConstraints={videoConstraints}
                className="rounded-md"
                onUserMediaError={() => {
                    setHasPermission(false);
                    toast({
                        variant: 'destructive',
                        title: 'Camera Error',
                        description: 'Could not access the camera. Please check permissions and ensure it is not in use by another application.',
                    });
                }}
            />
            <AlertDialogFooter className="mt-4">
                <Button onClick={capture} className="w-full">
                    <Camera className="mr-2 h-4 w-4" />
                    Take Photo
                </Button>
            </AlertDialogFooter>
        </>
    );
  };


  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Analyze Image from Camera</AlertDialogTitle>
          <AlertDialogDescription>
            Position the object you want to analyze in front of the camera and take a photo.
          </AlertDialogDescription>
        </AlertDialogHeader>

        {renderContent()}

        {hasPermission === false && (
            <AlertDialogFooter>
                <AlertDialogCancel asChild>
                    <Button variant="outline" onClick={handleClose}>Close</Button>
                </AlertDialogCancel>
            </AlertDialogFooter>
        )}
        
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>

      </AlertDialogContent>
    </AlertDialog>
  );
};

export default CameraCaptureDialog;
