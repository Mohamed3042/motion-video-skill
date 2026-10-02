import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {noise2D} from '@remotion/noise';
import {C, FONT, HUES} from './brand';
import {ReelShell, type SceneSpec} from './engine';
import {EndCard} from './endcard';
import {ProductIcon} from './icons';
import {Bars, Blur, Chip, CL, DotGrid, EXPO, EXPO_IN, IN_OUT, Kicker, LivingBg, Mono, Panel, SlamWord, lerp, pop} from './kit';
import {DURATION, EV, SCENES, SFX, TRANS} from './montage.timing';

const H = HUES.audiosync;
const CAMS = [
  {id: 'CAM A', color: '#02bcc7', tc: '01:12:04:18', off: 0},
  {id: 'CAM B', color: '#fda045', tc: '01:12:07:02', off: 230},
  {id: 'CAM C', color: '#b58cff', tc: '01:11:59:41', off: -170},
  {id: 'AUDIO', color: '#e6f6f7', tc: '01:12:05:30', off: 130},
];

const Title2: React.FC<{text: string; at: number; top: number; size?: number}> = ({text, at, top, size = 80}) => {
  const f = useCurrentFrame();
  return (
    <div style={{position: 'absolute', left: 0, right: 0, top, textAlign: 'center', fontFamily: FONT, fontWeight: 800, fontSize: size, letterSpacing: '-0.045em', color: '#fff', overflow: 'hidden', paddingBottom: 8}}>
      <div style={{translate: `0px ${lerp(f, at, at + 30, size * 1.3, 0)}px`}}>{text}</div>
    </div>
  );
};

// ---------- 01 Slate: four recordings arrive out of sync, the slate claps ----------
const Slate: React.FC = () => {
  const f = useCurrentFrame();
  const arm = interpolate(f, [84, 118], [-22, 0], {...CL, easing: EXPO_IN});
  const cl = pop(f, 78, 13, 170, 0.7);
  return (
    <AbsoluteFill>
      <LivingBg f={f} theme="dark" hue={H} spot={0.8} />
      <DotGrid f={f} theme="dark" opacity={0.4} speed={1} />
      {CAMS.map((cam, i) => {
        const k = pop(f, EV.strips[i] - 8, 14, 150, 0.8);
        const dir = i % 2 ? 1 : -1;
        const drift = Math.sin((f + i * 30) / 40) * 20;
        return (
          <div
            key={cam.id}
            style={{
              position: 'absolute',
              left: 260 + cam.off + drift,
              top: 220 + i * 160,
              width: 1400,
              height: 120,
              borderRadius: 16,
              background: `linear-gradient(90deg, ${cam.color}26, ${cam.color}10)`,
              border: `1px solid ${cam.color}66`,
              translate: `${(1 - k) * dir * 1500}px 0px`,
              opacity: interpolate(k, [0, 0.2], [0, 1], CL) * lerp(f, 80, 110, 1, 0.45),
              overflow: 'hidden',
            }}
          >
            <div style={{position: 'absolute', left: 22, top: 16, fontFamily: FONT, fontWeight: 700, fontSize: 20, letterSpacing: '0.14em', color: cam.color}}>{cam.id}</div>
            <Mono style={{position: 'absolute', right: 22, top: 16, fontSize: 18, color: C.nightSub}}>{cam.tc}</Mono>
            <div style={{position: 'absolute', left: 140, top: 18}}>
              <Bars n={110} w={1120} h={84} seed={cam.id} t={f} color={cam.color} amp={0.9} />
            </div>
          </div>
        );
      })}
      {/* the slate */}
      <div style={{position: 'absolute', left: 960 - 330, top: 330, width: 660, height: 420, scale: `${interpolate(cl, [0, 1], [0.6, 1])}`, opacity: interpolate(cl, [0, 0.3], [0, 1], CL)}}>
        <svg width={660} height={420} viewBox="0 0 660 420" style={{overflow: 'visible', filter: `drop-shadow(0 40px 60px rgba(0,0,0,0.6))`}}>
          <rect x={0} y={100} width={660} height={320} rx={22} fill={C.nightSurface} stroke={C.nightLine} strokeWidth={2} />
          <rect x={0} y={100} width={660} height={56} fill="#fff" />
          {[0, 1, 2, 3, 4, 5, 6].map((i) => (
            <path key={i} d={`M${i * 110 - 20} 156 L${i * 110 + 35} 100 L${i * 110 + 90} 100 L${i * 110 + 35} 156 Z`} fill={C.nightDeep} />
          ))}
          <g transform={`rotate(${arm} 0 100)`}>
            <rect x={0} y={40} width={660} height={56} rx={8} fill="#fff" />
            {[0, 1, 2, 3, 4, 5, 6].map((i) => (
              <path key={i} d={`M${i * 110 - 20} 96 L${i * 110 + 35} 40 L${i * 110 + 90} 40 L${i * 110 + 35} 96 Z`} fill={C.nightDeep} />
            ))}
          </g>
          <text x={40} y={230} fill={C.nightSub} style={{fontFamily: FONT, fontWeight: 600, fontSize: 22, letterSpacing: '0.18em'}}>
            MULTICAM · SCENE 01
          </text>
          <text x={40} y={330} fill="#fff" style={{fontFamily: FONT, fontWeight: 800, fontSize: 78, letterSpacing: '-0.04em'}}>
            Take 01
          </text>
          <text x={620} y={330} textAnchor="end" fill={H.hue} style={{fontFamily: FONT, fontWeight: 700, fontSize: 30, letterSpacing: '0.06em'}}>
            4 SOURCES
          </text>
        </svg>
      </div>
    </AbsoluteFill>
  );
};

