# Orchestrator resume verification

Checked on 3 October 2026 (Asia/Riyadh). Existing uncommitted work was preserved. No commit, push, API-key configuration or paid model call was performed.

## Completed

- Added `npm run demo` and `node bin/mvo.ts serve --demo`, so Windows PowerShell can start the simulation without POSIX environment-variable syntax.
- Labeled the dashboard's demo jobs, checks and spending as simulated. Completed simulations show an explanation instead of trying to play the fake MP4 placeholder.
- Allowed the demo server to serve generated stills from an explicitly selected `MVO_FAKE_DIR`, while retaining the normal path guards.
- Fixed raw local CLI operations that start or resume work: `call approve`, `call start_run`, and `call submit_job` keep following the run rather than exiting while its pipeline is active. Their standard output remains a JSON response; progress uses standard error, and a pipeline failure yields a failed exit status.
- Added regression coverage for the asynchronous CLI failure path and the portable demo-server startup/still-serving path.

## Verification

- Core suite: 14 passing checks.
- Interfaces: 7 passing tests, including HTTP operations, event streaming, file guards, token checks, MCP over stdio, CLI and demo startup.
- Pipeline suite: 28 passing checks, including real isolated rendering, failed-gate retries, model escalation through a loopback mock provider, budget pause/resume, cancellation and preservation of the working studio.
- The rendered pipeline fixture was verified by ffprobe as an 8-second 1280×720 H.264/AAC MP4 at 60 fps, with 480 frames. Model responses came from local mocks. This is render-pipeline evidence, not a real-provider acceptance test.
- TypeScript: `npx tsc --noEmit` passed. `git diff --check` passed.
- Chrome Headless Shell: Setup rendered four roles; New video created a plan; Approve started the live board; it reached simulated completion; generated PNG stills loaded; Runs reopened the completed simulation. No browser JavaScript exceptions occurred.
- Mobile browser emulation: the 390 px viewport had a 390 px document width. The captured desktop and mobile screens were inspected. This was not a physical-device test.

## Run locally

```powershell
Set-Location 'C:\Users\GAMING\Documents\video-motion-lab\motion-video-skill\orchestrator'
npm.cmd run demo
```

The command opens the dashboard at `http://127.0.0.1:4317`. To use another port without opening a browser:

```powershell
node bin/mvo.ts serve --demo --port 4318
```

For real work, use `node bin/mvo.ts dashboard` and configure the required roles and provider credentials, or a host agent. Keep the server process running when sharing it with CLI/MCP clients via `--url`. Demo runs reset when their process stops.

## Local evidence and limits

- [.test-tmp/proof/dashboard-ui-proof.json](.test-tmp/proof/dashboard-ui-proof.json)
- [.test-tmp/proof/dashboard-plan.png](.test-tmp/proof/dashboard-plan.png)
- [.test-tmp/proof/dashboard-board.png](.test-tmp/proof/dashboard-board.png)
- [.test-tmp/proof/dashboard-mobile.png](.test-tmp/proof/dashboard-mobile.png)

These screenshots and the smoke harness are local, ignored verification artifacts. Smoke-test servers were shut down after checking them. Real provider access, current provider model availability/prices and paid execution were not verified. Real interrupted runs are not automatically recovered when their executing process is restarted; use the long-lived server for shared runs.

A concurrent external edit to `src/pipeline/orchestrator.ts` (clearing a cancellation timeout) appeared during this resume. It was preserved and was not authored by this orchestrator-resume agent.
