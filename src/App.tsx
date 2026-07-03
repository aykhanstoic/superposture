import { useEffect, useState } from "react";
import { AppLayout, type Page } from "@/components/layout/AppLayout";
import { MonitoringProvider } from "@/components/monitor/MonitoringProvider";
import { useTheme } from "@/hooks/useTheme";
import { DashboardPage } from "@/pages/DashboardPage";
import { HistoryPage } from "@/pages/HistoryPage";
import { MonitorPage } from "@/pages/MonitorPage";
import { SettingsPage } from "@/pages/SettingsPage";
import { usePostureStore } from "@/store/postureStore";
import { useSettingsStore } from "@/store/settingsStore";

export default function App() {
  const [page, setPage] = useState<Page>("monitor");
  const postureAlertRequested = usePostureStore((s) => s.postureAlertRequested);
  const clearPostureAlert = usePostureStore((s) => s.clearPostureAlert);
  useTheme();

  useEffect(() => {
    if (!postureAlertRequested) return;
    setPage("monitor");
    useSettingsStore.getState().setShowCameraPreview(true);
    clearPostureAlert();
  }, [postureAlertRequested, clearPostureAlert]);

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
