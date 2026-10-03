// Motion Orchestrator dashboard. Plain JS, no build step, no network beyond this server's /api.
'use strict';

const ROLES = ['director', 'builder', 'reviewer', 'escalation'];
const ROLE_HINT = {
  director: 'writes the plan, final review',
  builder: 'builds every segment (~85% of tokens)',
  reviewer: 'scores stills (needs vision)',
  escalation: 'retakes jobs that keep failing',
};
const COLUMNS = [
  ['queued', ['queued']],
  ['waiting-host', ['waiting-host']],
  ['building', ['building']],
  ['gates', ['gates']],
  ['review', ['review']],
  ['accepted', ['accepted']],
  ['retrying · escalated', ['retrying', 'escalated']],
  ['failed', ['failed', 'cancelled']],
];
const TERMINAL = ['done', 'failed', 'cancelled'];

const state = {config: null, models: {}, modelErrors: {}, run: null, es: null, openGate: '', refreshTimer: 0};
const $ = (sel, el = document) => el.querySelector(sel);
const DEMO = document.body.dataset.demo === 'true';
$('#demo-banner').hidden = !DEMO;

// Tiny DOM builder. Text always goes in as text (plans and logs come from models: never inject HTML).
function h(tag, props, ...kids) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(props || {})) {
    if (v === null || v === undefined || v === false) continue;
    if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
    else if (k === 'style') Object.assign(el.style, v);
    else if (k in el && k !== 'list') el[k] = v;
    else el.setAttribute(k, v);
  }
  for (const c of kids.flat()) if (c !== null && c !== undefined && c !== false) el.append(c instanceof Node ? c : String(c));
  return el;
}

// ── API ─────────────────────────────────────────────────────────────────────────────────────────
let token = '';
try { token = localStorage.getItem('mvo_token') || ''; } catch {}

async function api(op, input = {}) {
  const res = await fetch('/api/' + op, {
    method: 'POST',
    headers: {'content-type': 'application/json', ...(token ? {authorization: 'Bearer ' + token} : {})},
    body: JSON.stringify(input),
  });
  if (res.status === 401) {
    $('#token-bar').hidden = false;
    throw new Error('This server needs its MVO_TOKEN: enter it at the top right.');
  }
  const body = await res.json().catch(() => ({error: res.statusText}));
  if (!res.ok) throw new Error((body && body.error) || res.statusText);
  return body;
}
const fileUrl = (p) => '/api/file?path=' + encodeURIComponent(p);

$('#token-bar').addEventListener('submit', (e) => {
  e.preventDefault();
  token = $('#token').value.trim();
  try { localStorage.setItem('mvo_token', token); } catch {}
  // <img>, <video> and EventSource cannot send headers: the server also accepts this same-site cookie.
  document.cookie = 'mvo_token=' + encodeURIComponent(token) + '; path=/; SameSite=Strict';
  $('#token-bar').hidden = true;
  boot();
});

function toast(msg) {
  const t = $('#toast');
  t.textContent = msg;
  t.hidden = false;
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => (t.hidden = true), 6000);
}
const guard = (fn) => async (...a) => {
  try { await fn(...a); } catch (e) { toast(e.message); }
};

// ── formatting ──────────────────────────────────────────────────────────────────────────────────
const usd = (n) => (n === null || n === undefined ? '?' : n === 0 ? '$0' : '$' + n.toFixed(n < 1 ? 3 : 2));
const kTok = (n) => (n >= 1e6 ? (n / 1e6).toFixed(1) + 'M' : n >= 1e3 ? Math.round(n / 1e3) + 'k' : String(n));
const secs = (frames, fps) => (frames / fps).toFixed(1);
const splitRef = (a) => {
  if (!a || a === 'host') return ['host', ''];
  const i = a.indexOf('/');
  return i < 0 ? [a, ''] : [a.slice(0, i), a.slice(i + 1)];
};

