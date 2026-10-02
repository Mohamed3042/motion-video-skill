import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {C, FONT, HUES} from './brand';
import {ReelShell, type SceneSpec} from './engine';
import {EndCard} from './endcard';
import {ProductIcon} from './icons';
import {Bars, Blur, Chip, CL, DotGrid, EXPO, IN_OUT, KineticWord, Kicker, LivingBg, Mono, Panel, SlamWord, lerp, pop, wavePath} from './kit';
import {DURATION, EV, SCENES, SFX, TRANS} from './voice.timing';

const H = HUES.voice;
const ICE = '#d9c8ff';

// ---------- 01 Signal: a point of light becomes a voice waveform, then the Voice icon ----------
const BAR_X = [-7, -3.5, 0, 3.5, 7];
const BAR_H = [4, 10, 16, 8, 3];

const Signal: React.FC = () => {
  const f = useCurrentFrame();
  const dot = pop(f, EV.dot, 10, 160, 0.6);
  const grow = lerp(f, EV.waveFrom, EV.waveTo, 0, 1, IN_OUT);
  const lineOut = lerp(f, 100, 120, 1, 0);
  const plate = pop(f, 100, 13, 150, 0.8);
  const push = lerp(f, 130, 180, 1, 1.14, IN_OUT);
  const S = 300;
  const u = (S * 0.6) / 24;
  const w = 80 + grow * 1300;
  const d = wavePath(w, 360, f, 0.15 + grow * 0.85, 7);
  return (
    <AbsoluteFill>
      <LivingBg f={f} theme="dark" hue={H} spot={lerp(f, 0, 90)} />
      <AbsoluteFill style={{scale: `${push}`}}>
        {/* glowing point */}
        <div
          style={{
            position: 'absolute',
            left: 960 - 14,
            top: 540 - 14,
            width: 28,
            height: 28,
            borderRadius: 14,
            background: '#fff',
            boxShadow: `0 0 30px #fff, 0 0 80px ${H.glow}, 0 0 160px ${H.hue}`,
            scale: `${dot * (1 - grow * 0.7)}`,
            opacity: f < EV.waveTo ? 1 : 0,
          }}
        />
        {/* waveform line */}
        {f >= EV.waveFrom && lineOut > 0 ? (
          <svg width={w} height={360} style={{position: 'absolute', left: 960 - w / 2, top: 540 - 180, overflow: 'visible', opacity: lineOut}}>
            <path d={d} fill="none" stroke={H.hue} strokeWidth={16} opacity={0.35} strokeLinejoin="round" />
            <path d={d} fill="none" stroke={H.glow} strokeWidth={7} opacity={0.6} strokeLinejoin="round" />
            <path d={d} fill="none" stroke="#fff" strokeWidth={3} strokeLinejoin="round" />
          </svg>
        ) : null}
        {/* icon plate + bars springing up */}
        {f >= 98 ? (
          <div style={{position: 'absolute', left: 960 - S / 2, top: 540 - S / 2, width: S, height: S}}>
            <div style={{position: 'absolute', inset: 0, scale: `${plate}`, opacity: interpolate(plate, [0, 0.3], [0, 1], CL)}}>
              <ProductIcon id="voice" size={S} glow={0.6} noGlyph />
            </div>
            <svg width={S} height={S} viewBox={`${-S / 2} ${-S / 2} ${S} ${S}`} style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
              {BAR_X.map((x, i) => {
                const k = pop(f, EV.bars[i], 9, 260, 0.5);
                const h = BAR_H[i] * u * k;
                return <rect key={i} x={x * u - 0.95 * u} y={-h / 2} width={1.9 * u} height={Math.max(0.1, h)} rx={0.95 * u} fill="#fff" opacity={k > 0.01 ? 1 : 0} />;
              })}
            </svg>
          </div>
        ) : null}
        {[0, 1].map((k) => {
          const t = lerp(f, 128 + k * 8, 170 + k * 8, 0, 1, EXPO);
          if (f < 128 + k * 8) return null;
          const R = 170 + t * 520;
          return <div key={k} style={{position: 'absolute', left: 960 - R, top: 540 - R, width: R * 2, height: R * 2, borderRadius: '50%', border: `2px solid ${H.glow}`, opacity: (1 - t) * 0.7}} />;
        })}
      </AbsoluteFill>
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 790,
          textAlign: 'center',
          fontFamily: FONT,
          fontWeight: 500,
          fontSize: 40,
          letterSpacing: '-0.02em',
          color: C.nightSub,
          opacity: lerp(f, 44, 70) * lerp(f, 140, 160, 1, 0),
          translate: `0px ${lerp(f, 44, 74, 26, 0)}px`,
        }}
      >
        Your own voice recordings.
      </div>
    </AbsoluteFill>
  );
};

