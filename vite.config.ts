import fs from "node:fs";
import path from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";
import type { Plugin } from "vite";

const host = process.env.TAURI_DEV_HOST;

const MIME: Record<string, string> = {
  ".js": "application/javascript",
  ".wasm": "application/wasm",
  ".task": "application/octet-stream",
};

/** Serves MediaPipe WASM/model as raw static files in dev (bypasses Vite transform). */
function mediapipeStaticPlugin(): Plugin {
  const wasmDir = path.resolve("node_modules/@mediapipe/tasks-vision/wasm");
  const modelFile = path.resolve("public/mediapipe/pose_landmarker_lite.task");

  return {
    name: "mediapipe-static",
    enforce: "pre",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = req.url?.split("?")[0] ?? "";

        if (url.startsWith("/mediapipe/wasm/")) {
          const name = path.basename(url);
          const file = path.join(wasmDir, name);
          if (fs.existsSync(file)) {
            const ext = path.extname(file);
            res.setHeader(
              "Content-Type",
              MIME[ext] ?? "application/octet-stream",
            );
            fs.createReadStream(file).pipe(res);
            return;
          }
        }

        if (url === "/mediapipe/pose_landmarker_lite.task") {
          if (fs.existsSync(modelFile)) {
            res.setHeader("Content-Type", MIME[".task"]);
            fs.createReadStream(modelFile).pipe(res);
            return;
          }
        }

        next();
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), mediapipeStaticPlugin()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  clearScreen: false,
  server: {
    port: 1420,
    strictPort: true,
    host: host || false,
    hmr: host
      ? {
          protocol: "ws",
          host,
          port: 1421,
        }
      : undefined,
    watch: {
      ignored: ["**/src-tauri/**"],
    },
  },
  envPrefix: ["VITE_", "TAURI_"],
  build: {
    target:
      process.env.TAURI_ENV_PLATFORM === "windows" ? "chrome105" : "safari13",
    minify: !process.env.TAURI_ENV_DEBUG ? "esbuild" : false,
    sourcemap: !!process.env.TAURI_ENV_DEBUG,
  },
  optimizeDeps: {
    exclude: ["@mediapipe/tasks-vision"],
  },
});
