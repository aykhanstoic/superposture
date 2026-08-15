import { useState } from "react";
import { Button } from "@/components/ui/Button";
import {
  LICENSE_KEY_PATTERN,
  normalizeLicenseKey,
  validateLicenseKey,
} from "@/services/license";
import { useLicenseStore } from "@/store/licenseStore";

type FormState =
  | { phase: "idle" }
  | { phase: "validating" }
  | { phase: "error"; message: string; retryable: boolean };

export function ActivationForm() {
  const [key, setKey] = useState("");
  const [state, setState] = useState<FormState>({ phase: "idle" });
  const storeActivation = useLicenseStore((s) => s.storeActivation);

  const activate = async () => {
    const normalized = normalizeLicenseKey(key);
    if (!LICENSE_KEY_PATTERN.test(normalized)) {
      setState({
        phase: "error",
        message:
          "That doesn't look like a license key. It has the form PG-XXXX-XXXX-XXXX-XXXX.",
        retryable: false,
      });
      return;
    }

    setState({ phase: "validating" });
    try {
      const outcome = await validateLicenseKey(normalized);
      if (outcome.valid) {
        storeActivation(normalized);
        return;
      }
      setState({
        phase: "error",
        message:
          outcome.reason === "revoked"
            ? "This key was refunded and is no longer valid."
            : "This key wasn't found. Check for typos — it's in your purchase email.",
        retryable: false,
      });
    } catch {
      setState({
        phase: "error",
        message:
          "Couldn't reach the activation server. Check your internet connection and try again — your key is fine.",
        retryable: true,
      });
    }
  };

  const validating = state.phase === "validating";

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <input
          type="text"
          value={key}
          onChange={(e) => {
            setKey(e.target.value);
            if (state.phase === "error") setState({ phase: "idle" });
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !validating) activate();
          }}
          placeholder="PG-XXXX-XXXX-XXXX-XXXX"
          spellCheck={false}
          autoCapitalize="characters"
          className="w-full rounded-xl border border-surface-border bg-white/5 px-4 py-2 font-mono text-sm tracking-wider text-white placeholder-white/25 outline-none transition-colors focus:border-accent/60"
        />
        <Button onClick={activate} disabled={validating || key.trim() === ""}>
          {validating ? "Checking..." : "Activate"}
        </Button>
      </div>
      {state.phase === "error" && (
        <p
          className={`text-xs ${state.retryable ? "text-amber-400/90" : "text-red-400/90"}`}
        >
          {state.message}
        </p>
      )}
    </div>
  );
}
