import { useEffect } from "react";
import { useSettingsStore } from "@/store/settingsStore";

export function useTheme() {
  const darkMode = useSettingsStore((s) => s.darkMode);
  const setDarkMode = useSettingsStore((s) => s.setDarkMode);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.add("dark");
    if (!darkMode) {
      setDarkMode(true);
    }
  }, [darkMode, setDarkMode]);
}
