# Montage Pro: Eleven Worlds — editing guide

The 164-second film uses its own entry point, `studio/src/mpw-entry.tsx`, so it does not modify the existing shared studio root or other films.

Use Node.js 24 or newer and FFmpeg/FFprobe on PATH. From a repository clone:

```powershell
cd studio
npm ci
node scripts/mpw/worlds/sound-spectro.ts
node scripts/mpw/music.ts
node scripts/mpw/check.ts
node node_modules/typescript/bin/tsc --noEmit -p tsconfig.mpw.json
npx remotion studio src/mpw-entry.tsx
```

To export and check:

```powershell
npx remotion render src/mpw-entry.tsx MontageProWorlds ../outputs/montage-pro-worlds.mp4 --concurrency=2
node scripts/mpw/check.ts ../outputs/montage-pro-worlds.mp4
```

The generated WAV is ignored by Git. Regenerate it before previewing or exporting a repository clone. The release's editable source ZIP includes the verified WAV, complete standalone dependencies manifest, scenes, synthesis scripts, required shared helpers, player and poster. Extract it and use its included README; its TypeScript config is `tsconfig.release.json`, and its export directory is `out/`.

Read [the production brief](../../briefs/montage-pro-worlds.md) before changing claims or content. Timing lives in `studio/src/mpw/timing.ts` and each world's timing module. Both picture and sound use these constants. Each world has its own accent and musical language; all synthesis is seeded. Preserve BT.709, the 60 fps grid and the product's local capability limits.

The Sound Lab spectrogram is computed from its synthesized audio. Run its generator after changing that audio. The master script requires all eleven worlds plus intro/finale to be non-silent, rejects invalid/out-of-window audio and checks loudness, true peak and duration. The onset check verifies every declared impact on WAV and encoded MP4.

Download the MP4 beside the extracted source ZIP's `out/montage-pro-worlds.html` for local playback. Run `node out/serve-player.mjs` from the extracted project to serve its player with working byte-range seeking. The repository's player instead streams and downloads the published master from the release.
