// Montage Pro Carbon Studio identity (product DESIGN.md v0.7.0) + one accent per world.
import {loadFont as loadInter} from '@remotion/google-fonts/Inter';
import {loadFont as loadMono} from '@remotion/google-fonts/JetBrainsMono';
import type {WorldId} from './timing';

// The product uses Segoe UI Variable (present on Windows render machines); Inter is the portable fallback.
const inter = loadInter('normal', {weights: ['400', '500', '600', '700', '800', '900'], subsets: ['latin']}).fontFamily;
export const FONT = `"Segoe UI Variable Display", "Segoe UI Variable", "Segoe UI", ${inter}, sans-serif`;
export const MONO = `${loadMono('normal', {weights: ['500', '700'], subsets: ['latin']}).fontFamily}, "Cascadia Mono", Consolas, monospace`;

export const C = {
  canvas: '#101211',
  panel: '#1b1f1d',
  raised: '#252b27',
  line: '#343b35',
  text: '#ebeae2',
  muted: '#a9b2a9',
  amber: '#edb654', // primary
  amberHover: '#f6c774',
  success: '#a5c9ad',
  error: '#ed9690',
  focus: '#f8ce81',
  onAmber: '#211a0e', // text on amber buttons
} as const;

export const ACCENT: Record<WorldId, string> = {
  ingest: '#d9c7a1',
  sync: '#edb654',
  review: '#8fc1d4',
  captions: '#f2efe6',
  handoff: '#f0a35e',
  sound: '#a5c9ad',
  picture: '#c79bf2',
  library: '#7fd1c7',
  editroom: '#ed9690',
  profile: '#f8ce81',
  anywhere: '#edb654',
};

export const RADIUS = {control: 6, dialog: 9};
export const W = 1920;
export const H = 1080;
export const SAFE = 72;
