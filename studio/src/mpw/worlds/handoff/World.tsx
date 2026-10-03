// World 5 · HANDOFF (orange). Captions' three stacked bars become the three round prongs of an impossible fork
// (a blivet): FCP7 XML, SRT · VTT, JSON REPORT. Their six edges run unbroken down the drawing and end as TWO
// rectangular bars: the middle prong turns into the gap between them. Three deliverables, one handoff: a file
// pulse runs down each prong into a package, the fork sinks in, the lid seals. "Your source media, untouched."
// Exit: the lid pops open and a waveform pours out (into Sound Lab's spectrogram).
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {ACCENT, C, FONT, MONO, RADIUS} from '../../brand';
import {useWorldFrame} from '../../frame';
import {Check, Chip, Glow, MonoLabel, Title, clamp, ease, mix, mixHex, panel, prog, pulse, rgba, sp} from '../review/kit';
import {T} from './timing';

const OR = ACCENT.handoff;
const PAPER = ACCENT.captions;
const SAGE = ACCENT.sound;

// the fork: six continuous vertical edges
const X = [740, 840, 910, 1010, 1080, 1180];
const Y_TOP = 244; // prong caps (ellipse centres)
const RY = 15;
const Y_SIDE = 748; // bar ends: outer corners
const Y_CORNER = 770; // bar ends: near corner
const PRONG = [0, 1, 2].map((i) => ({x0: X[2 * i], x1: X[2 * i + 1], cx: (X[2 * i] + X[2 * i + 1]) / 2}));
const LABELS = ['FCP7 XML', 'SRT · VTT', 'JSON REPORT'];
const LABEL_AT = [T.xml, T.subs, T.json];

// the package (oblique box): front face, top face, right side
const BOX = {x0: 730, x1: 1170, y0: 780, y1: 930, dx: 40, dy: -60};

const Blivet: React.FC<{f: number}> = ({f}) => {
  const morph = ease.inOut(prog(f, 0, 20));
  const draw = ease.inOut(prog(f, 6, 62));
  const yEnd = mix(590, Y_CORNER + 4, draw);
  const faces = ease.inOut(prog(f, 40, 80));
  const stroke = mixHex(PAPER, '#ffd9b0', morph);
  const glowOf = (i: number) => pulse(f, LABEL_AT[i], 30);
  return (
    <svg width={1920} height={1080} style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
      <defs>
        <linearGradient id="mpwHoCyl" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="#3a2210" />
          <stop offset="0.3" stopColor="#f5b877" />
          <stop offset="0.42" stopColor="#ffe2c2" />
          <stop offset="0.7" stopColor="#b8692a" />
          <stop offset="1" stopColor="#2e1a0b" />
        </linearGradient>
        <linearGradient id="mpwHoTopFade" gradientUnits="userSpaceOnUse" x1="0" y1="400" x2="0" y2="540">
          <stop offset="0" stopColor="#fff" />
          <stop offset="1" stopColor="#000" />
        </linearGradient>
        <linearGradient id="mpwHoBotFade" gradientUnits="userSpaceOnUse" x1="0" y1="470" x2="0" y2="600">
          <stop offset="0" stopColor="#000" />
          <stop offset="1" stopColor="#fff" />
        </linearGradient>
        <mask id="mpwHoTop">
          <rect x={0} y={0} width={1920} height={1080} fill="url(#mpwHoTopFade)" />
        </mask>
        <mask id="mpwHoBot">
          <rect x={0} y={0} width={1920} height={1080} fill="url(#mpwHoBotFade)" />
        </mask>
        <clipPath id="mpwHoDraw">
          <rect x={0} y={0} width={1920} height={yEnd} />
        </clipPath>
      </defs>
      {/* round prongs (top): cylinder shading that fades out down the drawing */}
      <g mask="url(#mpwHoTop)" opacity={morph}>
        {PRONG.map((p, i) => (
          <rect key={i} x={p.x0} y={Y_TOP} width={p.x1 - p.x0} height={330} fill="url(#mpwHoCyl)" opacity={0.85 + 0.15 * glowOf(i)} />
        ))}
      </g>
      {/* rectangular bars (bottom): two flat faces each, fading in down the drawing */}
      <g mask="url(#mpwHoBot)" clipPath="url(#mpwHoDraw)" opacity={faces}>
        <path d={`M${X[0]} 430 H${X[1]} V${Y_CORNER} L${X[0]} ${Y_SIDE} Z`} fill="#e39a55" />
        <path d={`M${X[1]} 430 H${X[2]} V${Y_SIDE} L${X[1]} ${Y_CORNER} Z`} fill="#7a4419" />
        <path d={`M${X[3]} 430 H${X[4]} V${Y_CORNER} L${X[3]} ${Y_SIDE} Z`} fill="#e39a55" />
        <path d={`M${X[4]} 430 H${X[5]} V${Y_SIDE} L${X[4]} ${Y_CORNER} Z`} fill="#7a4419" />
      </g>
      {/* the six unbroken edges + both bar ends */}
      <g clipPath="url(#mpwHoDraw)" fill="none" stroke={stroke} strokeWidth={3.5} strokeLinejoin="round" strokeLinecap="round" opacity={morph}>
        {X.map((x, k) => (
          <line key={k} x1={x} y1={Y_TOP} x2={x} y2={k === 1 || k === 4 ? Y_CORNER : Y_SIDE} />
        ))}
        <path d={`M${X[0]} ${Y_SIDE} L${X[1]} ${Y_CORNER} L${X[2]} ${Y_SIDE}`} />
        <path d={`M${X[3]} ${Y_SIDE} L${X[4]} ${Y_CORNER} L${X[5]} ${Y_SIDE}`} />
      </g>
      {/* prong caps */}
      {PRONG.map((p, i) => (
        <ellipse key={i} cx={p.cx} cy={Y_TOP} rx={(p.x1 - p.x0) / 2} ry={RY} fill={mixHex('#f7c48e', '#fff1df', glowOf(i))} stroke={stroke} strokeWidth={3.5} opacity={morph} />
      ))}
    </svg>
  );
};

