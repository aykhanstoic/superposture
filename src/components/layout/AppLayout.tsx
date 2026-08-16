import type { ReactNode } from "react";
import { useLicenseStatus } from "@/store/licenseStore";
import { usePostureStore } from "@/store/postureStore";
import { useSettingsStore } from "@/store/settingsStore";
import { CAMERA_OFF_VALUE } from "@/types";
import {
  IconActivity,
  IconChart,
  IconClock,
  IconSettings,
} from "@/components/ui/icons";

type Page = "monitor" | "dashboard" | "history" | "settings";

interface SidebarProps {
  active: Page;
  onNavigate: (page: Page) => void;
}

const navItems: { id: Page; label: string; icon: ReactNode }[] = [
  { id: "monitor", label: "Monitor", icon: <IconActivity size={17} /> },
  { id: "dashboard", label: "Dashboard", icon: <IconChart size={17} /> },
  { id: "history", label: "History", icon: <IconClock size={17} /> },
  { id: "settings", label: "Settings", icon: <IconSettings size={17} /> },
];

export function Sidebar({ active, onNavigate }: SidebarProps) {
  const licenseStatus = useLicenseStatus();

  return (
    <aside className="flex w-56 shrink-0 flex-col border-r border-white/[0.06] bg-black/20 px-4 py-6">
      <div className="mb-8 flex items-center gap-3 px-2">
        <img src="/upsit.svg" alt="" className="h-9 w-9 rounded-xl" />
        <div>
          <h1 className="text-sm font-semibold tracking-tight text-white">
            UpSit
          </h1>
          <p className="text-[10px] uppercase tracking-widest text-white/35">
            Local & Private
          </p>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-1">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
              active === item.id
                ? "bg-accent/15 text-accent shadow-sm shadow-accent/10"
                : "text-white/50 hover:bg-white/5 hover:text-white/80"
            }`}
          >
            {item.icon}
            {item.label}
          </button>
        ))}
      </nav>

      {licenseStatus.state === "trial" && (
        <button
          onClick={() => onNavigate("settings")}
          className="mb-3 rounded-xl border border-accent/25 bg-accent/10 px-3 py-2 text-left text-[11px] leading-snug text-accent/90 transition-colors hover:bg-accent/15"
        >
          Trial — {licenseStatus.daysLeft} day
          {licenseStatus.daysLeft === 1 ? "" : "s"} left
          <span className="block text-[10px] text-white/40">
            Enter a key in Settings
          </span>
        </button>
      )}
      <p className="px-2 text-[10px] leading-relaxed text-white/25">
        Webcam data never leaves your device.
      </p>
    </aside>
  );
}

/** Always-visible monitoring state, independent of the current page. */
function StatusChip() {
  const paused = useSettingsStore((s) => s.paused);
  const cameraId = useSettingsStore((s) => s.cameraId);
  const isMonitoring = usePostureStore((s) => s.isMonitoring);
  const isPoseReady = usePostureStore((s) => s.isPoseReady);
  const initError = usePostureStore((s) => s.initError);

  const chip =
    cameraId === CAMERA_OFF_VALUE
      ? { label: "Camera off", dot: "bg-white/30" }
      : initError
        ? { label: "Error", dot: "bg-score-poor" }
        : paused
          ? { label: "Paused", dot: "bg-score-fair" }
          : isMonitoring && isPoseReady
            ? {
                label: "Monitoring",
                dot: "bg-score-excellent animate-pulse-soft",
              }
            : { label: "Starting...", dot: "bg-white/30 animate-pulse-soft" };

  return (
    <div className="flex items-center gap-2 rounded-lg border border-white/[0.06] bg-white/[0.03] px-2.5 py-1.5">
      <span className={`h-2 w-2 rounded-full ${chip.dot}`} />
      <span className="text-xs font-medium text-white/60">{chip.label}</span>
    </div>
  );
}

interface AppLayoutProps {
  active: Page;
  onNavigate: (page: Page) => void;
  children: ReactNode;
}

export function AppLayout({ active, onNavigate, children }: AppLayoutProps) {
  const titles: Record<Page, string> = {
    monitor: "Monitor",
    dashboard: "Dashboard",
    history: "History",
    settings: "Settings",
  };

  return (
    <div className="flex h-screen overflow-hidden bg-surface">
      <Sidebar active={active} onNavigate={onNavigate} />
      <main className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-white/[0.06] px-6">
          <h2 className="text-base font-semibold text-white/90">
            {titles[active]}
          </h2>
          <StatusChip />
        </header>
        <div className="flex-1 overflow-y-auto p-6">{children}</div>
      </main>
    </div>
  );
}

export type { Page };
