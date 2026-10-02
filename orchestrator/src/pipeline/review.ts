// Review: a vision model scores stills against a rubric and returns JSON {score, issues, mustFix}.
// Used for each job (reviewer role) and for the final review (director role).
import {readFileSync} from 'node:fs';
import path from 'node:path';
import {z} from 'zod';
import type {ChatMessage, Config, ContentPart, GateResult, RoleId, Usage} from '../types.ts';
import {resolveRole} from '../config.ts';
import {makeProvider} from '../providers/index.ts';
import {extractJson} from './plan.ts';
import {exec} from './exec.ts';

const Verdict = z.object({score: z.number().min(0).max(10), issues: z.array(z.string()).default([]), mustFix: z.array(z.string()).default([])});
export type Verdict = z.infer<typeof Verdict>;

// Downscale a still to a JPEG ≤ 960 px wide for the request (full-size PNGs are several MB of base64 each).
async function imagePart(png: string): Promise<ContentPart> {
  const jpg = png.replace(/\.png$/i, '.review.jpg');
  const r = await exec('ffmpeg', ['-v', 'error', '-y', '-i', png, '-vf', 'scale=min(960\\,iw):-2', '-q:v', '4', jpg], {cwd: path.dirname(png)});
  const [file, mime] = r.code === 0 ? [jpg, 'image/jpeg'] : [png, 'image/png'];
  return {type: 'image_url', image_url: {url: `data:${mime};base64,${readFileSync(file).toString('base64')}`}};
}

export type ReviewOutcome = {gate: GateResult; verdict?: Verdict; usage?: Usage; skipped?: string};

export async function review(o: {config: Config; role: RoleId; system: string; task: string; stills: string[]; minScore: number; requireVision?: boolean}): Promise<ReviewOutcome> {
  const skip = (why: string): ReviewOutcome => ({gate: {gate: 'review', ok: true, details: `skipped: ${why}`}, skipped: why});
  const r = resolveRole(o.config, o.role);
  if (r.kind === 'host') return skip(`${o.role} is the MCP host: look at the stills (get_stills) and approve`);
  const vision = r.info?.vision === true;
  if (!vision && o.requireVision !== false) return skip(`${r.connection.id}/${r.model} is not marked vision-capable, so it cannot look at stills`);
  if (vision && !o.stills.length) return skip('no stills to review');
  const provider = makeProvider(r.connection);
  const content: ContentPart[] = [{type: 'text', text: o.task}, ...(vision ? await Promise.all(o.stills.map(imagePart)) : [])];
  const messages: ChatMessage[] = [
    {role: 'system', content: o.system},
    {role: 'user', content},
  ];
  const usage: Usage = {inTokens: 0, outTokens: 0, cachedInTokens: 0, costUSD: 0};
  let last = '';
  for (let attempt = 0; attempt < 2; attempt++) {
    let res: Awaited<ReturnType<typeof provider.chat>>;
    try {
      res = await provider.chat(r.model, messages, [], r.info?.price);
    } catch (e) {
      return {...skip(`the ${o.role} request failed (${(e as Error).message.slice(0, 300)})`), usage};
    }
    usage.inTokens += res.usage.inTokens;
    usage.outTokens += res.usage.outTokens;
    usage.cachedInTokens = (usage.cachedInTokens ?? 0) + (res.usage.cachedInTokens ?? 0);
    usage.costUSD += res.usage.costUSD;
    const text = typeof res.message.content === 'string' ? res.message.content : (res.message.content ?? []).map((p) => (p.type === 'text' ? p.text : '')).join('');
    try {
      const v = Verdict.parse(extractJson(text));
      const ok = v.score >= o.minScore;
      return {
        verdict: v,
        usage,
        gate: {
          gate: 'review',
          ok,
          details: `score ${v.score}/10 (pass ≥ ${o.minScore})${v.issues.length ? `\nissues:\n${v.issues.map((i) => `- ${i}`).join('\n')}` : ''}${!ok && v.mustFix.length ? `\nmust fix:\n${v.mustFix.map((i) => `- ${i}`).join('\n')}` : ''}`,
          data: v,
        },
      };
    } catch (e) {
      last = `${(e as Error).message}: ${text.slice(0, 300)}`;
      messages.push(res.message, {role: 'user', content: 'Reply with ONLY the JSON object {"score": number, "issues": string[], "mustFix": string[]}.'});
    }
  }
  // a broken reviewer must not burn the builder's retries: report and pass through
  return {...skip(`the ${o.role} did not return a valid verdict (${last})`), usage};
}
