# Job Orbit v2 — The Flight: production and verification

[Watch or download the release](https://github.com/Mohamed3042/motion-video-skill/releases/tag/job-orbit-v2.0) · [Player source](../../outputs/job-orbit-v2/index.html) · [Editing guide](EDITING.md)

The finished film preserves the saved v2 design: one continuous camera flight from job-search noise through ten 3D stations and a system-wide finale. Its interfaces and records are fictional illustrative animation, not recordings of a running product. The original v1 source, exports and release remain intact.

## Exact delivered files

| Property | Master | Sharing copy |
|---|---|---|
| Filename | `MK-Job-Orbit-v2-1080p60.mp4` | `MK-Job-Orbit-v2-Share-1080p60.mp4` |
| Bytes | 248,377,465 | 97,732,923 |
| Resolution | 1920 × 1080 | 1920 × 1080 |
| Duration / rate / frames | 120 s / 60 fps / 7,200 | 120 s / 60 fps / 7,200 |
| Video | H.264, yuv420p, BT.709 | H.264, yuv420p, BT.709 |
| Audio | Stereo AAC, 48 kHz | Stereo AAC, 48 kHz |
| Integrated loudness / true peak | −14 LUFS / −1.3 dBTP | −14 LUFS / −1.3 dBTP |

The sharing encode copies the validated audio. Both movies pass a complete stream decode, dimensions, duration, frame count/rate, codecs, colour and fast-start checks. Exact file hashes and release filenames are in the release's `SHA256.json`; the [sanitized delivery report](validation/delivery.json) and [master](validation/master-media.json)/[sharing](validation/share-media.json) media reports preserve their technical evidence.

## Sound checks

Both encoded movies pass all **65 declared impacts** within one frame with the required onset jump. A deliberately injected two-frame shift is rejected at all 65 positions. The measured loudness spread between the ten stations is 0.2 LU. See the [master](validation/master-audio.json) and [sharing](validation/share-audio.json) audio reports. The [source score report](validation/score.json) records the actual synthesized WAV and timing fingerprint.

These measurements verify declared events and technical properties. **The audio has not been listened to.**

## Visual and preservation review

Sampled review inspected 151 integrated source frames, including approach/departure views for every station, 20 representative frames extracted from the master and four from the sharing copy. No blocking visual fault was found. Minor side-margin drift during later movement was retained from the saved design. This was sampled inspection, not continuous playback review.

The [master contact sheet](../../outputs/job-orbit-v2/master-contact.jpg) and [source-frame review](validation/review.json) document that scope. The preservation comparison confirms **130 original scene/asset files remained byte-identical** to the recovery snapshot. The resume corrected only the stills utility's stale composition ID and added verification/export helpers. Recovery snapshots, transcripts, raw renders and browser bundles are kept locally and excluded from this release.

The editable ZIP is assembled from a file allowlist: v2 picture/sound source and assets, studio dependency manifest/lock/config, the referenced briefs, product truth notes, v2 editing/production notes, the actual source WAV and its synthesis report, LICENSE and a dedicated archive README. It excludes dependencies, other products and private runtime records. Standalone package verification is recorded in [package validation](validation/package.json).
