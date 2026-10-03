// Registry of every section's camera module (owned by the integrator). Plain TS.
import type {CamId, ShotModule} from './engine/camera.ts';
import * as chaos from './sections/chaos/shot.ts';
import * as turn from './sections/turn/shot.ts';
import * as profile from './sections/profile/shot.ts';
import * as globe from './sections/globe/shot.ts';
import * as findings from './sections/findings/shot.ts';
import * as focus from './sections/focus/shot.ts';
import * as fit from './sections/fit/shot.ts';
import * as nextproof from './sections/nextproof/shot.ts';
import * as market from './sections/market/shot.ts';
import * as employers from './sections/employers/shot.ts';
import * as engine from './sections/engine/shot.ts';
import * as anywhere from './sections/anywhere/shot.ts';
import * as finale from './finale/shot.ts';

export const SHOTS: Record<CamId, ShotModule> = {chaos, turn, profile, globe, findings, focus, fit, nextproof, market, employers, engine, anywhere, finale};
