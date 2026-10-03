// Product-art shards: measured crops (1x source px) of the concept screens' artwork.
// Plain TS (imported by scripts/mks/coldopen/shards.ts, which bakes public/mks/coldopen/*).
import type {ScreenId} from '../../screens.ts';

export type Rect = {x: number; y: number; w: number; h: number};
export type Shard = {name: string; screen: ScreenId; rect: Rect; hue: string};

// Explore (04) tile art — measured edges: columns x 303–711 / 729–1135 / 1152–1561,
// rows y 265–402 / 500–637 / 734–867. These nine land back in their tiles at the end of act 0.
export const TILE: Record<string, Rect> = {
  voice: {x: 303, y: 265, w: 409, h: 138},
  montage: {x: 729, y: 265, w: 407, h: 138},
  editor: {x: 1152, y: 265, w: 410, h: 138},
  tones: {x: 303, y: 500, w: 409, h: 138},
  macroforge: {x: 729, y: 500, w: 407, h: 138},
  reclaim: {x: 1152, y: 500, w: 410, h: 138},
  educate: {x: 303, y: 734, w: 409, h: 134},
  quotes: {x: 729, y: 734, w: 407, h: 134},
  flock: {x: 1152, y: 734, w: 410, h: 134},
};

export const SHARDS: Shard[] = [
  // the nine Explore tiles
  {name: 'x-voice', screen: '04-explore', rect: TILE.voice, hue: '#7BE3A5'},
  {name: 'x-montage', screen: '04-explore', rect: TILE.montage, hue: '#2FC7F2'},
  {name: 'x-editor', screen: '04-explore', rect: TILE.editor, hue: '#FF7A2E'},
  {name: 'x-tones', screen: '04-explore', rect: TILE.tones, hue: '#3F7BFF'},
  {name: 'x-macroforge', screen: '04-explore', rect: TILE.macroforge, hue: '#FFB43A'},
  {name: 'x-reclaim', screen: '04-explore', rect: TILE.reclaim, hue: '#C8CDD3'},
  {name: 'x-educate', screen: '04-explore', rect: TILE.educate, hue: '#8F6BFF'},
  {name: 'x-quotes', screen: '04-explore', rect: TILE.quotes, hue: '#39D98A'},
  {name: 'x-flock', screen: '04-explore', rect: TILE.flock, hue: '#3FA9FF'},
  // hero art (bigger, cleaner crops) for the passing word cards + extra products
  {name: 'h-voice', screen: '01-library-studio', rect: {x: 560, y: 209, w: 548, h: 253}, hue: '#7BE3A5'},
  {name: 'h-montage', screen: '03-library-focus', rect: {x: 742, y: 84, w: 836, h: 412}, hue: '#2FC7F2'},
  {name: 'h-editor', screen: '01-library-studio', rect: {x: 345, y: 533, w: 262, h: 150}, hue: '#FF7A2E'},
  {name: 'h-tones', screen: '01-library-studio', rect: {x: 663, y: 533, w: 262, h: 150}, hue: '#3F7BFF'},
  {name: 'h-charforge', screen: '01-library-studio', rect: {x: 980, y: 533, w: 263, h: 150}, hue: '#C9C4BC'},
  {name: 'h-macroforge', screen: '01-library-studio', rect: {x: 1298, y: 533, w: 263, h: 150}, hue: '#FFB43A'},
  {name: 'h-orbit', screen: '01-library-studio', rect: {x: 727, y: 819, w: 150, h: 106}, hue: '#8F6BFF'},
  {name: 'h-market', screen: '01-library-studio', rect: {x: 1151, y: 819, w: 160, h: 106}, hue: '#D8D8E0'},
];

// Pre-blurred copies: width of the baked image (px), sigma and padding as fractions of that width.
export const BLUR = [
  {width: 360, sigma: 0.025, pad: 0.08},
  {width: 180, sigma: 0.06, pad: 0.18},
  {width: 96, sigma: 0.14, pad: 0.4},
];