// a file pulse running down a prong into the package
const Pulse: React.FC<{f: number; i: number}> = ({f, i}) => {
  const a = T.arrive[i] - 66;
  const u = prog(f, a, T.arrive[i]);
  if (u <= 0 || u >= 1) return null;
  const y = mix(Y_TOP, 800, ease.inOut(u));
  const barX = [825, 960, 1095][i];
  const x = y < 470 ? PRONG[i].cx : y > 600 ? mix(barX, 950, prog(y, 700, 800)) : mix(PRONG[i].cx, barX, (y - 470) / 130);
  return (
    <>
      <div style={{position: 'absolute', left: x - 5, top: y - 90, width: 10, height: 90, borderRadius: 5, background: `linear-gradient(180deg, ${rgba('#fff4e6', 0)}, ${rgba('#fff4e6', 0.85)})`}} />
      <Glow x={x} y={y} w={70} color="#ffd9b0" opacity={0.9} />
      <div style={{position: 'absolute', left: x - 7, top: y - 7, width: 14, height: 14, borderRadius: 7, background: '#fff8ef'}} />
    </>
  );
};

const Card: React.FC<{f: number; at: number; x: number; y: number; w: number; label: string; title: string; children: React.ReactNode}> = ({f, at, x, y, w, label, title, children}) => {
  const u = sp(f, at, {damping: 15, stiffness: 190, mass: 0.8});
  const out = prog(f, T.sink - 6, T.sink + 12);
  const fl = pulse(f, at, 24);
  if (u <= 0) return null;
  return (
    <div style={{...panel({left: x, top: y, width: w}), padding: '20px 24px', boxSizing: 'border-box', opacity: clamp(u * 2) * (1 - out), transform: `translateY(${(1 - u) * 30}px)`, borderColor: fl > 0.02 ? rgba(OR, 0.4 + 0.6 * fl) : C.line}}>
      <Chip color={OR} fill={0.12 + 0.3 * fl}>
        {label}
      </Chip>
      <div style={{marginTop: 14, fontFamily: FONT, fontWeight: 650, fontSize: 32, color: C.text}}>{title}</div>
      <div style={{marginTop: 14}}>{children}</div>
    </div>
  );
};