// ---------- 02 Title ----------
const TitleType: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <div style={{position: 'absolute', left: 0, right: 0, top: 455}}>
      <SlamWord f={f} text="Montage Pro" at={EV.clap - 2} size={210} color="#ffffff" split={[H.hue, C.nightRed]} glitchAt={EV.clap + 40} sweepAt={EV.clap + 70} stagger={2} />
    </div>
  );
};

const Title: React.FC = () => {
  const f = useCurrentFrame();
  const ic = pop(f, EV.clap + 4, 12, 160, 0.7);
  return (
    <AbsoluteFill>
      <LivingBg f={f} theme="dark" hue={H} />
      <DotGrid f={f} theme="dark" opacity={0.6} />
      <AbsoluteFill style={{background: `radial-gradient(circle at 960px 560px, ${H.hue}33 0%, transparent 40%)`}} />
      <div style={{position: 'absolute', left: 960 - 64, top: 250, scale: `${ic}`, opacity: interpolate(ic, [0, 0.3], [0, 1], CL), rotate: `${(1 - ic) * 12}deg`}}>
        <ProductIcon id="audiosync" size={128} glow={0.4} />
      </div>
      <div style={{position: 'absolute', left: 0, right: 0, top: 404, display: 'flex', justifyContent: 'center', opacity: lerp(f, EV.clap + 10, EV.clap + 30)}}>
        <Kicker color={C.nightSub} dot={H.hue}>
          MK Suite · Audio &amp; video
        </Kicker>
      </div>
      <Blur on={f < EV.clap + 30}>
        <TitleType />
      </Blur>
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 730,
          textAlign: 'center',
          fontFamily: FONT,
          fontWeight: 500,
          fontSize: 36,
          lineHeight: 1.35,
          letterSpacing: '-0.015em',
          color: C.nightSub,
          opacity: lerp(f, EV.subline, EV.subline + 22),
          translate: `0px ${lerp(f, EV.subline, EV.subline + 26, 28, 0)}px`,
        }}
      >
        Align multicamera recordings and prepare an editing handoff
        <br />
        with captions and markers.
      </div>
    </AbsoluteFill>
  );
};

// ---------- 03 AudioSync: clips snap into alignment ----------
const SPIKE = 0.42;
const CLIP_W = 1080;
const CLIP_X = 330;
const snapX = (f: number, at: number, init: number) => {
  if (f < at) return init * (1 - interpolate(f, [at - 12, at], [0, 1], {...CL, easing: EXPO_IN}));
  return -init * 0.05 * Math.sin((f - at) * 0.9) * Math.exp(-(f - at) / 5);
};

