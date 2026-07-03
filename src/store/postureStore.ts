import { create } from "zustand";
import type { PostureResult } from "@/types";

interface PostureState {
  currentResult: PostureResult | null;
  isMonitoring: boolean;
  isPoseReady: boolean;
  initStatus: string;
  initError: string | null;
  fps: number;
  sessionId: number | null;
  monitoringSeconds: number;
  goodStreakSeconds: number;
  todayReminderCount: number;
  poorPostureSince: number | null;
  canSendReminder: boolean;
  postureAlertRequested: boolean;

  setCurrentResult: (result: PostureResult | null) => void;
  setIsMonitoring: (monitoring: boolean) => void;
  setIsPoseReady: (ready: boolean) => void;
  setInitStatus: (status: string) => void;
  setInitError: (error: string | null) => void;
  setFps: (fps: number) => void;
  setSessionId: (id: number | null) => void;
  incrementMonitoringSeconds: () => void;
  updateGoodStreak: (isGood: boolean) => void;
  incrementReminderCount: () => void;
  setPoorPostureSince: (timestamp: number | null) => void;
  setCanSendReminder: (can: boolean) => void;
  requestPostureAlert: () => void;
  clearPostureAlert: () => void;
  resetSessionStats: () => void;
}

export const usePostureStore = create<PostureState>((set) => ({
  currentResult: null,
  isMonitoring: false,
  isPoseReady: false,
  initStatus: "Initializing...",
  initError: null,
  fps: 0,
  sessionId: null,
  monitoringSeconds: 0,
  goodStreakSeconds: 0,
  todayReminderCount: 0,
  poorPostureSince: null,
  canSendReminder: true,
  postureAlertRequested: false,

  setCurrentResult: (currentResult) => set({ currentResult }),
  setIsMonitoring: (isMonitoring) => set({ isMonitoring }),
  setIsPoseReady: (isPoseReady) => set({ isPoseReady }),
  setInitStatus: (initStatus) => set({ initStatus }),
  setInitError: (initError) => set({ initError }),
  setFps: (fps) => set({ fps }),
  setSessionId: (sessionId) => set({ sessionId }),
  incrementMonitoringSeconds: () =>
    set((s) => ({ monitoringSeconds: s.monitoringSeconds + 1 })),
  updateGoodStreak: (isGood) =>
    set((s) => ({
      goodStreakSeconds: isGood ? s.goodStreakSeconds + 1 : 0,
    })),
  incrementReminderCount: () =>
    set((s) => ({ todayReminderCount: s.todayReminderCount + 1 })),
  setPoorPostureSince: (poorPostureSince) => set({ poorPostureSince }),
  setCanSendReminder: (canSendReminder) => set({ canSendReminder }),
  requestPostureAlert: () => set({ postureAlertRequested: true }),
  clearPostureAlert: () => set({ postureAlertRequested: false }),
  resetSessionStats: () =>
    set({
      monitoringSeconds: 0,
      goodStreakSeconds: 0,
      poorPostureSince: null,
    }),
}));
