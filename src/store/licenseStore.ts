import { create } from "zustand";
import { persist } from "zustand/middleware";
import { TRIAL_DAYS } from "@/services/license";

interface LicenseState {
  trialStartedAt: string | null;
  licenseKey: string | null;
  activatedAt: string | null;

  startTrialIfNeeded: () => void;
  storeActivation: (key: string) => void;
}

export const useLicenseStore = create<LicenseState>()(
  persist(
    (set, get) => ({
      trialStartedAt: null,
      licenseKey: null,
      activatedAt: null,

      startTrialIfNeeded: () => {
        if (!get().trialStartedAt && !get().activatedAt) {
          set({ trialStartedAt: new Date().toISOString() });
        }
      },
      storeActivation: (licenseKey) =>
        set({ licenseKey, activatedAt: new Date().toISOString() }),
    }),
    { name: "postureguard-license" },
  ),
);

export type LicenseStatus =
  | { state: "activated" }
  | { state: "trial"; daysLeft: number }
  | { state: "expired" };

export function computeLicenseStatus(
  s: Pick<LicenseState, "trialStartedAt" | "licenseKey" | "activatedAt">,
): LicenseStatus {
  if (s.activatedAt && s.licenseKey) {
    return { state: "activated" };
  }
  if (!s.trialStartedAt) {
    return { state: "trial", daysLeft: TRIAL_DAYS };
  }
  const elapsedMs = Date.now() - new Date(s.trialStartedAt).getTime();
  const daysLeft = Math.ceil(TRIAL_DAYS - elapsedMs / 86_400_000);
  if (daysLeft <= 0) {
    return { state: "expired" };
  }
  return { state: "trial", daysLeft };
}

export function useLicenseStatus(): LicenseStatus {
  const trialStartedAt = useLicenseStore((s) => s.trialStartedAt);
  const licenseKey = useLicenseStore((s) => s.licenseKey);
  const activatedAt = useLicenseStore((s) => s.activatedAt);
  return computeLicenseStatus({ trialStartedAt, licenseKey, activatedAt });
}
