// The Montage Pro app window shared by world 10's last beat (Queue) and world 11 (Anywhere).
// It is a pure function of D = Anywhere-local frame (Profile passes f − 720), so both worlds draw identical pixels
// across the boundary: the UI tiles flip like mirrors into Arabic (RTL) while the timeline tile never flips and keeps
// running left → right; later the window reflows into the phone layout, then its tiles fly into the finale's 4×3 grid.
import React from 'react';
import {loadFont as loadKufi} from '@remotion/google-fonts/NotoKufiArabic';
import {C, FONT, MONO} from '../../brand';
import {mulberry32} from '../../timing';
import {CamPicture, clamp01, IconChevron, IconFile, IconSpark, lerp, mixN, mixRect, rgba, type Rect} from '../profile/kit';

const kufi = loadKufi('normal', {weights: ['400', '500', '600', '700'], subsets: ['arabic']}).fontFamily;
export const ARABIC = `${kufi}, "Segoe UI", sans-serif`;

// ---------- geometry (desk-relative px; the desk sits at DESK.x, DESK.y on screen) ----------
export const DESK = {x: 640, y: 170, w: 1200, h: 760};
export type TileId = 'top' | 'nav' | 'main' | 'side' | 'tl';
const IDS: TileId[] = ['top', 'nav', 'main', 'side', 'tl'];
const EN: Record<TileId, Rect> = {
  top: {x: 0, y: 0, w: 1200, h: 58},
  nav: {x: 0, y: 58, w: 1200, h: 46},
  main: {x: 24, y: 122, w: 740, h: 420},
  side: {x: 784, y: 122, w: 392, h: 420},
  tl: {x: 0, y: 560, w: 1200, h: 200},
};
const AR: Record<TileId, Rect> = Object.fromEntries(IDS.map((id) => [id, {...EN[id], x: DESK.w - EN[id].x - EN[id].w}])) as Record<TileId, Rect>;
// phone layout (mobile.css: header, 2-column camera grid, timeline, one scroller, bottom navigation)
const PH: Record<TileId, Rect> = {
  top: {x: 510, y: 6, w: 380, h: 54},
  side: {x: 522, y: 68, w: 356, h: 206},
  tl: {x: 510, y: 286, w: 380, h: 150},
  main: {x: 522, y: 448, w: 356, h: 228},
  nav: {x: 510, y: 688, w: 380, h: 64},
};
const BODY_DESK: Rect = {x: 0, y: 0, w: 1200, h: 760};
const BODY_PHONE: Rect = {x: 498, y: -8, w: 404, h: 776};
export const toScreen = (r: Rect): Rect => ({...r, x: r.x + DESK.x, y: r.y + DESK.y});

// finale 4×3 multicam grid (16:9 tiles, centred in 1920×1080), row-major cells 0…11
export const GRID = {cols: 4, rows: 3, w: 424, h: 238.5, gap: 20, x0: 82, y0: 162.25};
export const cell = (i: number): Rect => ({
  x: GRID.x0 + (i % 4) * (GRID.w + GRID.gap),
  y: GRID.y0 + Math.floor(i / 4) * (GRID.h + GRID.gap),
  w: GRID.w,
  h: GRID.h,
});
// which grid cell each desk piece lands in (chips take 0, 1, 4, 8; cams 3, 6, 7, 11)
export const EXIT_CELL: Record<TileId, number> = {top: 2, tl: 5, main: 9, nav: 10, side: -1};
export const CAM_CELL = [3, 6, 7, 11];

// ---------- timing (Anywhere-local frames) ----------
export const ENTER = -120; // Profile f600: the essential panel opens into the whole app
export const REFLOW: [number, number] = [195, 240];
const FLIP_START: Record<TileId, number> = {side: -30, top: -25, nav: -25, main: -20, tl: 0};
const ease3 = (u: number) => u * u * u;
// 0 → 1 mirror progress of a tile (lands for every tile exactly on D = 0)
export const flipU = (id: TileId, D: number) => (id === 'tl' ? 0 : clamp01((D - FLIP_START[id]) / -FLIP_START[id]));
export const reflowP = (D: number) => lerp(D, REFLOW[0], REFLOW[1], 0, 1, (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2));

