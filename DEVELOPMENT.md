# PostureGuard — Development Guide

Privacy-first desktop posture monitoring app built with **Tauri + React + TypeScript + Vite**.

All webcam processing runs **locally**. No frames are uploaded. No account required.

---

## Prerequisites

| Tool | Version | Purpose |
|------|---------|---------|
| [Node.js](https://nodejs.org/) | 18+ | Frontend tooling |
| [Rust](https://rustup.rs/) | Latest stable | Tauri native shell |
| **Windows:** [MSVC Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/) | Desktop C++ workload | Compile Rust on Windows |
| **macOS:** Xcode Command Line Tools | `xcode-select --install` | Compile Rust on macOS |
| **Linux:** `build-essential`, `libwebkit2gtk-4.1-dev`, etc. | See [Tauri docs](https://v2.tauri.app/start/prerequisites/) | Compile on Linux |

Verify installation:

```powershell
node --version
npm --version
rustc --version
cargo --version
```

---

## Quick Start

```powershell
# 1. Install dependencies
npm install

# 2. Generate app icons (first time only)
npm run tauri icon public/postureguard.svg

# 3. Run in development mode
npm run tauri:dev
```

The app opens as a native window with hot-reload for the React frontend.

---

## Project Structure

```
src/
├── analysis/          # Posture scoring algorithms
├── components/
│   ├── dashboard/     # Charts and stat cards
│   ├── layout/        # Sidebar, app shell
│   ├── monitor/       # Camera preview, MonitoringProvider, live feedback
│   └── ui/            # Reusable UI primitives
├── database/          # SQLite via Tauri SQL plugin
├── hooks/             # useCamera, usePostureMonitor, useTheme
├── pages/             # Monitor, Dashboard, History, Settings
├── pose/              # MediaPipe detector + smoothing
├── services/          # Notifications, autostart
├── store/             # Zustand state (settings, posture)
├── types/             # Shared TypeScript types
└── utils/             # Helpers

src-tauri/
├── src/lib.rs         # Tray, plugins, window lifecycle
├── capabilities/      # Tauri permissions
└── tauri.conf.json    # App configuration
```

---

## Development Phases

### Phase 1 — Tauri setup, React UI, Camera access
- [x] Tauri 2 + Vite + React + TypeScript scaffold
- [x] Tailwind CSS with dark mode
- [x] Webcam permission, device selection, live preview
- [x] Feature-based folder structure

### Phase 2 — MediaPipe Pose Landmarker
- [x] `@mediapipe/tasks-vision` Pose Landmarker (lite model)
- [x] Track nose, ears, shoulders, elbows, hips
- [x] ~25 FPS inference with frame throttling
- [x] Landmark overlay on camera canvas
- [x] EMA smoothing to reduce jitter

### Phase 3 — Posture analysis
- [x] Forward head posture detection
- [x] Slouching / rounded shoulders
- [x] Uneven shoulders
- [x] Leaning left / right
- [x] Excessive neck angle
- [x] Confidence scores per issue
- [x] Overall score 0–100 with status tiers

### Phase 4 — Background monitoring & notifications
- [x] System tray icon with menu (Show, Pause, Quit)
- [x] Minimize to tray on window close
- [x] App continues running in background
- [x] Launch on startup (autostart plugin)
- [x] Native desktop notifications after poor posture duration
- [x] Anti-spam: requires posture recovery before next reminder
- [x] Camera preview can be hidden while monitoring continues

### Phase 5 — SQLite local storage
- [x] Sessions table
- [x] Score samples
- [x] Daily aggregated stats
- [x] All data stored in local `postureguard.db`

### Phase 6 — Dashboard & statistics
- [x] Today's monitoring time
- [x] Average posture score
- [x] Longest good posture streak
- [x] Reminder count
- [x] Weekly and monthly trend charts (Recharts)

### Phase 7 — Polish & performance
- [x] Linear-inspired UI (rounded cards, animations, system fonts)
- [x] Settings page (sensitivity, reminders, camera, theme)
- [x] History page (sessions + daily records)
- [ ] GPU delegate fallback to CPU if WebGL unavailable
- [ ] Bundle MediaPipe WASM locally for fully offline install

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Vite dev server only (browser, no Tauri APIs) |
| `npm run tauri:dev` | Full desktop app with hot reload |
| `npm run build` | Type-check + production frontend build |
| `npm run tauri:build` | Production installer (.msi / .dmg / .AppImage) |
| `npm run tauri icon <path>` | Regenerate platform icons from SVG/PNG |

---

## Configuration

Settings persist in browser `localStorage` (Zustand persist). Posture history persists in SQLite.

| Setting | Default | Description |
|---------|---------|-------------|
| Reminder interval | 3 min | Poor posture duration before notification |
| Sensitivity | Medium | Detection threshold multiplier |
| Launch on startup | Off | OS autostart |
| Dark mode | On | UI theme |
| Notification sounds | On | Native notification audio |
| Camera preview | On | Show/hide video feed |

---

## Architecture Notes

- **MonitoringProvider** wraps the app and keeps camera + MediaPipe running on every page and when the window is minimized to tray.
- A hidden off-screen `<video>` element feeds MediaPipe; the visible preview mirrors the same `MediaStream`.
- Closing the window hides to tray — the app keeps running until you choose **Quit** from the tray menu.

```
Webcam → MediaPipe (local WASM) → Posture Analysis (JS) → UI + SQLite
                ↓
         No network calls for frames
```

- Pose model downloaded once from Google CDN on first run (cacheable)
- For fully offline: copy WASM + model into `public/` and update paths in `src/pose/detector.ts`

---

## Building for Production

```powershell
npm run tauri:build
```

Output: `src-tauri/target/release/bundle/`

Windows installers produced:
- `bundle/msi/PostureGuard_1.0.0_x64_en-US.msi`
- `bundle/nsis/PostureGuard_1.0.0_x64-setup.exe`

Run the dev build without an installer:

```powershell
npm run tauri:dev
```

---

## Troubleshooting

**Camera not working**
- Grant camera permission in OS settings
- Select the correct device in Settings → Camera

**Rust not found**
- Install from [rustup.rs](https://rustup.rs) and restart terminal

**MediaPipe model fails to load**
- Check internet on first launch (model download)
- Verify CSP in `src-tauri/tauri.conf.json` allows `storage.googleapis.com`

**Tray icon missing**
- Run `npm run tauri icon public/postureguard.svg`

**High CPU usage**
- Hide camera preview (Settings)
- Pause monitoring when not at desk
- Lower sensitivity reduces re-analysis overhead

---

## Tech Stack Reference

- **Shell:** Tauri 2
- **UI:** React 19, TypeScript, Vite 6, Tailwind CSS 3
- **Pose:** MediaPipe Tasks Vision — Pose Landmarker Lite
- **State:** Zustand
- **Database:** SQLite via `@tauri-apps/plugin-sql`
- **Charts:** Recharts
- **Plugins:** notification, autostart, sql
