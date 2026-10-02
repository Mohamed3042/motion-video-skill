# Job Orbit — production and verification

The film runs for **120 seconds at 60 fps**, with an opening, ten feature worlds and a finale. Each world combines a distinct optical illusion, accent color and synthesized musical arrangement. The interfaces are coded illustrations of source-backed workflows with fictional sample data, not runtime screen recordings. See [PRODUCT-TRUTH.md](PRODUCT-TRUTH.md) for the claim boundaries and [EDITING.md](EDITING.md) for the reproducible build workflow.

Open the [chaptered player](../../outputs/job-orbit/index.html) or the [sharing copy](../../outputs/job-orbit/job-orbit-share.mp4).

## Delivered media

The [media validation report](validation/media.json) records the final files, hashes and checks. Both files passed technical validation; values below describe these exact exports.

| Property | Full-quality film | Sharing copy |
|---|---|---|
| Release filename | `MK-Job-Orbit-1080p60.mp4` | `MK-Job-Orbit-720p60.mp4` |
| Resolution | 1920 × 1080 | 1280 × 720 |
| Duration | 120.000 seconds | 120.000 seconds |
| Video frames / rate | 7,200 / 60 fps | 7,200 / 60 fps |
| File size | 103,538,037 bytes | 18,947,519 bytes |
| Video | H.264, `yuv420p`, BT.709 | H.264, `yuv420p`, BT.709 |
| Audio | AAC, 48 kHz, stereo | AAC, 48 kHz, stereo |
| Integrated loudness | −14.0 LUFS | −14.0 LUFS |
| True peak | −1.3 dBTP | −1.3 dBTP |

The repository player uses `job-orbit-share.mp4` for the same sharing file. Exact SHA-256 hashes are in the media report. Both streams start at timeline zero, and decoded audio is exactly 120 seconds. A complete audio/video decode exited successfully with zero error-output bytes for each file.

## Timing and audio checks

The checker reads the picture's timing declarations independently of the synthesized score's report. It verifies the timing fingerprint and measures the decoded audio of the actual final MP4. Full and sharing exports produced the same results:

| Check | Measured result | Acceptance bound |
|---|---:|---:|
| Declared impact/hit onset positions | 65 passed; 0 failed | All declared positions must pass |
| Maximum absolute onset offset | 0.257143 frames | At most 1 frame |
| Minimum onset jump | 15.357992 dB | At least 6 dB |
| Integrated loudness | −14.0 LUFS | −14 ± 0.5 LUFS |
| True peak | −1.3 dBTP | Below −1 dBTP |
| Loudness spread across ten worlds | 0.2 LU | At most 1.5 LU |
| Negative control: injected two-frame shift | 65 of 65 positions rejected | At least 80% rejected |

These measurements concern declared impact/hit positions, not an assessment of every musical detail. The [score report](validation/score.json) records the 44.1 kHz, 16-bit stereo source WAV and its timing fingerprint. The delivered AAC track is separately encoded at 48 kHz, then combined with the rendered video without another video encode.

The [finalizer validation](validation/finalizer.json) confirms that video packets were preserved, the existing final was protected, and same-path or existing-output requests were rejected. It also records a passing typecheck and checker run. Full-quality and sharing files contain identical audio packets: the sharing encode uses `-c:a copy` to retain the validated soundtrack.

## Visual review

Sampled review covered **41 frames extracted from the final exported film**, presented on seven contact sheets. It covered the opening, feature worlds, transitions, montage and end card. The final renderer log was empty: **0 bytes**.

- [Review sheet 1](../../outputs/job-orbit/review/sheet-1.jpg)
- [Review sheet 2](../../outputs/job-orbit/review/sheet-2.jpg)
- [Review sheet 3](../../outputs/job-orbit/review/sheet-3.jpg)
- [Review sheet 4](../../outputs/job-orbit/review/sheet-4.jpg)
- [Review sheet 5](../../outputs/job-orbit/review/sheet-5.jpg)
- [Review sheet 6](../../outputs/job-orbit/review/sheet-6.jpg)
- [Review sheet 7](../../outputs/job-orbit/review/sheet-7.jpg)

The JSON media report covers technical measurements only; its `visualReviewIncluded: false` describes that report's scope. The sampled visual review is documented separately here and by these sheets. An empty renderer log and successful decode are technical evidence, not substitutes for viewing the images.

## Acceptance limits

Continuous end-to-end watching and human listening were **not performed**. Physical-device playback was not verified. The sampled frame review and automated media checks do not establish those forms of acceptance.

This film also does not establish live research completion, a working external provider, a submitted application or physical-phone product acceptance. Its buttons and status changes are animated illustrations. Candidate facts, employers and example values are fictional sample data; the depicted optical illusions are creative metaphors.
