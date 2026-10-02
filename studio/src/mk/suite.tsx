import React from 'react';
import {AbsoluteFill, interpolate, interpolateColors, useCurrentFrame} from 'remotion';
import {C, FONT, HUES, PRODUCTS, type Hue} from './brand';
import {ReelShell, type SceneSpec} from './engine';
import {EndCard} from './endcard';
import {MKMark, ProductIcon} from './icons';
import {Bars, Blur, Chip, CL, DotGrid, EXPO, IN_OUT, KineticWord, Kicker, LivingBg, Mono, lerp, pop} from './kit';
import {DURATION, EV, SCENES, SFX, TRANS} from './suite.timing';

const MK: Hue = {deep: '#3a0d08', base: '#d93422', hue: C.red, glow: '#ffd2ca'};
const MARK_Y = 400;

// ---------- 01 The MK mark draws itself ----------
const Mark: React.FC = () => {
  const f = useCurrentFrame();
  const draw = interpolate(f, [EV.drawFrom, EV.drawTo], [0, 1], {...CL, easing: IN_OUT});
  const plate = pop(f, EV.markLock - 2, 11, 200, 0.6);
  const stroke = interpolateColors(plate, [0, 0.6], [C.ink, '#ffffff']);
  const ring = lerp(f, EV.markLock, EV.markLock + 40, 0, 1, EXPO);
  const S = 280;
  return (
    <AbsoluteFill>
      <LivingBg f={f} theme="light" hue={MK} spot={lerp(f, 0, 90)} />
      <DotGrid f={f} theme="light" opacity={0.5} />
      {f >= EV.markLock ? (
        <div style={{position: 'absolute', left: 960 - 160 - ring * 520, top: MARK_Y - 160 - ring * 520, width: 320 + ring * 1040, height: 320 + ring * 1040, borderRadius: '50%', border: `3px solid ${C.red}`, opacity: (1 - ring) * 0.8}} />
      ) : null}
      <div style={{position: 'absolute', left: 960 - S / 2, top: MARK_Y - S / 2, filter: `drop-shadow(0 30px 50px rgba(16,19,25,${0.28 * plate}))`}}>
        <MKMark size={S} draw={draw} plate={plate} stroke={stroke} />
      </div>
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 600,
          textAlign: 'center',
          fontFamily: FONT,
          fontWeight: 700,
          fontSize: 120,
          letterSpacing: '-0.04em',
          color: C.ink,
          clipPath: `inset(0px ${(1 - lerp(f, EV.word, EV.word + 26)) * 50}% 0px ${(1 - lerp(f, EV.word, EV.word + 26)) * 50}%)`,
        }}
      >
        MK Suite
      </div>
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 760,
          textAlign: 'center',
          fontFamily: FONT,
          fontWeight: 500,
          fontSize: 44,
          letterSpacing: '-0.02em',
          color: C.sub,
          opacity: lerp(f, EV.tagline, EV.tagline + 20),
          translate: `0px ${lerp(f, EV.tagline, EV.tagline + 26, 24, 0)}px`,
        }}
      >
        Your tools. One place.
      </div>
    </AbsoluteFill>
  );
};

// ---------- 02 Library: 17 product tiles land in the grid ----------
const ORDER = PRODUCTS; // create, work, grow
const CW = 250;
const CH = 160;
const GAP = 18;
const cardPos = (i: number) => ({x: 165 + (i % 6) * (CW + GAP), y: 340 + Math.floor(i / 6) * (CH + GAP)});