function estimateTable(est, budget) {
  const rows = est.roles.map((r) =>
    h('tr', {},
      h('td', {}, r.role), h('td', {className: 'mono'}, r.assignee), h('td', {className: 'num'}, r.jobs),
      h('td', {className: 'num'}, kTok(r.inTokens) + ' / ' + kTok(r.outTokens)),
      h('td', {className: 'num'}, usd(r.costUSD)), h('td', {className: 'num'}, r.minutes + ' min')));
  const fit = est.withinBudget === null ? ['warn', 'needs every price'] : est.withinBudget ? ['ok', 'within budget'] : ['fail', 'over budget'];
  return h('div', {},
    h('table', {className: 'table'},
      h('thead', {}, h('tr', {}, ['Role', 'Assignee', 'Jobs', 'Tokens in / out', 'Cost', 'Time'].map((t) => h('th', {}, t)))),
      h('tbody', {}, rows),
      h('tfoot', {}, h('tr', {},
        h('td', {colSpan: 4}, 'Total', budget !== undefined ? h('span', {className: 'muted'}, ' · budget ' + usd(budget)) : null),
        h('td', {className: 'num'}, usd(est.totalUSD)), h('td', {className: 'num'}, '~' + est.totalMinutes + ' min')))),
    h('p', {}, h('span', {className: 'badge ' + fit[0]}, fit[1])),
    est.notes.length ? h('ul', {className: 'notes'}, est.notes.map((n) => h('li', {}, n))) : null);
}

// ── tabs ────────────────────────────────────────────────────────────────────────────────────────
function show(tab) {
  for (const s of document.querySelectorAll('.tab')) s.hidden = s.id !== tab;
  for (const b of document.querySelectorAll('nav button')) b.classList.toggle('active', b.dataset.tab === tab);
  if (location.hash !== '#' + tab) history.replaceState(null, '', '#' + tab);
  if (tab === 'runs') loadRuns();
  if (tab === 'setup') refreshEstimate();
}
for (const b of document.querySelectorAll('nav button')) b.addEventListener('click', () => show(b.dataset.tab));

// ── Setup ───────────────────────────────────────────────────────────────────────────────────────
const pendingRun = () => (state.run && state.run.status === 'awaiting-approval' ? state.run : null);

async function loadModels(conn) {
  const kind = state.config && state.config.connections[conn] && state.config.connections[conn].kind;
  if (!kind || kind === 'mcp-host' || state.models[conn] || state.modelErrors[conn]) return;
  try {
    state.models[conn] = await api('list_models', {connection: conn});
  } catch (e) {
    state.modelErrors[conn] = e.message;
  }
}

function roleRow(role) {
  const c = state.config;
  const assignment = c.roles[role];
  const [connId, model] = splitRef(assignment);
  const conn = c.connections[connId] || {};
  const isHost = assignment === 'host' || conn.kind === 'mcp-host';
  const ref = connId + '/' + model;
  const info = c.models[ref] || {};
  const known = Object.keys(c.models).filter((r) => r.startsWith(connId + '/')).map((r) => r.slice(connId.length + 1));
  const options = [...new Set([...(state.models[connId] || []), ...known])].filter((m) => m !== '?');
  const needsPrice = !isHost && !conn.free && model && model !== '?' && !info.price;

  const connSel = h('select', {'aria-label': role + ' connection', onchange: guard(async (e) => {
    const next = e.target.value;
    const nconn = c.connections[next];
    if (nconn.kind === 'mcp-host') return change({roles: {[role]: 'host'}});
    await loadModels(next);
    const first = (state.models[next] || [])[0] || Object.keys(c.models).find((r) => r.startsWith(next + '/'))?.slice(next.length + 1);
    await change({roles: {[role]: next + '/' + (first || '?')}});
  })}, Object.keys(c.connections).map((id) => h('option', {value: id, selected: id === connId}, id)));

  const modelIn = h('input', {
    value: model === '?' ? '' : model, list: 'dl-' + role, placeholder: 'pick or type a model id', hidden: isHost,
    'aria-label': role + ' model',
    onchange: guard((e) => change({roles: {[role]: connId + '/' + (e.target.value.trim() || '?')}})),
  });
  const price = (key, label) => h('label', {className: 'price'}, label,
    h('input', {type: 'number', min: 0, step: 0.01, 'data-k': key, placeholder: '0.00'}));
  const priceBox = needsPrice ? h('div', {className: 'price-set'}, price('inPerM', 'in $/1M'), price('outPerM', 'out $/1M'),
    h('button', {type: 'button', onclick: guard((e) => {
      const inputs = [...e.target.closest('.price-set').querySelectorAll('input')];
      if (inputs.some((i) => i.value === '' || !(Number(i.value) >= 0))) throw new Error('Enter both prices (USD per 1M tokens).');
      // set_roles replaces the whole model entry: keep its other fields
      return change({models: [{...info, ref, price: Object.fromEntries(inputs.map((i) => [i.dataset.k, Number(i.value)]))}]});
    })}, 'Set price')) : null;
  const visionBox = !isHost && model && model !== '?' && !info.vision ? h('label', {className: 'price'},
    h('input', {type: 'checkbox', onchange: guard(() => change({models: [{...info, ref, vision: true}]}))}), 'this model can see images') : null;

  const badges = [];
  if (isHost) badges.push(['host', 'HOST']);
  else if (conn.free) badges.push(['free', 'FREE']);
  else badges.push(['paid', info.price ? 'PAID ' + usd(info.price.inPerM) + '/' + usd(info.price.outPerM) : 'PAID · price?']);
  if (info.vision) badges.push(['vision', 'vision']);

  return h('div', {className: 'role'},
    h('div', {className: 'role-name'}, h('b', {}, role), h('span', {className: 'muted'}, ROLE_HINT[role])),
    h('div', {className: 'role-pick'}, connSel, modelIn, h('datalist', {id: 'dl-' + role}, options.map((m) => h('option', {value: m})))),
    h('div', {className: 'badges'}, badges.map(([k, t]) => h('span', {className: 'badge ' + k}, t))),
    priceBox || visionBox ? h('div', {className: 'prices'}, priceBox, visionBox) : null,
    conn.note && !isHost ? h('div', {className: 'role-note muted'}, connId + ': ' + conn.note) : null,
    state.modelErrors[connId] && !isHost ? h('div', {className: 'role-note'}, 'Model list unavailable: ' + state.modelErrors[connId]) : null);
}

