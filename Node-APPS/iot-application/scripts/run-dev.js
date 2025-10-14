#!/usr/bin/env node

const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");

const projectRoot = path.resolve(__dirname, "..");
const configPath = path.resolve(projectRoot, "config/default.json");
const nextCli = require.resolve("next/dist/bin/next");

let child = null;
let restartRequested = false;
let restartTimer = null;
let watcher = null;

function readConfig() {
  try {
    delete require.cache[configPath];
    return require(configPath);
  } catch (error) {
    console.error(`[dev-server] Failed to load config at ${configPath}:`, error);
    return {};
  }
}

function launchNext() {
  const config = readConfig();
  const devPort = (config?.app?.devPort && Number(config.app.devPort)) || 3000;
  const host = config?.app?.host || "localhost";

  console.log(`[dev-server] Starting Next.js on ${host}:${devPort}`);

  child = spawn(
    process.execPath,
    [nextCli, "dev", "--port", String(devPort), "--hostname", host],
    {
      stdio: "inherit",
      cwd: projectRoot,
      env: {
        ...process.env,
        PORT: String(devPort),
        HOST: host,
      },
    }
  );

  child.on("exit", (code, signal) => {
    child = null;

    if (restartRequested) {
      restartRequested = false;
      launchNext();
      return;
    }

    if (signal) {
      process.exit(0);
    } else {
      process.exit(code ?? 0);
    }
  });
}

function restartNext() {
  if (!child) {
    launchNext();
    return;
  }

  if (restartRequested) {
    return;
  }

  restartRequested = true;
  console.log("[dev-server] Detected config change. Restarting Next.js...");

  const killed = child.kill();
  if (!killed) {
    restartRequested = false;
    launchNext();
  }
}

function scheduleRestart() {
  clearTimeout(restartTimer);
  restartTimer = setTimeout(() => {
    restartNext();
  }, 200);
}

function setupWatcher() {
  if (watcher) {
    watcher.close();
  }

  watcher = fs.watch(configPath, { persistent: true }, (eventType) => {
    if (eventType === "rename") {
      setupWatcher();
    }
    scheduleRestart();
  });
}

function cleanup() {
  if (watcher) {
    watcher.close();
  }

  if (child) {
    child.kill();
  }
}

process.on("SIGINT", () => {
  cleanup();
  process.exit(0);
});

process.on("SIGTERM", () => {
  cleanup();
  process.exit(0);
});

setupWatcher();
launchNext();
