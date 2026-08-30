<div align="center">
  <img src="public/upsit.svg" alt="UpSit logo" width="88" />

  # UpSit

  **Privacy-first posture monitoring for your desktop — 100% on-device.**

  [![Latest release](https://img.shields.io/github/v/release/aykhanstoic/superposture?style=flat-square&label=release)](https://github.com/aykhanstoic/superposture/releases/latest)
  [![Build](https://github.com/aykhanstoic/superposture/actions/workflows/build.yml/badge.svg)](https://github.com/aykhanstoic/superposture/actions/workflows/build.yml)
  [![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-informational?style=flat-square)](#requirements)
  [![License](https://img.shields.io/badge/license-proprietary-red?style=flat-square)](#license)

  [Website](https://www.upsit.online) · [Download](https://github.com/aykhanstoic/superposture/releases/latest) · [Development Guide](./DEVELOPMENT.md) · [Architecture](./ARCHITECTURE.md)
</div>

---

## What it does

UpSit watches your posture through your webcam while you work, scores it in real time with an on-device pose-detection model, and nudges you with a notification when you've been slouching for too long. Every frame is processed locally on your machine — nothing is ever uploaded.

## Features

- 🔒 **Fully local** — webcam frames are processed on-device and never leave your computer
- 🧍 **Real-time pose detection** — MediaPipe Pose Landmarker running at ~25 FPS
- 🩻 **Smart posture analysis** — flags forward head, slouching, uneven shoulders, leaning, and neck angle
- 🔔 **Gentle reminders** — native OS notifications when posture stays poor
- 🗂️ **Background monitoring** — lives in the system tray, can autostart, keeps working with the window closed
- 📊 **Dashboard & history** — daily stats and trend charts backed by a local SQLite database
- 🔑 **No account required** — works fully offline after the first model download

## How it works

```
Webcam → MediaPipe Pose Landmarker (WASM, on-device)
       → postureAnalyzer.ts scores posture issues
       → live feedback + native notifications
       → stored locally in SQLite → Dashboard / History trends
```

## Tech stack

| Layer | Tech |
|---|---|
| Desktop shell | [Tauri 2](https://tauri.app/) (Rust) |
| UI | React 19, TypeScript, Tailwind CSS |
| Pose detection | [`@mediapipe/tasks-vision`](https://developers.google.com/mediapipe) (WASM) |
| State | Zustand |
| Charts | Recharts |
| Local storage | SQLite via `tauri-plugin-sql` |

## Getting started

```powershell
npm install
npm run tauri icon public/upsit.svg   # first time only
npm run tauri:dev                     # development
npm run tauri:build                   # production installer
```

See **[DEVELOPMENT.md](./DEVELOPMENT.md)** for full setup and troubleshooting, and **[ARCHITECTURE.md](./ARCHITECTURE.md)** for how the app, licensing, and website fit together.

### Production builds

CI builds and publishes installers for Windows, macOS, and Linux on every version tag ([`.github/workflows/build.yml`](.github/workflows/build.yml)):

- **Windows** — `UpSit_<version>_x64-setup.exe` / `.msi`
- **macOS** — universal `.dmg`
- **Linux** — `.deb` / `.AppImage`

Grab the latest build from the [Releases page](https://github.com/aykhanstoic/superposture/releases/latest).

## Requirements

- Node.js 18+
- Rust (via [rustup](https://rustup.rs))
- **Windows:** Microsoft C++ Build Tools
- **macOS:** Xcode Command Line Tools
- **Linux:** see [Tauri prerequisites](https://v2.tauri.app/start/prerequisites/)

## License

Proprietary — one-time purchase license. The app runs on a free trial until activated; see [upsit.online](https://www.upsit.online) for licensing details.
