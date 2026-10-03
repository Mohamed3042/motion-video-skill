// Act 2 · Create (global 1440–2880, 24 s). Local frame 0 = act start; see ./timing.ts for the beat map.
// Camera shake is NOT applied here: the impacts export `shake` in EVENTS and the Reel shakes the whole frame.
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {C} from '../../brand';
import {useActFrame} from '../../frame';
import {Backdrop} from '../../kit';
import {ChapterScene} from './Chapter';
import {EditorScene} from './Editor';
import {KeysScene} from './Keys';
import {LibraryScene} from './Library';
import {MontageScene} from './Montage';
import {Supers} from './Supers';

export const Act: React.FC = () => {
  const f = useActFrame();
  return (
    <AbsoluteFill style={{background: C.stage, overflow: 'hidden'}}>
      <Backdrop f={f + 1440} />
      <ChapterScene f={f} />
      <MontageScene f={f} />
      <EditorScene f={f} />
      <LibraryScene f={f} />
      <KeysScene f={f} />
      <Supers f={f} />
    </AbsoluteFill>
  );
};
