import { useEffect, useRef } from "react";

interface CameraPreviewProps {
  stream: MediaStream | null;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  error: string | null;
  isActive: boolean;
}

export function CameraPreview({
  stream,
  canvasRef,
  error,
  isActive,
}: CameraPreviewProps) {
  const displayVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const display = displayVideoRef.current;
    if (!display) return;

    if (stream) {
      display.srcObject = stream;
      display.play().catch(() => undefined);
    } else {
      display.srcObject = null;
    }
  }, [stream]);

  if (error) {
    return (
      <div className="flex h-64 items-center justify-center rounded-xl border border-score-poor/30 bg-score-poor/5 p-6 text-center">
        <p className="text-sm text-score-poor">{error}</p>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-xl bg-black/40">
      <video
        ref={displayVideoRef}
        className="h-64 w-full object-cover mirror"
        playsInline
        muted
        autoPlay
      />
      <canvas
        ref={canvasRef}
        className="pointer-events-none absolute inset-0 h-full w-full object-cover mirror"
      />
      {!isActive && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60">
          <p className="text-sm text-white/60">Starting camera...</p>
        </div>
      )}
    </div>
  );
}
