# MK Suite launcher launch film

[Download the full film, Create preview and editable source ZIP](https://github.com/Mohamed3042/motion-video-skill/releases/tag/mk-suite-launch-2026-10-03).

The 120-second launch film preserves the existing seven-act direction and uses all 31 launcher design screens. These screens illustrate the next update; they are not recordings of a shipped launcher. The closing card states that the new MK Suite is coming in the next update.

![Your tools. One place.](out/poster.jpg)

## Delivery

- `MK-Suite-Launch.mp4`: 1920×1080, 60 fps, 120 seconds, H.264 with stereo AAC audio.
- `MK-Suite-Create-Preview.mp4`: the 24-second Create chapter, at the same resolution and frame rate.
- `MK-Suite-Launch-Source.zip`: this standalone project plus its generated PCM score. Install dependencies to edit or render.

Open `index.html` for the chaptered player. It streams the release videos and requires internet access. The videos are release assets because the full film exceeds GitHub's regular Git file-size limit. Download them to `out/` if you want to run the local delivery verifier.

The released master decodes through all 7,200 frames. All 67 declared impact/title/key/click onsets pass within one frame. Its exported audio measures −14.2 LUFS and −2.3 dBTP. [Delivery validation](evidence/delivery-validation.json), [sampled visual review](evidence/visual-review.md) and [source changes](SOURCE-CHANGES.md) describe the evidence and its limits. Visual review used sampled frames and transition strips; continuous human viewing and listening are not claimed.

## Edit and render

Use Node.js 24 or later, npm, and `ffmpeg`/`ffprobe` on your PATH. Node's built-in TypeScript support runs the score scripts. The dependency lockfile is included.

From this project's `studio/` directory:

```sh
npm ci
npm run typecheck
npm run music
npm run check
npm run dev
```

`MkSuiteLaunch` is the complete film. `MksAct` previews an individual chapter with `--props='{"id":"create"}'`; chapter previews include 12-frame handles at either end. The compositions are registered in `studio/src/RecoveryRoot.tsx` and use the isolated entry `studio/src/index.ts`.

To render and master a new export:

```sh
npm run render
npm run master
npm run verify
```

Rendering creates `out/MK-Suite-Launch-render.mp4`. Mastering copies that video stream and applies the verified oversampled limiter to the PCM score before AAC encoding, producing `out/MK-Suite-Launch.mp4`. The helper refuses to overwrite an existing final file. Move an earlier export aside before creating a replacement. Verification checks the complete decode, duration, codecs, loudness, peak level and declared sound onsets, and writes results to `evidence/`.

The delivered video is preserved byte-for-byte in the release. Future renders use the repository's BT.709 Remotion configuration. This publication was typechecked using the existing installed dependencies; a fresh `npm ci` installation was not tested.

## Project contents

- `BRIEF.md`: the recovered director's brief.
- `studio/src/mks/`: seven acts, shared camera/window toolkit, timing and screen manifest.
- `studio/public/mks/`: launcher artwork and image crops. Git excludes generated WAVs; run `npm run music` after cloning. The release source ZIP includes the score used for the delivered master. Remotion loads the Google fonts during rendering.
- `studio/scripts/mks/`: deterministic score synthesis, sound checks, still rendering and export verification.
- `evidence/`: compact delivery measurements and sampled review images. The source audit records the original recovery snapshot; its local preservation archive is not included in this public project.

The prior MK Suite films and other repository projects remain in their existing directories.
