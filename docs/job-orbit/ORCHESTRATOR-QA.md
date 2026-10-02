# Orchestrator integration verification

Verified on 2026-10-03 in the isolated publishing checkout, based on commit `7360e80a4e480a38b8f3ee6fe7dc2b171925bd1c`.

## Published scope

- The pipeline test creates a disposable Git repository and minimal Remotion studio under `orchestrator/.test-tmp/`. It reuses installed dependencies while isolating generated source, run state, branches, and per-job commits from the working studio.
- Fixture cleanup checks that its target stays within the scratch directory and explicitly unlinks the dependency junction before removing the fixture.
- Cancellation clears its unused timeout after a run stops, allowing the command process to exit normally.
- `MVO_TEST_KEEP_PROOF=1` retains an optional local fixture MP4 and gate report. Scratch and proof files are ignored by Git.

This change covers fixture isolation, safe cleanup and cancellation shutdown. CLI, dashboard, provider interfaces and package configuration are outside its scope.

## Checks and result

From `orchestrator/`:

```powershell
node node_modules/typescript/bin/tsc --noEmit
$env:MVO_TEST_KEEP_PROOF = '1'
node test/pipeline.test.ts
```

Typecheck passed. The pipeline test passed **29 checks** and exited with code 0. This run did not repeat the unchanged core or interface suites.

The test exercised plan validation and retry; ownership and deterministic-code gates; reversible composition registration; a host builder; reviewer-requested revision; repeated intentional determinism failures followed by escalation through the real tool loop; still rendering; sound and onset gates; integration; final review; MP4 rendering; budget pause, cap increase, and resume; cancellation; and cleanup. Four job commits were created only in the disposable fixture repository. Its temporary source, branches, and run state were removed afterward, and its generated Root.tsx was restored before cleanup.

Director, reviewer, and escalation responses came from **loopback mock servers**. Host work was supplied by test code. No external AI provider was called and no real provider spending occurred. Reported usage amounts are synthetic values from the mock responses. These checks establish local integration behavior, not real-model quality or production-provider compatibility.

## Render evidence

The resulting video is the test suite's fictional **Lumen** fixture, separate from the Job Orbit product film.

| Check | Observed result |
|---|---|
| Container duration | 8.000 seconds |
| Video | H.264, 1280 × 720, yuv420p, 60 fps, 480 frames |
| Audio | AAC |
| Integrated loudness | -14.0 LUFS |
| True peak | -1.7 dBFS, measured with ffmpeg `ebur128=peak=true` |
| Loudness range | 0.9 LU |
| MP4 SHA-256 | `ba59e4319cceaf979c8bf45071b794910cef7d02a3fa3670696ec18361841606` |

Four representative frames were visually inspected: fixture intro, both feature segments, and outro. Text was readable and no clipping was observed in those samples. This was sampled visual inspection and technical audio measurement; continuous playback and human listening were not performed for this fixture.

Optional local evidence remains under `orchestrator/.test-tmp/proof/` as `mvo-e2e-test.mp4`, `render-proof.json`, and `contact-sheet.png`. Those generated files are not part of the source publication. The README documents how to regenerate them.

Environment: Node.js 24.11.1 and ffmpeg 8.1.2 on Windows, with existing installed studio and orchestrator dependencies. No dependency installation was needed.
