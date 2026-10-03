// Finale (150–164 s): a 4×3 multicam grid of every world's hero frame with the amber active angle cutting on
// every beat (Camera Director style); the tiles fold into clip bars that slide into sync and collapse into the
// playhead line; at f9480 the line splits into In/Out brackets that lock MONTAGE PRO; then the end card.
import React from 'react';
import {AbsoluteFill, Freeze, useCurrentFrame} from 'remotion';
import {ACCENT, C, FONT, H, MONO, RADIUS, W} from '../brand';
import {DURATION, FINALE, PAD, WORLDS} from '../timing';
import {WORLD_IMPL} from '../worlds';
import {Intro} from '../intro/Intro';
import {HIT} from '../intro/timing';
import {Wordmark} from '../shell/Wordmark';
import {SECTIONS} from '../shell/timing';
import {CX, CY, ease, hash, lerp, mixHex, prog, rgba, smooth} from '../shell/util';
import {ACTIVE_TILE, COLLAPSE, LINES, LOGO_LOCK, MBEAT, MONTAGE, RISE, SLIDE, SNAPS, TILE_W, tileRect} from './timing';

const TILES = [{id: 'intro', name: 'PHASE LOCK', acc: C.amber}, ...WORLDS.map((w) => ({id: w.id, name: w.name, acc: ACCENT[w.id]}))];
const S = TILE_W / W;
const MORPH = SLIDE + 24; // tiles become plain clip bars

// Clip-bar layout for the sync slide: 12 stacked tracks, each out of sync by its own offset.
const BAR_W = 560;
const BAR_H = 30;
const barY = (i: number) => CY + (i - 5.5) * 40;
const barOff = (i: number) => (hash(i * 31 + 7) * 2 - 1) * 300 + (i % 2 ? 60 : -60);
const syncK = (i: number, g: number) => ease.cubicIn(prog(g, SNAPS[Math.floor(i / 4)] - 14, SNAPS[Math.floor(i / 4)]));

const activeAt = (g: number) => {
  if (g < MONTAGE || g >= SLIDE) return -1;
  return ACTIVE_TILE[Math.min(ACTIVE_TILE.length - 1, Math.floor((g - MONTAGE) / MBEAT))];
};

const TileContent: React.FC<{i: number}> = ({i}) => {
  if (i === 0)
    return (
      <Freeze frame={HIT + PAD}>
        <Intro />
      </Freeze>
    );
  const {World, HERO_FRAME} = WORLD_IMPL[WORLDS[i - 1].id];
  return (
    <Freeze frame={HERO_FRAME + PAD}>
      <World />
    </Freeze>
  );
};

// One tile: grid cell during the montage, morphing into its clip bar at SLIDE.
const Tile: React.FC<{i: number; g: number}> = ({i, g}) => {
  const t = TILES[i];
  const r = tileRect(i);
  // entrance: staggered from the Anywhere tile (11) outward
  const delay = 2 * Math.hypot((i % 4) - 3, Math.floor(i / 4) - 2);
  const enter = ease.cubicOut(prog(g, MONTAGE - 4 + delay, MONTAGE + 6 + delay));
  if (enter <= 0) return null;
  const m = ease.cubicInOut(prog(g, SLIDE + (i % 4), SLIDE + 18 + (i % 4)));
  const bx = CX - BAR_W / 2 + barOff(i) * (1 - syncK(i, g));
  const x = lerp(r.x, bx, m);
  const y = lerp(r.y, barY(i) - BAR_H / 2, m);
  const w = lerp(r.w, BAR_W, m);
  const h = lerp(r.h, BAR_H, m);
  const act = activeAt(g);
  const on = act === i;
  const sinceCut = (g - MONTAGE) % MBEAT;
  const pop = on ? Math.exp(-sinceCut / 6) : 0;
  const lift = on ? 1 + 0.035 * ease.expoOut(prog(sinceCut, 0, 6)) : 1;
  const zoom = 1 + 0.06 * prog(g, MONTAGE, SLIDE);
  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width: w,
        height: h,
        borderRadius: lerp(RADIUS.dialog, 4, m),
        overflow: 'hidden',
        background: C.canvas,
        opacity: enter,
        transform: `scale(${(lift * lerp(0.92, 1, enter)).toFixed(4)})`,
        boxShadow: on
          ? `0 0 0 3px ${C.amber}, 0 0 ${24 + 30 * pop}px ${rgba(C.amber, 0.55 + 0.3 * pop)}`
          : `0 0 0 1px ${m > 0 ? rgba(t.acc, 0.8) : C.line}, 0 10px 30px rgba(0,0,0,0.5)`,
        zIndex: on ? 2 : 1,
      }}
    >
      {g < MORPH ? (
        <div style={{position: 'absolute', left: (w - W * S * zoom) / 2, top: (h - H * S * zoom) / 2, width: W, height: H, transformOrigin: '0 0', transform: `scale(${(S * zoom).toFixed(5)})`}}>
          <TileContent i={i} />
        </div>
      ) : null}
      {/* dim the inactive angles so the cut reads; fill with the world colour as the tile becomes a clip */}
      <AbsoluteFill style={{background: '#000000', opacity: act >= 0 && !on ? 0.32 : 0}} />
      <AbsoluteFill style={{background: `linear-gradient(90deg, ${t.acc} 0%, ${mixHex(t.acc, C.panel, 0.35)} 100%)`, opacity: ease.cubicIn(m)}} />
      {m < 0.5 ? (
        <div style={{position: 'absolute', left: 12, bottom: 10, display: 'flex', gap: 8, alignItems: 'center', opacity: 1 - 2 * m}}>
          <span style={{fontFamily: MONO, fontWeight: 700, fontSize: 12, letterSpacing: '0.16em', color: C.text, background: 'rgba(16,18,17,0.78)', padding: '3px 7px', borderRadius: 4}}>
            {`${String(i).padStart(2, '0')}  ${t.name}`}
          </span>
        </div>
      ) : (
        <div style={{position: 'absolute', left: 12, top: 0, height: h, display: 'flex', alignItems: 'center', fontFamily: MONO, fontWeight: 700, fontSize: 12, letterSpacing: '0.18em', color: C.onAmber, opacity: 2 * m - 1}}>
          {`${String(i).padStart(2, '0')}  ${t.name}`}
        </div>
      )}
      {on ? (
        <div style={{position: 'absolute', left: 10, top: 10, fontFamily: MONO, fontWeight: 700, fontSize: 11, letterSpacing: '0.2em', color: C.onAmber, background: C.amber, padding: '3px 8px', borderRadius: 4}}>● PGM</div>
      ) : null}
    </div>
  );
};

