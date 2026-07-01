import { enable, disable, isEnabled } from "@tauri-apps/plugin-autostart";
import { isTauri } from "@/utils";

export async function syncAutostart(shouldEnable: boolean): Promise<void> {
  if (!isTauri()) return;

  try {
    const currentlyEnabled = await isEnabled();
    if (shouldEnable && !currentlyEnabled) {
      await enable();
    } else if (!shouldEnable && currentlyEnabled) {
      await disable();
    }
  } catch (err) {
    console.warn("Autostart sync failed:", err);
  }
}

export async function getAutostartStatus(): Promise<boolean> {
  if (!isTauri()) return false;
  try {
    return await isEnabled();
  } catch {
    return false;
  }
}
