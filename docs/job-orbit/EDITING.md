# Editing the Job Orbit feature film

The film is a 120-second, 1920 × 1080, 60 fps Remotion composition: **7,200 frames**, numbered 0–7,199. Ten feature worlds sit between an opening, a brand transition and a finale. Each world has its own accent, illusion and musical arrangement on a shared 120 BPM grid.

The interfaces are coded film illustrations with fictional sample data. They are not recordings of a running product. Preserve the sample labels and the capability limits in [PRODUCT-TRUTH.md](PRODUCT-TRUTH.md).

## Start here

Use `studio/src/orbit/entry.tsx`, composition ID `JobOrbit`. This standalone entry avoids loading the other film compositions. The source ZIP keeps the same `studio/` paths as the repository; start at its extracted root. Shared visual helpers are contained in `src/orbit/shared.tsx`; retain the supplied assets in `public/orbit/`.

Prerequisites: Node.js 24 is recommended; Node.js 22.18 or newer also supports the direct TypeScript commands below. Put `ffmpeg` and `ffprobe` on PATH. Initial setup may download Chromium and Google Fonts. From the repository or extracted source root:

```sh
cd studio
npm install
npx remotion studio src/orbit/entry.tsx
```

On Windows PowerShell, use `npm.cmd` and `npx.cmd` if script execution policy blocks the corresponding PowerShell wrappers.

## Edit, synthesize, check and render

Run these commands from `studio/`, in order after editing. The soundtrack generator writes `public/orbit/music.wav` and its measurement/timing report under `../out/audio/orbit/`.

```sh
npx tsc --noEmit
node scripts/orbit/music.ts
node scripts/orbit/check.ts --self-test
npx remotion render src/orbit/entry.tsx JobOrbit ../outputs/job-orbit-raw.mp4 --concurrency=6
node scripts/orbit/finalize.ts ../outputs/job-orbit-raw.mp4 ../outputs/job-orbit.mp4
node scripts/orbit/check.ts ../outputs/job-orbit.mp4 --self-test
```

The finalizer preserves the raw render, copies its video without re-encoding, and replaces its audio with a separately encoded 48 kHz stereo AAC track from the generated score. This avoids peak overshoot from the raw render's audio encoding. Input and output must be different paths, and the final output must not already exist; choose a new final filename for a revised export.

The last command checks the actual finalized MP4, not just the source WAV or raw render. It writes `../out/audio/orbit/sync-job-orbit.mp4.json`. The checker requires the `master-report.json` produced by the current soundtrack generation. Changing declared timing invalidates that report: regenerate the soundtrack before checking or rendering again.

Inspect the final container as well:

```sh
ffprobe -v error -show_entries format=duration:stream=codec_type,codec_name,width,height,avg_frame_rate,nb_frames,pix_fmt,color_space,color_transfer,color_primaries,sample_rate,channels -of json ../outputs/job-orbit.mp4
```

Expected specification: 120 seconds; 7,200 video frames; 60 fps; 1920 × 1080; H.264 video; `yuv420p`; BT.709; 48 kHz stereo AAC audio. Keep the codec, pixel format and color-space settings in `remotion.config.ts`. The generated source WAV is 44.1 kHz, 16-bit stereo; finalization produces the 48 kHz AAC delivery track.

These are specification targets, not a claim that a newly generated export has passed. Use the reports generated for the actual final file. Do not reuse earlier loudness, onset, file-size or hash numbers after a new export. The delivered export's results are recorded in [PRODUCTION.md](PRODUCTION.md).

For a smaller sharing copy, compress the video while **copying the validated AAC audio**. Do not encode the soundtrack a second time:

```sh
ffmpeg -hide_banner -n -i ../outputs/job-orbit.mp4 -map 0:v:0 -map 0:a:0 -vf scale=1280:720:flags=lanczos -c:v libx264 -crf 25 -preset slow -pix_fmt yuv420p -colorspace bt709 -color_primaries bt709 -color_trc bt709 -c:a copy -movflags +faststart ../outputs/job-orbit-share.mp4
node scripts/orbit/check.ts ../outputs/job-orbit-share.mp4 --self-test
```

This creates a 1280 × 720 sharing copy at the source's 60 fps. `-c:a copy` preserves the finalized soundtrack without another lossy audio encode. Validate the sharing file separately because it is a new media container with a newly encoded video stream. Its size depends on the final picture; the command does not promise the delivered file's exact byte count.

## Timeline

Frame ranges below include the start and exclude the end. Global timing lives in `src/orbit/timing.ts`; the finale uses `src/orbit/finale/timing.ts`.