function renderSetup() {
  const c = state.config;
  if (!c) return;
  $('#roles').replaceChildren(...ROLES.map(roleRow));
  if (document.activeElement !== $('#budget')) $('#budget').value = c.budgetUSD;
  for (const b of document.querySelectorAll('[data-preset]')) b.classList.toggle('active', b.dataset.preset === c.preset);
  $('#problems').replaceChildren(...(c.problems || []).map((p) => h('li', {}, p)));
}

async function change(input) {
  state.config = await api('set_roles', input);
  const run = pendingRun();
  if (run) state.run = {...run, config: await api('set_roles', {...input, runId: run.id})};
  await Promise.all(ROLES.map((r) => loadModels(splitRef(state.config.roles[r])[0])));
  renderSetup();
  refreshEstimate();
}

async function refreshEstimate() {
  const run = pendingRun();
  const seconds = Number($('#plan-form [name=seconds]').value) || 30;
  try {
    const est = await api('estimate_cost', run ? {runId: run.id} : {seconds});
    $('#est-basis').textContent = run
      ? 'For the planned run ' + run.id + ' (' + run.plan.segments.length + ' segments).'
      : 'Rough, before planning: a ' + seconds + ' s video (~' + Math.max(1, Math.round(seconds / 8)) + ' segments). Plan a video for the exact figure.';
    $('#setup-estimate').replaceChildren(estimateTable(est, state.config && state.config.budgetUSD));
    if (run) $('#plan-estimate').replaceChildren(estimateTable(est, state.config && state.config.budgetUSD));
  } catch (e) {
    $('#setup-estimate').replaceChildren(h('p', {className: 'muted'}, 'Estimate unavailable: ' + e.message));
  }
}

for (const b of document.querySelectorAll('[data-preset]')) b.addEventListener('click', guard(() => change({preset: b.dataset.preset})));
$('#budget').addEventListener('change', guard((e) => change({budgetUSD: Number(e.target.value) || 0})));
$('#plan-form [name=seconds]').addEventListener('change', () => refreshEstimate());

// ── New video ───────────────────────────────────────────────────────────────────────────────────
function renderPlan(run) {
  const p = run.plan;
  $('#plan-view').hidden = !p;
  if (!p) return;
  $('#plan-title').textContent = p.title;
  $('#plan-meta').textContent = p.seconds + ' s · ' + p.format + ' · ' + p.width + '×' + p.height + ' @ ' + p.fps + ' fps · ' + p.bpm + ' bpm · run ' + run.id;
  const total = p.seconds * p.fps;
  const block = (from, to, label, color, cls) => h('div', {
    className: 'block ' + (cls || ''), title: label + ' · ' + secs(from, p.fps) + '–' + secs(to, p.fps) + ' s',
    style: {width: ((to - from) / total) * 100 + '%', background: color || ''},
  }, h('span', {}, label));
  $('#timeline').replaceChildren(
    block(0, p.intro.endFrame, 'intro', null, 'frame'),
    ...p.segments.map((s) => block(s.startFrame, s.endFrame, s.name, s.accent)),
    block(p.outro.startFrame, total, 'outro', null, 'frame'));
  $('#segments').replaceChildren(...p.segments.map((s) =>
    h('li', {},
      h('div', {className: 'seg-head'}, h('span', {className: 'dot', style: {background: s.accent}}), h('b', {}, s.name),
        h('span', {className: 'muted'}, ' ' + secs(s.startFrame, p.fps) + '–' + secs(s.endFrame, p.fps) + ' s · ' + s.id)),
      h('p', {}, s.brief),
      h('p', {className: 'muted'}, '♪ ' + s.music))));
}

