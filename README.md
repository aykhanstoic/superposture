# PostureGuard

A privacy-first desktop app that monitors your posture using your webcam — entirely on your device.

![PostureGuard](public/postureguard.svg)

## Features

- **Local-only processing** — webcam frames never leave your computer
- **Real-time pose detection** — MediaPipe Pose Landmarker at ~25 FPS
- **Smart posture analysis** — forward head, slouching, uneven shoulders, leaning, neck angle
- **Gentle reminders** — native notifications when posture stays poor
- **Background monitoring** — system tray, autostart, runs when window is closed
- **Dashboard & history** — daily stats, trends, sessions stored in local SQLite
- **No account required** — works offline after first model download

## Quick Start

```powershell
npm install
npm run tauri icon public/postureguard.svg   # first time only
npm run tauri:dev                            # development
npm run tauri:build                          # production installer
```

See **[DEVELOPMENT.md](./DEVELOPMENT.md)** for full setup, architecture, and troubleshooting.

### Production output (Windows)

After `npm run tauri:build`:

- `src-tauri/target/release/bundle/nsis/PostureGuard_1.0.0_x64-setup.exe`
- `src-tauri/target/release/bundle/msi/PostureGuard_1.0.0_x64_en-US.msi`

## Requirements

- Node.js 18+
- Rust (via [rustup](https://rustup.rs))
- Windows: Microsoft C++ Build Tools

## License

Proprietary — suitable for one-time purchase distribution.
