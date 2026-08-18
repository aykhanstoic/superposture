import { useEffect, useState } from "react";
import { ActivationForm } from "@/components/license/ActivationForm";
import { getAutostartStatus, syncAutostart } from "@/services/autostart";
import { BUY_URL } from "@/services/license";
import { useLicenseStatus, useLicenseStore } from "@/store/licenseStore";
import { CAMERA_OFF_VALUE } from "@/types";
import { useSettingsStore } from "@/store/settingsStore";
import { Card } from "@/components/ui/Card";
import { Select } from "@/components/ui/Select";
import { Slider } from "@/components/ui/Slider";
import { Toggle } from "@/components/ui/Toggle";

function LicenseCard() {
  const status = useLicenseStatus();
  const licenseKey = useLicenseStore((s) => s.licenseKey);

  if (status.state === "activated") {
    return (
      <Card title="License" subtitle="Thanks for supporting UpSit!">
        <p className="text-sm text-white/70">
          Activated{licenseKey ? ` — ${licenseKey}` : ""}
        </p>
      </Card>
    );
  }

  return (
    <Card
      title="License"
      subtitle={
        status.state === "trial"
          ? `Free trial — ${status.daysLeft} day${status.daysLeft === 1 ? "" : "s"} left`
          : "Trial ended"
      }
    >
      <div className="space-y-3">
        <p className="text-xs text-white/40">
          Buy once at <span className="text-white/60">{BUY_URL}</span> — your
          key arrives by email.
        </p>
        <ActivationForm />
      </div>
    </Card>
  );
}

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
        <p className="text-xs text-white/40 pb-1">
          You'll get a nudge when your score stays below 50 for a couple of
          seconds.
        </p>
        <Slider
          label="Minimum time between reminders"
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
            [
              { value: CAMERA_OFF_VALUE, label: "Webcam off" },
              ...(devices.length > 0
                ? devices.map((d) => ({
                    value: d.deviceId,
                    label: d.label,
                  }))
                : [{ value: "", label: "No cameras found" }]),
            ]
          }
        />
        <p className="mt-2 text-xs text-white/40">
          Select <span className="text-white/60">Webcam off</span> to stop
          camera capture completely.
        </p>
      </Card>

      <Card title="General">
        <Toggle
          label="Launch on startup"
          description="Start UpSit when you log in"
          checked={settings.launchOnStartup}
          onChange={settings.setLaunchOnStartup}
        />
        <Toggle
          label="Notification sounds"
          checked={settings.notificationSounds}
          onChange={settings.setNotificationSounds}
        />
        <Toggle
          label="Slouch tick"
          description="Play a soft tick the moment your posture drops"
          checked={settings.slouchTickSound}
          onChange={settings.setSlouchTickSound}
        />
      </Card>

      <LicenseCard />

      <Card title="Privacy">
        <p className="text-sm leading-relaxed text-white/50">
          UpSit processes all webcam data locally. No frames are uploaded,
          no account is required, and the app works fully offline after
          installation.
        </p>
      </Card>
    </div>
  );
}
