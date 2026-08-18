import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AppSettings } from "@/types";
import { DEFAULT_SETTINGS } from "@/types";

interface SettingsState extends AppSettings {
  setReminderInterval: (minutes: number) => void;
  setSensitivity: (sensitivity: AppSettings["sensitivity"]) => void;
  setCameraId: (id: string) => void;
  setLaunchOnStartup: (enabled: boolean) => void;
  setNotificationSounds: (enabled: boolean) => void;
  setPaused: (paused: boolean) => void;
  togglePaused: () => void;
  setShowCameraPreview: (show: boolean) => void;
  setIntroDismissed: (dismissed: boolean) => void;
  setSlouchTickSound: (enabled: boolean) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      ...DEFAULT_SETTINGS,
      setReminderInterval: (minutes) =>
        set({ reminderIntervalMinutes: minutes }),
      setSensitivity: (sensitivity) => set({ sensitivity }),
      setCameraId: (cameraId) => set({ cameraId }),
      setLaunchOnStartup: (launchOnStartup) => set({ launchOnStartup }),
      setNotificationSounds: (notificationSounds) =>
        set({ notificationSounds }),
      setPaused: (paused) => set({ paused }),
      togglePaused: () => set((s) => ({ paused: !s.paused })),
      setShowCameraPreview: (showCameraPreview) => set({ showCameraPreview }),
      setIntroDismissed: (introDismissed) => set({ introDismissed }),
      setSlouchTickSound: (slouchTickSound) => set({ slouchTickSound }),
    }),
    { name: "upsit-settings" },
  ),
);
