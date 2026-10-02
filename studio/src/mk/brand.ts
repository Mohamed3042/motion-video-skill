// MK design system: tokens lifted from MK Suite web app /web/styles.css (+ product art in web/art/devices.png).
import {loadFont} from '@remotion/google-fonts/Inter';
import {loadFont as loadMono} from '@remotion/google-fonts/JetBrainsMono';

// The brand ships InterVariable (web/fonts) -> Inter from Google Fonts is an exact match.
export const FONT = loadFont('normal', {weights: ['400', '500', '600', '700', '800'], subsets: ['latin']}).fontFamily;
// Support face for timecodes / technical labels only.
export const MONO = loadMono('normal', {weights: ['500', '700'], subsets: ['latin']}).fontFamily;

export const C = {
  // light theme (:root)
  paper: '#faf9f7',
  surface: '#ffffff',
  rail: '#f1f0ee',
  raised: '#f5f5f4',
  soft: '#e9e9e8',
  ink: '#101319',
  sub: '#555f70',
  line: '#dddfe3',
  red: '#ed3f2b',
  redSoft: '#fff1ed',
  green: '#4aa721',
  // dark theme (:root[data-theme=dark])
  night: '#17181c',
  nightDeep: '#0c0d10',
  nightSurface: '#202227',
  nightRail: '#1b1d21',
  nightRaised: '#292c32',
  nightSoft: '#363941',
  nightInk: '#f3f4f6',
  nightSub: '#bac1ce',
  nightLine: '#3b3e46',
  nightRed: '#ff5541',
  nightGreen: '#84cf54',
} as const;

export type Hue = {deep: string; base: string; hue: string; glow: string};

// Product hues: voice/montage/editor/tones/macroforge/charforge sampled from the brand's product art;
// the rest extend the same deep->bright gradient recipe.
export const HUES: Record<string, Hue> = {
  voice: {deep: '#1a0936', base: '#41147f', hue: '#7a3cf0', glow: '#b58cff'},
  audiosync: {deep: '#012e37', base: '#017281', hue: '#02bcc7', glow: '#7ff3f7'},
  packaging: {deep: '#7f2003', base: '#cf5003', hue: '#f4903d', glow: '#ffc48a'},
  tones: {deep: '#5e3b00', base: '#b07510', hue: '#d79718', glow: '#ffd46b'},
  macroforge: {deep: '#0b3a8c', base: '#1668e8', hue: '#60a5fb', glow: '#b8d8ff'},
  charforge: {deep: '#6e1342', base: '#cf3a83', hue: '#f197c8', glow: '#ffd0e8'},
  reclaim: {deep: '#1f4d0c', base: '#3f8f1c', hue: '#84cf54', glow: '#c6f0a6'},
  career: {deep: '#1c2566', base: '#3446c7', hue: '#7f8cff', glow: '#c3c9ff'},
  marketplace: {deep: '#6b170e', base: '#d93422', hue: '#ff6b57', glow: '#ffb8ad'},
  bakery: {deep: '#5e1d37', base: '#b8466f', hue: '#f08fb0', glow: '#ffd3e1'},
  vertical: {deep: '#123842', base: '#2a6e83', hue: '#6fb7c9', glow: '#bfe6ef'},
  portfolio: {deep: '#1b1d22', base: '#3b3e46', hue: '#9aa3b2', glow: '#dfe3ea'},
  education: {deep: '#0b3f5e', base: '#1a85c2', hue: '#6cc6f5', glow: '#c4ecff'},
  quoteops: {deep: '#10234b', base: '#075cff', hue: '#7faeff', glow: '#cfe0ff'},
  automation: {deep: '#2f420b', base: '#668a17', hue: '#b5d65a', glow: '#e3f3b5'},
  flock: {deep: '#4f3215', base: '#9a6430', hue: '#e0b07a', glow: '#f6dcbc'},
  'business-os': {deep: '#101319', base: '#2b2e35', hue: '#ed3f2b', glow: '#ffb1a6'},
};

// Catalog facts used on screen (copied from catalog.json; families from web/suite.js FAMILIES).
export type Product = {id: string; name: string; short: string; family: 'create' | 'work' | 'grow'};
export const PRODUCTS: Product[] = [
  {id: 'voice', name: 'MK Voice', short: 'Voice', family: 'create'},
  {id: 'audiosync', name: 'Montage Pro', short: 'Montage', family: 'create'},
  {id: 'packaging', name: 'MK Editor', short: 'Editor', family: 'create'},
  {id: 'tones', name: 'MK Tones', short: 'Tones', family: 'create'},
  {id: 'charforge', name: 'CharForge Studio', short: 'CharForge', family: 'create'},
  {id: 'business-os', name: 'MK Business OS', short: 'Business OS', family: 'work'},
  {id: 'macroforge', name: 'MacroForge', short: 'MacroForge', family: 'work'},
  {id: 'reclaim', name: 'Reclaim', short: 'Reclaim', family: 'work'},
  {id: 'automation', name: 'Managed Workflows', short: 'Workflows', family: 'work'},
  {id: 'quoteops', name: 'Quotation Builder', short: 'Quotations', family: 'work'},
  {id: 'marketplace', name: 'MK Marketplace', short: 'Marketplace', family: 'work'},
  {id: 'vertical', name: 'Retail Ops Hub', short: 'Retail Ops', family: 'work'},
  {id: 'bakery', name: 'Cake Studio', short: 'Cake Studio', family: 'work'},
  {id: 'flock', name: 'Flock Operations', short: 'Flock', family: 'work'},
  {id: 'career', name: 'Job Engine / Orbit', short: 'Career', family: 'grow'},
  {id: 'portfolio', name: 'ask-repos', short: 'ask-repos', family: 'grow'},
  {id: 'education', name: 'MK Educate', short: 'Educate', family: 'grow'},
];