const Sync: React.FC = () => {
  const f = useCurrentFrame();
  const scan = interpolate(f, [EV.scanFrom, EV.scanTo], [0, 1], {...CL, easing: IN_OUT});
  const locked = pop(f, EV.locked, 12, 170, 0.7);
  const syncX = CLIP_X + CLIP_W * SPIKE;
  return (
    <AbsoluteFill>
      <LivingBg f={f} theme="dark" hue={H} />
      <DotGrid f={f} theme="dark" opacity={0.35} />
      <div style={{position: 'absolute', left: 0, right: 0, top: 150, display: 'flex', justifyContent: 'center', opacity: lerp(f, 262, 278)}}>
        <Kicker color={C.nightSub} dot={H.hue}>
          AudioSync Pro multicamera alignment
        </Kicker>
      </div>
      <Title2 text="Multicamera recordings, aligned." at={264} top={196} size={76} />
      <div style={{position: 'absolute', left: 150, top: 330, opacity: lerp(f, 258, 274), translate: `0px ${lerp(f, 258, 288, 60, 0)}px`}}>
        <Panel
          theme="dark"
          title="Multicam timeline"
          w={1620}
          h={600}
          accent={H.hue}
          style={{position: 'relative'}}
          right={locked > 0.05 ? <Chip theme="dark" text="Aligned" dot={C.nightGreen} size={16} style={{scale: `${locked}`}} /> : <Mono style={{color: C.nightSub, fontSize: 16}}>ANALYZING AUDIO</Mono>}
        >
          {CAMS.map((cam, i) => {
            const at = i === 0 ? 0 : EV.snaps[i - 1];
            const x = i === 0 ? 0 : snapX(f, at, cam.off);
            const flash = i === 0 ? 0 : interpolate(f, [at, at + 3, at + 24], [0, 1, 0], CL);
            const lit = f >= EV.scanTo || (scan > 0 && 120 + scan * 1440 >= CLIP_X + x + CLIP_W * SPIKE);
            return (
              <div key={cam.id} style={{position: 'absolute', left: 0, right: 0, top: 26 + i * 126, height: 110}}>
                <div style={{position: 'absolute', left: 30, top: 38, fontFamily: FONT, fontWeight: 700, fontSize: 20, letterSpacing: '0.12em', color: cam.color}}>{cam.id}</div>
                <div
                  style={{
                    position: 'absolute',
                    left: CLIP_X + x,
                    top: 8,
                    width: CLIP_W,
                    height: 96,
                    borderRadius: 12,
                    background: `linear-gradient(90deg, ${cam.color}30, ${cam.color}14)`,
                    border: `1px solid ${cam.color}${flash > 0.1 ? 'ff' : '66'}`,
                    boxShadow: `0 0 ${40 * flash}px ${cam.color}`,
                  }}
                >
                  <div style={{position: 'absolute', left: 16, top: 13}}>
                    <Bars n={100} w={CLIP_W - 32} h={70} seed={cam.id + 's'} t={0} live={0} color={`${cam.color}aa`} amp={0.55} />
                  </div>
                  <div style={{position: 'absolute', left: CLIP_W * SPIKE - 4, top: 6, width: 8, height: 84, borderRadius: 4, background: lit ? '#fff' : cam.color, boxShadow: lit ? `0 0 18px ${cam.color}` : 'none'}} />
                </div>
              </div>
            );
          })}
          {/* scan line */}
          {scan > 0 && scan < 1 ? <div style={{position: 'absolute', left: 120 + scan * 1440, top: 0, width: 3, height: 540, background: H.glow, boxShadow: `0 0 20px ${H.hue}`, opacity: 0.85}} /> : null}
          {/* sync line */}
          <div style={{position: 'absolute', left: syncX - 2, top: 10, width: 4, height: 510, borderRadius: 2, background: '#fff', opacity: locked, boxShadow: `0 0 24px ${H.hue}, 0 0 60px ${H.hue}`}} />
        </Panel>
      </div>
    </AbsoluteFill>
  );
};

