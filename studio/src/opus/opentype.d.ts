declare module 'opentype.js' {
  export interface PathCommand {
    type: 'M' | 'L' | 'Q' | 'C' | 'Z';
    x: number;
    y: number;
    x1: number;
    y1: number;
    x2: number;
    y2: number;
  }
  export interface Path {
    commands: PathCommand[];
  }
  export interface Glyph {
    index: number;
    name: string;
    unicode?: number;
    advanceWidth: number;
    getPath(x: number, y: number, fontSize: number): Path;
  }
  export interface Font {
    unitsPerEm: number;
    charToGlyph(c: string): Glyph;
    getAdvanceWidth(text: string, fontSize: number, options?: object): number;
    forEachGlyph(
      text: string,
      x: number,
      y: number,
      fontSize: number,
      options: object | undefined,
      cb: (glyph: Glyph, x: number, y: number, fontSize: number) => void,
    ): number;
  }
  export function parse(buffer: ArrayBuffer): Font;
  const opentype: {parse: typeof parse};
  export default opentype;
}
