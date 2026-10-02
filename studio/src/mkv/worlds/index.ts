// Registry of the nine worlds (owned by the integrator; world builders edit only their own folder).
import type {WorldEvent, WorldId} from '../timing';
import * as myvoice from './myvoice/World';
import * as myvoiceT from './myvoice/timing';
import * as clonelab from './clonelab/World';
import * as clonelabT from './clonelab/timing';
import * as live from './live/World';
import * as liveT from './live/timing';
import * as tts from './tts/World';
import * as ttsT from './tts/timing';
import * as training from './training/World';
import * as trainingT from './training/timing';
import * as arcade from './arcade/World';
import * as arcadeT from './arcade/timing';
import * as evolution from './evolution/World';
import * as evolutionT from './evolution/timing';
import * as settings from './settings/World';
import * as settingsT from './settings/timing';
import * as guide from './guide/World';
import * as guideT from './guide/timing';

export const WORLD_IMPL: Record<WorldId, {World: React.FC; EVENTS: WorldEvent[]; HERO_FRAME: number}> = {
  myvoice: {World: myvoice.World, ...myvoiceT},
  clonelab: {World: clonelab.World, ...clonelabT},
  live: {World: live.World, ...liveT},
  tts: {World: tts.World, ...ttsT},
  training: {World: training.World, ...trainingT},
  arcade: {World: arcade.World, ...arcadeT},
  evolution: {World: evolution.World, ...evolutionT},
  settings: {World: settings.World, ...settingsT},
  guide: {World: guide.World, ...guideT},
};