// ---------- 04 Camera + audio-channel selection ----------
const Footage: React.FC<{i: number; f: number; w: number; h: number}> = ({i, f, w, h}) => {
  const cam = CAMS[i];
  const px = Math.sin((f + i * 50) / 50) * 14;
  const sky = ['#0b4b55', '#5a2f0d', '#2e1b55', '#13343a'][i];
  return (
    <div style={{position: 'absolute', inset: 0, overflow: 'hidden', background: `linear-gradient(180deg, ${sky} 0%, #0c0d10 100%)`}}>
      <div style={{position: 'absolute', left: w * [0.62, 0.3, 0.7, 0.5][i] - 60 + px, top: h * 0.22, width: 120, height: 120, borderRadius: 60, background: `radial-gradient(circle, ${cam.color} 0%, transparent 70%)`, opacity: 0.8}} />
      <div style={{position: 'absolute', left: -20 + px * 1.6, right: -20, top: h * 0.62, height: h, background: '#0c0d10', opacity: 0.9}} />
      <div style={{position: 'absolute', left: w * [0.25, 0.55, 0.4, 0.3][i] + px * 2.4, top: h * 0.38, width: w * 0.14, height: h * 0.5, borderRadius: '40% 40% 8px 8px', background: `${cam.color}44`, border: `2px solid ${cam.color}88`}} />
    </div>
  );
};

const Select: React.FC = () => {
  const f = useCurrentFrame();
  const order = [1, 2, 0];
  let selected = 0;
  EV.cams.forEach((at, k) => {
    if (f >= at) selected = order[k];
  });
  const lastCam = [...EV.cams].reverse().find((at) => f >= at) ?? 0;
  const bump = interpolate(f, [lastCam, lastCam + 4, lastCam + 18], [0, 1, 0], CL);
  const TW = 470;
  const TH = 264;
  const enabled = [true, f >= EV.channels[0], f < EV.channels[1], false];
  return (
    <AbsoluteFill>
      <LivingBg f={f} theme="dark" hue={H} />
      <DotGrid f={f} theme="dark" opacity={0.35} />
      <div style={{position: 'absolute', left: 150, top: 150, opacity: lerp(f, 532, 548)}}>
        <Kicker color={C.nightSub} dot={H.hue}>
          Camera and audio-channel selection
        </Kicker>
      </div>
      <div style={{position: 'absolute', left: 150, top: 200, fontFamily: FONT, fontWeight: 800, fontSize: 72, letterSpacing: '-0.045em', color: '#fff', overflow: 'hidden', paddingBottom: 8}}>
        <div style={{translate: `0px ${lerp(f, 534, 562, 100, 0)}px`}}>Pick the angle. Pick the channels.</div>
      </div>
      {CAMS.slice(0, 3).map((cam, i) => {
        const k = pop(f, 536 + i * 8, 14, 170, 0.7);
        const x = 150 + (i % 2) * (TW + 26);
        const y = 340 + Math.floor(i / 2) * (TH + 26);
        const on = selected === i && f >= EV.cams[0];
        return (
          <div
            key={cam.id}
            style={{
              position: 'absolute',
              left: x,
              top: y,
              width: TW,
              height: TH,
              borderRadius: 18,
              overflow: 'hidden',
              border: `${on ? 4 : 1}px solid ${on ? H.glow : C.nightLine}`,
              boxShadow: on ? `0 0 ${30 + 30 * bump}px ${H.hue}` : '0 30px 60px rgba(0,0,0,0.45)',
              scale: `${interpolate(k, [0, 1], [0.85, 1]) * (on ? 1 + bump * 0.025 : 1)}`,
              opacity: interpolate(k, [0, 0.3], [0, 1], CL),
            }}
          >
            <Footage i={i} f={f} w={TW} h={TH} />
            <div style={{position: 'absolute', left: 18, top: 16, fontFamily: FONT, fontWeight: 700, fontSize: 18, letterSpacing: '0.14em', color: cam.color}}>{cam.id}</div>
            <Mono style={{position: 'absolute', right: 18, top: 16, fontSize: 16, color: C.nightSub}}>{cam.tc}</Mono>
            {on ? <div style={{position: 'absolute', left: 18, bottom: 16, fontFamily: FONT, fontWeight: 700, fontSize: 16, letterSpacing: '0.14em', color: '#04181b', background: H.glow, padding: '6px 12px', borderRadius: 8}}>SELECTED</div> : null}
          </div>
        );
      })}
      {/* program view */}
      <div style={{position: 'absolute', left: 150 + TW + 26, top: 340 + TH + 26, width: TW, height: TH, borderRadius: 18, border: `1px dashed ${C.nightLine}`, opacity: lerp(f, 560, 580), overflow: 'hidden'}}>
        {f >= EV.cams[0] ? <Footage i={selected} f={f} w={TW} h={TH} /> : null}
        <div style={{position: 'absolute', left: 18, top: 16, fontFamily: FONT, fontWeight: 700, fontSize: 18, letterSpacing: '0.14em', color: '#fff'}}>PROGRAM</div>
      </div>
      {/* audio channels */}
      <div style={{position: 'absolute', left: 1160, top: 340, opacity: lerp(f, 546, 566), translate: `${lerp(f, 546, 576, 80, 0)}px 0px`}}>
        <Panel theme="dark" title="Audio channels" w={610} h={554} accent={H.hue} style={{position: 'relative'}}>
          {[0, 1, 2, 3].map((ch) => {
            const en = enabled[ch];
            const sw = ch === 1 ? lerp(f, EV.channels[0], EV.channels[0] + 8) : ch === 2 ? lerp(f, EV.channels[1], EV.channels[1] + 8, 1, 0) : en ? 1 : 0;
            return (
              <div key={ch} style={{position: 'absolute', left: 26, right: 26, top: 24 + ch * 114, height: 96, borderRadius: 14, background: 'rgba(255,255,255,0.03)', border: `1px solid ${C.nightLine}`}}>
                <div style={{position: 'absolute', left: 20, top: 18, fontFamily: FONT, fontWeight: 700, fontSize: 20, color: '#fff'}}>{`CH ${ch + 1}`}</div>
                <div style={{position: 'absolute', left: 20, top: 52, fontFamily: FONT, fontWeight: 500, fontSize: 16, color: C.nightSub}}>{['Camera mic', 'Lav 1', 'Lav 2', 'Room'][ch]}</div>
                {/* meter */}
                <div style={{position: 'absolute', left: 170, top: 40, display: 'flex', gap: 4}}>
                  {Array.from({length: 22}).map((_, s) => {
                    const lvl = (0.45 + 0.5 * Math.abs(noise2D('ch' + ch, f * 0.06, 0))) * 22;
                    const on = s < lvl;
                    return <div key={s} style={{width: 10, height: 18, borderRadius: 2, background: on ? (s > 18 ? C.nightRed : s > 14 ? '#fda045' : H.hue) : C.nightSoft, opacity: on ? 0.35 + 0.65 * sw : 1}} />;
                  })}
                </div>
                {/* toggle */}
                <div style={{position: 'absolute', right: 20, top: 30, width: 64, height: 36, borderRadius: 18, background: sw > 0.5 ? H.hue : C.nightSoft}}>
                  <div style={{position: 'absolute', left: 4 + sw * 28, top: 4, width: 28, height: 28, borderRadius: 14, background: '#fff'}} />
                </div>
              </div>
            );
          })}
        </Panel>
      </div>
    </AbsoluteFill>
  );
};

