// OpenAI-compatible wire format (OpenAI, DeepSeek, xAI, Gemini /openai, OpenRouter, Ollama, LM Studio, ...).
import {costOf} from './cost.ts';
import {apiKey, baseUrl, requestJSON} from './ratelimit.ts';
import type {ChatMessage, Connection, Price, Provider, ToolDef, Usage} from '../types.ts';

function headers(c: Connection): Record<string, string> {
  const key = apiKey(c);
  return {'Content-Type': 'application/json', ...(key ? {Authorization: `Bearer ${key}`} : {}), ...c.headers};
}

// Usage-field differences: cached input is prompt_tokens_details.cached_tokens (OpenAI, xAI, Gemini) or
// prompt_cache_hit_tokens (DeepSeek); both are included in prompt_tokens. Some servers leave reasoning tokens out
// of completion_tokens but count them in total_tokens, so output = max(completion, total - prompt).
export function openaiUsage(u: any, price: Price | undefined, free: boolean | undefined): Usage {
  const inTokens = Number(u?.prompt_tokens) || 0;
  const outTokens = Math.max(Number(u?.completion_tokens) || 0, (Number(u?.total_tokens) || 0) - inTokens);
  const cachedInTokens = Math.max(Number(u?.prompt_tokens_details?.cached_tokens) || 0, Number(u?.prompt_cache_hit_tokens) || 0);
  return {inTokens, outTokens, cachedInTokens, costUSD: costOf({inTokens, outTokens, cachedInTokens}, price, free)};
}

export function openaiProvider(connection: Connection): Provider {
  return {
    connection,
    async chat(model: string, messages: ChatMessage[], tools: ToolDef[], price?: Price) {
      const body = JSON.stringify({model, messages, ...(tools.length ? {tools: tools.map((t) => ({type: 'function', function: t}))} : {})});
      const {json, slot} = await requestJSON(connection, `${baseUrl(connection)}/chat/completions`, {method: 'POST', headers: headers(connection), body}, body.length / 4);
      const message = json?.choices?.[0]?.message as ChatMessage | undefined;
      if (!message) throw new Error(`${connection.id}: response has no choices[0].message: ${JSON.stringify(json).slice(0, 500)}`);
      message.role ??= 'assistant';
      const usage = openaiUsage(json.usage, price, connection.free);
      slot.tokens = usage.inTokens + usage.outTokens;
      return {message, usage}; // message is passed back untouched (reasoning / thought fields included)
    },
    async listModels() {
      const {json} = await requestJSON(connection, `${baseUrl(connection)}/models`, {headers: headers(connection)});
      const items: any[] = json?.data ?? json?.models ?? [];
      return items.map((m) => String(m?.id ?? m?.name ?? m).replace(/^models\//, '')).sort();
    },
  };
}
