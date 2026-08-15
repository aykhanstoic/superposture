import type { ReactNode } from "react";
import { useLicenseStatus } from "@/store/licenseStore";

type Page = "monitor" | "dashboard" | "history" | "settings";

interface SidebarProps {
  active: Page;
  onNavigate: (page: Page) => void;
}

const navItems: { id: Page; label: string; icon: string }[] = [
  { id: "monitor", label: "Monitor", icon: "◎" },
  { id: "dashboard", label: "Dashboard", icon: "◫" },
  { id: "history", label: "History", icon: "◷" },
  { id: "settings", label: "Settings", icon: "⚙" },
];

export function Sidebar({ active, onNavigate }: SidebarProps) {
  const licenseStatus = useLicenseStatus();

  return (
    <aside className="flex w-56 shrink-0 flex-col border-r border-surface-border bg-surface px-4 py-6">
      <div className="mb-8 flex items-center gap-3 px-2">
        <img src="/postureguard.svg" alt="" className="h-8 w-8 rounded-lg" />
        <div>
          <h1 className="text-sm font-semibold text-white">PostureGuard</h1>
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
                ? "bg-accent/15 text-accent"
                : "text-white/50 hover:bg-white/5 hover:text-white/80"
            }`}
          >
            <span className="text-base">{item.icon}</span>
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

interface AppLayoutProps {
  active: Page;
  onNavigate: (page: Page) => void;
  children: ReactNode;
}

export function AppLayout({ active, onNavigate, children }: AppLayoutProps) {
  const titles: Record<Page, string> = {
    monitor: "Live Monitor",
    dashboard: "Dashboard",
    history: "History",
    settings: "Settings",
  };

  return (
    <div className="flex h-screen overflow-hidden bg-surface">
      <Sidebar active={active} onNavigate={onNavigate} />
      <main className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-14 shrink-0 items-center border-b border-surface-border px-6">
          <h2 className="text-base font-semibold text-white/90">
            {titles[active]}
          </h2>
        </header>
        <div className="flex-1 overflow-y-auto p-6">{children}</div>
      </main>
    </div>
  );
}

export type { Page };
