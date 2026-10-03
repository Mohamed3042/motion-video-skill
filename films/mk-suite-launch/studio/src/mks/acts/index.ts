// Registry of the seven acts (owned by the integrator; act builders edit only their own folder).
import type {ActId, MksEvent} from '../timing';
import * as coldopen from './coldopen/Act';
import * as coldopenT from './coldopen/timing';
import * as reveal from './reveal/Act';
import * as revealT from './reveal/timing';
import * as create from './create/Act';
import * as createT from './create/timing';
import * as work from './work/Act';
import * as workT from './work/timing';
import * as grow from './grow/Act';
import * as growT from './grow/timing';
import * as yours from './yours/Act';
import * as yoursT from './yours/timing';
import * as finale from './finale/Act';
import * as finaleT from './finale/timing';

export const ACT_IMPL: Record<ActId, {Act: React.FC; EVENTS: MksEvent[]}> = {
  coldopen: {Act: coldopen.Act, ...coldopenT},
  reveal: {Act: reveal.Act, ...revealT},
  create: {Act: create.Act, ...createT},
  work: {Act: work.Act, ...workT},
  grow: {Act: grow.Act, ...growT},
  yours: {Act: yours.Act, ...yoursT},
  finale: {Act: finale.Act, ...finaleT},
};
