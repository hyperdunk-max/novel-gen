# Agent Notes

## Running and Packaging the Editor

- User preference: do not have Codex stop, restart, or launch the local editor service/app unless the user explicitly asks in the current turn. Service/app launches have repeatedly looked like hangs in this environment.
- If a backend change needs a restart, only tell the user that it will take effect after they manually reopen `小说编辑器.exe`.
- Avoid running a single long PowerShell command that stops the current `node server.js`, starts a detached Node process, sleeps, and probes the API in one shell invocation. In this environment that pattern can appear to hang even when the server has already started.
- Prefer checking first:
  - `netstat -ano | Select-String -Pattern ':8000\s'`
  - `Invoke-WebRequest -Uri 'http://127.0.0.1:8000/api/agent-config' -UseBasicParsing -TimeoutSec 3`
- Checking service status is okay when useful, but do not stop or start the service from Codex unless the user explicitly asks for that in the current turn.
- After changing `agent-config.json` or server-side prompt/default-model logic, verify `/api/agent-config` returns the expected `defaultModel` and `available` model flags before troubleshooting the frontend.
- Agent models are available from the Electron app because it starts the internal local server itself. Directly opening `index.html` as a `file://` URL bypasses `server.js`, so `./api/agent-config` cannot load and the UI falls back to local rules.
- For one-click local use, double-click root `小说编辑器.exe`.
- The portable build can take around 3 minutes in the compression/signing stage. Use a longer timeout for `npm run build`; a 2 minute timeout may look stuck even when it is still working.
- Do not package `src/agent-config.json`; it may contain the user's real API key. Package `src/agent-config.example.json` only, and let the app copy it to Electron `userData` on first run.
