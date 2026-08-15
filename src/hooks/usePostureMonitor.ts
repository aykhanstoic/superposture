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
import { clearCanvas, drawPreview } from "@/pose/detector";
import {
  computeTier,
  createSchedulerState,
  tierIntervalMs,
  updateSchedulerScore,
} from "@/pose/inferenceScheduler";
import { PoseBridge } from "@/pose/poseBridge";
import { LandmarkSmoother } from "@/pose/smoothing";
import { ScoreSmoother } from "@/pose/scoreSmoothing";
import { showPostureReminder } from "@/services/notifications";
import { usePostureStore } from "@/store/postureStore";
import { useSettingsStore } from "@/store/settingsStore";
import { CAMERA_OFF_VALUE, type PostureResult } from "@/types";
import { isTauri } from "@/utils";

const SAMPLE_INTERVAL_MS = 5000;
const UI_UPDATE_INTERVAL_MS = 125;
const POOR_SCORE_THRESHOLD = 50;
const RECOVER_SCORE_THRESHOLD = 55;
const POOR_SCORE_DEBOUNCE_MS = 2000;

function isVideoReady(video: HTMLVideoElement): boolean {
  return (
    video.srcObject !== null &&
    video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA &&
    video.videoWidth > 0 &&
    video.videoHeight > 0
  );
}

