// MK Voice app identity (the MK Voice design notes) + one accent per world.
import {loadFont} from '@remotion/google-fonts/Inter';
import {loadFont as loadMono} from '@remotion/google-fonts/JetBrainsMono';
import type {WorldId} from './timing';

export const FONT = loadFont('normal', {weights: ['400', '500', '600', '700', '800', '900'], subsets: ['latin']}).fontFamily;
export const MONO = loadMono('normal', {weights: ['500', '700'], subsets: ['latin']}).fontFamily;

export const C = {
  bg: '#121212',
  black: '#000000',
  surface: '#181818',
  control: '#242424',
  selection: '#2a2a2a',
  fg: '#ffffff',
  sub: '#b3b3b3',
  divider: '#333333',
  green: '#1ED760',
} as const;

export const ACCENT: Record<WorldId, string> = {
  myvoice: '#FFB547',
  clonelab: '#4FE3FF',
  live: '#1ED760',
  tts: '#FF5FA2',
  training: '#FF7A2F',
  arcade: '#FFE14D',
  evolution: '#A77BFF',
  settings: '#E6E6E6',
  guide: '#2EE6A8',
};

export const W = 1920;
export const H = 1080;
export const SAFE = 72;
