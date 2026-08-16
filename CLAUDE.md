# UpSit — desktop app

Privacy-first posture monitoring desktop app: webcam → on-device MediaPipe pose
detection → posture score → reminder notifications. Nothing leaves the machine.
Sold as a **$9.99 one-time purchase with a 7-day free trial** (no subscription,
no accounts).

Full architecture (app internals, licensing/commercial layer, roadmap):
see [ARCHITECTURE.md](ARCHITECTURE.md) — the source of truth for the whole system.

## Project status (as of 2026-08-16)

**Done and working:**
- The full monitoring product: pose pipeline, scoring, reminders, tray,
  SQLite stats, dashboard/history pages
- 7-day trial + license activation flow in the app (`src/services/license.ts`,
  `src/store/licenseStore.ts`, `src/components/license/`) — trial badge in
  sidebar, License card in Settings, blocking screen on expiry
- Website + license backend **deployed**: https://postureguard-site.vercel.app
  (repo `../postureguard-site`, auto-deploys from `main`); `/api/validate` is
  live, CORS-enabled, and verified against the §3.2 contract
- Both repos on GitHub (`aykhanstoic/superposture`, `aykhanstoic/postureguard-site`)
- Renamed **PostureGuard → UpSit** everywhere (2026-08-16); key prefix `PG-` → `UP-`
  (contract updated in ARCHITECTURE.md §3.2 first, zero keys had been issued)
- Upstash Redis attached to the Vercel project (free tier, `iad1`, eviction off)
- Stripe **test mode** configured via CLI: product `prod_V57svZ23vG7XAd` with
  Payment Link (created at $35 — **price needs updating to $9.99**), webhook
  (`checkout.session.completed` + `charge.refunded`);
  `STRIPE_WEBHOOK_SECRET` set in Vercel (production, sensitive)
- Domain **upsit.online** bought and attached to the Vercel project;
  `BUY_URL`/`VALIDATE_URL` and the CSP `connect-src` now point at it

**Not done yet (in dependency order):**
1. DNS: point upsit.online at Vercel (`A @ 76.76.21.21` at the registrar, or
   switch to Vercel nameservers) — until it resolves, activation in a freshly
   built app falls back to "retry later"
2. Resend: account + verify upsit.online (SPF/DKIM DNS records) +
   `RESEND_API_KEY`/`EMAIL_FROM` env vars in Vercel
3. Full test-mode purchase loop: buy → key email → activate → refund → revoke
4. Stripe Tax origin address (dashboard); at launch recreate Payment Link +
   webhook + secret in **live mode** and fill the payment-link TODOs in the site repo
5. Code signing: Apple Developer for macOS notarization; Windows cert or accept
   SmartScreen
6. Real-world testing, then launch (soft launch → Product Hunt/Show HN)

## Stack

Tauri 2 (thin Rust shell in `src-tauri/`, all logic in the webview) · React 19 +
TypeScript · Vite 6 · Tailwind 3 (dark theme only) · Zustand · MediaPipe
tasks-vision (bundled WASM + lite model, no runtime downloads) · SQLite via
Tauri SQL plugin.

## Commands

- `npm run tauri:dev` — run the full app
- `npm run dev` — webview only in a browser (no tray/SQLite/notifications)
- `npm run build` — typecheck (`tsc --noEmit`) + frontend build; use this to verify changes
- `npm run tauri:build` — production installer

There are no tests yet.

## Layout

- `src/pose/` — camera→model bridge, landmark/score smoothing, adaptive inference scheduler
- `src/analysis/postureAnalyzer.ts` — geometric posture heuristics and scoring
- `src/hooks/usePostureMonitor.ts` — the core monitoring loop; owns the pipeline lifecycle
- `src/services/license.ts` — trial constants, key validation client (the app's ONLY network call)
- `src/store/` — Zustand stores: `settingsStore` (persisted), `postureStore` (runtime),
  `licenseStore` (persisted trial/activation state)
- `src/components/license/` — ActivationForm, TrialExpiredScreen
- `src/database/db.ts` — SQLite schema + queries (sessions, score samples, daily stats)
- `src/pages/`, `src/components/` — UI (Monitor, Dashboard, History, Settings)
- `src-tauri/src/lib.rs` — tray icon, close-to-tray, plugin wiring; no custom commands

## Conventions & constraints

- Privacy is the product: never add network calls except the one-time license
  validation described in ARCHITECTURE.md §3.2. No telemetry. The CSP pins
  `connect-src` to the license host only — keep it that way.
- Performance matters (app runs all day in the background): respect the inference
  scheduler tiers, UI-update throttling, and low-res capture settings.
- Camera value `CAMERA_OFF_VALUE` (`"__off__"`) is a sentinel meaning "no capture at all".
- Dark theme only; there is no light-mode CSS.
- License keys: `UP-` + 4×4 chars, no `0/O/1/I`. `valid:false` from the server is
  definitive; network/server errors must surface as "retry", never lock out a key.

## Sibling repo

The website + license backend live in `../postureguard-site` (static landing page +
Vercel functions: `POST /api/validate`, `POST /api/webhooks/stripe`). The API
contract both repos implement is pinned in ARCHITECTURE.md §3.2 — change it there
first, then both sides. Deployment checklist and Redis data model are in that
repo's README.
