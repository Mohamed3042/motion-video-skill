import type {Price} from '../types.ts';

// USD for one usage record. inTokens INCLUDES cachedInTokens (providers normalize to that).
// free → 0; unknown price → 0 (callers detect "unknown" via price === undefined).
export function costOf(u: {inTokens: number; outTokens: number; cachedInTokens?: number}, price?: Price, free?: boolean): number {
  if (free || !price) return 0;
  const cached = Math.min(u.cachedInTokens ?? 0, u.inTokens);
  return ((u.inTokens - cached) * price.inPerM + cached * (price.cachedInPerM ?? price.inPerM) + u.outTokens * price.outPerM) / 1e6;
}
