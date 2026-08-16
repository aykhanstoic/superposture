// License activation client. Contract: ARCHITECTURE.md §3.2.
// This is the only network call in the entire app.

export const TRIAL_DAYS = 3;
export const BUY_URL = "https://www.upsit.online/#pricing";

const VALIDATE_URL = "https://www.upsit.online/api/validate";

export const LICENSE_KEY_PATTERN = /^UP(-[A-Z0-9]{4}){4}$/;

export function normalizeLicenseKey(raw: string): string {
  return raw.trim().toUpperCase();
}

export type ValidationOutcome =
  | { valid: true }
  | { valid: false; reason: "not_found" | "revoked" };

/**
 * Definitive outcomes resolve; anything else (network down, server error)
 * throws so callers treat it as "retry later", never as an invalid key.
 */
export async function validateLicenseKey(
  key: string,
): Promise<ValidationOutcome> {
  const response = await fetch(VALIDATE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ key }),
  });

  if (response.status === 200) {
    return (await response.json()) as ValidationOutcome;
  }

  throw new Error(`Validation request failed (${response.status})`);
}
