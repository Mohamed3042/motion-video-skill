// D + E · the Studio library (01): the Ctrl K search overlay (16) drops in and "voice" types live; then the pinned
// run — MK Voice, MK Tones, CharForge Studio lift out of the library one per downbeat — and everything runs off left
// into the framework's whip-pan.
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {C, FONT} from '../../brand';
import {Crop, Highlight, Stage, Super, ease, lerp, prog, springAt, type Rect} from '../../kit';
import {Sweep, Win, track, type Shot} from './parts';
import {CROP, R01, R16} from './rects';
import {T, TYPED, typeF} from './timing';

const L: Record<string, Shot> = {
  appear: {m: 1.3, fx: 865, fy: 494, z: -2600, o: 0},
  behind: {m: 1.3, fx: 865, fy: 494, z: -1500, o: 0.55},
  arrive: {m: 1.3, fx: 865, fy: 494},
  typing: {m: 1.4, fx: 865, fy: 452},
  result: {m: 1.42, fx: 865, fy: 455},
  library: {m: 0.98, fx: 793, fy: 476},
  library2: {m: 0.98, fx: 805, fy: 482},
  truck1: {m: 1, fx: 912, fy: 500},
  truck1b: {m: 1, fx: 932, fy: 500},
  truck2: {m: 1, fx: 1052, fy: 500},
  truck2b: {m: 1, fx: 1080, fy: 500},
};

const shotAt = (f: number) =>
  track(f, [
    [846, L.appear],
    [T.kKey, L.behind, ease.out],
    [T.type0, L.arrive, ease.out],
    [T.voiceHl, L.typing],
    [T.enter, L.result],
    [1064, L.library],
    [1170, L.library2],
    [1208, L.truck1],
    [1290, L.truck1b],
    [1328, L.truck2],
    [1446, L.truck2b],
  ]);

// Pinned products: lift (spring, lands on the beat), hold, exit left.
type Pin = {rect: Rect; lift: number; exit?: number; to: {x: number; y: number; s: number}; hue: string; name?: string; line?: string};
const PINS: Pin[] = [
  {rect: R01.voiceHero, lift: T.voice - 24, exit: 1164, to: {x: 960, y: 470, s: 1.45}, hue: '30,215,96'},
  {rect: R01.tones, lift: T.tones - 22, exit: 1284, to: {x: 690, y: 540, s: 1.55}, hue: '63,123,255', name: 'MK Tones', line: 'Melody sketches.'},
  {rect: R01.charforge, lift: T.charforge - 22, to: {x: 690, y: 540, s: 1.55}, hue: '201,196,188', name: 'CharForge Studio', line: 'Character variants.'},
];

const PinCard: React.FC<{f: number; pin: Pin; shot: Shot}> = ({f, pin, shot}) => {
  if (f < pin.lift) return null;
  const {m, fx, fy, ox = 0, oy = 0} = shot;
  const r = pin.rect;
  const from = {x: 960 + ox + (r.x + r.w / 2 - fx) * m, y: 540 + oy + (r.y + r.h / 2 - fy) * m, s: m};
  const u = springAt(f, pin.lift, {stiffness: 150, damping: 19});
  const e = pin.exit !== undefined ? ease.in(prog(f, pin.exit, pin.exit + 22)) : 0;
  if (e >= 1) return null;
  const s = lerp(from.s, pin.to.s, u);
  const cx = lerp(from.x, pin.to.x, u) - 1700 * e;
  const cy = lerp(from.y, pin.to.y, u);
  const w = r.w * s;
  const h = r.h * s;
  const lift = Math.min(1, u);
  return (
    <div
      style={{
        position: 'absolute',
        left: cx - w / 2,
        top: cy - h / 2,
        width: w,
        height: h,
        borderRadius: 12 * s,
        transform: `perspective(1800px) rotateX(${8 * (1 - lift)}deg) rotateY(${18 * e}deg)`,
        boxShadow: [`0 ${50 * lift}px ${120 * lift}px rgba(0,0,0,${0.7 * lift})`, `0 0 0 1px ${C.line}`, `0 0 ${110 * lift}px rgba(${pin.hue},${0.28 * lift})`].join(', '),
        filter: e > 0.05 ? `blur(${(10 * e * e).toFixed(2)}px)` : undefined,
      }}
    >
      <Crop id="01-library-studio" rect={r} scale={s} radius={12 * s} />
      <Sweep r={{x: 0, y: 0, w, h}} p={prog(f, pin.lift + 30, pin.lift + 80)} strength={0.16} radius={12 * s} />
    </div>
  );
};