$('#plan-form').addEventListener('submit', guard(async (e) => {
  e.preventDefault();
  const fd = new FormData(e.target);
  const btn = $('button[type=submit]', e.target);
  btn.disabled = true;
  btn.textContent = 'Planning…';
  $('#plan-error').hidden = true;
  try {
    const run = await api('plan_video', {
      idea: fd.get('idea').trim(), seconds: Number(fd.get('seconds')), format: fd.get('format'),
      brandNotes: fd.get('brandNotes').trim() || undefined,
    });
    state.run = run;
    renderPlan(run);
    await refreshEstimate();
  } catch (err) {
    // Can be long (a "host" director gets the director's whole task back): show it in full, not as a toast.
    $('#plan-error').textContent = err.message;
    $('#plan-error').hidden = false;
  } finally {
    btn.disabled = false;
    btn.textContent = 'Plan';
  }
}));

$('#approve-start').addEventListener('click', guard(async () => {
  const run = pendingRun();
  if (!run) throw new Error('No planned run waiting for approval.');
  await api('approve', {runId: run.id, what: 'plan'}); // approving the plan starts the build
  openRun(run.id);
}));

// ── Run board ───────────────────────────────────────────────────────────────────────────────────
function jobCard(job, plan) {
  const seg = plan && plan.segments.find((s) => s.id === job.segmentId);
  const chips = job.gates.map((g) => {
    const key = job.id + ':' + g.gate;
    return h('button', {className: 'chip ' + (g.ok ? 'ok' : 'fail'), title: g.details, 'aria-expanded': String(state.openGate === key),
      onclick: () => { state.openGate = state.openGate === key ? '' : key; renderBoard(); }}, g.gate);
  });
  const open = job.gates.find((g) => state.openGate === job.id + ':' + g.gate);
  return h('article', {className: 'job', style: {borderTopColor: seg ? seg.accent : ''}},
    h('div', {className: 'job-title'}, h('b', {}, seg ? seg.name : job.kind), job.segmentId ? h('span', {className: 'muted'}, ' ' + job.segmentId) : null),
    h('div', {className: 'job-meta'},
      h('span', {className: 'mono'}, job.assignee), ' · #' + job.attempt,
      job.claimedBy ? ' · ' + job.claimedBy : '', ' · ' + usd(job.usage.costUSD)),
    chips.length ? h('div', {className: 'chips'}, chips) : null,
    open ? h('pre', {className: 'gate-details'}, open.details) : null,
    job.stills.length ? h('div', {className: 'stills'}, job.stills.map((p) =>
      h('a', {href: fileUrl(p), target: '_blank', rel: 'noopener'}, h('img', {src: fileUrl(p), alt: 'still', loading: 'lazy'})))) : null,
    job.log.length ? h('div', {className: 'job-log muted'}, job.log[job.log.length - 1]) : null);
}

function renderBoard() {
  const run = state.run;
  $('#board-empty').hidden = !!run;
  $('#board-view').hidden = !run;
  if (!run) return;
  $('#board-title').textContent = (run.plan && run.plan.title) || run.idea;
  $('#board-status').textContent = run.status;
  $('#board-status').className = 'pill ' + run.status;
  $('#board-id').textContent = run.id;
  const budget = run.budgetUSD !== undefined ? run.budgetUSD : run.config && run.config.budgetUSD;
  const pct = budget ? Math.min(100, (run.spentUSD / budget) * 100) : 0;
  $('#spend-fill').style.width = pct + '%';
  $('#spend-fill').className = pct >= 100 ? 'fail' : pct > 80 ? 'warn' : 'ok';
  $('#spend-text').textContent = 'spent ' + usd(run.spentUSD) + ' of ' + usd(budget);
  $('#approve-budget').hidden = run.status !== 'paused-budget';
  const awaitingFinal = typeof run.error === 'string' && run.error.startsWith('awaiting final approval');
  $('#approve-final').hidden = !awaitingFinal;
  $('#run-error').textContent = run.error || '';
  $('#run-error').hidden = !run.error;
  $('#cancel-run').hidden = TERMINAL.includes(run.status);
  $('#final-wrap').hidden = DEMO || !run.output;
  $('#demo-result').hidden = !DEMO || !run.output;
  if (!DEMO && run.output && $('#final').dataset.src !== run.output) {
    $('#final').dataset.src = run.output;
    $('#final').src = fileUrl(run.output);
  }
  $('#columns').replaceChildren(...COLUMNS.map(([name, statuses]) => {
    const jobs = run.jobs.filter((j) => statuses.includes(j.status));
    return h('div', {className: 'col'}, h('div', {className: 'col-head'}, name, h('span', {className: 'count'}, jobs.length)),
      jobs.map((j) => jobCard(j, run.plan)));
  }));
}

