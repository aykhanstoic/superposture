import { useEffect, useState } from "react";
import { useSettingsStore } from "@/store/settingsStore";
import { CAMERA_OFF_VALUE } from "@/types";
import { useMonitoring } from "@/components/monitor/MonitoringProvider";
import {
  CameraPreview,
  type LiveStatus,
} from "@/components/monitor/CameraPreview";
import { PostureFeedback } from "@/components/monitor/PostureFeedback";
import { IssueList } from "@/components/monitor/IssueList";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import type { Page } from "@/components/layout/AppLayout";
import {
  IconBell,
  IconCamera,
  IconEye,
  IconPlay,
  IconShield,
  IconTray,
} from "@/components/ui/icons";
import { usePostureStore } from "@/store/postureStore";

// A result older than this means nobody has been detected for a while.
const STALE_RESULT_MS = 4000;

function WelcomeCard({ onDismiss }: { onDismiss: () => void }) {
  const rows = [
    {
      icon: <IconShield size={17} />,
      text: "UpSit watches how you sit through your webcam. Every frame is analyzed on this device and never leaves it.",
    },
    {
      icon: <IconBell size={17} />,
      text: "Slouch for a few seconds and you'll get a gentle nudge to sit up.",
    },
    {
      icon: <IconTray size={17} />,
      text: "Close this window anytime — monitoring keeps running quietly in the system tray.",
    },
  ];

  return (
    <Card className="border-accent/25">
      <div className="flex items-start justify-between gap-6">
        <div>
          <h3 className="text-sm font-semibold text-white">
            Welcome to UpSit
          </h3>
          <div className="mt-3 space-y-2.5">
            {rows.map((row, i) => (
              <div key={i} className="flex items-start gap-3">
                <span className="mt-0.5 shrink-0 text-accent">{row.icon}</span>
                <p className="text-xs leading-relaxed text-white/60">
                  {row.text}
                </p>
              </div>
            ))}
          </div>
        </div>
        <Button variant="secondary" onClick={onDismiss} className="shrink-0">
          Got it
        </Button>
      </div>
    </Card>
  );
}

export function MonitorPage({ onNavigate }: { onNavigate: (p: Page) => void }) {
  const { canvasRef, error, isActive } = useMonitoring();
  const showPreview = useSettingsStore((s) => s.showCameraPreview);
  const setShowCameraPreview = useSettingsStore((s) => s.setShowCameraPreview);
  const introDismissed = useSettingsStore((s) => s.introDismissed);
  const setIntroDismissed = useSettingsStore((s) => s.setIntroDismissed);
  const cameraId = useSettingsStore((s) => s.cameraId);
  const paused = useSettingsStore((s) => s.paused);
  const togglePaused = useSettingsStore((s) => s.togglePaused);
  const isPoseReady = usePostureStore((s) => s.isPoseReady);
  const calibrating = usePostureStore((s) => s.calibrating);
  const initStatus = usePostureStore((s) => s.initStatus);
  const initError = usePostureStore((s) => s.initError);
  const currentResult = usePostureStore((s) => s.currentResult);

  // Ticks once a second so "no one in view" can be derived from staleness.
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const resultIsFresh =
    currentResult !== null && now - currentResult.timestamp < STALE_RESULT_MS;

  const status: LiveStatus = paused
    ? { label: "Paused", tone: "warn" }
    : initError
      ? { label: "Something went wrong", tone: "warn" }
      : !isPoseReady
        ? { label: initStatus, tone: "dim", pulse: true }
        : !resultIsFresh
          ? { label: "No one in view", tone: "dim" }
          : calibrating
            ? { label: "Calibrating to you...", tone: "dim", pulse: true }
            : { label: "Tracking", tone: "ok" };

  if (cameraId === CAMERA_OFF_VALUE) {
    return (
      <div className="mx-auto max-w-2xl space-y-5 animate-fade-in">
        {!introDismissed && (
          <WelcomeCard onDismiss={() => setIntroDismissed(true)} />
        )}
        <Card>
          <div className="flex flex-col items-center py-10 text-center">
            <span className="text-white/25">
              <IconCamera size={32} />
            </span>
            <p className="mt-4 text-sm font-medium text-white/70">
              The webcam is off
            </p>
            <p className="mt-1 max-w-xs text-xs leading-relaxed text-white/40">
              UpSit needs the camera to see your posture. Nothing is recorded
              or uploaded — analysis happens entirely on this device.
            </p>
            <Button className="mt-5" onClick={() => onNavigate("settings")}>
              Choose a camera in Settings
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-fade-in">
      {!introDismissed && (
        <WelcomeCard onDismiss={() => setIntroDismissed(true)} />
      )}

      <div className="grid gap-5 lg:grid-cols-5">
        <div className="lg:col-span-3">
          {showPreview ? (
            <CameraPreview
              canvasRef={canvasRef}
              error={error}
              isActive={isActive}
              status={status}
              paused={paused}
              onTogglePause={togglePaused}
              onHidePreview={() => setShowCameraPreview(false)}
            />
          ) : (
            <Card className="flex aspect-video flex-col items-center justify-center text-center">
              <div className="flex items-center gap-2">
                <span
                  className={`h-2 w-2 rounded-full ${
                    status.tone === "ok"
                      ? "bg-score-excellent"
                      : status.tone === "warn"
                        ? "bg-score-fair"
                        : "bg-white/40"
                  } ${status.pulse ? "animate-pulse-soft" : ""}`}
                />
                <p className="text-sm font-medium text-white/70">
                  {status.label}
                </p>
              </div>
              <p className="mt-2 max-w-xs text-xs leading-relaxed text-white/40">
                The preview is hidden — detection keeps running without it.
              </p>
              <div className="mt-5 flex gap-2">
                <Button
                  variant="secondary"
                  onClick={() => setShowCameraPreview(true)}
                >
                  <IconEye size={15} />
                  Show preview
                </Button>
                {paused ? (
                  <Button onClick={togglePaused}>
                    <IconPlay size={15} />
                    Resume
                  </Button>
                ) : (
                  <Button variant="ghost" onClick={togglePaused}>
                    Pause
                  </Button>
                )}
              </div>
            </Card>
          )}
        </div>

        <div className="lg:col-span-2">
          <PostureFeedback result={currentResult} calibrating={calibrating} />
        </div>
      </div>

      <IssueList
        issues={resultIsFresh ? (currentResult?.issues ?? []) : []}
        calibrating={calibrating}
        hasResult={resultIsFresh}
      />
    </div>
  );
}