const Grid: React.FC<{g: number}> = ({g}) => {
  if (g >= COLLAPSE[0] + 2) return null;
  return (
    <AbsoluteFill>
      {TILES.map((_, i) => (
        <Tile key={i} i={i} g={g} />
      ))}
    </AbsoluteFill>
  );
};

// The synced clips collapse into the playhead line (bars narrow to the centre, then the line stretches and heats).
const Collapse: React.FC<{g: number}> = ({g}) => {
  if (g < COLLAPSE[0] || g >= LOGO_LOCK + 2) return null;
  const n = ease.cubicInOut(prog(g, COLLAPSE[0], COLLAPSE[0] + 22));
  const join = ease.cubicInOut(prog(g, COLLAPSE[0] + 16, COLLAPSE[1]));
  const hot = smooth(COLLAPSE[1] - 6, LOGO_LOCK, g);
  const w = lerp(BAR_W, 4, n);
  const half = lerp(5.5 * 40 + BAR_H / 2, 395, ease.expoOut(prog(g, COLLAPSE[1] - 8, LOGO_LOCK - 4)));
  return (
    <svg width={W} height={H} style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
      {join < 1
        ? TILES.map((t, i) => (
            <rect key={i} x={CX - w / 2} y={lerp(barY(i) - BAR_H / 2, barY(i) - 20.5, join)} width={w} height={lerp(BAR_H, 41, join)} rx={lerp(4, 1, n)} fill={mixHex(t.acc, C.amber, n)} opacity={1 - join * 0.999} />
          ))
        : null}
      {join > 0 ? (
        <g opacity={join}>
          <rect x={CX - 16} y={CY - half} width={32} height={2 * half} fill={C.amber} opacity={0.3 + 0.5 * hot} style={{filter: 'blur(16px)'}} />
          <rect x={CX - 2} y={CY - half} width={4} height={2 * half} fill={C.amber} />
          <rect x={CX - 0.75} y={CY - half} width={1.5} height={2 * half} fill="#FFF6E2" opacity={0.4 + 0.6 * hot} />
        </g>
      ) : null}
    </svg>
  );
};

const WORD_SIZE = 118;
const wordY = (g: number) => lerp(CY, 392, ease.cubicInOut(prog(g, RISE[0], RISE[1])));
const Lock: React.FC<{g: number}> = ({g}) => {
  if (g < LOGO_LOCK) return null;
  const t = g - LOGO_LOCK;
  const rise = ease.cubicInOut(prog(g, RISE[0], RISE[1]));
  const y = wordY(g);
  const open = ease.expoOut(prog(t, 0, 14));
  const marks = 1 - 0.6 * smooth(LOGO_LOCK + 24, LOGO_LOCK + 70, g);
  const shock = (d: number, max: number, col: string) => {
    const k = ease.expoOut(prog(t, d, d + 44));
    if (t < d || k >= 1) return null;
    return <ellipse key={d} cx={CX} cy={CY} rx={590 + max * k} ry={96 + 0.45 * max * k} fill="none" stroke={col} strokeWidth={10 * (1 - k) + 1} opacity={1 - k} />;
  };
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{background: `radial-gradient(ellipse 40% 26% at 50% ${(y / H) * 100}%, ${rgba(C.amber, 0.16)} 0%, ${rgba(C.amber, 0.04)} 50%, rgba(0,0,0,0) 100%)`, opacity: 0.6 + 0.4 * Math.exp(-t / 30)}} />
      <svg width={W} height={H} style={{position: 'absolute', inset: 0, overflow: 'visible', filter: `drop-shadow(0 0 14px ${C.amber})`}}>
        {shock(0, 1500, C.amber)}
        {shock(5, 1000, '#FFF6E2')}
      </svg>
      <Wordmark x={CX} y={y} size={lerp(WORD_SIZE, 104, rise)} open={open} marks={marks} glow={0.25 + 0.75 * Math.exp(-t / 16)} />
    </AbsoluteFill>
  );
};

