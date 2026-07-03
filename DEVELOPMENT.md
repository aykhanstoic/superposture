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
- [x] Track nose, eyes, ears, shoulders (7 landmarks — two-line model)
- [x] Adaptive inference FPS (10/15/20)
- [x] Two-line overlay: shoulder line + ear-eye-nose polyline
- [x] EMA landmark smoothing

### Phase 3 — Posture analysis (two-line geometry)
- [x] Forward head (nose vs shoulder center)
- [x] Slouching (head drop toward shoulders)
- [x] Uneven shoulders (shoulder line tilt + ear height)
- [x] Leaning left / right
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
- [x] GPU delegate fallback to CPU if WebGL unavailable (worker init)
- [x] Bundle MediaPipe WASM locally for fully offline install
- [x] Adaptive inference FPS for low CPU in tray mode
- [x] Main-thread MediaPipe inference (local WASM)
- [x] setInterval + Web Lock keep-alive for tray background monitoring
- [x] Full-frame 320×320 downscale (480×360 camera capture)

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
| Camera preview | Off | Show/hide video feed on Monitor page |

---

## Architecture Notes

- **Primary use case:** App runs in the **system tray** while you work in other apps. When posture stays poor for the reminder interval, a native notification pop-up fires and the window is brought forward.
- **MonitoringProvider** wraps the app and keeps camera + pose model running on every page and when the window is minimized to tray.
- A hidden off-screen `<video>` element feeds inference; preview (when enabled) draws to a single canvas — no dual video decode.
- Closing the window hides to tray — the app keeps running until you choose **Quit** from the tray menu.

```
Webcam 480×360 → full-frame downscale 320×320 → MediaPipe (local WASM)
       → two-line geometry analysis → score EMA → Notification + UI
                ↓
         No network calls for frames (fully offline after install)
```

**Two-line model:** Shoulder line (left ↔ right shoulder) + face polyline (leftEar → leftEye → nose → rightEye → rightEar). Scoring uses nose position relative to the shoulder line, normalized by shoulder width.

- Pose model and WASM bundled in `public/mediapipe/` — no CDN required
- Inference uses **adaptive FPS**: ~10 fps when posture is stable, ~15 fps normally, ~20 fps when degrading
- Monitoring loop uses **setInterval** (not rAF) so tray-hidden operation is not throttled

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
- Verify `public/mediapipe/` contains WASM files and `pose_landmarker_lite.task`
- Re-run `npm install` then copy assets from `node_modules/@mediapipe/tasks-vision/wasm/` to `public/mediapipe/wasm/`

**Tray monitoring stops when window hidden**
- Should not happen — app uses setInterval + Web Lock keep-alive. Restart the app if monitoring pauses after long tray time.

**Tray icon missing**
- Run `npm run tauri icon public/postureguard.svg`

**High CPU usage**
- Hide camera preview (Settings) — default is off
- Pause monitoring when not at desk
- Stable good posture automatically drops inference to ~10 fps

---

## Tech Stack Reference

- **Shell:** Tauri 2
- **UI:** React 19, TypeScript, Vite 6, Tailwind CSS 3
- **Pose:** MediaPipe Tasks Vision — Pose Landmarker Lite
- **State:** Zustand
- **Database:** SQLite via `@tauri-apps/plugin-sql`
- **Charts:** Recharts
- **Plugins:** notification, autostart, sql