| Section | Seconds | Global frames | Picture / sound direction |
|---|---:|---:|---|
| The noise | 0–12 | 0–720 | Search overload; accumulating percussion and tension |
| Orbit | 12–22 | 720–1,320 | Signals organize around the brand; harmonic lift |
| Profile & resume | 22–30 | 1,320–1,800 | Spiral illusion; Rhodes arrangement |
| The globe | 30–38 | 1,800–2,280 | Rotating sphere; orbital pads |
| New findings | 38–46 | 2,280–2,760 | Lilac chaser; bright mallet pattern |
| Job focus | 46–54 | 2,760–3,240 | Ebbinghaus circles; keys and heartbeat rhythm |
| Your fit | 54–62 | 3,240–3,720 | Checker-shadow illusion; funk |
| Next proof | 62–70 | 3,720–4,200 | Ponzo rails; stepwise musical build |
| My market | 70–78 | 4,200–4,680 | Zöllner lines; house arrangement |
| Employers | 78–86 | 4,680–5,160 | Café wall; neo-soul arrangement |
| Evidence & agents | 86–94 | 5,160–5,640 | Barber pole; techno arrangement |
| Yours, everywhere | 94–102 | 5,640–6,120 | Apparent motion between dots; lo-fi arrangement |
| Finale | 102–120 | 6,120–7,200 | Ten-world montage, logo convergence, end card |

The finale montage starts at frame 6,120. Rings converge at 6,420; the logo locks at 6,480 (108 seconds); end-card lines begin at 6,570; the fade begins at 7,080 (118 seconds).

## Where to change things

| Change | File or directory |
|---|---|
| Composition registration and output dimensions | `src/orbit/entry.tsx` |
| Duration, section bounds, beat grid and overlap | `src/orbit/timing.ts` |
| One section's picture | `src/orbit/sections/<id>/World.tsx` |
| One section's sound-bearing events and montage pose | `src/orbit/sections/<id>/timing.ts` |
| Section registry | `src/orbit/sections/index.ts` |
| Fonts, palette, accent colors and logo path | `src/orbit/brand.ts` |
| Portal transitions, HUD and finishing layers | `src/orbit/shell/` |
| Finale picture and timing | `src/orbit/finale/` |
| Audio arrangements, synthesis and mastering | `scripts/orbit/music.ts`, `dsp.ts`, `types.ts` and `sections/` |
| Audio timing and media checks | `scripts/orbit/check.ts` |
| Final video/audio assembly | `scripts/orbit/finalize.ts` |
| Film assets and generated soundtrack | `public/orbit/` |

## Keep picture and sound together

`FPS = 60`, `BEAT = 30` frames and `BAR = 120` frames. Section `EVENTS` use **local** frames; global time is the section start plus the local frame. Framework portal events and finale events use global frames. The music generator and checker read these timing modules directly.

Scenes use `useSectionFrame()` from `src/orbit/frame.ts`. The shell starts each sequence `PAD = 12` frames early and ends it 12 frames late, so local frames can run from −12 through the section's end overlap. Preserve that coordinate system when moving an animation. Do not subtract the overlap a second time.

Move an animation beat and its declared event together. Update `HERO_FRAME` when the best readable montage pose changes. Regenerate music after event or boundary changes. The authored central score is in `music.ts`; optional section modules can supply non-silent arrangements. Retain this behavior when changing a world's instruments.

Animate from frame values and seeded randomness. Avoid wall-clock time, unseeded randomness and external mutable data. Keep text within the 72-pixel safe margin and retain a readable product state between the title and outgoing portal. The optical illusions are visual metaphors, not product algorithms.

## Visual and audio review

Render at least two stills for each changed section and frames around its transitions, then inspect them. This standalone command does not depend on the repository's general composition index:

```sh
npx remotion still src/orbit/entry.tsx JobOrbit ../outputs/orbit-focus-review.png --frame=3100
npx remotion still src/orbit/entry.tsx JobOrbit ../outputs/orbit-fit-transition.png --frame=3240
```

For the transition at frame 3,240, also inspect frames 3,234 and 3,246. Review the finished video in playback for pacing, legibility, flashes, portals and audio balance.

The automated audio check targets declared impacts within ±1 frame, at least a 6 dB onset jump, integrated loudness around −14 LUFS, true peak below −1 dBTP and no more than 1.5 LU spread across the ten worlds. Its self-test injects a two-frame error to confirm that the detector rejects mistiming. These checks do not prove that the film has been watched or the mix listened to. Record those reviews separately and report any unperformed review honestly.

## Content changes

Read [PRODUCT-TRUTH.md](PRODUCT-TRUTH.md) before changing product copy. Keep confirmed facts distinct from drafts, observations distinct from current openings, and scenarios distinct from earned skills. The phone companion requires the PC workspace and its private connection to remain available. Optional external providers and encrypted backups mean “nothing leaves your PC” is not an accurate whole-product promise.

Do not introduce real resumes, personal application records, credentials, working private links or claims of hiring outcomes. Keep all sample employers, people, dates and values clearly illustrative. A rendered click demonstrates the story; it does not establish a completed application, a working provider connection or a physical-device test.