// ---------- 05 Markers + caption track ----------
const MARKERS = ['Intro', 'Interview', 'B-roll', 'Close'];
const MX = [0.12, 0.36, 0.6, 0.83];

const Markers: React.FC = () => {
  const f = useCurrentFrame();
  const TLW = 1500;
  const ph = interpolate(f, [756, 930], [0.05, 0.95], CL);
  return (
    <AbsoluteFill>
      <LivingBg f={f} theme="dark" hue={H} />
      <DotGrid f={f} theme="dark" opacity={0.35} />
      <div style={{position: 'absolute', left: 0, right: 0, top: 150, display: 'flex', justifyContent: 'center', opacity: lerp(f, 742, 758)}}>
        <Kicker color={C.nightSub} dot={H.hue}>
          Captions and markers
        </Kicker>
      </div>
      <Title2 text="Markers and captions, on the timeline." at={744} top={196} size={72} />
      <div style={{position: 'absolute', left: 210, top: 340, width: TLW, height: 470, opacity: lerp(f, 738, 754)}}>
        {/* ruler */}
        <div style={{position: 'absolute', left: 0, right: 0, top: 0, height: 30, display: 'flex', justifyContent: 'space-between'}}>
          {Array.from({length: 16}).map((_, i) => (
            <Mono key={i} style={{fontSize: 14, color: C.nightSub, opacity: 0.7}}>{`0${Math.floor((i * 4) / 60)}:${String((i * 4) % 60).padStart(2, '0')}`}</Mono>
          ))}
        </div>
        {/* marker lane */}
        {MARKERS.map((m, i) => {
          const k = pop(f, EV.markers[i] - 4, 10, 220, 0.5);
          return (
            <div key={m} style={{position: 'absolute', left: TLW * MX[i] - 14, top: 38 + (1 - k) * -60, opacity: interpolate(k, [0, 0.2], [0, 1], CL)}}>
              <svg width={28} height={36} viewBox="0 0 28 36">
                <path d="M2 2h24v20L14 34 2 22z" fill={C.nightRed} />
              </svg>
              <div style={{position: 'absolute', left: 36, top: 4, fontFamily: FONT, fontWeight: 700, fontSize: 18, color: '#fff', whiteSpace: 'nowrap'}}>{m}</div>
            </div>
          );
        })}
        {/* video track */}
        <div style={{position: 'absolute', left: 0, right: 0, top: 96, height: 110, display: 'flex', gap: 8}}>
          {[0, 1, 2, 0, 1, 2, 0].map((c, i) => (
            <div key={i} style={{flex: [1.2, 0.8, 1, 1.4, 0.7, 1, 1.1][i], borderRadius: 10, overflow: 'hidden', position: 'relative', border: `1px solid ${CAMS[c].color}66`}}>
              <Footage i={c} f={f} w={260} h={110} />
            </div>
          ))}
        </div>
        {/* audio track */}
        <div style={{position: 'absolute', left: 0, right: 0, top: 220, height: 90, borderRadius: 10, background: `${H.hue}18`, border: `1px solid ${H.hue}55`}}>
          <div style={{position: 'absolute', left: 12, top: 10}}>
            <Bars n={170} w={TLW - 24} h={70} seed="mixdown" t={0} live={0} color={`${H.glow}aa`} amp={0.85} />
          </div>
        </div>
        {/* caption track */}
        <div style={{position: 'absolute', left: 0, right: 0, top: 324, height: 76, borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: `1px solid ${C.nightLine}`}}>
          {[0.04, 0.34, 0.62].map((x, i) => {
            const k = pop(f, EV.captions[i] - 6, 14, 190, 0.7);
            return (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  left: TLW * x,
                  top: 10,
                  width: TLW * 0.26,
                  height: 56,
                  borderRadius: 8,
                  background: C.nightRaised,
                  border: `1px solid ${C.nightLine}`,
                  translate: `${(1 - k) * 120}px 0px`,
                  opacity: interpolate(k, [0, 0.3], [0, 1], CL),
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '0 14px',
                }}
              >
                <div style={{fontFamily: FONT, fontWeight: 800, fontSize: 14, color: '#04181b', background: '#fff', borderRadius: 4, padding: '2px 6px'}}>CC</div>
                <div style={{flex: 1, display: 'flex', flexDirection: 'column', gap: 7}}>
                  <div style={{height: 7, borderRadius: 4, background: C.nightSub, opacity: 0.6, width: '92%'}} />
                  <div style={{height: 7, borderRadius: 4, background: C.nightSub, opacity: 0.4, width: '64%'}} />
                </div>
              </div>
            );
          })}
        </div>
        {/* track labels */}
        {[['VIDEO', 140], ['AUDIO', 254], ['CAPTIONS', 350]].map(([l, y]) => (
          <div key={l} style={{position: 'absolute', left: -120, top: Number(y), width: 104, textAlign: 'right', fontFamily: FONT, fontWeight: 700, fontSize: 14, letterSpacing: '0.14em', color: C.nightSub}}>
            {l}
          </div>
        ))}
        {/* playhead */}
        <div style={{position: 'absolute', left: TLW * ph - 1.5, top: 30, width: 3, height: 390, background: '#fff', boxShadow: `0 0 14px ${H.glow}`}} />
        <div style={{position: 'absolute', left: TLW * ph - 11, top: 24, width: 22, height: 16, background: '#fff', clipPath: 'polygon(0 0,100% 0,100% 50%,50% 100%,0 50%)'}} />
      </div>
      <div style={{position: 'absolute', left: 0, right: 0, top: 840, textAlign: 'center', fontFamily: FONT, fontWeight: 500, fontSize: 26, color: C.nightSub, opacity: lerp(f, 880, 900) * 0.9}}>
        Automatic transcription is not included.
      </div>
    </AbsoluteFill>
  );
};

