import { useCallback, useEffect, useRef, useState } from "react";
import { useSettingsStore } from "@/store/settingsStore";

export interface CameraDevice {
  deviceId: string;
  label: string;
}

export function useCamera() {
  const cameraId = useSettingsStore((s) => s.cameraId);
  const setCameraId = useSettingsStore((s) => s.setCameraId);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [devices, setDevices] = useState<CameraDevice[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isActive, setIsActive] = useState(false);

  const enumerateDevices = useCallback(async () => {
    try {
      const allDevices = await navigator.mediaDevices.enumerateDevices();
      const cameras = allDevices
        .filter((d) => d.kind === "videoinput")
        .map((d, i) => ({
          deviceId: d.deviceId,
          label: d.label || `Camera ${i + 1}`,
        }));
      setDevices(cameras);
      if (!cameraId && cameras.length > 0) {
        setCameraId(cameras[0].deviceId);
      }
    } catch {
      setError("Unable to list cameras.");
    }
  }, [cameraId, setCameraId]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsActive(false);
  }, []);

  const startCamera = useCallback(async () => {
    setError(null);
    stopCamera();

    try {
      const constraints: MediaStreamConstraints = {
        video: {
          deviceId: cameraId ? { exact: cameraId } : undefined,
          width: { ideal: 640 },
          height: { ideal: 480 },
          frameRate: { ideal: 30, max: 30 },
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setIsActive(true);
      await enumerateDevices();
    } catch {
      setError("Camera permission denied or unavailable.");
      setIsActive(false);
    }
  }, [cameraId, stopCamera, enumerateDevices]);

  useEffect(() => {
    return () => stopCamera();
  }, [stopCamera]);

  return {
    videoRef,
    devices,
    error,
    isActive,
    startCamera,
    stopCamera,
    enumerateDevices,
  };
}
