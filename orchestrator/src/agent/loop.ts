// Generic tool loop over any Provider: chat → run tool calls → feed results back, until finish / no tool calls.
import type {makeTools} from './tools.ts';
import type {ChatMessage, ContentPart, Price, Provider, Usage} from '../types.ts';

export async function runAgent(o: {
  provider: Provider;
  model: string;
  price?: Price;
  system: string;
  task: string;
  tools: ReturnType<typeof makeTools>;
  maxSteps?: number;
  onEvent?: (msg: string) => void;
  signal?: AbortSignal;
  budgetLeftUSD?: () => number; // budget left EXCLUDING this agent's spend; the loop subtracts its own running cost
}): Promise<{finalText: string; usage: Usage; steps: number; stoppedBy: 'finish' | 'no-tools' | 'max-steps' | 'budget' | 'aborted'}> {
  const messages: ChatMessage[] = [
    {role: 'system', content: o.system},
    {role: 'user', content: o.task},
  ];
  const usage: Usage = {inTokens: 0, outTokens: 0, cachedInTokens: 0, costUSD: 0};
  const maxSteps = o.maxSteps ?? 200;
  let finalText = '';
  let steps = 0;
  const done = (stoppedBy: 'finish' | 'no-tools' | 'max-steps' | 'budget' | 'aborted') => ({finalText, usage, steps, stoppedBy});

  while (steps < maxSteps) {
    if (o.signal?.aborted) return done('aborted');
    if (o.budgetLeftUSD && o.budgetLeftUSD() - usage.costUSD <= 0) {
      o.onEvent?.('stopped: budget reached');
      return done('budget');
    }
    const r = await o.provider.chat(o.model, messages, o.tools.defs, o.price);
    steps++;
    usage.inTokens += r.usage.inTokens;
    usage.outTokens += r.usage.outTokens;
    usage.cachedInTokens = (usage.cachedInTokens ?? 0) + (r.usage.cachedInTokens ?? 0);
    usage.costUSD += r.usage.costUSD;
    const msg = r.message;
    messages.push(msg);
    if (o.signal?.aborted) return done('aborted'); // don't run tools after a cancel
    const text = typeof msg.content === 'string' ? msg.content : (msg.content ?? []).map((p) => (p.type === 'text' ? p.text : '')).join('');
    if (text.trim()) {
      finalText = text;
      o.onEvent?.(text.length > 300 ? `${text.slice(0, 300)}…` : text);
    }
    if (!msg.tool_calls?.length) return done('no-tools');

    const images: ContentPart[] = [];
    let finished = false;
    for (const [i, call] of msg.tool_calls.entries()) {
      call.id ||= `call_${steps}_${i}`; // a few servers omit ids; the tool result must reference one
      const raw: unknown = call.function?.arguments;
      let args: any = {};
      let text: string;
      try {
        args = typeof raw === 'string' ? JSON.parse(raw || '{}') : (raw ?? {});
      } catch {
        args = undefined;
      }
      if (args === undefined) text = `Error: arguments for ${call.function?.name} are not valid JSON; send a JSON object.`;
      else {
        o.onEvent?.(`· ${call.function.name} ${JSON.stringify(args).slice(0, 160)}`);
        const res = await o.tools.run(call.function.name, args);
        text = res.text;
        if (res.images) images.push(...res.images);
        if (res.finished) {
          finished = true;
          finalText = res.text;
        }
      }
      messages.push({role: 'tool', tool_call_id: call.id, content: text});
    }
    if (finished) return done('finish');
    if (images.length) messages.push({role: 'user', content: images});
  }
  o.onEvent?.(`stopped: ${maxSteps} steps`);
  return done('max-steps');
}
