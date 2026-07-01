import { useCallback, useEffect, useRef } from "react";
import { listen } from "@tauri-apps/api/event";
import { analyzePosture } from "@/analysis/postureAnalyzer";
import {
  endSession,
  initDatabase,
  saveScoreSample,
  startSession,
  updateDailyStats,
} from "@/database/db";
import { useCamera } from "@/hooks/useCamera";
import { PoseDetector, drawLandmarks } from "@/pose/detector";
import { LandmarkSmoother } from "@/pose/smoothing";
import { showPostureReminder } from "@/services/notifications";
import { usePostureStore } from "@/store/postureStore";
import { useSettingsStore } from "@/store/settingsStore";
import { isTauri } from "@/utils";

const SAMPLE_INTERVAL_MS = 5000;

export function usePostureMonitor(
  camera: ReturnType<typeof useCamera>,
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
) {
  const cameraId = useSettingsStore((s) => s.cameraId);
  const togglePaused = useSettingsStore((s) => s.togglePaused);

  const detectorRef = useRef<PoseDetector | null>(null);
  const smootherRef = useRef(new LandmarkSmoother());
  const rafRef = useRef(0);
  const lastSampleRef = useRef(0);
  const frameCountRef = useRef(0);
  const scoreAccumulatorRef = useRef<number[]>([]);
  const sessionReminderRef = useRef(0);

  const checkReminder = useCallback(() => {
    const { currentResult, poorPostureSince, canSendReminder } =
      usePostureStore.getState();
    const { reminderIntervalMinutes, notificationSounds } =
      useSettingsStore.getState();
    if (!currentResult) return;

    const now = Date.now();
    const isPoor = currentResult.status === "poor";

    if (isPoor) {
      if (poorPostureSince === null) {
        usePostureStore.getState().setPoorPostureSince(now);
      } else if (
        canSendReminder &&
        now - poorPostureSince >= reminderIntervalMinutes * 60 * 1000
      ) {
        showPostureReminder(notificationSounds);
        usePostureStore.getState().incrementReminderCount();
        sessionReminderRef.current += 1;
        usePostureStore.getState().setCanSendReminder(false);
      }
    } else if (
      currentResult.status === "good" ||
      currentResult.status === "excellent"
    ) {
      usePostureStore.getState().setPoorPostureSince(null);
      usePostureStore.getState().setCanSendReminder(true);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    let secondsInterval: ReturnType<typeof setInterval>;
    let fpsInterval: ReturnType<typeof setInterval>;

    async function init() {
      await initDatabase();
      const detector = new PoseDetector();
      await detector.initialize();
      if (!mounted) {
        detector.dispose();
        return;
      }
      detectorRef.current = detector;
      smootherRef.current.reset();

      usePostureStore.getState().setIsPoseReady(true);
      await camera.startCamera();
      if (!mounted) return;

      const id = await startSession();
      usePostureStore.getState().setSessionId(id);
      usePostureStore.getState().setIsMonitoring(true);
      scoreAccumulatorRef.current = [];
      sessionReminderRef.current = 0;

      const tick = (timestamp: number) => {
        if (!mounted) return;

        const video = camera.videoRef.current;
        const canvas = canvasRef.current;
        const detectorInstance = detectorRef.current;
        const isPaused = useSettingsStore.getState().paused;

        if (video && detectorInstance && camera.isActive && !isPaused) {
          const raw = detectorInstance.detect(video, timestamp);
          if (raw) {
            frameCountRef.current += 1;
            const smoothed = smootherRef.current.smooth(raw);
            const result = analyzePosture(
              smoothed,
              useSettingsStore.getState().sensitivity,
            );
            usePostureStore.getState().setCurrentResult(result);
            checkReminder();
            usePostureStore
              .getState()
              .updateGoodStreak(result.status === "good" || result.status === "excellent");

            const preview = useSettingsStore.getState().showCameraPreview;
            if (preview && canvas) {
              drawLandmarks(canvas, video, smoothed);
            } else if (canvas) {
              const ctx = canvas.getContext("2d");
              ctx?.clearRect(0, 0, canvas.width, canvas.height);
            }

            const now = performance.now();
            const sid = usePostureStore.getState().sessionId;
            if (sid && now - lastSampleRef.current >= SAMPLE_INTERVAL_MS) {
              lastSampleRef.current = now;
              scoreAccumulatorRef.current.push(result.score);
              saveScoreSample(sid, result.score);
            }
          }
        }

        rafRef.current = requestAnimationFrame(tick);
      };

      rafRef.current = requestAnimationFrame(tick);

      fpsInterval = setInterval(() => {
        usePostureStore.getState().setFps(frameCountRef.current);
        frameCountRef.current = 0;
      }, 1000);

      secondsInterval = setInterval(() => {
        if (!useSettingsStore.getState().paused) {
          usePostureStore.getState().incrementMonitoringSeconds();
        }
      }, 1000);
    }

    init();

    return () => {
      mounted = false;
      cancelAnimationFrame(rafRef.current);
      clearInterval(secondsInterval!);
      clearInterval(fpsInterval!);
      detectorRef.current?.dispose();
      detectorRef.current = null;
      camera.stopCamera();
      usePostureStore.getState().setIsMonitoring(false);

      const state = usePostureStore.getState();
      if (state.sessionId) {
        const scores = scoreAccumulatorRef.current;
        const avg =
          scores.length > 0
            ? scores.reduce((a, b) => a + b, 0) / scores.length
            : 0;
        endSession(
          state.sessionId,
          avg,
          state.monitoringSeconds,
          sessionReminderRef.current,
        );
        updateDailyStats(
          avg,
          state.monitoringSeconds,
          sessionReminderRef.current,
          state.goodStreakSeconds,
        );
      }
    };
  }, [cameraId, camera, canvasRef, checkReminder]);

  useEffect(() => {
    if (!isTauri()) return;
    const unlisten = listen("tray-pause-toggle", () => togglePaused());
    return () => {
      unlisten.then((fn) => fn());
    };
  }, [togglePaused]);

  return {
    goodStreakSeconds: usePostureStore((s) => s.goodStreakSeconds),
    monitoringSeconds: usePostureStore((s) => s.monitoringSeconds),
  };
}
