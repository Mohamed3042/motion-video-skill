// The café wall resolves into straight, source-linked employer dossiers.
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {ACCENT, C, FONT, MONO} from '../../brand';
import {useSectionFrame} from '../../frame';
import {CafeWall} from '../market/kit';
import {Btn, Check, ease, IconBriefcase, IconDoc, panelStyle, Pill, prog, rgba, rise, SampleChip, Title} from '../profile/kit';

const A = ACCENT.employers;
const rows = [
  {name: 'Northstar Labs', monogram: 'N', context: 'Workflow automation', detail: 'Python mentioned in a public post', source: 'Employer engineering page'},
  {name: 'Cedar Systems', monogram: 'C', context: 'Reporting systems', detail: 'Operations needs in a public post', source: 'Employer news feed'},
];

export const World: React.FC = () => {
  const f = useSectionFrame();
  const reveal = ease.expoOut(prog(f, 108, 136));
  const sourceFocus = ease.expoOut(prog(f, 240, 264));
  const watch = ease.expoOut(prog(f, 360, 379));
  const exit = ease.inOut(prog(f, 444, 480));
  const uiOut = 1 - ease.cubicIn(prog(f, 440, 464));
  return (
    <AbsoluteFill style={{background: C.bg, fontFamily: FONT, color: C.ink}}>
      <div style={{position: 'absolute', inset: 0, opacity: (1 - reveal * .92) * (1 - exit)}}><CafeWall g={f} /></div>
      <div style={{position: 'absolute', inset: 0, background: `radial-gradient(ellipse at 65% 40%, ${rgba(A, .13)}, transparent 65%)`}} />
      {/* Level rules expose the illusion: row edges never tilt. */}
      <svg width={1920} height={1080} style={{position: 'absolute', inset: 0, opacity: ease.expoOut(prog(f, 56, 74)) * (1 - reveal)}}>
        {[400, 544, 688, 832].map((y, i) => <g key={y}><path d={`M1080 ${y} H1798`} stroke={A} strokeWidth={5} strokeDasharray={720} strokeDashoffset={720 * (1 - ease.expoOut(prog(f, 54 + i * 7, 82 + i * 7)))} /><circle cx={1080} cy={y} r={8} fill={A} /></g>)}
      </svg>
      <Title f={f} idx={8} name="EMPLOYERS" promise="Inspect employers through their sources." accent={A} />
      <div style={{position: 'absolute', left: 124, top: 752, fontSize: 32, color: A, opacity: ease.expoOut(prog(f, 66, 85)) * (1 - reveal)}}>Every row is straight. Every claim needs a source.</div>
      <div style={{position: 'absolute', inset: 0, opacity: uiOut}}>
        <div style={{position: 'absolute', left: 126, top: 149, right: 126, display: 'flex', justifyContent: 'space-between', alignItems: 'center', ...rise(f, 108, 30)}}><div style={{fontWeight: 600, fontSize: 40}}>Look beyond the job title.</div><Pill label="Source-linked dossiers" color={A} fs={25} /></div>
        {rows.map((row, i) => <div key={row.name} style={{...panelStyle(A), left: 124 + i * 848, top: 230, width: 824, height: 600, ...rise(f, 120 + i * 8, 80)}}>
          <div style={{height: 6, background: A, opacity: .85}} />
          <div style={{position: 'absolute', left: 32, top: 39, width: 70, height: 70, borderRadius: 16, background: rgba(A, .14), border: `1px solid ${rgba(A, .5)}`, display: 'grid', placeItems: 'center', fontSize: 38, color: A, fontWeight: 700}}>{row.monogram}</div>
          <div style={{position: 'absolute', left: 122, top: 37, fontSize: 39, fontWeight: 600}}>{row.name}</div>
          <div style={{position: 'absolute', left: 124, top: 90, fontSize: 26, color: C.muted}}>Employer dossier</div>
          <SampleChip style={{right: 28, top: 126, fontSize: 15}} />
          <div style={{position: 'absolute', left: 34, right: 34, top: 173, height: 142, borderBottom: `1px solid ${C.line}`}}>
            <div style={{display: 'flex', alignItems: 'center', gap: 13, color: A, fontSize: 26}}><IconBriefcase size={29} color={A} /> Publicly observed needs</div>
            <div style={{fontSize: 36, fontWeight: 500, marginTop: 15}}>{row.context}</div><div style={{fontSize: 27, color: C.muted, marginTop: 10}}>{row.detail}</div>
          </div>
          <div style={{position: 'absolute', left: 22, right: 22, top: 337, border: `1px solid ${rgba(A, sourceFocus * .65)}`, borderRadius: 9, padding: '17px 12px', background: rgba(A, sourceFocus * .05), transform: `translateY(${(1 - sourceFocus) * 8}px)`}}><div style={{display: 'flex', gap: 13, alignItems: 'center', fontSize: 29}}><IconDoc size={30} color={A} /> {row.source}</div><div style={{marginTop: 12, fontSize: 26, color: C.muted}}>Captured 02 Oct 2026 · Accepted observation</div></div>
          <div style={{position: 'absolute', left: 34, right: 34, bottom: 31, display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
            <Btn label="View sources" primary fs={28} h={61} glow={sourceFocus * (1 - watch) * .45} accent={A} />
            <div style={{display: 'flex', gap: 15, alignItems: 'center', fontSize: 28, color: watch > .5 && i === 0 ? A : C.muted}}>Watch employer<div style={{width: 66, height: 36, padding: 4, borderRadius: 30, boxSizing: 'border-box', background: i === 0 ? rgba(A, .15 + .6 * watch) : C.raised, border: `1px solid ${rgba(A, .55)}`}}><div style={{width: 26, height: 26, borderRadius: '50%', background: C.ink, transform: `translateX(${i === 0 ? 28 * watch : 0}px)`}} /></div></div>
          </div>
        </div>)}
        <div style={{position: 'absolute', left: 126, top: 865, display: 'flex', gap: 17, alignItems: 'center', fontSize: 29, color: C.muted, ...rise(f, 240, 28)}}><Check size={26} color={A} /> Needs come from accepted public observations.</div>
        <div style={{position: 'absolute', right: 126, top: 856, ...rise(f, 360, 32)}}><Btn label="Find unexpected opportunities" fs={27} h={60} accent={A} glow={.22 * watch} /></div>
        <div style={{position: 'absolute', left: 126, top: 922, fontFamily: MONO, fontSize: 20, color: C.soft, opacity: reveal}}>Employer context does not establish an open vacancy.</div>
      </div>
      {/* Horizontal rows shear into the next world's barber-pole sheet. */}
      <svg width={1920} height={1080} style={{position: 'absolute', inset: 0, opacity: exit}}><rect width={1920} height={1080} fill={C.deep} /><g transform={`translate(960 540) skewY(${45 * exit}) translate(-960 -540)`}>{Array.from({length: 40}, (_, i) => <rect key={i} x={-1600} y={i * 120 - 1860} width={5120} height={60} fill={A} />)}</g></svg>
    </AbsoluteFill>
  );
};
