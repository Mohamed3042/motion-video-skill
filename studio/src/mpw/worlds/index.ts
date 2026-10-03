// Registry of the eleven worlds (owned by the integrator; world builders edit only their own folder).
import type {WorldEvent, WorldId} from '../timing';
import * as ingest from './ingest/World';
import * as ingestT from './ingest/timing';
import * as sync from './sync/World';
import * as syncT from './sync/timing';
import * as review from './review/World';
import * as reviewT from './review/timing';
import * as captions from './captions/World';
import * as captionsT from './captions/timing';
import * as handoff from './handoff/World';
import * as handoffT from './handoff/timing';
import * as sound from './sound/World';
import * as soundT from './sound/timing';
import * as picture from './picture/World';
import * as pictureT from './picture/timing';
import * as library from './library/World';
import * as libraryT from './library/timing';
import * as editroom from './editroom/World';
import * as editroomT from './editroom/timing';
import * as profile from './profile/World';
import * as profileT from './profile/timing';
import * as anywhere from './anywhere/World';
import * as anywhereT from './anywhere/timing';

export const WORLD_IMPL: Record<WorldId, {World: React.FC; EVENTS: WorldEvent[]; HERO_FRAME: number}> = {
  ingest: {World: ingest.World, ...ingestT},
  sync: {World: sync.World, ...syncT},
  review: {World: review.World, ...reviewT},
  captions: {World: captions.World, ...captionsT},
  handoff: {World: handoff.World, ...handoffT},
  sound: {World: sound.World, ...soundT},
  picture: {World: picture.World, ...pictureT},
  library: {World: library.World, ...libraryT},
  editroom: {World: editroom.World, ...editroomT},
  profile: {World: profile.World, ...profileT},
  anywhere: {World: anywhere.World, ...anywhereT},
};