// ---------- 06 Handoff: exports stack into one package ----------
const FILES = [
  {ext: 'XML', name: 'FCP7 XML', color: H.hue},
  {ext: 'CC', name: 'Captions', color: '#e6f6f7'},
  {ext: 'MRK', name: 'Markers', color: C.nightRed},
];

const Handoff: React.FC = () => {
  const f = useCurrentFrame();
  const packed = pop(f, EV.packed, 12, 180, 0.7);
  return (
    <AbsoluteFill>
      <LivingBg f={f} theme="dark" hue={H} spot={1.1} />
      <DotGrid f={f} theme="dark" opacity={0.35} speed={0.6} />
      <div style={{position: 'absolute', left: 0, right: 0, top: 150, display: 'flex', justifyContent: 'center', opacity: lerp(f, 920, 936)}}>
        <Kicker color={C.nightSub} dot={H.hue}>
          FCP7 XML, caption and marker exports
        </Kicker>
      </div>
      <Title2 text="Prepare the editing handoff." at={922} top={196} size={76} />
      {FILES.map((file, i) => {
        const at = EV.chips[i];
        const k = interpolate(f, [at - 16, at], [0, 1], {...CL, easing: EXPO});
        const fromX = [-700, 0, 700][i];
        const x = 960 - 170 + fromX * (1 - k) + (i - 1) * 380 * (1 - packed);
        const y = 400 + (1 - k) * 300 - i * 14 * packed;
        return (
          <div
            key={file.name}
            style={{
              position: 'absolute',
              left: x,
              top: y + i * 0,
              width: 340,
              height: 400,
              borderRadius: 22,
              background: `linear-gradient(180deg, ${C.nightSurface}, #17191d)`,
              border: `1px solid ${C.nightLine}`,
              boxShadow: `0 40px 80px rgba(0,0,0,0.5), 0 0 40px ${file.color}22`,
              opacity: interpolate(k, [0, 0.3], [0, 1], CL),
              rotate: `${(1 - k) * [-14, 0, 14][i] + packed * (i - 1) * 4}deg`,
              padding: 30,
              fontFamily: FONT,
            }}
          >
            <div style={{width: 110, height: 130, borderRadius: 14, background: `${file.color}22`, border: `2px solid ${file.color}`, display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: 30, color: file.color}}>{file.ext}</div>
            <div style={{marginTop: 34, fontWeight: 800, fontSize: 38, letterSpacing: '-0.03em', color: '#fff'}}>{file.name}</div>
            <div style={{marginTop: 12, fontWeight: 500, fontSize: 20, color: C.nightSub}}>Export</div>
            <div style={{position: 'absolute', left: 30, right: 30, bottom: 30, height: 8, borderRadius: 4, background: C.nightSoft}}>
              <div style={{width: `${lerp(f, at, at + 24) * 100}%`, height: 8, borderRadius: 4, background: file.color}} />
            </div>
          </div>
        );
      })}
      <div style={{position: 'absolute', left: 0, right: 0, top: 846, display: 'flex', justifyContent: 'center', scale: `${interpolate(packed, [0, 1], [0.8, 1])}`, opacity: interpolate(packed, [0, 0.3], [0, 1], CL)}}>
        <Chip theme="dark" text="Editing handoff prepared" dot={C.nightGreen} />
      </div>
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
    icon={(s, g) => <ProductIcon id="audiosync" size={s} glow={g} />}
    title="Montage Pro"
    tagline="Align multicamera recordings. Hand off with captions and markers."
    footer="Windows build · Local preview 0.5.0"
    fine="Automatic transcription is not included."
  />
);

const COMPS: Record<string, React.FC> = {slate: Slate, title: Title, sync: Sync, select: Select, markers: Markers, handoff: Handoff, end: End};
const scenes: SceneSpec[] = SCENES.map((t) => ({t, Comp: COMPS[t.id], theme: 'dark' as const, origin: t.id === 'select' ? [150 + 235, 340 + 132] : t.id === 'handoff' ? [960, 600] : undefined}));
const shakes = [...SFX.impacts.map((at) => ({at, amp: 14})), ...SFX.hits.map((at) => ({at, amp: 6}))];

export const MkMontageReel: React.FC = () => (
  <ReelShell scenes={scenes} T={TRANS} duration={DURATION} hue={H} product="Montage Pro" right="Windows build · 0.5.0" audio="mk/montage.wav" shakes={shakes} />
);
