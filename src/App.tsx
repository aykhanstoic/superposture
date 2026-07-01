import { useState } from "react";
import { AppLayout, type Page } from "@/components/layout/AppLayout";
import { MonitoringProvider } from "@/components/monitor/MonitoringProvider";
import { useTheme } from "@/hooks/useTheme";
import { DashboardPage } from "@/pages/DashboardPage";
import { HistoryPage } from "@/pages/HistoryPage";
import { MonitorPage } from "@/pages/MonitorPage";
import { SettingsPage } from "@/pages/SettingsPage";

export default function App() {
  const [page, setPage] = useState<Page>("monitor");
  useTheme();

  return (
    <MonitoringProvider>
      <AppLayout active={page} onNavigate={setPage}>
        {page === "monitor" && <MonitorPage />}
        {page === "dashboard" && <DashboardPage />}
        {page === "history" && <HistoryPage />}
        {page === "settings" && <SettingsPage />}
      </AppLayout>
    </MonitoringProvider>
  );
}
