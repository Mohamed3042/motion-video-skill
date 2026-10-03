# Montage Pro — phone edition

A native 1080 × 1920 companion to the approved desktop Eleven Worlds film: 164 seconds, 60 fps, the same chapter boundaries and original code-synthesized score. Every visual chapter is composed for portrait. The desktop film and its source are preserved.

## Edit and render

Use Node.js 24+, FFmpeg and FFprobe. In `studio`, run `npm ci` for an extracted source archive (the local production checkout reuses installed dependencies through a junction).

```powershell
node node_modules/typescript/bin/tsc --noEmit -p tsconfig.phone.json
npx remotion studio src/phone-entry.tsx
node scripts/mpw/check.ts
node scripts/phone-stills.ts heroes
node scripts/phone-stills.ts 120 720 1560 1680 2310 2850 3270 3540 4350 4690 5280 5790 6360 6900 7210 7660 8010 8430 8670 8910 9570 boundaries
npx remotion render src/phone-entry.tsx MontageProPhone ../out/montage-pro-phone.mp4 --concurrency=2
node scripts/phone-check.mjs
```

The hero stills also supply the portrait multicamera finale. Generate them before rendering the finale or the full film. Keep `public/phone/heroes`, the score, grain and actual computed Sound Lab spectrogram assets together with the source.

The phone composition attenuates the original PCM score by 0.4 dB to retain AAC true-peak headroom. The released master received this adjustment by copying the rendered video stream and encoding the original PCM once; its picture is unchanged. The desktop score and master are preserved.

Read both briefs before changing feature copy. These are authored explanatory scenes, not recordings of a live product session. Drift is measured and reported; profiles are local preferences rather than model training; NLE import compatibility requires separate validation.

Website editions use separate 720 × 1280, 30 fps transports with short keyframe intervals. The silent scroll film holds a decoded frame until the visitor scrolls; the audible copy is selected only through the Sound control. Desktop website assets remain unchanged.

Validation receipts accompany the render. Sampled frame review, browser emulation and measured audio checks do not constitute physical-phone testing or continuous listening approval.