const Line: React.FC<{children: React.ReactNode}> = ({children}) => (
  <div style={{display: 'flex', alignItems: 'center', gap: 10, fontFamily: FONT, fontSize: 21, color: C.muted, marginTop: 6}}>
    <div style={{width: 7, height: 7, borderRadius: 2, background: OR}} />
    {children}
  </div>
);

// the package: lid hinged on the back edge (a = 0 closed, 1 open)
const Package: React.FC<{f: number; lidOpen: number; part: 'back' | 'front'}> = ({f, lidOpen, part}) => {
  const {x0, x1, y0, y1, dx, dy} = BOX;
  const hinge0 = {x: x0 + dx, y: y0 + dy};
  const hinge1 = {x: x1 + dx, y: y0 + dy};
  const ang = (lidOpen * 105 * Math.PI) / 180;
  // closed: the lid's free edge sits on the front edge (−dx, −dy from the hinge); open: it stands up behind
  const vx = -dx * Math.cos(ang);
  const vy = -dy * Math.cos(ang) - 92 * Math.sin(ang);
  const lid = `M${hinge0.x} ${hinge0.y} L${hinge1.x} ${hinge1.y} L${hinge1.x + vx} ${hinge1.y + vy} L${hinge0.x + vx} ${hinge0.y + vy} Z`;
  const lidBehind = vy < 0;
  const seal = sp(f, T.seal, {damping: 12, stiffness: 260, mass: 0.7});
  const sealed = f >= T.seal && lidOpen < 0.5;
  const sealFlash = pulse(f, T.seal, 30);
  const tapeX = x0 + (x1 - x0) * 0.8;
  const files = ['sequence.xml', 'captions.srt · captions.vtt', 'sync-report.json'];
  if (part === 'back') {
    return (
      <svg width={1920} height={1080} style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
        {/* inside of the box (the opening) and an open lid standing behind it */}
        <path d={`M${x0} ${y0} L${x1} ${y0} L${x1 + dx} ${y0 + dy} L${x0 + dx} ${y0 + dy} Z`} fill="#140d07" stroke={rgba(OR, 0.5)} strokeWidth={2} />
        {lidBehind ? <path d={lid} fill="#3a2513" stroke={OR} strokeWidth={2.5} strokeLinejoin="round" /> : null}
      </svg>
    );
  }
  return (
    <>
      <svg width={1920} height={1080} style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
        <path d={`M${x1} ${y0} L${x1 + dx} ${y0 + dy} L${x1 + dx} ${y1 + dy} L${x1} ${y1} Z`} fill="#2a1b0e" stroke={OR} strokeWidth={2.5} strokeLinejoin="round" />
        <rect x={x0} y={y0} width={x1 - x0} height={y1 - y0} fill="#21180f" stroke={OR} strokeWidth={2.5} />
        {!lidBehind ? <path d={lid} fill="#4a2f17" stroke={OR} strokeWidth={2.5} strokeLinejoin="round" /> : null}
        {/* the seal: a tape across the lid and down the front */}
        {sealed ? (
          <g opacity={clamp(seal * 2)} transform={`translate(${(1 - seal) * -30} 0)`}>
            <path d={`M${tapeX - 48 + dx} ${y0 + dy} L${tapeX + 48 + dx} ${y0 + dy} L${tapeX + 48} ${y0} L${tapeX - 48} ${y0} Z`} fill={mixHex(OR, '#ffe3c4', sealFlash)} />
            <rect x={tapeX - 48} y={y0} width={96} height={46} fill={mixHex(OR, '#ffe3c4', sealFlash)} />
          </g>
        ) : null}
      </svg>
      {sealFlash > 0.02 && sealed ? <Glow x={(x0 + x1) / 2 + 20} y={y0 - 20} w={700} h={260} color={OR} opacity={0.6 * sealFlash} /> : null}
      <div style={{position: 'absolute', left: x0 + 22, top: y0 + 16, width: x1 - x0 - 44}}>
        <div style={{display: 'flex', alignItems: 'center'}}>
          <MonoLabel color={OR}>HANDOFF PACKAGE</MonoLabel>
          <span style={{marginLeft: 'auto', fontFamily: MONO, fontSize: 14, color: C.muted, opacity: sealed ? 0 : 1}}>Day 01</span>
        </div>
        {files.map((x, k) => {
          const got = f >= T.arrive[k];
          const g = pulse(f, T.arrive[k], 20);
          return (
            <div key={x} style={{display: 'flex', alignItems: 'center', gap: 10, marginTop: k ? 6 : 12, fontFamily: MONO, fontWeight: 500, fontSize: 17, color: got ? C.text : rgba(C.muted, 0.35)}}>
              <div style={{width: 18, display: 'flex'}}>{got ? <Check size={18} color={mixHex(OR, '#fff', g)} width={10} /> : null}</div>
              {x}
            </div>
          );
        })}
      </div>
      {sealed ? (
        <div style={{position: 'absolute', left: tapeX - 48, top: y0 + 6, width: 96, textAlign: 'center', fontFamily: MONO, fontWeight: 700, fontSize: 13, letterSpacing: '0.12em', color: '#2a1606', opacity: clamp(seal * 2)}}>
          ONE
          <br />
          HANDOFF
        </div>
      ) : null}
    </>
  );
};

