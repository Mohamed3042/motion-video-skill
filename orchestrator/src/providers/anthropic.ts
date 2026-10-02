// Anthropic-compatible wire format (Messages API: Claude, DeepSeek /anthropic, ...). Converts our OpenAI-shaped
// ChatMessage[] to Anthropic blocks and back. The original response blocks ride along on the returned message as
// `anthropic_content` and are sent back verbatim, so thinking blocks / signatures survive the round trip.
import {costOf} from './cost.ts';
import {apiKey, baseUrl, requestJSON} from './ratelimit.ts';
import type {ChatMessage, Connection, ContentPart, Price, Provider, ToolCall, ToolDef, Usage} from '../types.ts';

type Block = Record<string, unknown>;
type AMessage = {role: 'user' | 'assistant'; content: Block[]};

const MAX_TOKENS = 8192;

function headers(c: Connection): Record<string, string> {
  const key = apiKey(c);
  return {'Content-Type': 'application/json', 'anthropic-version': '2023-06-01', ...(key ? {'x-api-key': key} : {}), ...c.headers};
}

const textOf = (content: ChatMessage['content']): string =>
  typeof content === 'string' ? content : (content ?? []).map((p) => (p.type === 'text' ? p.text : '')).join('');

function partToBlock(p: ContentPart): Block | null {
  if (p.type === 'text') return p.text ? {type: 'text', text: p.text} : null;
  const m = /^data:([^;,]+);base64,(.*)$/s.exec(p.image_url.url);
  return m
    ? {type: 'image', source: {type: 'base64', media_type: m[1], data: m[2]}}
    : {type: 'image', source: {type: 'url', url: p.image_url.url}};
}

const blocksOf = (content: ChatMessage['content']): Block[] =>
  (typeof content === 'string' ? [{type: 'text', text: content} as ContentPart] : (content ?? [])).map(partToBlock).filter((b): b is Block => !!b && b.text !== '');

export function toAnthropic(messages: ChatMessage[]): {system?: string; messages: AMessage[]} {
  const system: string[] = [];
  const out: AMessage[] = [];
  for (const m of messages) {
    let am: AMessage;
    if (m.role === 'system') {
      system.push(textOf(m.content));
      continue;
    } else if (m.role === 'tool') {
      am = {role: 'user', content: [{type: 'tool_result', tool_use_id: m.tool_call_id, content: textOf(m.content) || '(empty)'}]};
    } else if (m.role === 'assistant') {
      const raw = m.anthropic_content;
      am = {
        role: 'assistant',
        content: Array.isArray(raw)
          ? (raw as Block[])
          : [
              ...blocksOf(m.content),
              ...(m.tool_calls ?? []).map((tc) => {
                let input: unknown = {};
                try {
                  input = JSON.parse(tc.function.arguments || '{}');
                } catch {}
                return {type: 'tool_use', id: tc.id, name: tc.function.name, input};
              }),
            ],
      };
    } else am = {role: 'user', content: blocksOf(m.content)};
    if (!am.content.length) continue;
    const prev = out.at(-1);
    if (prev?.role === am.role) prev.content.push(...am.content); // consecutive tool results (+ image follow-up) → one user turn
    else out.push(am);
  }
  return {...(system.length ? {system: system.join('\n\n')} : {}), messages: out};
}

export function fromAnthropic(json: any, price: Price | undefined, free: boolean | undefined): {message: ChatMessage; usage: Usage} {
  const blocks: any[] = Array.isArray(json?.content) ? json.content : [];
  const text = blocks.filter((b) => b.type === 'text').map((b) => b.text).join('');
  const tool_calls: ToolCall[] = blocks
    .filter((b) => b.type === 'tool_use')
    .map((b) => ({id: b.id, type: 'function', function: {name: b.name, arguments: JSON.stringify(b.input ?? {})}}));
  const message: ChatMessage = {role: 'assistant', content: text || null, ...(tool_calls.length ? {tool_calls} : {}), anthropic_content: blocks};
  // input_tokens EXCLUDES cache reads/writes here; normalize so inTokens includes them (like the OpenAI format).
  const u = json?.usage ?? {};
  const cachedInTokens = Number(u.cache_read_input_tokens) || 0;
  const inTokens = (Number(u.input_tokens) || 0) + cachedInTokens + (Number(u.cache_creation_input_tokens) || 0);
  const outTokens = Number(u.output_tokens) || 0;
  return {message, usage: {inTokens, outTokens, cachedInTokens, costUSD: costOf({inTokens, outTokens, cachedInTokens}, price, free)}};
}

export function anthropicProvider(connection: Connection): Provider {
  return {
    connection,
    async chat(model: string, messages: ChatMessage[], tools: ToolDef[], price?: Price) {
      const body = JSON.stringify({
        model,
        max_tokens: MAX_TOKENS,
        ...toAnthropic(messages),
        ...(tools.length ? {tools: tools.map((t) => ({name: t.name, description: t.description, input_schema: t.parameters}))} : {}),
      });
      const {json, slot} = await requestJSON(connection, `${baseUrl(connection)}/v1/messages`, {method: 'POST', headers: headers(connection), body}, body.length / 4);
      if (!Array.isArray(json?.content)) throw new Error(`${connection.id}: response has no content: ${JSON.stringify(json).slice(0, 500)}`);
      const r = fromAnthropic(json, price, connection.free);
      slot.tokens = r.usage.inTokens + r.usage.outTokens;
      return r;
    },
    async listModels() {
      const {json} = await requestJSON(connection, `${baseUrl(connection)}/v1/models?limit=1000`, {headers: headers(connection)});
      return ((json?.data ?? []) as any[]).map((m) => String(m.id)).sort();
    },
  };
}