// ---------- 02 Title slam ----------
const TitleType: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <div style={{position: 'absolute', left: 0, right: 0, top: 455}}>
      <SlamWord f={f} text="MK Voice" at={EV.title - 2} size={230} color="#ffffff" split={[H.hue, C.nightRed]} glitchAt={EV.title + 38} sweepAt={EV.sweep} />
    </div>
  );
};

const Title: React.FC = () => {
  const f = useCurrentFrame();
  const ic = pop(f, EV.title + 4, 12, 160, 0.7);
  return (
    <AbsoluteFill>
      <LivingBg f={f} theme="dark" hue={H} />
      <DotGrid f={f} theme="dark" opacity={0.6} />
      <AbsoluteFill style={{background: `radial-gradient(circle at 960px 560px, ${H.hue}44 0%, transparent 40%)`}} />
      <div style={{position: 'absolute', left: 960 - 64, top: 250, scale: `${ic}`, opacity: interpolate(ic, [0, 0.3], [0, 1], CL), rotate: `${(1 - ic) * -12}deg`}}>
        <ProductIcon id="voice" size={128} glow={0.4} />
      </div>
      <div style={{position: 'absolute', left: 0, right: 0, top: 404, display: 'flex', justifyContent: 'center', opacity: lerp(f, EV.title + 10, EV.title + 30)}}>
        <Kicker color={C.nightSub} dot={H.glow}>
          MK Suite · Audio &amp; video
        </Kicker>
      </div>
      <Blur on={f < EV.title + 34}>
        <TitleType />
      </Blur>
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 735,
          textAlign: 'center',
          fontFamily: FONT,
          fontWeight: 500,
          fontSize: 38,
          letterSpacing: '-0.015em',
          color: C.nightSub,
          opacity: lerp(f, EV.subline, EV.subline + 22),
          translate: `0px ${lerp(f, EV.subline, EV.subline + 26, 28, 0)}px`,
        }}
      >
        Organize and process your own voice recordings in a local studio.
      </div>
    </AbsoluteFill>
  );
};

// ---------- 03 Local voice library ----------
const ROWS = [
  {name: 'Narration — take 01', len: '00:42', tag: 'Narration'},
  {name: 'Podcast intro', len: '00:18', tag: 'Spoken'},
  {name: 'Character read — warm', len: '01:05', tag: 'Character'},
  {name: 'Audiobook, chapter 2', len: '03:27', tag: 'Narration'},
  {name: 'Studio session 4', len: '00:31', tag: 'Session'},
];