// ---------- the timeline (never mirrored) ----------
const WIN = 15; // seconds visible in the timeline window
export const playFrac = (D: number) => 0.18 + (D + 120) / 60 / WIN;
export const timecode = (D: number) => {
  const fr = Math.max(0, Math.floor((130 + WIN * playFrac(D)) * 30));
  const p = (n: number) => String(n).padStart(2, '0');
  return `00:${p(Math.floor(fr / 1800) % 60)}:${p(Math.floor(fr / 30) % 60)}:${p(fr % 30)}`;
};
const TRACKS = [
  {name: 'CAM A', color: C.amber},
  {name: 'CAM B', color: '#8fc1d4'},
  {name: 'CAM C', color: '#a5c9ad'},
  {name: 'REC', color: C.focus},
];
const CLIPS = TRACKS.map((_, k) => {
  const r = mulberry32(1100 + k * 31);
  const out: {a: number; b: number; wave: number[]}[] = [];
  let t = r() * 0.05;
  while (t < 1) {
    const len = 0.22 + r() * 0.34;
    out.push({a: t, b: Math.min(1.02, t + len), wave: Array.from({length: 160}, (_, i) => (0.3 + 0.7 * r()) * (0.35 + 0.65 * Math.abs(Math.sin(i * 0.21 + k))))});
    t += len + 0.015 + r() * 0.05;
  }
  return out;
});

const Timeline: React.FC<{w: number; h: number; D: number; glint?: number}> = ({w, h, D, glint = 0}) => {
  const small = w < 600;
  const hw = small ? 58 : 92;
  const rowR = small ? 24 : 30; // readout row
  const rh = small ? 18 : 22; // ruler
  const tw = w - hw - 10;
  const top = rowR + rh;
  const th = (h - top - 8) / 4;
  const px = hw + playFrac(D) * tw;
  const sec0 = 130;
  return (
    <svg width={w} height={h} style={{position: 'absolute', inset: 0, direction: 'ltr'}}>
      <rect width={w} height={h} fill="#141715" />
      <line x1={0} y1={0.5} x2={w} y2={0.5} stroke={C.line} />
      {/* readout: running timecode, left to right */}
      <text x={12} y={rowR - 8} fontFamily={MONO} fontWeight={700} fontSize={small ? 13 : 15} fill={C.amber}>
        {timecode(D)}
      </text>
      <g transform={`translate(${small ? 112 : 136} ${rowR - 17})`} opacity={0.75}>
        <path d="M2 6h16M12 1.5l6 4.5-6 4.5" fill="none" stroke={C.muted} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
      </g>
      {/* ruler */}
      <rect x={hw} y={rowR} width={tw} height={rh} fill="#181c1a" />
      {Array.from({length: WIN + 1}, (_, s) => {
        const x = hw + (s / WIN) * tw;
        const lab = s % (small ? 5 : 3) === 0;
        const tt = sec0 + s;
        return (
          <g key={s}>
            <line x1={x} y1={rowR + rh} x2={x} y2={rowR + rh - (lab ? 9 : 5)} stroke={C.muted} strokeOpacity={0.6} />
            {lab && s < WIN ? (
              <text x={x + 4} y={rowR + rh - 8} fontFamily={MONO} fontSize={small ? 8.5 : 10} fill={C.muted} opacity={0.8}>
                {`00:${String(Math.floor(tt / 60)).padStart(2, '0')}:${String(tt % 60).padStart(2, '0')}`}
              </text>
            ) : null}
          </g>
        );
      })}
      {/* tracks */}
      {TRACKS.map((tr, k) => {
        const y = top + 4 + k * th;
        return (
          <g key={tr.name}>
            <rect x={0} y={y} width={hw - 4} height={th - 3} fill="#1b1f1d" />
            <text x={10} y={y + th / 2 + 3.5} fontFamily={MONO} fontWeight={700} fontSize={small ? 8.5 : 10.5} fill={C.muted}>
              {tr.name}
            </text>
            <svg x={hw} y={y} width={tw} height={th - 3}>
              {CLIPS[k].map((c, j) => {
                const x0 = c.a * tw;
                const cw = (c.b - c.a) * tw;
                const n = Math.max(4, Math.min(c.wave.length, Math.floor((cw - 6) / 3.2)));
                const pts = c.wave.slice(0, n).map((v, i) => `M${(x0 + 3 + ((i + 0.5) / n) * (cw - 6)).toFixed(1)} ${((th - 3) / 2 - (v * (th - 10)) / 2).toFixed(1)}v${(v * (th - 10)).toFixed(1)}`);
                return (
                  <g key={j}>
                    <rect x={x0} y={0} width={cw} height={th - 3} rx={3} fill={rgba(tr.color, 0.13)} stroke={rgba(tr.color, 0.42)} strokeWidth={1} />
                    <path d={pts.join('')} stroke={rgba(tr.color, 0.6)} strokeWidth={1.4} strokeLinecap="round" />
                  </g>
                );
              })}
            </svg>
          </g>
        );
      })}
      {/* glint when the mirror passes: the timeline is seen, and stays */}
      {glint > 0 ? <rect x={0} y={0} width={w} height={h} fill={C.amber} opacity={0.06 * glint} /> : null}
      {/* playhead */}
      <line x1={px} y1={rowR} x2={px} y2={h - 4} stroke={C.amber} strokeWidth={2} />
      <path d={`M${px - 6} ${rowR} h12 v6 l-6 6 l-6 -6z`} fill={C.amber} />
    </svg>
  );
};