const line = (g: number, at: number) => ({p: ease.expoOut(prog(g, at, at + 22)), o: prog(g, at, at + 14)});
const EndCard: React.FC<{g: number}> = ({g}) => {
  if (g < LINES[0] - 2) return null;
  const [l0, l1, l2, l3] = LINES.map((f) => line(g, f));
  const centered: React.CSSProperties = {position: 'absolute', left: 0, width: W, textAlign: 'center', whiteSpace: 'nowrap'};
  const tl = ease.cubicInOut(prog(g, LINES[3] + 20, LINES[3] + 60));
  let x = CX - 330;
  return (
    <AbsoluteFill>
      <div style={{...centered, top: 496, fontFamily: FONT, fontWeight: 500, fontSize: 56, letterSpacing: '-0.012em', color: C.text, opacity: l0.o, transform: `translateY(${(1 - l0.p) * 22}px)`}}>
        Every angle. Every word. <span style={{color: C.amber}}>Your cut.</span>
      </div>
      <div style={{...centered, top: 590, fontFamily: FONT, fontWeight: 400, fontSize: 27, color: C.muted, opacity: l1.o, transform: `translateY(${(1 - l1.p) * 18}px)`}}>
        {['Sync', 'Review', 'Captions', 'Handoff', '30 Studio tools'].map((w, i) => (
          <React.Fragment key={w}>
            {i ? <span style={{color: C.amber, padding: '0 14px'}}>·</span> : null}
            {w}
          </React.Fragment>
        ))}
      </div>
      <div style={{...centered, top: 648, fontFamily: FONT, fontWeight: 500, fontSize: 31, color: C.text, opacity: l2.o, transform: `translateY(${(1 - l2.p) * 18}px)`}}>On your PC. In your control.</div>
      <div style={{...centered, top: 726, display: 'flex', justifyContent: 'center', opacity: l3.o, transform: `translateY(${(1 - l3.p) * 16}px)`}}>
        <div style={{fontFamily: MONO, fontWeight: 700, fontSize: 15, letterSpacing: '0.28em', color: C.text, padding: '11px 22px 11px 26px', borderRadius: 999, border: `1px solid ${C.line}`, background: C.panel, display: 'flex', alignItems: 'center', gap: 12}}>
          <span style={{width: 8, height: 8, borderRadius: '50%', background: C.amber, boxShadow: `0 0 8px ${C.amber}`}} />
          DESKTOP · LOCAL-FIRST
        </div>
      </div>
      {/* the whole film as one hairline timeline: thirteen sections, one sequence */}
      <svg width={W} height={H} style={{position: 'absolute', inset: 0, opacity: 0.85 * tl}}>
        {SECTIONS.map((s) => {
          const w = (660 * (s.end - s.start)) / DURATION;
          const x0 = x;
          x += w;
          return <rect key={s.id} x={x0 + 1} y={826} width={Math.max(0, (w - 2) * tl)} height={3} rx={1.5} fill={s.id === 'intro' || s.id === 'finale' ? C.amber : ACCENT[s.id]} />;
        })}
      </svg>
    </AbsoluteFill>
  );
};

export const Finale: React.FC = () => {
  const g = useCurrentFrame() - PAD + FINALE.start;
  const flash = g >= LOGO_LOCK ? Math.exp(-(g - LOGO_LOCK) / 7) : 0;
  const snap = Math.max(0, ...SNAPS.map((f) => (g >= f ? Math.exp(-(g - f) / 6) : 0)));
  return (
    <AbsoluteFill style={{background: C.canvas}}>
      <AbsoluteFill style={{background: `radial-gradient(ellipse 70% 60% at 50% 50%, ${rgba(C.raised, 0.6)} 0%, rgba(16,18,17,0) 70%)`}} />
      <Grid g={g} />
      <AbsoluteFill style={{background: `radial-gradient(ellipse 30% 40% at 50% 50%, ${rgba(C.amber, 0.12)} 0%, rgba(0,0,0,0) 80%)`, opacity: snap}} />
      <Collapse g={g} />
      <Lock g={g} />
      <EndCard g={g} />
      <AbsoluteFill style={{background: `radial-gradient(ellipse 50% 50% at 50% 50%, #FFF6E2 0%, ${rgba(C.amber, 0.75)} 40%, ${rgba(C.amber, 0.15)} 100%)`, opacity: 0.85 * flash}} />
    </AbsoluteFill>
  );
};
