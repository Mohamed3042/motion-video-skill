// Registry of all sections (owned by the integrator; builders edit only their own folders).
import type {SectionEvent, SectionId} from '../timing';
import * as chaos from './chaos/World';
import * as chaosT from './chaos/timing';
import * as turn from './turn/World';
import * as turnT from './turn/timing';
import * as profile from './profile/World';
import * as profileT from './profile/timing';
import * as globe from './globe/World';
import * as globeT from './globe/timing';
import * as findings from './findings/World';
import * as findingsT from './findings/timing';
import * as focus from './focus/World';
import * as focusT from './focus/timing';
import * as fit from './fit/World';
import * as fitT from './fit/timing';
import * as nextproof from './nextproof/World';
import * as nextproofT from './nextproof/timing';
import * as market from './market/World';
import * as marketT from './market/timing';
import * as employers from './employers/World';
import * as employersT from './employers/timing';
import * as engine from './engine/World';
import * as engineT from './engine/timing';
import * as anywhere from './anywhere/World';
import * as anywhereT from './anywhere/timing';

export const SECTION_IMPL: Record<SectionId, {World: React.FC; EVENTS: SectionEvent[]; HERO_FRAME: number}> = {
  chaos: {World: chaos.World, ...chaosT},
  turn: {World: turn.World, ...turnT},
  profile: {World: profile.World, ...profileT},
  globe: {World: globe.World, ...globeT},
  findings: {World: findings.World, ...findingsT},
  focus: {World: focus.World, ...focusT},
  fit: {World: fit.World, ...fitT},
  nextproof: {World: nextproof.World, ...nextproofT},
  market: {World: market.World, ...marketT},
  employers: {World: employers.World, ...employersT},
  engine: {World: engine.World, ...engineT},
  anywhere: {World: anywhere.World, ...anywhereT},
};