// ---------- tile contents ----------
const Wordmark: React.FC<{ar: boolean; size: number}> = ({ar, size}) =>
  ar ? (
    <span style={{fontFamily: ARABIC, fontWeight: 600, fontSize: size * 1.12, color: C.text, whiteSpace: 'nowrap'}}>
      مونتاج <span style={{color: C.amber}}>برو</span>
    </span>
  ) : (
    <span style={{fontFamily: FONT, fontWeight: 450, fontSize: size, letterSpacing: '0.3em', color: C.text, whiteSpace: 'nowrap'}}>
      MONTAGE <span style={{color: C.amber}}>PRO</span>
    </span>
  );

const TopContent: React.FC<{ar: boolean; phone: boolean}> = ({ar, phone}) => (
  <div style={{position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', gap: 16, padding: phone ? '0 14px' : '0 22px', direction: ar ? 'rtl' : 'ltr', borderBottom: `1px solid ${C.line}`}}>
    <Wordmark ar={ar} size={phone ? 18 : 19} />
    <div style={{flex: 1}} />
    {ar ? (
      <span style={{width: 34, height: 34, borderRadius: 6, border: `1px solid ${rgba(C.amber, 0.55)}`, display: 'grid', placeItems: 'center'}}>
        <IconSpark size={18} color={C.amber} />
      </span>
    ) : (
      <span style={{display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px', borderRadius: 6, border: `1px solid ${rgba(C.amber, 0.55)}`, fontFamily: FONT, fontSize: 14, color: C.amber}}>
        <IconSpark size={16} color={C.amber} />
        Intelligence
      </span>
    )}
    {phone ? null : (
      <span style={{display: 'flex', alignItems: 'center', gap: 7, fontFamily: ar ? ARABIC : FONT, fontSize: 13, color: C.muted}}>
        <span style={{width: 7, height: 7, borderRadius: 4, background: C.success}} />
        {ar ? 'المحرّك جاهز' : 'Engine ready'}
      </span>
    )}
    <span style={{display: 'flex', alignItems: 'center', gap: 4, fontFamily: FONT, fontSize: 14, color: C.muted}}>
      {ar ? 'AR' : 'EN'}
      <IconChevron size={16} color={C.muted} />
    </span>
  </div>
);

const NAV_EN = ['Projects', 'Media', 'Studio', 'Queue', 'My profile'];
const NAV_AR = ['المشاريع', 'الوسائط', 'الاستوديو', 'المعالجة', 'ملفي'];
const NavContent: React.FC<{ar: boolean}> = ({ar}) => (
  <div style={{position: 'absolute', inset: 0, display: 'flex', alignItems: 'stretch', gap: 30, padding: '0 22px', direction: ar ? 'rtl' : 'ltr', borderBottom: `1px solid ${C.line}`}}>
    {(ar ? NAV_AR : NAV_EN).map((n, i) => (
      <span
        key={n}
        style={{
          display: 'flex',
          alignItems: 'center',
          fontFamily: ar ? ARABIC : FONT,
          fontSize: ar ? 14 : 15,
          color: i === 3 ? C.amber : C.muted,
          borderBottom: i === 3 ? `2px solid ${C.amber}` : '2px solid transparent',
        }}
      >
        {n}
      </span>
    ))}
  </div>
);

// phone bottom navigation icons
const NavIcon: React.FC<{i: number; color: string}> = ({i, color}) => {
  const p = {fill: 'none', stroke: color, strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const};
  return (
    <svg width={20} height={20} viewBox="0 0 24 24">
      {i === 0 ? <path d="M3.5 7.5v11h17v-9h-9l-2-2z" {...p} /> : null}
      {i === 1 ? (
        <g {...p}>
          <rect x={4} y={5} width={16} height={14} rx={1.5} />
          <path d="M4 16l5-5 4 4 3-3 4 4" />
        </g>
      ) : null}
      {i === 2 ? <path d="M5 10v4M8.5 7v10M12 4v16M15.5 7v10M19 10v4" {...p} /> : null}
      {i === 3 ? <path d="M9 6.5h11M9 12h11M9 17.5h11M4.5 6.5h.01M4.5 12h.01M4.5 17.5h.01" {...p} /> : null}
      {i === 4 ? <path d="M5 7h9M18 7h1M5 17h3M12 17h7M16 5v4M10 15v4" {...p} /> : null}
    </svg>
  );
};
const PhoneNav: React.FC = () => (
  <div style={{position: 'absolute', inset: 0, display: 'flex', direction: 'rtl', borderTop: `1px solid ${C.line}`, background: C.panel}}>
    {NAV_AR.map((n, i) => (
      <div key={n} style={{flex: 1, display: 'grid', placeItems: 'center', alignContent: 'center', gap: 3}}>
        <NavIcon i={i} color={i === 3 ? C.amber : C.muted} />
        <span style={{fontFamily: ARABIC, fontSize: 10.5, color: i === 3 ? C.amber : C.muted}}>{n}</span>
      </div>
    ))}
  </div>
);

// render queue jobs: progress is a function of D, shared by both worlds
export const JOB_DONE = -75; // Profile f645: Loudness Delivery completes (blip)
const jobs = (D: number) => {
  const p2 = clamp01(mixN(0.35, 1, (D + 120) / (JOB_DONE + 120)));
  const p3 = D < JOB_DONE ? 0 : clamp01((D - JOB_DONE) / 420);
  return [
    {file: 'Take 03.wav', en: 'Audio Repair', ar: 'إصلاح الصوت', p: 1, st: 'done' as const},
    {file: 'Episode 2.wav', en: 'Loudness Delivery', ar: 'جهارة التسليم', p: p2, st: p2 >= 1 ? ('done' as const) : ('run' as const)},
    {file: 'A012.mov', en: 'Proxy Preparation', ar: 'نسخ المونتاج', p: p3, st: p3 >= 1 ? ('done' as const) : p3 > 0 ? ('run' as const) : ('wait' as const)},
  ];
};
const STATUS = {
  done: {en: 'Completed', ar: 'مكتملة', c: C.success},
  run: {en: 'Processing', ar: 'قيد المعالجة', c: C.amber},
  wait: {en: 'Queued', ar: 'في الانتظار', c: C.muted},
};
const Bar: React.FC<{p: number; ar: boolean; w: number; color: string}> = ({p, ar, w, color}) => (
  <div style={{width: w, height: 6, borderRadius: 3, background: C.line, position: 'relative', overflow: 'hidden', flexShrink: 0}}>
    <div style={{position: 'absolute', top: 0, bottom: 0, [ar ? 'right' : 'left']: 0, width: `${p * 100}%`, background: color, borderRadius: 3}} />
  </div>
);
const Iso: React.FC<{children: React.ReactNode; style?: React.CSSProperties}> = ({children, style}) => (
  <span dir="ltr" style={{unicodeBidi: 'isolate', ...style}}>
    {children}
  </span>
);

const QueueDesk: React.FC<{ar: boolean; D: number}> = ({ar, D}) => {
  const js = jobs(D);
  const tf = ar ? ARABIC : FONT;
  const active = js.filter((j) => j.st !== 'done').length;
  return (
    <div style={{position: 'absolute', inset: 0, padding: '20px 22px', direction: ar ? 'rtl' : 'ltr', display: 'flex', flexDirection: 'column', gap: 14}}>
      <div style={{display: 'flex', alignItems: 'flex-end', gap: 14}}>
        <div style={{flex: 1}}>
          <div style={{fontFamily: tf, fontWeight: 600, fontSize: ar ? 24 : 26, color: C.text, letterSpacing: ar ? 0 : '-0.01em'}}>{ar ? 'قائمة المعالجة' : 'Render queue'}</div>
          <div style={{fontFamily: tf, fontSize: 13.5, color: C.muted, marginTop: 4}}>{ar ? '3 مهام على الكمبيوتر' : '3 jobs on your PC'}</div>
        </div>
        {[
          [ar ? 'الكل' : 'All', 3],
          [ar ? 'قيد المعالجة' : 'Active', active],
          [ar ? 'مكتملة' : 'Completed', 3 - active],
        ].map(([n, c], i) => (
          <span
            key={i}
            style={{
              fontFamily: tf,
              fontSize: 13,
              padding: '7px 14px',
              borderRadius: 6,
              background: i === 0 ? C.amber : C.raised,
              color: i === 0 ? C.onAmber : C.text,
              border: `1px solid ${i === 0 ? C.amber : C.line}`,
              display: 'flex',
              gap: 8,
            }}
          >
            {n}
            <Iso style={{fontFamily: MONO, opacity: 0.75}}>{c}</Iso>
          </span>
        ))}
      </div>
      <div style={{display: 'flex', fontFamily: tf, fontSize: 12, color: C.muted, padding: '6px 14px 0', borderTop: `1px solid ${C.line}`}}>
        <span style={{width: 236}}>{ar ? 'المصدر' : 'Source'}</span>
        <span style={{width: 176}}>{ar ? 'العملية' : 'Operation'}</span>
        <span style={{width: 120}}>{ar ? 'الحالة' : 'Status'}</span>
        <span>{ar ? 'التقدّم' : 'Progress'}</span>
      </div>
      {js.map((j) => {
        const s = STATUS[j.st];
        return (
          <div key={j.file} style={{display: 'flex', alignItems: 'center', height: 64, padding: '0 14px', borderRadius: 6, background: C.raised, border: `1px solid ${C.line}`}}>
            <span style={{width: 236, display: 'flex', alignItems: 'center', gap: 12}}>
              <span style={{width: 34, height: 34, borderRadius: 6, background: '#1e2320', border: `1px solid ${C.line}`, display: 'grid', placeItems: 'center'}}>
                <IconFile size={18} color={C.muted} />
              </span>
              <span>
                <Iso style={{display: 'block', fontFamily: FONT, fontWeight: 600, fontSize: 14, color: C.text}}>{j.file}</Iso>
                <span style={{fontFamily: tf, fontSize: 11, color: C.muted}}>{ar ? 'ملف مصدر واحد' : '1 source file'}</span>
              </span>
            </span>
            <span style={{width: 176, fontFamily: tf, fontWeight: 600, fontSize: 14, color: C.text}}>{ar ? j.ar : j.en}</span>
            <span style={{width: 120, display: 'flex', alignItems: 'center', gap: 8, fontFamily: tf, fontSize: 13, color: s.c}}>
              <span style={{width: 7, height: 7, borderRadius: 4, background: s.c}} />
              {ar ? s.ar : s.en}
            </span>
            <span style={{flex: 1, display: 'flex', alignItems: 'center', gap: 10}}>
              <Bar p={j.p} ar={ar} w={120} color={j.st === 'done' ? C.success : C.amber} />
              <Iso style={{fontFamily: MONO, fontSize: 12, color: C.muted, width: 40}}>{Math.round(j.p * 100)}%</Iso>
            </span>
          </div>
        );
      })}
    </div>
  );
};

const QueuePhone: React.FC<{D: number}> = ({D}) => {
  const js = jobs(D);
  return (
    <div style={{position: 'absolute', inset: 0, padding: '12px 12px', direction: 'rtl', display: 'flex', flexDirection: 'column', gap: 8}}>
      <div style={{display: 'flex', alignItems: 'baseline', gap: 10}}>
        <span style={{fontFamily: ARABIC, fontWeight: 600, fontSize: 18, color: C.text}}>قائمة المعالجة</span>
        <span style={{fontFamily: ARABIC, fontSize: 11, color: C.muted}}>3 مهام على الكمبيوتر</span>
      </div>
      {js.map((j) => {
        const s = STATUS[j.st];
        return (
          <div key={j.file} style={{padding: '8px 10px', borderRadius: 6, background: C.raised, border: `1px solid ${C.line}`, display: 'flex', flexDirection: 'column', gap: 6}}>
            <div style={{display: 'flex', alignItems: 'center', gap: 8}}>
              <span style={{fontFamily: ARABIC, fontWeight: 600, fontSize: 12.5, color: C.text}}>{j.ar}</span>
              <Iso style={{fontFamily: FONT, fontSize: 11, color: C.muted}}>{j.file}</Iso>
              <span style={{flex: 1}} />
              <span style={{display: 'flex', alignItems: 'center', gap: 5, fontFamily: ARABIC, fontSize: 10.5, color: s.c}}>
                <span style={{width: 6, height: 6, borderRadius: 3, background: s.c}} />
                {s.ar}
              </span>
            </div>
            <Bar p={j.p} ar w={310} color={j.st === 'done' ? C.success : C.amber} />
          </div>
        );
      })}
    </div>
  );
};

// camera cells inside the side tile (tile-relative), mirrored order in Arabic
const camCells = (w: number, h: number, ar: boolean, phone: number) => {
  const head = 34 * (1 - phone);
  const pad = 12 * (1 - phone);
  const gap = 8;
  const cw = (w - 2 * pad - gap) / 2;
  const ch = (h - head - pad * 2 - gap) / 2;
  return [0, 1, 2, 3].map((k) => {
    const col = ar ? 1 - (k % 2) : k % 2;
    return {x: pad + col * (cw + gap), y: head + pad + Math.floor(k / 2) * (ch + gap), w: cw, h: ch};
  });
};
const activeCam = (D: number) => Math.floor((D + 1200) / 60) % 4;
const Cam: React.FC<{r: Rect; k: number; D: number; active: boolean; alpha?: number}> = ({r, k, D, active, alpha = 1}) => (
  <div
    style={{
      position: 'absolute',
      left: r.x,
      top: r.y,
      width: r.w,
      height: r.h,
      borderRadius: 6,
      overflow: 'hidden',
      outline: active ? `2px solid ${C.amber}` : `1px solid ${C.line}`,
      outlineOffset: active ? -2 : -1,
      opacity: alpha,
    }}
  >
    <CamPicture w={r.w} h={r.h} variant={k} t={D + 2000} />
    <span style={{position: 'absolute', left: 7, top: 5, fontFamily: MONO, fontWeight: 700, fontSize: 10.5, color: active ? C.amber : C.text, opacity: 0.9}}>{`CAM ${'ABCD'[k]}`}</span>
  </div>
);

const SideContent: React.FC<{ar: boolean; w: number; h: number; D: number; phone: number; camsAlpha?: number}> = ({ar, w, h, D, phone, camsAlpha = 1}) => {
  const cells = camCells(w, h, ar, phone);
  return (
    <>
      <div
        style={{
          position: 'absolute',
          left: 14,
          right: 14,
          top: 9,
          display: 'flex',
          justifyContent: 'space-between',
          direction: ar ? 'rtl' : 'ltr',
          fontFamily: ar ? ARABIC : FONT,
          fontSize: 13,
          color: C.muted,
          opacity: 1 - phone * 2,
        }}
      >
        <span>{ar ? 'معاينة (تقريبية)' : 'Preview (approximate)'}</span>
        <span style={{fontFamily: MONO, fontSize: 11}}>2×2</span>
      </div>
      {cells.map((r, k) => (
        <Cam key={k} r={r} k={k} D={D} active={activeCam(D) === k} alpha={camsAlpha} />
      ))}
    </>
  );
};

const TopPhone: React.FC = () => (
  <div style={{position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', gap: 10, padding: '0 14px', direction: 'rtl', borderBottom: `1px solid ${C.line}`}}>
    <Wordmark ar size={18} />
    <div style={{flex: 1}} />
    <span style={{width: 32, height: 32, borderRadius: 6, border: `1px solid ${rgba(C.amber, 0.55)}`, display: 'grid', placeItems: 'center'}}>
      <IconSpark size={16} color={C.amber} />
    </span>
    <span style={{display: 'flex', alignItems: 'center', gap: 2, fontFamily: FONT, fontSize: 13, color: C.muted}}>
      AR
      <IconChevron size={14} color={C.muted} />
    </span>
  </div>
);

// ---------- the window ----------
export const Desk: React.FC<{D: number; exit?: number}> = ({D, exit = 0}) => {
  const enter = (k: number) => lerp(D, ENTER + k * 4, ENTER + 22 + k * 4);
  const r = reflowP(D);
  const body = mixRect(BODY_DESK, BODY_PHONE, r);
  const ex = clamp01(exit);
  const contentA = 1 - clamp01(ex * 1.6);
  const camsSeparate = ex > 0;
  // mirror axis glow: brightest when the tiles land
  const axis = D < -32 || D > 30 ? 0 : D <= 0 ? ((D + 32) / 32) ** 3 : Math.exp(-D / 6);
  return (
    <div style={{position: 'absolute', left: DESK.x, top: DESK.y, width: DESK.w, height: DESK.h}}>
      {/* warm room light behind the window (pre-blurred) */}
      <div style={{position: 'absolute', left: -300, top: -200, width: DESK.w + 600, height: DESK.h + 400, opacity: 0.9 * enter(0) * (1 - ex), background: `radial-gradient(closest-side, ${rgba(C.amber, 0.06)}, ${rgba(C.amber, 0)})`}} />
      {/* window body (desk → phone) */}
      <div
        style={{
          position: 'absolute',
          left: body.x,
          top: body.y,
          width: body.w,
          height: body.h,
          borderRadius: mixN(9, 46, r),
          background: '#121513',
          border: `${mixN(1, 2, r)}px solid ${r > 0.5 ? '#3d453f' : C.line}`,
          boxShadow: `0 40px 120px rgba(0,0,0,0.55)${r > 0 ? `, 0 0 0 ${8 * r}px #0c0e0d` : ''}`,
          opacity: enter(0) * (1 - ex),
          scale: String(mixN(0.97, 1, enter(0))),
        }}
      />
      {r > 0.6 ? (
        <div style={{position: 'absolute', left: 600 - 44, top: -2, width: 88, height: 16, borderRadius: 8, background: '#0a0b0b', opacity: clamp01((r - 0.6) / 0.4) * (1 - ex)}} />
      ) : null}
      {IDS.map((id, k) => {
        const u = flipU(id, D);
        const eu = ease3(u);
        const ang = 180 * eu;
        const ar = ang >= 90;
        const deskRect = mixRect(EN[id], AR[id], eu);
        const rect0 = mixRect(deskRect, PH[id], r);
        const target = id === 'side' ? rect0 : (() => {
          const c = cell(EXIT_CELL[id]);
          return {x: c.x - DESK.x, y: c.y - DESK.y, w: c.w, h: c.h};
        })();
        const rect = id === 'side' ? rect0 : mixRect(rect0, target, ex);
        const rot = ar ? ang - 180 : ang;
        const sheen = Math.sin((ang * Math.PI) / 180);
        const deskA = 1 - clamp01(r * 2.2);
        const phoneA = clamp01(r * 2.2 - 1.2);
        const panel = id === 'main' || id === 'side';
        const e = enter(k + 1);
        return (
          <div
            key={id}
            style={{
              position: 'absolute',
              left: rect.x,
              top: rect.y,
              width: rect.w,
              height: rect.h,
              transform: `perspective(1600px) rotateY(${-rot}deg)`,
              opacity: e * (id === 'side' ? 1 - ex : 1),
              translate: `0px ${(1 - e) * 16}px`,
            }}
          >
            <div
              style={{
                position: 'absolute',
                inset: 0,
                borderRadius: panel || ex > 0 ? mixN(6, 6, ex) : 0,
                background: ex > 0 && id !== 'side' ? `rgba(21,24,22,${ex})` : panel && (id !== 'side' || r < 1) ? (id === 'side' ? `rgba(27,31,29,${1 - r})` : C.panel) : 'transparent',
                border: panel || ex > 0 ? `1px solid ${ex > 0 ? rgba(C.amber, 0.25 + 0.3 * ex) : id === 'side' ? rgba('#343b35', 1 - r) : C.line}` : undefined,
                overflow: 'hidden',
              }}
            >
              <div style={{position: 'absolute', inset: 0, opacity: contentA}}>
                {id === 'tl' ? <Timeline w={rect.w} h={rect.h} D={D} glint={axis} /> : null}
                {id === 'top' ? (
                  <>
                    {deskA > 0 ? (
                      <div style={{position: 'absolute', inset: 0, opacity: deskA}}>
                        <TopContent ar={ar} phone={false} />
                      </div>
                    ) : null}
                    {phoneA > 0 ? (
                      <div style={{position: 'absolute', inset: 0, opacity: phoneA}}>
                        <TopPhone />
                      </div>
                    ) : null}
                  </>
                ) : null}
                {id === 'nav' ? (
                  <>
                    {deskA > 0 ? (
                      <div style={{position: 'absolute', inset: 0, opacity: deskA}}>
                        <NavContent ar={ar} />
                      </div>
                    ) : null}
                    {phoneA > 0 ? (
                      <div style={{position: 'absolute', inset: 0, opacity: phoneA}}>
                        <PhoneNav />
                      </div>
                    ) : null}
                  </>
                ) : null}
                {id === 'main' ? (
                  <>
                    {deskA > 0 ? (
                      <div style={{position: 'absolute', inset: 0, opacity: deskA}}>
                        <QueueDesk ar={ar} D={D} />
                      </div>
                    ) : null}
                    {phoneA > 0 ? (
                      <div style={{position: 'absolute', inset: 0, opacity: phoneA}}>
                        <QueuePhone D={D} />
                      </div>
                    ) : null}
                  </>
                ) : null}
              </div>
              {id === 'side' ? <SideContent ar={ar} w={rect.w} h={rect.h} D={D} phone={r} camsAlpha={camsSeparate ? 0 : 1} /> : null}
              {sheen > 0.01 ? <div style={{position: 'absolute', inset: 0, background: `linear-gradient(${ar ? 250 : 110}deg, rgba(255,255,255,0) 20%, rgba(248,206,129,${0.22 * sheen}) 50%, rgba(255,255,255,0) 80%)`}} /> : null}
            </div>
          </div>
        );
      })}
      {/* exit: each camera flies to its own grid cell */}
      {camsSeparate
        ? (() => {
            const side = mixRect(mixRect(EN.side, AR.side, 1), PH.side, r);
            return camCells(side.w, side.h, true, r).map((c, k) => {
              const from = {x: side.x + c.x, y: side.y + c.y, w: c.w, h: c.h};
              const t = cell(CAM_CELL[k]);
              const to = {x: t.x - DESK.x, y: t.y - DESK.y, w: t.w, h: t.h};
              return <Cam key={k} r={mixRect(from, to, ex)} k={k} D={D} active={k === 3 ? ex > 0.5 : activeCam(D) === k && ex < 0.5} />;
            });
          })()
        : null}
      {/* the mirror axis */}
      {axis > 0.01 ? (
        <div
          style={{
            position: 'absolute',
            left: 600 - 60,
            top: -30,
            width: 120,
            height: DESK.h + 60,
            background: `linear-gradient(90deg, rgba(237,182,84,0) 0%, rgba(237,182,84,${0.16 * axis}) 46%, rgba(255,240,205,${0.9 * axis}) 50%, rgba(237,182,84,${0.16 * axis}) 54%, rgba(237,182,84,0) 100%)`,
            opacity: 1 - r,
          }}
        />
      ) : null}
    </div>
  );
};