// The search overlay, positioned in the dialog's own px (origin = dialog top-left).
const SearchDialog: React.FC<{f: number; m: number}> = ({f, m}) => {
  const d = R16.dialog;
  const q = (r: Rect) => ({left: (r.x - d.x) * m, top: (r.y - d.y) * m, width: r.w * m, height: r.h * m});
  const n = TYPED.split('').filter((_, i) => f >= typeF(i)).length;
  const typing = n > 0 && n < TYPED.length;
  const caretOn = typing || Math.floor((f - T.kKey) / 15) % 2 === 0;
  const fs = R16.fontSize * m;
  const reveal = (at: number) => ease.out(prog(f, at, at + 10));
  const aIn = reveal(typeF(2) + 1);
  const dIn = reveal(typeF(4) + 3);
  const enter = f >= T.enter ? Math.exp(-(f - T.enter) / 10) : 0;
  return (
    <>
      {/* field: the image's own typed text is masked; ours types live in Inter at the measured spot */}
      <div style={{position: 'absolute', ...q(R16.textMask), background: R16.fieldFill}} />
      <div style={{position: 'absolute', left: (R16.textX - d.x - 0.6) * m, top: (R16.baseline - d.y) * m - 0.864 * fs, display: 'flex', alignItems: 'flex-start', height: fs}}>
        <span style={{fontFamily: FONT, fontSize: fs, lineHeight: 1, fontWeight: 500, color: '#FFFFFF', whiteSpace: 'pre', letterSpacing: -0.35 * m}}>{TYPED.slice(0, n)}</span>
        <span
          style={{
            display: 'block',
            marginLeft: (n ? 4.2 : 1) * m,
            marginTop: (R16.caret.y - R16.baseline) * m + 0.864 * fs,
            width: R16.caret.w * m,
            height: R16.caret.h * m,
            background: '#FFFFFF',
            opacity: caretOn ? 1 : 0,
          }}
        />
      </div>
      {/* results appear as the query forms */}
      <div style={{position: 'absolute', ...q(R16.results), background: R16.dialogBg}} />
      {aIn > 0 ? (
        <Crop id="16-command-search" rect={R16.appsBlock} scale={m} style={{position: 'absolute', ...q(R16.appsBlock), opacity: aIn, transform: `translateY(${(1 - aIn) * 14 * m}px)`}} />
      ) : null}
      {dIn > 0 ? (
        <Crop id="16-command-search" rect={R16.destBlock} scale={m} style={{position: 'absolute', ...q(R16.destBlock), opacity: dIn, transform: `translateY(${(1 - dIn) * 14 * m}px)`}} />
      ) : null}
      <Sweep r={{x: (R16.voice.x - d.x) * m, y: (R16.voice.y - d.y) * m, w: R16.voice.w * m, h: R16.voice.h * m}} p={prog(f, T.voiceHl, T.voiceHl + 40)} strength={0.2} radius={14 * m} />
      <Highlight f={f} r={{x: (R16.voice.x - d.x) * m, y: (R16.voice.y - d.y) * m, w: R16.voice.w * m, h: R16.voice.h * m}} start={T.voiceHl - 4} radius={16 * m} width={2.5 * m} />
      {/* Enter key in the footer presses */}
      {enter > 0.01 ? (
        <div style={{position: 'absolute', ...q(R16.enter), borderRadius: 6 * m, background: `rgba(30,215,96,${0.3 * enter})`, boxShadow: `0 0 ${18 * m * enter}px rgba(30,215,96,${0.8 * enter}), inset 0 0 0 ${1.5 * m}px rgba(30,215,96,${enter})`}} />
      ) : null}
    </>
  );
};

