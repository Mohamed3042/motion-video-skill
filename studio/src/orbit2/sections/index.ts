// Registry of all sections (owned by the integrator; builders edit only their own folders).
// v2: each section has a CSS-3D `World` (LOCAL coords, inside <SectionSpace>), an optional WebGL `GL`
// (inside <SectionGL>), its sound EVENTS (local frames) and the HERO_FRAME the finale montage revisits.
import type React from 'react';
import type {SectionEvent, SectionId} from '../timing';
import * as chaos from './chaos/World';
import * as chaosG from './chaos/GL';
import * as chaosT from './chaos/timing';
import * as turn from './turn/World';
import * as turnG from './turn/GL';
import * as turnT from './turn/timing';
import * as profile from './profile/World';
import * as profileG from './profile/GL';
import * as profileT from './profile/timing';
import * as globe from './globe/World';
import * as globeG from './globe/GL';
import * as globeT from './globe/timing';
import * as findings from './findings/World';
import * as findingsG from './findings/GL';
import * as findingsT from './findings/timing';
import * as focus from './focus/World';
import * as focusG from './focus/GL';
import * as focusT from './focus/timing';
import * as fit from './fit/World';
import * as fitG from './fit/GL';
import * as fitT from './fit/timing';
import * as nextproof from './nextproof/World';
import * as nextproofG from './nextproof/GL';
import * as nextproofT from './nextproof/timing';
import * as market from './market/World';
import * as marketG from './market/GL';
import * as marketT from './market/timing';
import * as employers from './employers/World';
import * as employersG from './employers/GL';
import * as employersT from './employers/timing';
import * as engine from './engine/World';
import * as engineG from './engine/GL';
import * as engineT from './engine/timing';
import * as anywhere from './anywhere/World';
import * as anywhereG from './anywhere/GL';
import * as anywhereT from './anywhere/timing';

export type SectionImpl = {World: React.FC; GL: React.FC | null; EVENTS: SectionEvent[]; HERO_FRAME: number};

export const SECTION_IMPL: Record<SectionId, SectionImpl> = {
  chaos: {World: chaos.World, GL: chaosG.GL, ...chaosT},
  turn: {World: turn.World, GL: turnG.GL, ...turnT},
  profile: {World: profile.World, GL: profileG.GL, ...profileT},
  globe: {World: globe.World, GL: globeG.GL, ...globeT},
  findings: {World: findings.World, GL: findingsG.GL, ...findingsT},
  focus: {World: focus.World, GL: focusG.GL, ...focusT},
  fit: {World: fit.World, GL: fitG.GL, ...fitT},
  nextproof: {World: nextproof.World, GL: nextproofG.GL, ...nextproofT},
  market: {World: market.World, GL: marketG.GL, ...marketT},
  employers: {World: employers.World, GL: employersG.GL, ...employersT},
  engine: {World: engine.World, GL: engineG.GL, ...engineT},
  anywhere: {World: anywhere.World, GL: anywhereG.GL, ...anywhereT},
};
