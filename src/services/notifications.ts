import {
  isPermissionGranted,
  requestPermission,
  sendNotification,
} from "@tauri-apps/plugin-notification";
import { isTauri } from "@/utils";

export async function ensureNotificationPermission(): Promise<boolean> {
  if (!isTauri()) return false;

  let granted = await isPermissionGranted();
  if (!granted) {
    const permission = await requestPermission();
    granted = permission === "granted";
  }
  return granted;
}

export async function showPostureReminder(playSound: boolean): Promise<void> {
  if (!isTauri()) {
    if (Notification.permission === "granted") {
      new Notification("PostureGuard", { body: "Straighten your back." });
    }
    return;
  }

  const granted = await ensureNotificationPermission();
  if (!granted) return;

  await sendNotification({
    title: "PostureGuard",
    body: "Straighten your back.",
    sound: playSound ? "default" : undefined,
  });
}