async function refreshRun() {
  if (!state.run) return;
  state.run = await api('run_status', {runId: state.run.id});
  renderBoard();
}
const scheduleRefresh = () => {
  clearTimeout(state.refreshTimer);
  state.refreshTimer = setTimeout(guard(refreshRun), 250);
};

function log(line) {
  const el = $('#log');
  el.textContent += line + '\n';
  const lines = el.textContent.split('\n');
  if (lines.length > 500) el.textContent = lines.slice(-500).join('\n');
  el.scrollTop = el.scrollHeight;
}

const openRun = guard(async (runId) => {
  state.run = await api('run_status', {runId});
  $('#log').textContent = '';
  if (state.es) state.es.close();
  state.es = new EventSource('/api/events?run=' + encodeURIComponent(runId));
  state.es.onmessage = (m) => {
    const e = JSON.parse(m.data);
    log(e.t.slice(11, 19) + '  ' + e.type.padEnd(5) + ' ' + e.message);
    scheduleRefresh();
  };
  renderBoard();
  show('board');
});
setInterval(() => { // fallback poll in case events were missed (e.g. after sleep)
  if (state.run && !$('#board').hidden && !TERMINAL.includes(state.run.status)) guard(refreshRun)();
}, 5000);

$('#cancel-run').addEventListener('click', guard(async () => {
  if (!confirm('Cancel this run? Unfinished jobs stop; accepted work stays.')) return;
  await api('cancel_run', {runId: state.run.id});
  await refreshRun();
}));
$('#approve-budget').addEventListener('click', guard(async () => {
  const run = state.run;
  const answer = prompt('Spent ' + usd(run.spentUSD) + ' of ' + usd(run.budgetUSD) + '. New budget in USD for this run:', String(Math.ceil(run.budgetUSD * 2)));
  if (answer === null) return;
  const budgetUSD = Number(answer);
  if (!(budgetUSD > run.spentUSD)) throw new Error('The new budget must be more than what is already spent.');
  await api('set_roles', {runId: run.id, budgetUSD});
  await api('approve', {runId: run.id, what: 'budget'});
  await refreshRun();
}));
$('#approve-final').addEventListener('click', guard(async () => {
  await api('approve', {runId: state.run.id, what: 'final'});
  await refreshRun();
}));

// ── Runs ────────────────────────────────────────────────────────────────────────────────────────
const loadRuns = guard(async () => {
  const runs = await api('list_runs');
  $('#runs-body').replaceChildren(...(runs.length ? runs.map((r) =>
    h('tr', {className: 'click', tabIndex: 0, onclick: () => openRun(r.id), onkeydown: (e) => e.key === 'Enter' && openRun(r.id)},
      h('td', {className: 'mono'}, r.id), h('td', {}, r.idea), h('td', {}, h('span', {className: 'pill ' + r.status}, r.status)),
      h('td', {className: 'num'}, usd(r.spentUSD)), h('td', {}, new Date(r.createdAt).toLocaleString()),
      h('td', {}, r.output ? DEMO ? 'simulated' : h('a', {href: fileUrl(r.output), target: '_blank', rel: 'noopener', onclick: (e) => e.stopPropagation()}, 'video') : '')))
    : [h('tr', {}, h('td', {colSpan: 6, className: 'muted'}, 'No runs yet.'))]));
});

// ── boot ────────────────────────────────────────────────────────────────────────────────────────
const boot = guard(async () => {
  state.config = await api('get_config');
  await Promise.all(ROLES.map((r) => loadModels(splitRef(state.config.roles[r])[0])));
  renderSetup();
  const tab = location.hash.slice(1);
  show(['setup', 'new', 'board', 'runs'].includes(tab) ? tab : 'setup');
});
boot();