const Library: React.FC = () => {
  const f = useCurrentFrame();
  const tilt = lerp(f, 330, 560, -9, -3, IN_OUT);
  const sel = lerp(f, EV.select, EV.select + 14);
  const play = interpolate(f, [EV.playFrom, 570], [0, 1], CL);
  return (
    <AbsoluteFill>
      <LivingBg f={f} theme="dark" hue={H} />
      <DotGrid f={f} theme="dark" opacity={0.45} />
      <div style={{position: 'absolute', left: 150, top: 300, width: 600}}>
        <div style={{opacity: lerp(f, 322, 338), translate: `${lerp(f, 322, 346, -30, 0)}px 0px`}}>
          <Kicker color={C.nightSub} dot={H.glow}>
            Local voice library
          </Kicker>
        </div>
        <div
          style={{
            marginTop: 30,
            fontFamily: FONT,
            fontWeight: 800,
            fontSize: 92,
            lineHeight: 1.02,
            letterSpacing: '-0.045em',
            color: '#fff',
          }}
        >
          {['Your recordings,', 'organized.'].map((l, i) => (
            <div key={i} style={{overflow: 'hidden', paddingBottom: 8}}>
              <div style={{translate: `0px ${lerp(f, 324 + i * 8, 352 + i * 8, 110, 0)}px`}}>{l}</div>
            </div>
          ))}
        </div>
        <div style={{marginTop: 34, fontFamily: FONT, fontWeight: 500, fontSize: 30, lineHeight: 1.4, color: C.nightSub, opacity: lerp(f, 352, 376)}}>
          Every take, in one
          <br />
          local library.
        </div>
      </div>
      <div style={{position: 'absolute', left: 820, top: 200, perspective: 2000}}>
        <div style={{transform: `rotateY(${tilt}deg)`, transformOrigin: '0% 50%', opacity: lerp(f, 318, 332), translate: `${lerp(f, 318, 350, 120, 0)}px 0px`}}>
          <Panel theme="dark" title="Voice library" w={960} h={680} accent={H.hue} right={<Chip theme="dark" text="Local" dot={C.nightGreen} size={16} />} style={{position: 'relative'}}>
            {ROWS.map((r, i) => {
              const k = pop(f, EV.rows[i], 14, 180, 0.7);
              const on = i === 2;
              return (
                <div
                  key={i}
                  style={{
                    position: 'absolute',
                    left: 18,
                    right: 18,
                    top: 16 + i * 78,
                    height: 70,
                    borderRadius: 14,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 22,
                    padding: '0 20px',
                    background: on ? `rgba(122,60,240,${0.28 * sel})` : 'rgba(255,255,255,0.025)',
                    border: `1px solid ${on && sel > 0 ? `rgba(181,140,255,${0.7 * sel})` : 'rgba(255,255,255,0.04)'}`,
                    opacity: interpolate(k, [0, 0.4], [0, 1], CL),
                    translate: `${(1 - k) * 90}px 0px`,
                    fontFamily: FONT,
                  }}
                >
                  <div style={{width: 38, height: 38, borderRadius: 19, background: on && sel > 0.5 ? H.hue : C.nightRaised, display: 'grid', placeItems: 'center'}}>
                    <svg width={14} height={14} viewBox="0 0 14 14">
                      <path d="M3 1.5v11l9-5.5z" fill="#fff" />
                    </svg>
                  </div>
                  <div style={{width: 300, color: C.nightInk, fontSize: 22, fontWeight: 600, letterSpacing: '-0.01em', whiteSpace: 'nowrap'}}>{r.name}</div>
                  <Bars n={44} w={300} h={40} seed={`row${i}`} t={on ? f : 0} live={on ? 1 : 0} color={on && sel > 0.5 ? H.glow : '#6c6f7a'} amp={0.95} />
                  <Mono style={{color: C.nightSub, fontSize: 18, marginLeft: 'auto'}}>{r.len}</Mono>
                  <div style={{fontSize: 15, fontWeight: 600, color: C.nightSub, padding: '6px 12px', borderRadius: 99, border: `1px solid ${C.nightLine}`, width: 96, textAlign: 'center'}}>{r.tag}</div>
                </div>
              );
            })}
            {/* now playing */}
            <div style={{position: 'absolute', left: 18, right: 18, top: 422, height: 178, borderRadius: 16, background: 'rgba(12,13,16,0.6)', border: `1px solid ${C.nightLine}`, opacity: sel, overflow: 'hidden'}}>
              <div style={{position: 'absolute', left: 24, top: 18, fontFamily: FONT, fontSize: 17, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: C.nightSub}}>Character read — warm</div>
              <Mono style={{position: 'absolute', right: 24, top: 18, color: H.glow, fontSize: 17}}>{`00:${String(Math.floor(play * 65)).padStart(2, '0')} / 01:05`}</Mono>
              <div style={{position: 'absolute', left: 24, top: 56}}>
                <Bars n={120} w={876} h={100} seed="row2" t={f} color={H.glow} color2="#5b5e69" split={play} reveal={lerp(f, EV.select, EV.select + 24, 0, 1)} />
              </div>
              <div style={{position: 'absolute', left: 24 + 876 * play - 1, top: 50, width: 3, height: 112, background: '#fff', boxShadow: `0 0 14px ${H.glow}`, opacity: play > 0 ? 1 : 0}} />
            </div>
          </Panel>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ---------- 04 Voice conversion workflows ----------
const NODE_X = [250, 790, 1330];
const NODES = [
  {kicker: 'Source', title: 'Your recording'},
  {kicker: 'Workflow', title: 'Voice conversion'},
  {kicker: 'Output', title: 'Converted take'},
];

const Convert: React.FC = () => {
  const f = useCurrentFrame();
  const flow = interpolate(f, [EV.flowFrom, EV.flowTo], [0, 1], CL);
  const done = pop(f, EV.done, 12, 180, 0.7);
  return (
    <AbsoluteFill>
      <LivingBg f={f} theme="dark" hue={H} />
      <DotGrid f={f} theme="dark" opacity={0.45} speed={0.5} />
      <div style={{position: 'absolute', left: 0, right: 0, top: 168, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 26}}>
        <div style={{opacity: lerp(f, 560, 576)}}>
          <Kicker color={C.nightSub} dot={H.glow}>
            Voice conversion workflows
          </Kicker>
        </div>
        <div style={{fontFamily: FONT, fontWeight: 800, fontSize: 84, letterSpacing: '-0.045em', color: '#fff', overflow: 'hidden', paddingBottom: 8}}>
          <div style={{translate: `0px ${lerp(f, 562, 590, 110, 0)}px`}}>Shape a take, step by step.</div>
        </div>
      </div>
      {/* wires */}
      <svg width={1920} height={1080} style={{position: 'absolute', inset: 0}}>
        {[0, 1].map((i) => {
          const x1 = NODE_X[i] + 340;
          const x2 = NODE_X[i + 1];
          const draw = lerp(f, EV.nodes[i + 1] - 14, EV.nodes[i + 1] + 6, 0, 1, IN_OUT);
          return (
            <g key={i}>
              <line x1={x1} y1={560} x2={x1 + (x2 - x1) * draw} y2={560} stroke={C.nightLine} strokeWidth={4} strokeLinecap="round" />
              <line x1={x1} y1={560} x2={x1 + (x2 - x1) * draw} y2={560} stroke={H.hue} strokeWidth={4} strokeLinecap="round" strokeDasharray="2 14" opacity={0.9} />
            </g>
          );
        })}
        {flow > 0 && flow < 1
          ? [0, 1, 2, 3, 4, 5].map((k) => {
              const q = flow * 1.6 - k * 0.12;
              if (q < 0 || q > 1) return null;
              const seg = q < 0.5 ? 0 : 1;
              const local = (q - seg * 0.5) * 2;
              const x1 = NODE_X[seg] + 340;
              const x2 = NODE_X[seg + 1];
              return <circle key={k} cx={x1 + (x2 - x1) * local} cy={560} r={7} fill="#fff" style={{filter: `drop-shadow(0 0 10px ${H.glow})`}} />;
            })
          : null}
      </svg>
      {NODES.map((n, i) => {
        const k = pop(f, EV.nodes[i], 12, 170, 0.7);
        const isOut = i === 2;
        const active = i === 1 ? interpolate(f, [EV.flowFrom + 20, EV.flowFrom + 40, EV.flowTo - 10, EV.flowTo + 10], [0, 1, 1, 0.3], CL) : 0;
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: NODE_X[i],
              top: 420,
              width: 340,
              height: 280,
              borderRadius: 22,
              background: `linear-gradient(180deg, ${C.nightSurface}, #191b1f)`,
              border: `1px solid ${isOut && done > 0.1 ? H.glow : i === 1 && active > 0.2 ? H.hue : C.nightLine}`,
              boxShadow: `0 40px 80px rgba(0,0,0,0.5), 0 0 ${60 * (isOut ? done : active)}px ${H.hue}88`,
              scale: `${interpolate(k, [0, 1], [0.8, 1])}`,
              opacity: interpolate(k, [0, 0.3], [0, 1], CL),
              padding: 26,
              fontFamily: FONT,
            }}
          >
            <div style={{fontSize: 16, fontWeight: 600, letterSpacing: '0.16em', textTransform: 'uppercase', color: C.nightSub}}>{n.kicker}</div>
            <div style={{marginTop: 10, fontSize: 32, fontWeight: 700, letterSpacing: '-0.025em', color: '#fff'}}>{n.title}</div>
            <div style={{position: 'absolute', left: 26, bottom: 30}}>
              {i === 1 ? (
                <svg width={288} height={96} viewBox="0 0 288 96">
                  {[0, 1, 2].map((j) => {
                    const on = interpolate(f, [EV.flowFrom + 14 + j * 14, EV.flowFrom + 24 + j * 14], [0, 1], CL);
                    return (
                      <g key={j}>
                        <rect x={j * 100} y={22} width={84} height={52} rx={12} fill={on > 0.5 ? `${H.hue}55` : C.nightRaised} stroke={on > 0.5 ? H.glow : C.nightLine} strokeWidth={2} />
                        <circle cx={j * 100 + 42} cy={48} r={8} fill={on > 0.5 ? '#fff' : C.nightSoft} />
                      </g>
                    );
                  })}
                </svg>
              ) : (
                <Bars
                  n={40}
                  w={288}
                  h={96}
                  seed={isOut ? 'conv-out' : 'conv-src'}
                  t={f}
                  color={isOut ? ICE : H.hue}
                  reveal={isOut ? lerp(f, EV.flowTo - 30, EV.flowTo + 6, 0, 1, IN_OUT) : 1}
                  amp={isOut ? 0.9 : 1}
                />
              )}
            </div>
            {isOut ? (
              <div style={{position: 'absolute', right: 22, top: 22, width: 40, height: 40, borderRadius: 20, background: C.nightGreen, display: 'grid', placeItems: 'center', scale: `${done}`}}>
                <svg width={22} height={22} viewBox="0 0 22 22">
                  <path d="M5 11.5l4 4 8-9" fill="none" stroke="#10230a" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            ) : null}
          </div>
        );
      })}
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 800,
          textAlign: 'center',
          fontFamily: FONT,
          fontWeight: 500,
          fontSize: 26,
          color: C.nightSub,
          opacity: lerp(f, EV.done - 10, EV.done + 14) * 0.9,
        }}
      >
        Processing depends on compatible hardware and separately authorized models and recordings.
      </div>
    </AbsoluteFill>
  );
};

