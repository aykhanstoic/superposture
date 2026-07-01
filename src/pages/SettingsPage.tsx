import { useEffect, useState } from "react";
import { getAutostartStatus, syncAutostart } from "@/services/autostart";
import { useSettingsStore } from "@/store/settingsStore";
import { Card } from "@/components/ui/Card";
import { Select } from "@/components/ui/Select";
import { Slider } from "@/components/ui/Slider";
import { Toggle } from "@/components/ui/Toggle";

export function SettingsPage() {
  const settings = useSettingsStore();
  const [devices, setDevices] = useState<{ deviceId: string; label: string }[]>([]);

  useEffect(() => {
    navigator.mediaDevices.enumerateDevices().then((all) => {
      setDevices(
        all
          .filter((d) => d.kind === "videoinput")
          .map((d, i) => ({
            deviceId: d.deviceId,
            label: d.label || `Camera ${i + 1}`,
          })),
      );
    });
  }, []);

  useEffect(() => {
    syncAutostart(settings.launchOnStartup);
  }, [settings.launchOnStartup]);

  useEffect(() => {
    getAutostartStatus().then((enabled) => {
      if (enabled !== settings.launchOnStartup) {
        settings.setLaunchOnStartup(enabled);
      }
    });
  }, []);

  return (
    <div className="mx-auto max-w-xl space-y-5 animate-fade-in">
      <Card title="Monitoring">
        <Toggle
          label="Pause monitoring"
          description="Temporarily stop posture detection"
          checked={settings.paused}
          onChange={settings.setPaused}
        />
        <Toggle
          label="Show camera preview"
          description="Hide preview while keeping detection active"
          checked={settings.showCameraPreview}
          onChange={settings.setShowCameraPreview}
        />
        <Slider
          label="Reminder interval"
          value={settings.reminderIntervalMinutes}
          min={1}
          max={15}
          unit=" min"
          onChange={settings.setReminderInterval}
        />
        <Select
          label="Sensitivity"
          value={settings.sensitivity}
          onChange={(e) =>
            settings.setSensitivity(e.target.value as typeof settings.sensitivity)
          }
          options={[
            { value: "low", label: "Low — fewer alerts" },
            { value: "medium", label: "Medium — balanced" },
            { value: "high", label: "High — strict detection" },
          ]}
        />
      </Card>

      <Card title="Camera">
        <Select
          label="Select camera"
          value={settings.cameraId}
          onChange={(e) => settings.setCameraId(e.target.value)}
          options={
            devices.length > 0
              ? devices.map((d) => ({
                  value: d.deviceId,
                  label: d.label,
                }))
              : [{ value: "", label: "No cameras found" }]
          }
        />
      </Card>

      <Card title="General">
        <Toggle
          label="Launch on startup"
          description="Start PostureGuard when you log in"
          checked={settings.launchOnStartup}
          onChange={settings.setLaunchOnStartup}
        />
        <Toggle
          label="Dark mode"
          checked={settings.darkMode}
          onChange={settings.setDarkMode}
        />
        <Toggle
          label="Notification sounds"
          checked={settings.notificationSounds}
          onChange={settings.setNotificationSounds}
        />
      </Card>

      <Card title="Privacy">
        <p className="text-sm leading-relaxed text-white/50">
          PostureGuard processes all webcam data locally. No frames are uploaded,
          no account is required, and the app works fully offline after
          installation.
        </p>
      </Card>
    </div>
  );
}