const Card: React.FC<{i: number; f: number}> = ({i, f}) => {
  const p = ORDER[i];
  const at = EV.icons[i];
  const {x, y} = cardPos(i);
  const t = interpolate(f, [at - 14, at], [0, 1], {...CL, easing: EXPO});
  const ang = (i * 137.5 * Math.PI) / 180;
  const fx = x + Math.cos(ang) * 900;
  const fy = y + Math.sin(ang) * 600;
  const land = interpolate(f, [at, at + 3, at + 14], [0, 1, 0], CL);
  return (
    <div
      style={{
        position: 'absolute',
        left: fx + (x - fx) * t,
        top: fy + (y - fy) * t,
        width: CW,
        height: CH,
        borderRadius: 16,
        background: C.surface,
        border: `1px solid ${land > 0.05 ? HUES[p.id].hue : C.line}`,
        boxShadow: `0 13px 30px rgba(35,38,45,0.10), 0 2px 5px rgba(35,38,45,0.05), 0 0 ${26 * land}px ${HUES[p.id].hue}88`,
        opacity: interpolate(t, [0, 0.25], [0, 1], CL),
        rotate: `${(1 - t) * (i % 2 ? 18 : -18)}deg`,
        scale: `${0.7 + 0.3 * t}`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 14,
      }}
    >
      <ProductIcon id={p.id} size={70} />
      <div style={{fontFamily: FONT, fontWeight: 600, fontSize: 21, letterSpacing: '-0.015em', color: C.ink, whiteSpace: 'nowrap'}}>{p.name}</div>
    </div>
  );
};

const Cards: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <>
      {ORDER.map((p, i) => (
        <Card key={p.id} i={i} f={f} />
      ))}
    </>
  );
};

const Library: React.FC = () => {
  const f = useCurrentFrame();
  const landed = EV.icons.filter((at) => f >= at).length;
  const drift = lerp(f, 180, 420, 1.0, 1.035, IN_OUT);
  return (
    <AbsoluteFill>
      <LivingBg f={f} theme="light" hue={MK} />
      <DotGrid f={f} theme="light" opacity={0.45} />
      <AbsoluteFill style={{scale: `${drift}`}}>
        <div style={{position: 'absolute', left: 165, top: 150, opacity: lerp(f, 186, 204)}}>
          <Kicker color={C.sub} dot={C.red}>
            MK Suite catalog
          </Kicker>
        </div>
        <div style={{position: 'absolute', left: 165, top: 196, display: 'flex', alignItems: 'baseline', gap: 24, fontFamily: FONT, fontWeight: 800, fontSize: 88, letterSpacing: '-0.045em', color: C.ink}}>
          <span style={{opacity: lerp(f, 196, 212)}}>
            <span style={{display: 'inline-block', minWidth: 104, textAlign: 'right', fontVariantNumeric: 'tabular-nums'}}>{landed}</span> products.
          </span>
          <span style={{color: C.red, opacity: lerp(f, EV.catalog, EV.catalog + 16), translate: `0px ${lerp(f, EV.catalog, EV.catalog + 24, 40, 0)}px`}}>One catalog.</span>
        </div>
        <Blur on={f < EV.icons[16] + 2}>
          <Cards />
        </Blur>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ---------- 03 Families: CREATE. WORK. GROW. then the product line sorts into columns ----------
const FAM = [
  {id: 'create', word: 'CREATE', title: 'Create', line: 'Make and refine creative work.'},
  {id: 'work', word: 'WORK', title: 'Work', line: 'Plan, automate and organize.'},
  {id: 'grow', word: 'GROW', title: 'Grow', line: 'Research and move forward.'},
] as const;
const COL_X = [150, 690, 1230];
export const VOICE_ICON_ORIGIN: [number, number] = [COL_X[0] + 30 + 32, 300 + 230 + 32];

const Words: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <>
      {FAM.map((w, i) => (
        <KineticWord key={w.id} f={f} text={w.word} at={EV.words[i]} out={i < 2 ? EV.words[i + 1] - 1 : EV.sort - 14} color={C.ink} accent={C.red} size={200} />
      ))}
    </>
  );
};

