// MK Suite launcher identity (taken from the reimagined launcher concepts).
import {loadFont} from '@remotion/google-fonts/Inter';
import {loadFont as loadMono} from '@remotion/google-fonts/JetBrainsMono';

export const FONT = loadFont('normal', {weights: ['400', '500', '600', '700', '800', '900'], subsets: ['latin']}).fontFamily;
export const MONO = loadMono('normal', {weights: ['500', '700'], subsets: ['latin']}).fontFamily;

export const C = {
  stage: '#07090A', // the dark space the windows float in
  panel: '#121212',
  surface: '#181818',
  control: '#242424',
  line: '#2A2A2A',
  fg: '#FFFFFF',
  sub: '#B3B3B3',
  green: '#1ED760',
  greenDeep: '#0B3D22',
} as const;

// Product art hues (for glows, accents, shards' rim light).
export const PRODUCT_HUE: Record<string, string> = {
  voice: '#7BE3A5',
  montage: '#2FC7F2',
  editor: '#FF7A2E',
  tones: '#3F7BFF',
  charforge: '#C9C4BC',
  macroforge: '#FFB43A',
  reclaim: '#C8CDD3',
  orbit: '#8F6BFF',
  cake: '#FF5E8A',
  marketplace: '#D8D8E0',
  educate: '#39D98A',
  quotes: '#E6EDE8',
  flock: '#3FA9FF',
  businessos: '#1ED760',
};

export const W = 1920;
export const H = 1080;
export const SAFE = 80;
