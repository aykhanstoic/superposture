import {
  createContext,
  useContext,
  useRef,
  type ReactNode,
  type RefObject,
} from "react";
import { useCamera } from "@/hooks/useCamera";
import { usePostureMonitor } from "@/hooks/usePostureMonitor";

interface MonitoringContextValue {
  videoRef: RefObject<HTMLVideoElement | null>;
  canvasRef: RefObject<HTMLCanvasElement | null>;
  error: string | null;
  isActive: boolean;
}

const MonitoringContext = createContext<MonitoringContextValue | null>(null);

export function MonitoringProvider({ children }: { children: ReactNode }) {
  const camera = useCamera();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  usePostureMonitor(camera, canvasRef);

  return (
    <MonitoringContext.Provider
      value={{
        videoRef: camera.videoRef,
        canvasRef,
        error: camera.error,
        isActive: camera.isActive,
      }}
    >
      {/* Primary capture element — always mounted for MediaPipe */}
      <video
        ref={camera.videoRef}
        className="pointer-events-none fixed -left-[9999px] top-0 h-[480px] w-[640px] opacity-0"
        playsInline
        muted
        aria-hidden
      />
      {children}
    </MonitoringContext.Provider>
  );
}

export function useMonitoring() {
  const ctx = useContext(MonitoringContext);
  if (!ctx) {
    throw new Error("useMonitoring must be used within MonitoringProvider");
  }
  return ctx;
}
