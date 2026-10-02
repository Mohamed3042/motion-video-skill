# Independent source rebuild

Verified on 2026-10-02 on Windows with Node.js 24.11.1.

The source allowlist was copied into a new folder whose path contains spaces, without `.git`, `node_modules`, browser caches or orchestration state.

- `npm run setup`: fresh install passed; 338 packages installed.
- `npm run check`: TypeScript and all 53 impact/hit onset checks passed, within one frame.
- The standalone `studio/src/mk-suite-workflows/entry.ts` rendered `MkSuiteWorkflows` frame 3898 successfully.
- The rendered quotation result was inspected at original resolution. Arabic letters join correctly; the bilingual layout, matching totals and export state are readable.

This checks the independent source build and a representative frame. It is separate from the full master export checks in `PRODUCTION.md` and `VALIDATION.json`. Fonts and the Remotion browser downloaded as documented; this does not establish an offline build.