const Families: React.FC = () => {
  const f = useCurrentFrame();
  let last: number = EV.words[0];
  for (const w of EV.words) if (f >= w) last = w;
  const k = lerp(f, last, last + 26, 0, 1, EXPO);
  return (
    <AbsoluteFill>
      <LivingBg f={f} theme="light" hue={MK} />
      <DotGrid f={f} theme="light" opacity={0.4} />
      {f < EV.sort ? (
        <>
          <div style={{position: 'absolute', left: 960 - 900, top: 540 - 900, width: 1800, height: 1800, borderRadius: '50%', border: `3px solid ${C.red}`, scale: `${0.15 + k * 0.85}`, opacity: (1 - k) * 0.5}} />
          <Blur on>
            <Words />
          </Blur>
        </>
      ) : null}
      {FAM.map((fam, i) => {
        const s = pop(f, EV.sort - 6 + i * 5, 14, 160, 0.8);
        const items = PRODUCTS.filter((p) => p.family === fam.id);
        return (
          <div
            key={fam.id}
            style={{
              position: 'absolute',
              left: COL_X[i],
              top: 300,
              width: 540,
              height: 530,
              borderRadius: 22,
              background: C.surface,
              border: `1px solid ${C.line}`,
              boxShadow: '0 30px 70px rgba(35,38,45,0.12), 0 3px 8px rgba(35,38,45,0.05)',
              opacity: interpolate(s, [0, 0.3], [0, 1], CL),
              translate: `0px ${(1 - s) * 160}px`,
              padding: 30,
              fontFamily: FONT,
            }}
          >
            <div style={{fontWeight: 600, fontSize: 18, letterSpacing: '0.16em', textTransform: 'uppercase', color: C.sub}}>{`${items.length} products`}</div>
            <div style={{marginTop: 10, fontWeight: 800, fontSize: 72, letterSpacing: '-0.045em', color: C.ink}}>
              {fam.title}
              <span style={{color: C.red}}>.</span>
            </div>
            <div style={{marginTop: 6, fontWeight: 500, fontSize: 26, color: C.sub}}>{fam.line}</div>
            <div style={{position: 'absolute', left: 30, top: 230, display: 'flex', flexWrap: 'wrap', gap: 14, width: 480}}>
              {items.map((p, j) => {
                const q = pop(f, EV.sort + 4 + j * 2 + i * 3, 12, 200, 0.6);
                return (
                  <div key={p.id} style={{scale: `${q}`, opacity: interpolate(q, [0, 0.3], [0, 1], CL)}}>
                    <ProductIcon id={p.id} size={64} />
                  </div>
                );
              })}
            </div>
            <div style={{position: 'absolute', left: 30, right: 30, bottom: 28, fontWeight: 500, fontSize: 19, lineHeight: 1.45, color: C.sub, opacity: lerp(f, EV.sort + 20, EV.sort + 40)}}>
              {items.map((p) => p.name).join(' · ')}
            </div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

// ---------- 04 Featured: MK Voice ----------
const Feature: React.FC<{
  f: number;
  id: string;
  hue: Hue;
  name: string;
  desc: React.ReactNode;
  chips: string[];
  chipAt: readonly number[];
  start: number;
  side: 'left' | 'right';
  status: string;
}> = ({f, id, hue, name, desc, chips, chipAt, start, side, status}) => {
  const x = side === 'left' ? 150 : 1010;
  const ic = pop(f, start + 6, 12, 160, 0.7);
  return (
    <div style={{position: 'absolute', left: x, top: 262, width: 760, fontFamily: FONT}}>
      <div style={{display: 'flex', alignItems: 'center', gap: 28}}>
        <div style={{scale: `${ic}`, opacity: interpolate(ic, [0, 0.3], [0, 1], CL)}}>
          <ProductIcon id={id} size={120} glow={0.4} />
        </div>
        <div>
          <div style={{opacity: lerp(f, start + 10, start + 26)}}>
            <Kicker color={C.nightSub} dot={hue.glow}>
              {status}
            </Kicker>
          </div>
          <div style={{marginTop: 8, fontWeight: 800, fontSize: 96, letterSpacing: '-0.045em', color: '#fff', overflow: 'hidden', paddingBottom: 6}}>
            <div style={{translate: `0px ${lerp(f, start + 8, start + 36, 120, 0)}px`}}>{name}</div>
          </div>
        </div>
      </div>
      <div style={{marginTop: 30, fontWeight: 500, fontSize: 34, lineHeight: 1.36, letterSpacing: '-0.015em', color: C.nightSub, opacity: lerp(f, start + 20, start + 40), translate: `0px ${lerp(f, start + 20, start + 44, 24, 0)}px`}}>
        {desc}
      </div>
      <div style={{marginTop: 40, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 16}}>
        {chips.map((c, i) => {
          const k = pop(f, chipAt[i], 14, 190, 0.7);
          return (
            <div key={c} style={{opacity: interpolate(k, [0, 0.3], [0, 1], CL), translate: `${(1 - k) * (side === 'left' ? -60 : 60)}px 0px`}}>
              <Chip theme="dark" text={c} dot={hue.glow} size={24} />
            </div>
          );
        })}
      </div>
    </div>
  );
};

const VoiceFeature: React.FC = () => {
  const f = useCurrentFrame();
  const h = HUES.voice;
  return (
    <AbsoluteFill>
      <LivingBg f={f} theme="dark" hue={h} />
      <DotGrid f={f} theme="dark" opacity={0.4} />
      <Feature
        f={f}
        id="voice"
        hue={h}
        name="MK Voice"
        status="Featured · Local preview"
        start={590}
        side="left"
        desc={
          <>
            Organize and process your own voice
            <br />
            recordings in a local studio.
          </>
        }
        chips={['Local voice library', 'Voice conversion workflows', 'Dataset preparation and training controls']}
        chipAt={EV.voiceChips}
      />
      <div style={{position: 'absolute', left: 1020, top: 250, width: 750, height: 580, borderRadius: 28, background: 'rgba(12,13,16,0.5)', border: `1px solid ${C.nightLine}`, opacity: lerp(f, 590, 604), overflow: 'hidden'}}>
        <div style={{position: 'absolute', left: 30, top: 26}}>
          <Mono style={{fontSize: 18, color: h.glow}}>VOICE LIBRARY · TAKE 01</Mono>
        </div>
        <div style={{position: 'absolute', left: 30, top: 110}}>
          <Bars n={64} w={690} h={300} seed="suite-voice" t={f} color={h.glow} reveal={lerp(f, EV.voiceWave, EV.voiceWave + 40, 0, 1, IN_OUT)} />
        </div>
        {[0, 1, 2].map((r) => (
          <div key={r} style={{position: 'absolute', left: 30, right: 30, top: 450 + r * 40, height: 28, display: 'flex', alignItems: 'center', gap: 16, opacity: lerp(f, 640 + r * 8, 656 + r * 8)}}>
            <div style={{width: 12, height: 12, borderRadius: 6, background: r === 0 ? h.glow : C.nightSoft}} />
            <div style={{height: 8, borderRadius: 4, background: r === 0 ? '#ffffff' : C.nightSoft, width: [260, 200, 230][r]}} />
            <Mono style={{marginLeft: 'auto', fontSize: 15, color: C.nightSub}}>{['00:42', '00:18', '01:05'][r]}</Mono>
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
};

// ---------- 05 Featured: Montage Pro ----------
const TRACKS = [
  {c: '#02bcc7', off: 0},
  {c: '#fda045', off: 150},
  {c: '#b58cff', off: -120},
  {c: '#e6f6f7', off: 90},
];

const MontageFeature: React.FC = () => {
  const f = useCurrentFrame();
  const h = HUES.audiosync;
  const locked = lerp(f, EV.snaps[2], EV.snaps[2] + 16);
  return (
    <AbsoluteFill>
      <LivingBg f={f} theme="dark" hue={h} />
      <DotGrid f={f} theme="dark" opacity={0.4} />
      <div style={{position: 'absolute', left: 150, top: 250, width: 760, height: 580, borderRadius: 28, background: 'rgba(12,13,16,0.5)', border: `1px solid ${C.nightLine}`, opacity: lerp(f, 766, 780), overflow: 'hidden'}}>
        <div style={{position: 'absolute', left: 30, top: 26}}>
          <Mono style={{fontSize: 18, color: h.glow}}>MULTICAM · 4 SOURCES</Mono>
        </div>
        {TRACKS.map((t, i) => {
          const at = i === 0 ? 0 : EV.snaps[i - 1];
          const x = i === 0 ? 0 : f < at ? t.off * (1 - interpolate(f, [at - 12, at], [0, 1], {...CL, easing: (u) => u * u * u})) : -t.off * 0.05 * Math.sin((f - at) * 0.9) * Math.exp(-(f - at) / 5);
          const fl = i === 0 ? 0 : interpolate(f, [at, at + 3, at + 22], [0, 1, 0], CL);
          return (
            <div key={i} style={{position: 'absolute', left: 90 + x, top: 100 + i * 110, width: 580, height: 84, borderRadius: 12, background: `${t.c}26`, border: `1px solid ${t.c}${fl > 0.1 ? 'ff' : '66'}`, boxShadow: `0 0 ${36 * fl}px ${t.c}`}}>
              <div style={{position: 'absolute', left: 12, top: 12}}>
                <Bars n={56} w={556} h={60} seed={'sm' + i} t={0} live={0} color={`${t.c}aa`} amp={0.55} />
              </div>
              <div style={{position: 'absolute', left: 580 * 0.45 - 4, top: 6, width: 8, height: 72, borderRadius: 4, background: '#fff'}} />
            </div>
          );
        })}
        <div style={{position: 'absolute', left: 90 + 580 * 0.45 - 2, top: 90, width: 4, height: 450, background: '#fff', opacity: locked, boxShadow: `0 0 24px ${h.hue}`}} />
      </div>
      <Feature
        f={f}
        id="audiosync"
        hue={h}
        name="Montage Pro"
        status="Featured · Local preview"
        start={768}
        side="right"
        desc={
          <>
            Align multicamera recordings and prepare an
            <br />
            editing handoff with captions and markers.
          </>
        }
        chips={['AudioSync Pro multicamera alignment', 'Camera and audio-channel selection', 'FCP7 XML, caption and marker exports']}
        chipAt={EV.montageChips}
      />
    </AbsoluteFill>
  );
};

// ---------- 06 End card: the whole line orbits, the MK mark locks ----------
const Ring: React.FC = () => {
  const f = useCurrentFrame();
  const out = lerp(f, EV.lock + 6, EV.lock + 40, 0, 1, EXPO);
  return (
    <>
      {PRODUCTS.map((p, i) => {
        const k = pop(f, EV.ring + i * 2, 14, 170, 0.7);
        const a = (i / PRODUCTS.length) * Math.PI * 2 + f * 0.006;
        const rx = 700 + out * 600;
        const ry = 330 + out * 300;
        return (
          <div key={p.id} style={{position: 'absolute', left: 960 + Math.cos(a) * rx - 32, top: 540 + Math.sin(a) * ry - 32, scale: `${k}`, opacity: interpolate(k, [0, 0.3], [0, 1], CL) * (1 - out)}}>
            <ProductIcon id={p.id} size={64} />
          </div>
        );
      })}
    </>
  );
};

const End: React.FC = () => (
  <EndCard
    theme="light"
    hue={MK}
    from={EV.ring - 24}
    lock={EV.lock}
    tag={EV.tag}
    foot={EV.foot}
    duration={DURATION}
    behind={<Ring />}
    icon={(s) => <MKMark size={s} />}
    title="MK Suite"
    tagline="Your tools, together."
    footer="17 products · Local previews"
    fine="A catalog listing is not a download. Availability varies by product."
  />
);

const COMPS: Record<string, React.FC> = {mark: Mark, library: Library, families: Families, voice: VoiceFeature, montage: MontageFeature, end: End};
const THEMES: Record<string, 'light' | 'dark'> = {mark: 'light', library: 'light', families: 'light', voice: 'dark', montage: 'dark', end: 'light'};
const ORIGINS: Record<string, [number, number]> = {mark: [960, MARK_Y], families: VOICE_ICON_ORIGIN, montage: [960, 540]};
const scenes: SceneSpec[] = SCENES.map((t) => ({t, Comp: COMPS[t.id], theme: THEMES[t.id], origin: ORIGINS[t.id]}));
const shakes = [...SFX.impacts.map((at) => ({at, amp: at === EV.lock ? 14 : 8})), ...SFX.hits.map((at) => ({at, amp: 7}))];

export const MkSuiteReel: React.FC = () => (
  <ReelShell scenes={scenes} T={TRANS} duration={DURATION} hue={MK} product="Product family" right="17 products · One catalog" audio="mk/suite.wav" shakes={shakes} />
);