// the exit: a waveform pours out of the open package and spreads across the frame
const Pour: React.FC<{f: number; cx0: number}> = ({f, cx0}) => {
  if (f < T.lid) return null;
  const u = ease.inOut(prog(f, T.lid + 2, T.pour + 26));
  const n = 72;
  const cx = mix(cx0, 960, u);
  const cy = mix(BOX.y0 - 40, 540, u);
  const sp_ = mix(8, 26.6, u);
  const A = mix(40, 300, ease.cubicOut(u));
  const col = mixHex(OR, SAGE, prog(f, T.pour - 10, T.pour + 30));
  return (
    <>
      <Glow x={cx} y={cy} w={mix(300, 1800, u)} h={mix(160, 520, u)} color={col} opacity={0.35} />
      {Array.from({length: n}, (_, k) => {
        const d = (k - (n - 1) / 2) / (n / 2);
        const env = Math.exp(-d * d * 1.6) * 0.8 + 0.2;
        const h = Math.max(6, A * env * (0.45 + 0.55 * Math.abs(Math.sin(k * 0.83 + f * 0.21) * Math.cos(k * 0.29 - f * 0.07))));
        const rise = (1 - u) * 40;
        return <div key={k} style={{position: 'absolute', left: cx + (k - (n - 1) / 2) * sp_ - 5, top: cy - h / 2 - rise, width: 10, height: h, borderRadius: 5, background: col, opacity: 0.55 + 0.45 * env}} />;
      })}
    </>
  );
};

