const http = require("http");
const os = require("os");
const path = require("path");
const fs = require("fs");
const { spawn } = require("child_process");

const HOST = "127.0.0.1";
const START_PORT = 8000;
const PORT_COUNT = 20;
const PROBE_TIMEOUT_MS = 700;
const START_TIMEOUT_MS = 10000;
const OPEN_BROWSER = !process.argv.includes("--no-open");

function requestAgentConfig(port) {
  return new Promise((resolve) => {
    const request = http.get(
      {
        host: HOST,
        port,
        path: "/api/agent-config",
        timeout: PROBE_TIMEOUT_MS,
      },
      (response) => {
        let body = "";
        response.setEncoding("utf8");
        response.on("data", (chunk) => {
          body += chunk;
        });
        response.on("end", () => {
          if (response.statusCode !== 200) {
            resolve(false);
            return;
          }
          try {
            JSON.parse(body);
            resolve(true);
          } catch {
            resolve(false);
          }
        });
      },
    );

    request.on("timeout", () => {
      request.destroy();
      resolve(false);
    });
    request.on("error", () => resolve(false));
  });
}

async function findRunningServer() {
  for (let offset = 0; offset < PORT_COUNT; offset += 1) {
    const port = START_PORT + offset;
    if (await requestAgentConfig(port)) return port;
  }
  return null;
}

function startServer() {
  const logDir = os.tmpdir();
  const out = fs.openSync(path.join(logDir, "novel-editor-server.out.log"), "a");
  const err = fs.openSync(path.join(logDir, "novel-editor-server.err.log"), "a");
  const env = { ...process.env };
  delete env.PORT;

  const child = spawn(process.execPath, ["server.js"], {
    cwd: __dirname,
    detached: true,
    env,
    stdio: ["ignore", out, err],
    windowsHide: true,
  });
  child.unref();
}

async function waitForServer() {
  const deadline = Date.now() + START_TIMEOUT_MS;
  while (Date.now() < deadline) {
    const port = await findRunningServer();
    if (port) return port;
    await new Promise((resolve) => setTimeout(resolve, 350));
  }
  return null;
}

function openBrowser(url) {
  const child = spawn("cmd", ["/c", "start", "", url], {
    detached: true,
    stdio: "ignore",
    windowsHide: true,
  });
  child.unref();
}

async function main() {
  let port = await findRunningServer();
  if (!port) {
    startServer();
    port = await waitForServer();
  }

  if (!port) {
    console.error("Failed to start the novel editor server.");
    console.error("Try running: node server.js");
    process.exit(1);
  }

  const url = `http://${HOST}:${port}/`;
  console.log(`Novel editor: ${url}`);
  if (OPEN_BROWSER) openBrowser(url);
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
