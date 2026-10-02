// Offline self-check for agent/run.mjs: a fake OpenAI-compatible server asks for one tool call,
// then checks the tool result came back and ends the turn. Run: node agent/selftest.mjs
import {createServer} from 'node:http';
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';

let calls = 0;
const server = createServer((req, res) => {
  let body = '';
  req.on('data', (c) => (body += c));
  req.on('end', () => {
    const {messages, tools} = JSON.parse(body);
    calls++;
    assert.equal(tools.length, 4);
    assert.match(messages[0].content, /name: motion-video/);
    const reply =
      calls === 1
        ? {role: 'assistant', content: null, tool_calls: [{id: 't1', type: 'function', function: {name: 'run_command', arguments: JSON.stringify({command: 'node -e "console.log(6*7)"'})}}]}
        : (assert.match(messages.at(-1).content, /exit 0\s+42/), {role: 'assistant', content: 'done-ok'});
    res.writeHead(200, {'Content-Type': 'application/json'});
    res.end(JSON.stringify({choices: [{message: reply}]}));
  });
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));

const child = spawn(process.execPath, [fileURLToPath(new URL('./run.mjs', import.meta.url)), '--yes', 'test'], {
  env: {...process.env, BASE_URL: `http://127.0.0.1:${server.address().port}`, API_KEY: 'x', MODEL: 'mock', PROVIDER: 'openai'},
  stdio: ['ignore', 'pipe', 'pipe'],
});
let out = '';
let err = '';
child.stdout.on('data', (d) => (out += d));
child.stderr.on('data', (d) => (err += d));
const code = await new Promise((r) => child.on('close', r));
server.close();

assert.equal(code, 0, err);
assert.match(out, /done-ok/);
assert.equal(calls, 2);
console.log('selftest ok');
