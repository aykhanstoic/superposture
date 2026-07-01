import { useSettingsStore } from "@/store/settingsStore";
import { useMonitoring } from "@/components/monitor/MonitoringProvider";
import { CameraPreview } from "@/components/monitor/CameraPreview";
import { PostureFeedback } from "@/components/monitor/PostureFeedback";
import { IssueList } from "@/components/monitor/IssueList";
import { Card } from "@/components/ui/Card";
import { usePostureStore } from "@/store/postureStore";

export function MonitorPage() {
  const { stream, canvasRef, error, isActive } = useMonitoring();
  const showPreview = useSettingsStore((s) => s.showCameraPreview);
  const paused = useSettingsStore((s) => s.paused);
  const isPoseReady = usePostureStore((s) => s.isPoseReady);
  const initStatus = usePostureStore((s) => s.initStatus);
  const initError = usePostureStore((s) => s.initError);
  const fps = usePostureStore((s) => s.fps);
  const currentResult = usePostureStore((s) => s.currentResult);

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <div className="space-y-5">
        <Card title="Live Monitor" subtitle="All processing happens locally on your device">
          {showPreview ? (
            <CameraPreview
              stream={stream}
              canvasRef={canvasRef}
              error={error}
              isActive={isActive}
            />
          ) : (
            <div className="flex h-64 flex-col items-center justify-center rounded-xl border border-dashed border-surface-border bg-white/[0.02]">
              <div className="mb-3 h-3 w-3 rounded-full bg-accent animate-pulse-soft" />
              <p className="text-sm text-white/50">Monitoring in background</p>
              <p className="mt-1 text-xs text-white/30">Camera preview hidden</p>
            </div>
          )}

          <div className="mt-3 flex items-center justify-between text-xs text-white/40">
            <span>
              {paused
                ? "Paused"
                : initError
                  ? initError
                  : isPoseReady
                    ? "Detecting posture"
                    : initStatus}
            </span>
            <span>{fps} FPS</span>
          </div>
        </Card>
      </div>

      <div className="space-y-5">
        <PostureFeedback result={currentResult} />
        <IssueList issues={currentResult?.issues ?? []} />
      </div>
    </div>
  );
}
