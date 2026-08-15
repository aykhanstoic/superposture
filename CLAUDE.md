# PostureGuard — desktop app

Privacy-first posture monitoring desktop app: webcam → on-device MediaPipe pose
detection → posture score → reminder notifications. Nothing leaves the machine.

Full architecture (app internals, planned licensing/commercial layer, roadmap):
see [ARCHITECTURE.md](ARCHITECTURE.md).

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
- `src/database/db.ts` — SQLite schema + queries (sessions, score samples, daily stats)
- `src/store/` — Zustand stores: `settingsStore` (persisted), `postureStore` (runtime)
- `src/pages/`, `src/components/` — UI (Monitor, Dashboard, History, Settings)
- `src-tauri/src/lib.rs` — tray icon, close-to-tray, plugin wiring; no custom commands

## Conventions & constraints

- Privacy is the product: never add network calls except the one-time license
  validation described in ARCHITECTURE.md §3.2. No telemetry.
- Performance matters (app runs all day in the background): respect the inference
  scheduler tiers, UI-update throttling, and low-res capture settings.
- Camera value `CAMERA_OFF_VALUE` (`"__off__"`) is a sentinel meaning "no capture at all".
- Dark theme only; there is no light-mode CSS.

## Sibling repo

The website + license backend live in `../postureguard-site` (static landing page +
serverless `POST /api/validate` and Stripe webhook). The API contract both repos
implement is pinned in ARCHITECTURE.md §3.2 — change it there first, then both sides.
