import { IconEyeOff, IconPause, IconPlay } from "@/components/ui/icons";

export interface LiveStatus {
  label: string;
  tone: "ok" | "dim" | "warn";
  pulse?: boolean;
}

interface CameraPreviewProps {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  error: string | null;
  isActive: boolean;
  status: LiveStatus;
  paused: boolean;
  onTogglePause: () => void;
  onHidePreview: () => void;
}

const TONE_DOT: Record<LiveStatus["tone"], string> = {
  ok: "bg-score-excellent",
  dim: "bg-white/40",
  warn: "bg-score-fair",
};

function OverlayButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      title={label}
      aria-label={label}
      className="flex h-9 items-center gap-1.5 rounded-lg bg-black/55 px-2.5 text-xs font-medium text-white/85 backdrop-blur-sm transition-colors hover:bg-black/75"
    >
      {children}
    </button>
  );
}

export function CameraPreview({
  canvasRef,
  error,
  isActive,
  status,
  paused,
  onTogglePause,
  onHidePreview,
}: CameraPreviewProps) {
  if (error) {
    return (
      <div className="flex aspect-video items-center justify-center rounded-2xl border border-score-poor/30 bg-score-poor/5 p-6 text-center">
        <p className="text-sm text-score-poor">{error}</p>
      </div>
    );
  }

  return (
    <div className="relative aspect-video overflow-hidden rounded-2xl border border-white/[0.06] bg-black/50">
      <canvas ref={canvasRef} className="h-full w-full object-cover mirror" />

      {!isActive && !paused && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60">
          <p className="text-sm text-white/60">Starting camera...</p>
        </div>
      )}

      {paused && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/70">
          <p className="text-sm font-medium text-white/80">
            Paused — camera released, light off
          </p>
          <button
            onClick={onTogglePause}
            className="flex items-center gap-2 rounded-xl bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent/90"
          >
            <IconPlay size={15} />
            Resume
          </button>
        </div>
      )}

      {/* Status pill */}
      <div className="absolute left-3 top-3 flex items-center gap-2 rounded-lg bg-black/55 px-2.5 py-1.5 backdrop-blur-sm">
        <span
          className={`h-2 w-2 rounded-full ${TONE_DOT[status.tone]} ${
            status.pulse ? "animate-pulse-soft" : ""
          }`}
        />
        <span className="text-xs font-medium text-white/85">{status.label}</span>
      </div>

      {/* Controls */}
      <div className="absolute right-3 top-3 flex gap-2">
        {!paused && (
          <OverlayButton label="Pause monitoring" onClick={onTogglePause}>
            <IconPause size={15} />
          </OverlayButton>
        )}
        <OverlayButton label="Hide preview" onClick={onHidePreview}>
          <IconEyeOff size={15} />
          Hide
        </OverlayButton>
      </div>
    </div>
  );
}
