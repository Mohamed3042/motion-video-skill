// MK Suite - Every idea has a world — the reel shell (owned by the framework job; this is the scaffold's starting point).
// Intro, segments and outro in Sequences that overlap by PAD frames, a crossfade at every boundary,
// one camera shake driven by every impact/hit that asks for it, and the master soundtrack.
import React from 'react';
import {AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {ACCENT, C, MONO} from './brand';
import {PAD, SECTIONS, SEGMENTS, type SectionId} from './timing';
import {SEG_IMPL} from './segments';
import {FW_EVENTS} from './shell/timing';
import {Intro} from './intro/Intro';
import {Outro} from './outro/Outro';
import {clamp, ease} from './util';

const COMPONENT = {
  intro: Intro,
  outro: Outro,
  ...Object.fromEntries(SEGMENTS.map((s) => [s.id, SEG_IMPL[s.id].World])),
} as Record<SectionId, React.FC>;

// Camera shake: smooth sum of sines under a 20-frame decaying envelope (never per-frame jitter).
const SHAKES = [
  ...FW_EVENTS.filter((e) => e.shake).map((e) => ({f: e.f, amp: e.shake!})),
  ...SEGMENTS.flatMap((s) => SEG_IMPL[s.id].EVENTS.filter((e) => e.shake).map((e) => ({f: s.start + e.f, amp: e.shake!}))),
];
const shakeAt = (g: number) => {
  let x = 0;
  let y = 0;
  for (const s of SHAKES) {
    const t = g - s.f;
    if (t < 0 || t >= 20) continue;
    const env = (1 - t / 20) ** 2;
    const k = s.f * 0.37;
    x += s.amp * env * (0.65 * Math.sin(t * 0.95 + k) + 0.35 * Math.sin(t * 1.73 + 2.1 * k));
    y += s.amp * env * (0.65 * Math.cos(t * 0.83 + 1.3 * k) + 0.35 * Math.sin(t * 2.11 + k));
  }
  return x || y ? `translate(${x.toFixed(2)}px, ${y.toFixed(2)}px)` : undefined;
};

// One section inside its Sequence; it fades in across its start boundary (over the previous section's tail).
const Shot: React.FC<{i: number}> = ({i}) => {
  const s = SECTIONS[i];
  const g = useCurrentFrame() + s.start - PAD;
  const p = i===0 ? 1 : ease.cubicInOut(clamp((g-s.start+6)/12));
  const q=clamp((g-s.end+6)/12);
  const mode=i%6;
  const clipPath = p>=1 ? undefined : mode===0 ? `circle(${p*2200}px at 65% 52%)` : mode===1 ? `polygon(0 0, ${p*130}% 0, ${p*130-30}% 100%, 0 100%)` : mode===2 ? `inset(${(1-p)*50}% 0)` : mode===3 ? `inset(0 ${(1-p)*100}% 0 0)` : mode===4 ? `circle(${p*2100}px at 35% 50%)` : `inset(0 0 0 ${(1-p)*100}%)`;
  const Comp = COMPONENT[s.id];
  return (
    <AbsoluteFill style={{clipPath,overflow:'hidden',transform:q>0?`scale(${1+q*.035}) translateX(${-q*24}px)`:undefined}}>
      <Comp />
    </AbsoluteFill>
  );
};

export const Reel: React.FC = () => {
  const g = useCurrentFrame();
  const current=SEGMENTS.find(s=>g>=s.start&&g<s.end);
  return (
    <AbsoluteFill style={{background: C.bg, overflow: 'hidden'}}>
      <AbsoluteFill style={{transform: shakeAt(g)}}>
        {SECTIONS.map((s, i) => (
          <Sequence key={s.id} from={s.start - PAD} durationInFrames={s.end - s.start + 2 * PAD} name={`${String(s.index).padStart(2, '0')} ${s.name}`} layout="none">
            <Shot i={i} />
          </Sequence>
        ))}
      </AbsoluteFill>
      {current ? <>
        <div style={{position:'absolute',left:72,top:28,height:28,padding:'4px 12px',background:'#10121AE8',borderRadius:4,display:'flex',alignItems:'center',gap:14,fontFamily:MONO,fontSize:15,color:'#F8F5EF',letterSpacing:1.7}}><span style={{display:'inline-block',width:7,height:7,borderRadius:4,background:ACCENT[current.id]}}/>MK SUITE<span style={{color:'#AEB0B8'}}>/</span>{String(current.index).padStart(2,'0')} / 23</div>
        <div style={{position:'absolute',left:72,right:72,bottom:36,height:2,background:'#FFFFFF16'}}><div style={{height:2,width:`${(g-current.start)/(current.end-current.start)*100}%`,background:ACCENT[current.id],opacity:.65}}/></div>
      </> : null}
      <Audio src={staticFile('mk-suite-worlds/music.wav')} />
    </AbsoluteFill>
  );
};
