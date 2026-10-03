# MK Suite launch: sampled encoded picture review

Reviewed on 2026-10-03 (Asia/Riyadh). This is a picture-only review of decoded frames from `out/MK-Suite-Launch.mp4` in the isolated recovery copy. No source or video file was modified for this review. Audio mastering and technical decode/onset checks were handled separately. The integrator confirmed that the final audio-only remux retained the identical encoded video stream, SHA-256 `c8baba82290e68f2590640c14c2c83ca24ce305203ed935fc2c7ee5680cc6c62`, so the inspected picture remains applicable to the final master.

**Result:** no actionable picture defect was found in the inspected samples. This is sampled visual evidence, not continuous playback acceptance.

## Samples

Frame numbers are zero-based at 60 fps. Read each image left to right, then top to bottom. Unused cells in transition sheets are black padding, not video frames.

| Evidence image | Encoded frames inspected |
| --- | --- |
| [Full-film contact](encoded-contact.jpg) | 0, 240, 480, …, 6960: 30 images at 0, 4, 8, …, 116 seconds |
| [Cold open → Reveal](encoded-cold-reveal.jpg) | 590, 592, 594, 596, 598, 600, 602, 604, 606, 608, 610 |
| [Reveal → Create](encoded-reveal-create.jpg) | 1432, 1434, 1436, 1438, 1440, 1442, 1444, 1446, 1448 |
| [Search return](encoded-search-return.jpg) | 2460, 2464, 2468, 2472, 2476, 2480, 2484, 2488, 2492, 2496, 2500, 2504, 2508 |
| [Work → Grow](encoded-work-grow.jpg) | 3832, 3834, 3836, 3838, 3840, 3842, 3844, 3846, 3848 |
| [Yours → Finale](encoded-yours-finale.jpg) | 5992, 5994, 5996, 5998, 6000, 6002, 6004, 6006, 6008 |

The contact uses `fps=1/4:round=up:start_time=0`, `scale=480:270`, and `tile=5x6`. A decoded-frame checksum comparison confirmed that its first three sampling positions match source frames 0, 240, and 480. Transition sheets select explicit source frame numbers, scale each to 480×270, and tile them without changing the MP4.

## Observations

- Cold open → Reveal: the assembled Explore window retains its placement across the cut; the light bloom and pullback follow it. No duplicated label or stray bottom concept strip was visible in these samples.
- Reveal → Create: the incoming chapter appears inside the green-white bloom and resolves into the Create card. Temporary blur and low contrast occur within the intended bloom.
- Search return: the dialog closes, the camera pulls back to the full library, and the MK Voice card lifts. The sidebar becomes visible with the wider library framing; it does not appear as an isolated left-edge sliver while the sampled search dialog is held.
- Work → Grow: the glyph remains in its intended slot while its bars grow and the chapter text appears. No position jump was evident in the sampled strip.
- Yours → Finale: the Welcome window, cubes, and pin cards retain alignment across frame 6000. No obvious duplicated edge or discontinuity was visible.
- Across the full-film contact, no unintended super overlap, readable price, or visible `DESIGN CONCEPT` label was found. UI portions leave the frame during the documented close-ups and camera moves; the sampled focal content remains legible at contact scale once its animation has settled.

## Limits

This review covers 30 broad samples and 51 closely spaced transition samples, some overlapping. Contact thumbnails are reduced to 480×270 and cannot establish small-print correctness, full-resolution text clarity, or the absence of defects between sampled frames. The last four seconds and every unsampled transition are not covered by this contact. No continuous human watching, listening, device playback, or live UI acceptance is claimed. Audio quality, loudness, timing, and full-file decode results belong to separate verification evidence.
