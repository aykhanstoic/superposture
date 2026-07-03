import {
  isPermissionGranted,
  requestPermission,
  sendNotification,
} from "@tauri-apps/plugin-notification";
import { getCurrentWindow } from "@tauri-apps/api/window";
import type { PostureResult } from "@/types";
import { isTauri } from "@/utils";
import { usePostureStore } from "@/store/postureStore";
import { useSettingsStore } from "@/store/settingsStore";

export async function ensureNotificationPermission(): Promise<boolean> {
  if (!isTauri()) return false;

  let granted = await isPermissionGranted();
  if (!granted) {
    const permission = await requestPermission();
    granted = permission === "granted";
  }
  return granted;
}

function buildReminderBody(result: PostureResult): string {
  const topIssue = [...result.issues].sort(
    (a, b) => b.confidence - a.confidence,
  )[0];
  const score = Math.round(result.score);
  if (topIssue) {
    return `Score ${score} — ${topIssue.label}. Straighten up.`;
  }
  return `Score ${score}. Straighten your back.`;
}

export async function showPostureReminder(
  playSound: boolean,
  result: PostureResult,
): Promise<void> {
  const body = buildReminderBody(result);

  if (!isTauri()) {
    if (Notification.permission === "granted") {
      new Notification("PostureGuard", { body });
    }
    return;
  }

  const granted = await ensureNotificationPermission();
  if (!granted) return;

  await sendNotification({
    title: "PostureGuard",
    body,
    sound: playSound ? "default" : undefined,
  });

  useSettingsStore.getState().setShowCameraPreview(true);
  usePostureStore.getState().requestPostureAlert();

  try {
    const win = getCurrentWindow();
    await win.show();
    await win.setFocus();
  } catch {
    // Non-fatal if window show fails
  }
}
