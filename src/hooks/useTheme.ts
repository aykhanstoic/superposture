import { useEffect } from "react";

export function useTheme() {
  useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);
}
