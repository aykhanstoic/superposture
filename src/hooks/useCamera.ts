import { useCallback, useRef, useState } from "react";
import { useSettingsStore } from "@/store/settingsStore";
import { CAMERA_OFF_VALUE } from "@/types";

export interface CameraDevice {
  deviceId: string;
  label: string;
}

async function waitForVideoElement(
  videoRef: React.RefObject<HTMLVideoElement | null>,
  maxAttempts = 100,
): Promise<HTMLVideoElement> {
  for (let i = 0; i < maxAttempts; i++) {
    if (videoRef.current) return videoRef.current;
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  throw new Error("Video element not available");
}

async function requestCameraStream(
  cameraId: string,
): Promise<MediaStream | null> {
  const baseVideo = {
    width: { ideal: 480 },
    height: { ideal: 360 },
    frameRate: { ideal: 15, max: 15 },
  };

  if (cameraId === CAMERA_OFF_VALUE) {
    return null;
  }

  if (cameraId) {
    try {
      return await navigator.mediaDevices.getUserMedia({
        video: { ...baseVideo, deviceId: { exact: cameraId } },
        audio: false,
      });
    } catch {
      console.warn("Saved camera unavailable, falling back to default camera.");
      useSettingsStore.getState().setCameraId("");
    }
  }

  return navigator.mediaDevices.getUserMedia({
    video: baseVideo,
    audio: false,
  });
}

export function useCamera() {
  const cameraId = useSettingsStore((s) => s.cameraId);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [devices, setDevices] = useState<CameraDevice[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);

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
      return cameras;
    } catch {
      setError("Unable to list cameras.");
      return [];
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setStream(null);
    setIsActive(false);
  }, []);

  const startCamera = useCallback(async () => {
    setError(null);
    stopCamera();

    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("Camera API not available in this environment.");
      }

      const mediaStream = await requestCameraStream(cameraId);

      if (!mediaStream) {
        setStream(null);
        setIsActive(false);
        await enumerateDevices();
        return;
      }

      streamRef.current = mediaStream;

      const video = await waitForVideoElement(videoRef);
      video.srcObject = mediaStream;
      video.muted = true;
      video.playsInline = true;
      await video.play();

      setStream(mediaStream);
      setIsActive(true);
      await enumerateDevices();
    } catch (err) {
      console.error("Camera start failed:", err);
      const message =
        err instanceof Error ? err.message : "Camera permission denied.";
      setError(
        message.includes("NotAllowed")
          ? "Camera permission denied. Allow camera access in Windows Settings."
          : "Could not start camera. Check permissions and try again.",
      );
      setIsActive(false);
    }
  }, [cameraId, stopCamera, enumerateDevices]);

  return {
    videoRef,
    streamRef,
    stream,
    devices,
    error,
    isActive,
    startCamera,
    stopCamera,
    enumerateDevices,
  };
}
