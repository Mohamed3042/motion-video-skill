// Job Engine Orbit identity (product source: web/src/OrbitDesign.css, web/DESIGN.md) + one accent per world.
import {loadFont} from '@remotion/google-fonts/SpaceGrotesk';
import {loadFont as loadArabic} from '@remotion/google-fonts/IBMPlexSansArabic';
import {loadFont as loadMono} from '@remotion/google-fonts/JetBrainsMono';
import type {WorldId} from './timing';

export const FONT = loadFont('normal', {weights: ['400', '500', '600', '700'], subsets: ['latin']}).fontFamily;
export const ARABIC = loadArabic('normal', {weights: ['400', '600', '700'], subsets: ['arabic']}).fontFamily;
export const MONO = loadMono('normal', {weights: ['500', '700'], subsets: ['latin']}).fontFamily;

export const C = {
  bg: '#071253',
  panel: '#0c1c58',
  raised: '#14265f',
  line: '#355287',
  ink: '#f3f7ff',
  muted: '#aec5ef',
  soft: '#8ba9db',
  cobalt: '#122ac2',
  cobaltHover: '#2345e0',
  coral: '#ff754d',
  sky: '#89b7ff',
  good: '#74e1ba',
  warning: '#ffca8a',
  red: '#ffa6b7',
  deep: '#040b36', // darker navy for space/backgrounds
} as const;

export const ACCENT: Record<WorldId, string> = {
  profile: '#ff754d',
  globe: '#89b7ff',
  findings: '#74e1ba',
  focus: '#f3f7ff',
  fit: '#ffca8a',
  nextproof: '#ffa6b7',
  market: '#6f8cff',
  employers: '#c9b6ff',
  engine: '#4d7cff',
  anywhere: '#5ee0e6',
};

export const W = 1920;
export const H = 1080;
export const SAFE = 72;
export const LOGO = 'orbit/brand/orbit-512.png'; // staticFile() path; never distort
