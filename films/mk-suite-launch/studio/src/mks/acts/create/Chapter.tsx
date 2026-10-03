// A · "Create." — the chapter card emerges out of the framework's zoom-through bloom (frame 0).
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {Chapter, ease, lerp, prog} from '../../kit';
import {PenIcon} from './parts';
import {T} from './timing';

export const ChapterScene: React.FC<{f: number}> = ({f}) => {
  if (f > T.chapterEnd + 1) return null;
  const emerge = ease.expoOut(prog(f, -12, 50));
  const drift = ease.inOut(prog(f, 40, T.chapterEnd));
  const exit = prog(f, T.chapterEnd - 24, T.chapterEnd) ** 2; // flies past the camera as the window arrives
  const scale = lerp(1.18, 1, emerge) * (1 + 0.03 * drift) * (1 + 1.3 * exit);
  const blur = 10 * (1 - ease.out(prog(f, -4, 18))) + 8 * exit;
  const bright = 1 + 0.8 * (1 - ease.out(prog(f, 0, 24)));
  const glow = 1 - ease.out(prog(f, 0, 48));
  return (
    <AbsoluteFill>
      {/* the bloom's afterglow, contracting behind the word */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse ${lerp(70, 34, emerge)}% ${lerp(60, 30, emerge)}% at 50% 50%, rgba(220,255,234,${0.5 * glow}) 0%, rgba(30,215,96,${0.22 * glow}) 45%, rgba(30,215,96,0) 100%)`,
        }}
      />
      <AbsoluteFill style={{opacity: 1 - prog(f, T.chapterEnd - 14, T.chapterEnd - 2), transform: `scale(${scale})`, filter: `${blur > 0.05 ? `blur(${blur}px) ` : ''}brightness(${bright})`}}>
        <Chapter
          f={f}
          start={-8}
          end={T.chapterEnd}
          index="02 — CREATE"
          word="Create."
          sub="Turn ideas into something real."
          icon={<PenIcon size={176} draw={ease.inOut(prog(f, -6, 34))} glow={1 + glow} />}
        />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