// ---------------------------------------------------------------- world ----
export const World: React.FC = () => {
  const f = useWorldFrame();
  const boxIn = sp(f, T.box - 16, {damping: 16, stiffness: 120, mass: 1});
  const sink = ease.inOut(prog(f, T.sink, T.seal - 10));
  const lidClose = ease.cubicIn(prog(f, T.seal - 12, T.seal));
  const lidPop = sp(f, T.lid - 6, {damping: 9, stiffness: 220, mass: 0.6});
  const lidOpen = f < T.lid - 6 ? 1 - lidClose : clamp(lidPop, 0, 1.15);
  const move = ease.inOut(prog(f, T.seal + 14, T.seal + 54));
  const shiftX = 380 * move;
  const boxY = (1 - boxIn) * 360;
  const boxFade = 1 - prog(f, T.pour, T.pour + 22);
  const boxTf = `translate(${shiftX}px, ${boxY + 90 * (1 - boxFade) ** 2}px) scale(${1 + 0.12 * move})`;
  const left = sp(f, T.untouched - 30, {damping: 16, stiffness: 150, mass: 0.9});
  const leftOut = ease.inOut(prog(f, T.lid - 24, T.lid));
  const ck = ease.cubicOut(prog(f, T.untouched - 6, T.untouched));
  const ckFlash = pulse(f, T.untouched, 24);
  return (
    <AbsoluteFill style={{background: C.canvas, overflow: 'hidden'}}>
      {/* drafting-table backdrop: a faint orange dot grid */}
      <div style={{position: 'absolute', inset: 0, backgroundImage: `radial-gradient(${rgba(OR, 0.12)} 1.4px, transparent 1.6px)`, backgroundSize: '40px 40px', opacity: 0.6 * (1 - leftOut * 0.5)}} />
      <Glow x={960} y={520} w={1500} h={1000} color={OR} opacity={0.1} />
      {/* entrance: Captions' three paper bars */}
      {f < 22
        ? PRONG.map((p) => <div key={p.cx} style={{position: 'absolute', left: p.x0, top: 236, width: 100, height: 354, borderRadius: 3, background: PAPER, opacity: 1 - ease.inOut(prog(f, 0, 20)), boxShadow: `0 0 40px ${rgba(PAPER, 0.25)}`}} />)
        : null}
      <Title f={f} index="05 / 11" name="HANDOFF" color={OR} out={98} promise={<>Hand your editor a <span style={{color: OR, fontWeight: 650}}>clean sequence.</span></>} />
      {/* the deliverables */}
      <Card f={f} at={T.xml} x={96} y={250} w={560} label="FCP7 XML" title="Editable sequence">
        <Line>Stacked camera tracks</Line>
        <Line>One marker per sync group</Line>
        <div style={{marginTop: 18, position: 'relative', height: 92}}>
          {['CAM A', 'CAM B', 'CAM C', 'CAM D'].map((c, k) => (
            <div key={c} style={{position: 'absolute', left: 64 + k * 18, top: 70 - k * 22, width: 300, height: 18, borderRadius: 3, background: rgba(OR, 0.18 + k * 0.08), border: `1px solid ${rgba(OR, 0.6)}`}}>
              <span style={{position: 'absolute', left: -60 - k * 18, top: 0, fontFamily: MONO, fontSize: 12, color: C.muted}}>{c}</span>
            </div>
          ))}
          {[120, 260].map((x) => (
            <div key={x} style={{position: 'absolute', left: x + 64, top: 0, width: 12, height: 12, background: C.amber, transform: 'rotate(45deg)'}} />
          ))}
        </div>
      </Card>
      <Card f={f} at={T.subs} x={1290} y={210} w={558} label="SRT · VTT" title="Captions, as edited">
        <div style={{fontFamily: MONO, fontSize: 16, color: C.muted, lineHeight: 1.55}}>
          <div>00:00:04.000 → 00:00:05.200</div>
          <div style={{color: PAPER, fontFamily: FONT, fontSize: 20}}>Every angle.</div>
        </div>
      </Card>
      <Card f={f} at={T.json} x={1290} y={470} w={558} label="JSON REPORT" title="Every sync measurement">
        <div style={{fontFamily: MONO, fontSize: 16, lineHeight: 1.5, color: C.muted}}>
          {'{ "camera": "CAM B",'}
          <br />
          {'  "verdict": "Strong",'}
          <br />
          {'  "drift": "measured" }'}
        </div>
      </Card>
      {/* the package, the fork, the pulses */}
      <div style={{position: 'absolute', inset: 0, transformOrigin: '950px 830px', transform: boxTf, opacity: clamp(boxIn * 3) * boxFade}}>
        <Package f={f} lidOpen={clamp(lidOpen)} part="back" />
      </div>
      <div style={{position: 'absolute', inset: 0, clipPath: f >= T.sink ? 'inset(0 0 300px 0)' : undefined}}>
        <div style={{position: 'absolute', inset: 0, transformOrigin: '960px 780px', transform: `translateY(${sink * 560}px) scaleX(${1 - 0.12 * sink})`, opacity: f >= T.seal ? 0 : 1}}>
          <Blivet f={f} />
        </div>
      </div>
      {[0, 1, 2].map((i) => (
        <Pulse key={i} f={f} i={i} />
      ))}
      <div style={{position: 'absolute', inset: 0, transformOrigin: '950px 830px', transform: boxTf, opacity: clamp(boxIn * 3) * boxFade}}>
        <Package f={f} lidOpen={clamp(lidOpen)} part="front" />
      </div>
      {/* prong labels */}
      {PRONG.map((p, i) => {
        const u = sp(f, LABEL_AT[i], {damping: 12, stiffness: 230, mass: 0.6});
        const out = prog(f, T.sink - 6, T.sink + 8);
        return (
          <div key={i} style={{position: 'absolute', left: p.cx - 100, top: 178, width: 200, textAlign: 'center', fontFamily: MONO, fontWeight: 700, fontSize: 21, letterSpacing: '0.06em', color: mixHex(OR, '#fff1df', pulse(f, LABEL_AT[i], 24)), opacity: clamp(u * 2) * (1 - out), transform: `translateY(${(1 - u) * 16}px) scale(${0.85 + 0.15 * u})`}}>
            {LABELS[i]}
          </div>
        );
      })}
      <div style={{position: 'absolute', left: 96, top: 610, fontFamily: FONT, fontWeight: 650, fontSize: 40, lineHeight: 1.15, color: C.text, opacity: prog(f, T.json + 36, T.json + 52) * (1 - prog(f, T.sink - 6, T.sink + 8))}}>
        Three deliverables.
        <br />
        <span style={{color: OR}}>One handoff.</span>
      </div>
      {/* after the seal: the originals */}
      {f >= T.untouched - 30 ? (
        <div style={{position: 'absolute', left: 96, top: 330, width: 900, opacity: clamp(left * 2) * (1 - leftOut), transform: `translateX(${(1 - left) * -50}px)`}}>
          <MonoLabel color={OR}>SOURCE MEDIA</MonoLabel>
          <div style={{marginTop: 16, fontFamily: FONT, fontWeight: 700, fontSize: 74, lineHeight: 1.04, letterSpacing: '-0.02em', color: C.text}}>
            Your source media,
            <br />
            <span style={{color: OR}}>untouched.</span>
          </div>
          <div style={{marginTop: 34, display: 'flex', gap: 10}}>
            {['CAM A', 'CAM B', 'CAM C', 'CAM D', 'REC'].map((c) => (
              <div key={c} style={{display: 'flex', alignItems: 'center', gap: 8, height: 40, padding: '0 14px', borderRadius: RADIUS.control, background: C.panel, border: `1px solid ${C.line}`, fontFamily: MONO, fontWeight: 700, fontSize: 15, color: C.text}}>
                <svg width={14} height={16} viewBox="0 0 14 16">
                  <rect x={1} y={7} width={12} height={8} rx={2} fill={OR} />
                  <path d="M3.5 7 V5 a3.5 3.5 0 0 1 7 0 V7" fill="none" stroke={OR} strokeWidth={1.8} />
                </svg>
                {c}
              </div>
            ))}
          </div>
          <div style={{marginTop: 26, display: 'flex', alignItems: 'center', gap: 12, fontFamily: FONT, fontSize: 26, color: ckFlash > 0.05 ? C.text : C.muted}}>
            <Check size={30} color={C.success} p={ck} width={9} />
            Never modified or re-encoded by sync or export.
          </div>
        </div>
      ) : null}
      <Pour f={f} cx0={(BOX.x0 + BOX.x1) / 2 + BOX.dx / 2 + shiftX} />
    </AbsoluteFill>
  );
};
