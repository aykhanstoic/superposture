interface CameraPreviewProps {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  error: string | null;
  isActive: boolean;
}

export function CameraPreview({
  canvasRef,
  error,
  isActive,
}: CameraPreviewProps) {
  if (error) {
    return (
      <div className="flex h-64 items-center justify-center rounded-xl border border-score-poor/30 bg-score-poor/5 p-6 text-center">
        <p className="text-sm text-score-poor">{error}</p>
      </div>
    );
  }

  return (
    <div className="relative h-64 overflow-hidden rounded-xl bg-black/40">
      <canvas
        ref={canvasRef}
        className="h-full w-full object-cover mirror"
      />
      {!isActive && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60">
          <p className="text-sm text-white/60">Starting camera...</p>
        </div>
      )}
    </div>
  );
}
