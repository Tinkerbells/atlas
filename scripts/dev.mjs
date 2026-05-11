import path from "node:path";
import electronPath from "electron";
import { fileURLToPath } from "node:url";
import { build, createServer } from "vite";
import { execSync, spawn } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");

const mode = "development";
process.env.NODE_ENV = mode;
process.env.MODE = mode;

// --- Helper: kill any Electron processes holding port 5173 ---
function killElectronZombies() {
  try {
    if (process.platform === "win32") {
      execSync("taskkill /F /IM electron.exe 2>nul || exit 0");
    }
    else {
      execSync("pkill -9 -f \"electron\" 2>/dev/null || true");
    }
  }
  catch {
    // ignore
  }
}

// --- Helper: wait until port 5173 is free ---
async function waitForPort(maxWaitMs = 5000) {
  const start = Date.now();
  while (Date.now() - start < maxWaitMs) {
    try {
      execSync("lsof -ti:5173 2>/dev/null");
      // Port is still in use, wait
      await new Promise(r => setTimeout(r, 200));
    }
    catch {
      // lsof returned nothing = port is free
      return;
    }
  }
}

// Kill old Electron and wait for port cleanup
killElectronZombies();
await waitForPort();

// 1. Start renderer dev server
let rendererServer;
let serverRetries = 0;
while (serverRetries < 3) {
  try {
    rendererServer = await createServer({
      mode,
      configFile: path.resolve(rootDir, "vite.config.ts"),
    });
    await rendererServer.listen();
    break;
  }
  catch (err) {
    if (err.code === "EADDRINUSE" || err.message?.includes("is already in use")) {
      console.log(`[dev] Port 5173 in use, retrying in 1s...`);
      killElectronZombies();
      await new Promise(r => setTimeout(r, 1000));
      serverRetries++;
    }
    else {
      throw err;
    }
  }
}

const devServerUrl = rendererServer.resolvedUrls?.local?.[0];
if (!devServerUrl) {
  throw new Error("[dev] Failed to resolve dev server URL");
}
process.env.VITE_DEV_SERVER_URL = devServerUrl;
console.log(`[dev] Renderer dev server running at ${devServerUrl}`);

const rendererWatchServerProvider = {
  name: "renderer-watch-server-provider",
  api: {
    provideRendererWatchServer() {
      return rendererServer;
    },
  },
};

// 2. Build preload once to ensure the file exists before Electron starts
await build({
  mode,
  configFile: path.resolve(rootDir, "vite.preload.config.ts"),
  plugins: [rendererWatchServerProvider],
});

// 3. Build shared process once to ensure the file exists before Electron starts
await build({
  mode,
  configFile: path.resolve(rootDir, "vite.shared.config.ts"),
  plugins: [rendererWatchServerProvider],
});

// 4. Build main in watch mode with electron restart
let electronApp = null;

async function startElectron() {
  if (electronApp !== null) {
    // Remove exit listener so killing the old process does not kill the dev script
    electronApp.removeListener("exit", process.exit);

    // Graceful shutdown with force-kill fallback
    await new Promise((resolve) => {
      let resolved = false;
      const done = () => {
        if (!resolved) {
          resolved = true;
          resolve();
        }
      };

      electronApp.once("exit", done);
      electronApp.kill("SIGTERM");

      // Force kill after 1.5s if still alive
      setTimeout(() => {
        if (electronApp && !electronApp.killed) {
          electronApp.kill("SIGKILL");
        }
      }, 1500);

      // Ultimate fallback: resolve anyway after 2.5s
      setTimeout(done, 2500);
    });

    electronApp = null;

    // Give macOS time to release the single-instance lock and clean up
    await new Promise(r => setTimeout(r, 500));
  }

  console.log(`[dev] Starting Electron with VITE_DEV_SERVER_URL=${process.env.VITE_DEV_SERVER_URL}`);

  // Launch Electron binary directly (avoid npx wrapper which creates a zombie shell process)
  electronApp = spawn(String(electronPath), ["--inspect=0", "."], {
    stdio: "inherit",
    cwd: rootDir,
    env: {
      ...process.env,
      NODE_ENV: mode,
      MODE: mode,
      VITE_DEV_SERVER_URL: process.env.VITE_DEV_SERVER_URL,
    },
  });

  electronApp.addListener("exit", process.exit);
}

await build({
  mode,
  configFile: path.resolve(rootDir, "vite.main.config.ts"),
  plugins: [
    rendererWatchServerProvider,
    {
      name: "electron-restart",
      async writeBundle() {
        await startElectron();
      },
    },
  ],
  build: {
    watch: {},
  },
});

// 5. Watch preload for subsequent changes (does not block)
await build({
  mode,
  configFile: path.resolve(rootDir, "vite.preload.config.ts"),
  plugins: [rendererWatchServerProvider],
  build: {
    watch: {},
  },
});

// 6. Watch shared process for subsequent changes (does not block)
await build({
  mode,
  configFile: path.resolve(rootDir, "vite.shared.config.ts"),
  plugins: [rendererWatchServerProvider],
  build: {
    watch: {},
  },
});

// Graceful shutdown on Ctrl+C / SIGTERM
function cleanupAndExit() {
  if (electronApp && !electronApp.killed) {
    electronApp.removeListener("exit", process.exit);
    electronApp.kill("SIGTERM");
  }
  process.exit();
}

process.on("SIGINT", cleanupAndExit);
process.on("SIGTERM", cleanupAndExit);