export const LibraryScene: React.FC<{f: number}> = ({f}) => {
  if (f < 846) return null;
  const shot = shotAt(f);
  // During the search push-in, frame only the content pane. Restore the sidebar as
  // the camera pulls back to the pinned library after Enter.
  const sidebarCrop = R01.main.x * (1 - ease.inOut(prog(f, T.enter + 18, 1064)));
  const libraryCrop: Rect = {...CROP, x: sidebarCrop, w: CROP.w - sidebarCrop};
  // depth of field while behind the keycaps; dim + defocus while pinned cards are lifted out
  const behind = 1 - ease.out(prog(f, T.kKey, T.type0));
  const pinned = ease.inOut(prog(f, PINS[0].lift, PINS[0].lift + 20));
  const bright = lerp(1, 0.38, behind) * lerp(1, 0.34, pinned);
  const blur = 7 * behind + 6 * pinned;
  const filter = bright < 0.999 || blur > 0.05 ? `brightness(${bright.toFixed(3)}) blur(${blur.toFixed(2)}px)` : undefined;
  // overlay life: drop in on K, close on Enter
  const drop = springAt(f, T.kKey + 5, {stiffness: 230, damping: 22});
  const close = ease.in(prog(f, T.enter + 2, T.enter + 18));
  const overlay = prog(f, T.kKey + 5, T.kKey + 11) * (1 - close);
  const dimO = prog(f, T.kKey + 4, T.kKey + 18) * (1 - close);
  const full16 = prog(f, T.type0 - 6, T.type0 + 6) * (1 - close);
  // run-off into the whip
  const run = ease.in(prog(f, T.runOff, 1446));
  const runX = -1100 * run;
  const lifted = (p: Pin) => f >= p.lift && (p.exit === undefined || f < p.exit + 22);
  const pinIdx = PINS.findIndex((p, i) => f >= p.lift && (i === PINS.length - 1 || f < PINS[i + 1].lift));
  return (
    <AbsoluteFill style={{transform: runX ? `translateX(${runX.toFixed(1)}px)` : undefined, filter: run > 0.02 ? `blur(${(9 * run * run).toFixed(2)}px)` : undefined}}>
      <Stage>
        <Win id="01-library-studio" crop={libraryCrop} shot={shot} rim={0.4} filter={filter}>
          {(px, m) => {
            const main = px(R01.main);
            const dlg = px(R16.dialog);
            const s = (1 - drop) * 0.04 + 1 - 0.03 * close;
            return (
              <>
                {/* holes left by lifted cards */}
                {PINS.map((p, i) => {
                  if (!lifted(p)) return null;
                  const h = px(p.rect);
                  return <div key={i} style={{position: 'absolute', left: h.x, top: h.y, width: h.w, height: h.h, borderRadius: 12 * m, background: '#0E0F0F', boxShadow: `inset 0 0 0 1px ${C.line}`, opacity: prog(f, p.lift, p.lift + 4)}} />;
                })}
                {dimO > 0 ? <div style={{position: 'absolute', left: main.x, top: main.y, width: main.w, height: main.h, background: 'rgba(0,0,0,0.5)', opacity: dimO}} /> : null}
                {full16 > 0 ? <Crop id="16-command-search" rect={libraryCrop} scale={m} style={{position: 'absolute', left: 0, top: 0, opacity: full16}} /> : null}
                {overlay > 0 ? (
                  <div
                    style={{
                      position: 'absolute',
                      left: dlg.x,
                      top: dlg.y,
                      width: dlg.w,
                      height: dlg.h,
                      opacity: overlay,
                      transform: `translateY(${(1 - drop) * -36 * m}px) scale(${s})`,
                    }}
                  >
                    <div style={{position: 'absolute', inset: 2 * m, borderRadius: 18 * m, boxShadow: `0 ${30 * m}px ${80 * m}px rgba(0,0,0,0.65)`}} />
                    <Crop id="16-command-search" rect={R16.dialog} scale={m} />
                    <SearchDialog f={f} m={m} />
                  </div>
                ) : null}
              </>
            );
          }}
        </Win>
      </Stage>
      {PINS.map((p, i) => (
        <PinCard key={i} f={f} pin={p} shot={shot} />
      ))}
      {pinIdx >= 1 && PINS[pinIdx].name ? (
        <div style={{position: 'absolute', left: 1000, top: 452}}>
          <Super
            f={f}
            text={PINS[pinIdx].name!}
            sub={PINS[pinIdx].line}
            start={PINS[pinIdx].lift + 26}
            end={PINS[pinIdx].exit}
            size={92}
            subSize={42}
            align="left"
            maxWidth={820}
          />
        </div>
      ) : null}
    </AbsoluteFill>
  );
};