export function usePostureMonitor(
  camera: ReturnType<typeof useCamera>,
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
) {
  const cameraId = useSettingsStore((s) => s.cameraId);
  const togglePaused = useSettingsStore((s) => s.togglePaused);

  const cameraRef = useRef(camera);
  cameraRef.current = camera;

  const bridgeRef = useRef<PoseBridge | null>(null);
  const smootherRef = useRef(new LandmarkSmoother());
  const scoreSmootherRef = useRef(new ScoreSmoother());
  const monitorIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastSampleRef = useRef(0);
  const lastUiPushRef = useRef(0);
  const frameCountRef = useRef(0);
  const scoreAccumulatorRef = useRef<number[]>([]);
  const sessionReminderRef = useRef(0);
  const initGenerationRef = useRef(0);
  const detectingRef = useRef(false);
  const schedulerRef = useRef(createSchedulerState());
  const currentIntervalMsRef = useRef(tierIntervalMs("normal"));

  const resultRef = useRef<PostureResult | null>(null);
  const poorPostureSinceRef = useRef<number | null>(null);
  const lastReminderAtRef = useRef(0);

  const checkReminder = useCallback((result: PostureResult) => {
    const { reminderIntervalMinutes, notificationSounds } =
      useSettingsStore.getState();

    const now = Date.now();
    const isPoor = result.score < POOR_SCORE_THRESHOLD;

    if (isPoor) {
      if (poorPostureSinceRef.current === null) {
        poorPostureSinceRef.current = now;
        usePostureStore.getState().setPoorPostureSince(now);
      }

      const sustainedPoor =
        now - poorPostureSinceRef.current >= POOR_SCORE_DEBOUNCE_MS;
      const cooldownMs = reminderIntervalMinutes * 60 * 1000;
      const cooldownOk =
        lastReminderAtRef.current === 0 ||
        now - lastReminderAtRef.current >= cooldownMs;

      if (sustainedPoor && cooldownOk) {
        showPostureReminder(notificationSounds, result);
        usePostureStore.getState().incrementReminderCount();
        sessionReminderRef.current += 1;
        lastReminderAtRef.current = now;
      }
    } else if (result.score >= RECOVER_SCORE_THRESHOLD) {
      poorPostureSinceRef.current = null;
      lastReminderAtRef.current = 0;
      usePostureStore.getState().setPoorPostureSince(null);
    }
  }, []);

  const pushUiUpdate = useCallback((result: PostureResult) => {
    const now = performance.now();
    if (now - lastUiPushRef.current >= UI_UPDATE_INTERVAL_MS) {
      lastUiPushRef.current = now;
      usePostureStore.getState().setCurrentResult(result);
    }
  }, []);

  useEffect(() => {
    const generation = ++initGenerationRef.current;
    let mounted = true;
    let secondsInterval: ReturnType<typeof setInterval> | undefined;
    let fpsInterval: ReturnType<typeof setInterval> | undefined;

    const isCurrent = () =>
      mounted && initGenerationRef.current === generation;

    const clearMonitorInterval = () => {
      if (monitorIntervalRef.current) {
        clearInterval(monitorIntervalRef.current);
        monitorIntervalRef.current = null;
      }
    };

    const scheduleMonitor = (intervalMs: number) => {
      if (intervalMs === currentIntervalMsRef.current && monitorIntervalRef.current) {
        return;
      }
      currentIntervalMsRef.current = intervalMs;
      clearMonitorInterval();
      monitorIntervalRef.current = setInterval(tick, intervalMs);
    };

    const tick = async () => {
      if (!isCurrent() || detectingRef.current) return;

      const isPaused = useSettingsStore.getState().paused;
      if (isPaused) return;

      const video = cameraRef.current.videoRef.current;
      const canvas = canvasRef.current;
      const bridge = bridgeRef.current;

      if (!video || !bridge || !isVideoReady(video)) return;

      detectingRef.current = true;
      try {
        const raw = bridge.detect(video);
        const now = performance.now();

        if (raw) {
          frameCountRef.current += 1;
          const smoothed = smootherRef.current.smooth(raw);
          const rawResult = analyzePosture(
            smoothed,
            useSettingsStore.getState().sensitivity,
          );
          const result = scoreSmootherRef.current.smooth(rawResult);

          resultRef.current = result;
          checkReminder(result);
          pushUiUpdate(result);

          usePostureStore
            .getState()
            .updateGoodStreak(
              result.status === "good" || result.status === "excellent",
            );

          const preview = useSettingsStore.getState().showCameraPreview;
          if (preview && canvas) {
            drawPreview(canvas, video, smoothed);
          } else if (canvas) {
            clearCanvas(canvas);
          }

          const sid = usePostureStore.getState().sessionId;
          if (sid && now - lastSampleRef.current >= SAMPLE_INTERVAL_MS) {
            lastSampleRef.current = now;
            scoreAccumulatorRef.current.push(result.score);
            saveScoreSample(sid, result.score);
          }

          updateSchedulerScore(schedulerRef.current, result.score, now);
          const tier = computeTier(schedulerRef.current, result, now);
          schedulerRef.current.tier = tier;
          scheduleMonitor(tierIntervalMs(tier));
        } else {
          const tier = computeTier(schedulerRef.current, null, now);
          schedulerRef.current.tier = tier;
          scheduleMonitor(tierIntervalMs(tier));
        }
      } finally {
        detectingRef.current = false;
      }
    };

    async function init() {
      if (cameraId === CAMERA_OFF_VALUE) {
        usePostureStore.getState().setInitStatus("Webcam is off");
        usePostureStore.getState().setInitError(null);
        usePostureStore.getState().setIsPoseReady(false);
        usePostureStore.getState().setIsMonitoring(false);
        if (canvasRef.current) {
          clearCanvas(canvasRef.current);
        }
        return;
      }

      usePostureStore.getState().setInitStatus("Starting camera...");
      usePostureStore.getState().setInitError(null);
      usePostureStore.getState().setIsPoseReady(false);

      await cameraRef.current.startCamera();
      if (!isCurrent()) return;

      usePostureStore.getState().setInitStatus("Loading pose model...");

      const dbPromise = initDatabase().catch((err) => {
        console.warn("Database init failed (non-fatal):", err);
      });

      let bridge: PoseBridge;
      try {
        bridge = new PoseBridge();
        await bridge.initialize();
      } catch (err) {
        console.error("Pose model init failed:", err);
        if (isCurrent()) {
          const message =
            err instanceof Error ? err.message : "Unknown error";
          usePostureStore.getState().setInitError(
            `Could not load pose model: ${message}`,
          );
          usePostureStore.getState().setInitStatus("Model failed to load");
        }
        return;
      }

      if (!isCurrent()) {
        bridge.dispose();
        return;
      }

      bridgeRef.current = bridge;
      smootherRef.current.reset();
      scoreSmootherRef.current.reset();
      schedulerRef.current = createSchedulerState();
      resultRef.current = null;
      poorPostureSinceRef.current = null;

      usePostureStore.getState().setIsPoseReady(true);
      usePostureStore.getState().setInitStatus("Detecting posture");

      await dbPromise;
      if (!isCurrent()) return;

      const id = await startSession();
      usePostureStore.getState().setSessionId(id);
      usePostureStore.getState().setIsMonitoring(true);
      scoreAccumulatorRef.current = [];
      sessionReminderRef.current = 0;

      scheduleMonitor(tierIntervalMs("normal"));

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
      initGenerationRef.current += 1;
      clearMonitorInterval();
      if (secondsInterval) clearInterval(secondsInterval);
      if (fpsInterval) clearInterval(fpsInterval);
      bridgeRef.current?.dispose();
      bridgeRef.current = null;
      cameraRef.current.stopCamera();
      usePostureStore.getState().setIsMonitoring(false);
      usePostureStore.getState().setIsPoseReady(false);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cameraId]);

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