// ---------- 05 Dataset preparation + training controls ----------
const Prepare: React.FC = () => {
  const f = useCurrentFrame();
  const W = 1500;
  const segs = [0, 0.17, 0.36, 0.52, 0.71, 0.86, 1];
  const ready = pop(f, EV.ready, 12, 170, 0.7);
  return (
    <AbsoluteFill>
      <LivingBg f={f} theme="dark" hue={H} />
      <DotGrid f={f} theme="dark" opacity={0.4} />
      <div style={{position: 'absolute', left: 210, top: 160, opacity: lerp(f, 770, 786)}}>
        <Kicker color={C.nightSub} dot={H.glow}>
          Dataset preparation
        </Kicker>
      </div>
      <div style={{position: 'absolute', left: 210, top: 214, fontFamily: FONT, fontWeight: 800, fontSize: 80, letterSpacing: '-0.045em', color: '#fff', overflow: 'hidden', paddingBottom: 8}}>
        <div style={{translate: `0px ${lerp(f, 772, 800, 100, 0)}px`}}>From recordings to a dataset.</div>
      </div>
      {/* long take, sliced */}
      <div style={{position: 'absolute', left: 210, top: 380, width: W, height: 170, borderRadius: 20, background: 'rgba(12,13,16,0.55)', border: `1px solid ${C.nightLine}`, opacity: lerp(f, 768, 782)}}>
        <div style={{position: 'absolute', left: 20, top: 25}}>
          <Bars n={150} w={W - 40} h={120} seed="dataset" t={f * 0.3} color={H.hue} reveal={lerp(f, 770, 820, 0, 1, IN_OUT)} />
        </div>
        {segs.slice(1, -1).map((x, i) => {
          const k = pop(f, EV.slices[i], 10, 240, 0.5);
          return (
            <div key={i} style={{position: 'absolute', left: 20 + (W - 40) * x - 2, top: -16 + (1 - k) * -40, width: 4, height: 202, background: '#fff', borderRadius: 2, opacity: interpolate(k, [0, 0.2], [0, 1], CL), boxShadow: `0 0 16px ${H.glow}`}} />
          );
        })}
        {segs.slice(0, -1).map((x, i) => {
          const at = i === 0 ? EV.slices[0] : EV.slices[i - 1];
          const k = lerp(f, at + 4, at + 20);
          const w = (segs[i + 1] - x) * (W - 40);
          return (
            <div key={i} style={{position: 'absolute', left: 20 + (W - 40) * x + w / 2 - 50, top: -46, width: 100, textAlign: 'center', opacity: k, translate: `0px ${(1 - k) * 12}px`}}>
              <Mono style={{fontSize: 18, color: H.glow}}>{`clip ${String(i + 1).padStart(2, '0')}`}</Mono>
            </div>
          );
        })}
      </div>
      {/* training controls */}
      <div style={{position: 'absolute', left: 210, top: 600, opacity: lerp(f, EV.slidersFrom - 10, EV.slidersFrom + 10), translate: `0px ${lerp(f, EV.slidersFrom - 10, EV.slidersFrom + 16, 40, 0)}px`}}>
        <Panel theme="dark" title="Training controls" w={W} h={200} accent={H.hue} style={{position: 'relative'}}>
          {[0, 1, 2].map((i) => {
            const target = [0.62, 0.38, 0.8][i];
            const v = lerp(f, EV.slidersFrom + i * 8, EV.slidersFrom + 40 + i * 8, 0.1, target, EXPO);
            return (
              <div key={i} style={{position: 'absolute', left: 40 + i * 470, top: 70, width: 400, height: 8, borderRadius: 4, background: C.nightSoft}}>
                <div style={{width: 400 * v, height: 8, borderRadius: 4, background: `linear-gradient(90deg, ${H.base}, ${H.glow})`}} />
                <div style={{position: 'absolute', left: 400 * v - 16, top: -12, width: 32, height: 32, borderRadius: 16, background: '#fff', boxShadow: `0 0 18px ${H.glow}`}} />
              </div>
            );
          })}
        </Panel>
      </div>
      <div style={{position: 'absolute', left: 0, right: 0, top: 846, display: 'flex', justifyContent: 'center', gap: 22, scale: `${interpolate(ready, [0, 1], [0.85, 1])}`, opacity: interpolate(ready, [0, 0.3], [0, 1], CL)}}>
        <Chip theme="dark" text="Dataset preparation" dot={C.nightGreen} />
        <Chip theme="dark" text="Training controls" dot={C.nightGreen} />
      </div>
    </AbsoluteFill>
  );
};

