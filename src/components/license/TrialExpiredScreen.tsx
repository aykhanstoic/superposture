import { useState } from "react";
import { ActivationForm } from "@/components/license/ActivationForm";
import { Button } from "@/components/ui/Button";
import { BUY_URL } from "@/services/license";

export function TrialExpiredScreen() {
  const [copied, setCopied] = useState(false);

  const copyBuyUrl = async () => {
    try {
      await navigator.clipboard.writeText(BUY_URL);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard unavailable — the URL is shown as selectable text anyway.
    }
  };

  return (
    <div className="flex h-screen items-center justify-center bg-surface p-6">
      <div className="w-full max-w-md space-y-6 rounded-2xl border border-surface-border bg-surface-elevated p-8 shadow-sm">
        <div className="flex items-center gap-3">
          <img src="/upsit.svg" alt="" className="h-9 w-9 rounded-lg" />
          <div>
            <h1 className="text-base font-semibold text-white">UpSit</h1>
            <p className="text-[10px] uppercase tracking-widest text-white/35">
              Local & Private
            </p>
          </div>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-white">
            Your free trial has ended
          </h2>
          <p className="mt-1.5 text-sm text-white/55">
            Hope UpSit helped your posture these three days. Buy it once
            and it's yours forever — no subscription, no account, and as
            always, nothing leaves your device.
          </p>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-white/40">
            Get a license key
          </p>
          <div className="flex gap-2">
            <input
              readOnly
              value={BUY_URL}
              onFocus={(e) => e.target.select()}
              className="w-full rounded-xl border border-surface-border bg-white/5 px-4 py-2 text-xs text-white/70 outline-none"
            />
            <Button variant="secondary" onClick={copyBuyUrl}>
              {copied ? "Copied!" : "Copy"}
            </Button>
          </div>
          <p className="text-xs text-white/35">
            Open this link in your browser — your key arrives by email right
            after purchase.
          </p>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-white/40">
            Already have a key?
          </p>
          <ActivationForm />
        </div>
      </div>
    </div>
  );
}
