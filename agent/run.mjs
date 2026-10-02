#!/usr/bin/env node
// Minimal coding-agent loop for any OpenAI-compatible chat API (DeepSeek, Grok/xAI, Gemini, OpenAI, OpenRouter…).
// It loads skills/motion-video/SKILL.md as the system prompt and gives the model four tools:
// run_command, read_file, write_file, view_image. Commands and file writes need your "y" unless you pass --yes.
//
//   node agent/run.mjs --provider deepseek "make a 20 second promo video for my app"
//   node agent/run.mjs --provider xai --yes "make a 30 second 9:16 launch reel for ..."
//   BASE_URL=https://my-gateway/v1 API_KEY=... MODEL=... node agent/run.mjs "..."
//
// Requires Node 18+. No dependencies.
import {mkdirSync, readFileSync, writeFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {dirname, extname, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import readline from 'node:readline/promises';

const PROVIDERS = {
  deepseek: {url: 'https://api.deepseek.com', key: 'DEEPSEEK_API_KEY', model: 'deepseek-flash'}, // V4.1-Flash; or deepseek-v4-pro
  xai: {url: 'https://api.x.ai/v1', key: 'XAI_API_KEY', model: 'grok-4.7'},
  gemini: {url: 'https://generativelanguage.googleapis.com/v1beta/openai', key: 'GEMINI_API_KEY', model: 'gemini-3.6-flash'},
  openai: {url: 'https://api.openai.com/v1', key: 'OPENAI_API_KEY', model: ''},
  openrouter: {url: 'https://openrouter.ai/api/v1', key: 'OPENROUTER_API_KEY', model: ''},
};

const argv = process.argv.slice(2);
const flag = (name) => {
  const i = argv.indexOf(name);
  if (i < 0) return undefined;
  argv.splice(i, 1);
  return true;
};
const opt = (name) => {
  const i = argv.indexOf(name);
  if (i < 0) return undefined;
  const v = argv[i + 1];
  argv.splice(i, 2);
  return v;
};
const YES = flag('--yes');
const NO_VISION = flag('--no-vision');
const providerName = opt('--provider') ?? process.env.PROVIDER ?? 'deepseek';
const p = PROVIDERS[providerName];
if (!p && !process.env.BASE_URL) throw new Error(`Unknown provider "${providerName}". Use one of: ${Object.keys(PROVIDERS).join(', ')} or set BASE_URL.`);
const BASE = (process.env.BASE_URL ?? p.url).replace(/\/+$/, '');
const KEY = process.env.API_KEY ?? (p && process.env[p.key]);
const MODEL = opt('--model') ?? process.env.MODEL ?? p?.model;
if (!KEY) throw new Error(`Set ${p ? p.key : 'API_KEY'} (your API key for ${providerName}).`);
if (!MODEL) throw new Error('Set --model or MODEL (this provider has no default model).');

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SHELL = process.env.AGENT_SHELL ?? (process.platform === 'win32' ? 'powershell.exe' : '/bin/bash');
const SKILL = readFileSync(resolve(ROOT, 'skills/motion-video/SKILL.md'), 'utf8');
const SYSTEM = `You are a coding agent working in a terminal on ${process.platform} (commands run in ${SHELL}).
The repository root is ${ROOT}; tool paths are relative to it unless absolute.
Follow the skill below exactly. Act with the tools instead of describing what you would do.
When you need the user's answer (e.g. the video length), ask and end your turn without tool calls.
${NO_VISION ? 'You cannot view images: verify with ffprobe/ffmpeg numbers and ask the user to look at stills.' : 'Use view_image to look at rendered stills before the final render.'}

<skill>
${SKILL}
</skill>`;

const TOOLS = [
  {name: 'run_command', description: 'Run a shell command. Returns exit code and output (tail).', params: {command: 'string', cwd: 'string?'}},
  {name: 'read_file', description: 'Read a UTF-8 text file.', params: {path: 'string'}},
  {name: 'write_file', description: 'Create or overwrite a text file (parent folders are created).', params: {path: 'string', content: 'string'}},
  {name: 'view_image', description: 'Look at a PNG/JPG image, e.g. a rendered still.', params: {path: 'string'}},
].map((t) => ({
  type: 'function',
  function: {
    name: t.name,
    description: t.description,
    parameters: {
      type: 'object',
      properties: Object.fromEntries(Object.keys(t.params).map((k) => [k, {type: 'string'}])),
      required: Object.entries(t.params).filter(([, v]) => !v.endsWith('?')).map(([k]) => k),
    },
  },
}));

const rl = process.stdin.isTTY ? readline.createInterface({input: process.stdin, output: process.stdout}) : null;
const confirm = async (what) => {
  if (YES) return true;
  if (!rl) return false;
  return /^y/i.test(await rl.question(`\n${what}\nAllow? [y/N] `));
};
const tail = (s, n = 20000) => (s.length > n ? `…(truncated)…\n${s.slice(-n)}` : s);
const abs = (pth) => resolve(ROOT, pth);

async function runTool(name, a, images) {
  try {
    if (name === 'run_command') {
      if (!(await confirm(`$ ${a.command}`))) return 'User declined to run this command.';
      const r = spawnSync(a.command, {cwd: a.cwd ? abs(a.cwd) : ROOT, shell: SHELL, encoding: 'utf8', timeout: 45 * 60_000, maxBuffer: 256 * 1024 * 1024});
      return tail(`exit ${r.status ?? r.signal}\n${r.stdout ?? ''}${r.stderr ?? ''}${r.error ? `\n${r.error.message}` : ''}`);
    }
    if (name === 'read_file') return tail(readFileSync(abs(a.path), 'utf8'), 100000);
    if (name === 'write_file') {
      if (!(await confirm(`write ${a.path} (${a.content.length} chars)`))) return 'User declined this write.';
      mkdirSync(dirname(abs(a.path)), {recursive: true});
      writeFileSync(abs(a.path), a.content);
      return `wrote ${a.path}`;
    }
    if (name === 'view_image') {
      if (NO_VISION) return 'Image viewing is disabled for this model.';
      const mime = extname(a.path).toLowerCase() === '.png' ? 'image/png' : 'image/jpeg';
      images.push({path: a.path, url: `data:${mime};base64,${readFileSync(abs(a.path)).toString('base64')}`});
      return 'The image is attached in the next message.';
    }
    return `Unknown tool ${name}`;
  } catch (e) {
    return `Error: ${e.message}`;
  }
}

async function chat(messages) {
  for (let attempt = 0; ; attempt++) {
    const res = await fetch(`${BASE}/chat/completions`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json', Authorization: `Bearer ${KEY}`},
      body: JSON.stringify({model: MODEL, messages, tools: TOOLS}),
    });
    if (res.ok) return (await res.json()).choices[0].message;
    const body = await res.text();
    if ((res.status === 429 || res.status >= 500) && attempt < 4) {
      await new Promise((r) => setTimeout(r, 2000 * 2 ** attempt));
      continue;
    }
    throw new Error(`API ${res.status}: ${body.slice(0, 1000)}`);
  }
}

const messages = [{role: 'system', content: SYSTEM}];
async function turn(text) {
  messages.push({role: 'user', content: text});
  for (let step = 0; step < 400; step++) {
    const msg = await chat(messages);
    messages.push(msg); // kept as returned (reasoning/thought fields included — some providers require them back)
    if (msg.content) console.log(`\n${typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content)}\n`);
    if (!msg.tool_calls?.length) return;
    const images = [];
    for (const call of msg.tool_calls) {
      let args = {};
      try {
        args = JSON.parse(call.function.arguments || '{}');
      } catch {}
      console.log(`· ${call.function.name} ${JSON.stringify(args).slice(0, 160)}`);
      messages.push({role: 'tool', tool_call_id: call.id, content: await runTool(call.function.name, args, images)});
    }
    if (images.length)
      messages.push({role: 'user', content: images.flatMap((im) => [{type: 'text', text: `Image: ${im.path}`}, {type: 'image_url', image_url: {url: im.url}}])});
  }
  console.log('Stopped after 400 steps.');
}

console.log(`motion-video agent · ${providerName} · ${MODEL}${YES ? ' · auto-approve' : ''}`);
const first = argv.join(' ').trim();
if (first) await turn(first);
if (rl) {
  for (;;) {
    const next = (await rl.question('\nyou › ')).trim();
    if (!next || next === 'exit') break;
    await turn(next);
  }
  rl.close();
}