// ---------- 06 Kinetic words ----------
const Words: React.FC = () => {
  const f = useCurrentFrame();
  const w = ['ORGANIZE', 'PREPARE', 'CONVERT'];
  return (
    <>
      {w.map((t, i) => (
        <KineticWord key={t} f={f} text={t} at={EV.words[i]} out={(EV.words[i + 1] ?? 1050) - 1} color="#fff" accent={C.nightRed} size={200} />
      ))}
    </>
  );
};

const Kinetic: React.FC = () => {
  const f = useCurrentFrame();
  let last: number = EV.words[0];
  for (const w of EV.words) if (f >= w) last = w;
  const k = lerp(f, last, last + 26, 0, 1, EXPO);
  return (
    <AbsoluteFill>
      <LivingBg f={f} theme="dark" hue={H} spot={1.2} />
      <div style={{position: 'absolute', left: 960 - 900, top: 540 - 900, width: 1800, height: 1800, borderRadius: '50%', border: `3px solid ${H.glow}`, scale: `${0.15 + k * 0.85}`, opacity: (1 - k) * 0.6}} />
      <Blur on>
        <Words />
      </Blur>
    </AbsoluteFill>
  );
};

// ---------- 07 End card ----------
const End: React.FC = () => (
  <EndCard
    theme="dark"
    hue={H}
    from={1050}
    lock={EV.lock}
    tag={EV.tag}
    foot={EV.foot}
    duration={DURATION}
    icon={(s, g) => <ProductIcon id="voice" size={s} glow={g} />}
    title="MK Voice"
    tagline="Your own voice recordings, in a local studio."
    footer="Windows · Local preview 1.37.26"
    fine="No voice packs or likeness guarantees are included."
  />
);

const COMPS: Record<string, React.FC> = {signal: Signal, title: Title, library: Library, convert: Convert, prepare: Prepare, kinetic: Kinetic, end: End};

const scenes: SceneSpec[] = SCENES.map((t) => ({t, Comp: COMPS[t.id], theme: 'dark' as const}));

const shakes = [
  ...SFX.impacts.map((at) => ({at, amp: 14})),
  ...SFX.hits.map((at) => ({at, amp: 9})),
];

export const MkVoiceReel: React.FC = () => (
  <ReelShell scenes={scenes} T={TRANS} duration={DURATION} hue={H} product="MK Voice" right="Windows · v1.37.26" audio="mk/voice.wav" shakes={shakes} />
);


