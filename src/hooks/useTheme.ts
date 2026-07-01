import { useEffect } from "react";
import { useSettingsStore } from "@/store/settingsStore";

export function useTheme() {
  const darkMode = useSettingsStore((s) => s.darkMode);

  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [darkMode]);
}
