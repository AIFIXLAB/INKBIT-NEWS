// Board storage. Uses Supabase when SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_SECRET_KEY) are set,
// otherwise falls back to Upstash Redis (KV_REST_API_URL / KV_REST_API_TOKEN). No npm packages needed.
const R = require('./_redis');

const SB_URL = (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '').replace(/\/$/, '');
const SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY || '';
const useSB = Boolean(SB_URL && SB_KEY);

async function sb(path, { method = 'GET', body, prefer, range } = {}) {
  const headers = { apikey: SB_KEY, 'Content-Type': 'application/json' };
  if (SB_KEY.startsWith('eyJ')) headers.Authorization = `Bearer ${SB_KEY}`;   // legacy JWT service_role key
  if (prefer) headers.Prefer = prefer;
  if (range) { headers['Range-Unit'] = 'items'; headers.Range = range; }
  const r = await fetch(`${SB_URL}/rest/v1/${path}`, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
  const t = await r.text();
  if (!r.ok) throw new Error(`supabase ${r.status}: ${t.slice(0, 200)}`);
  return t ? JSON.parse(t) : null;
}
async function sbAll(path) {          // page through results (Supabase returns max 1,000 rows per request)
  const out = [];
  for (let from = 0; ; from += 1000) {
    const rows = await sb(path, { range: `${from}-${from + 999}` });
    out.push(...rows); if (rows.length < 1000) return out;
  }
}
const toMsg = r => ({ id: r.id, t: r.created_at, name: r.name, text: r.text });

const supa = {
  kind: 'supabase',
  ready: () => true,
  async recent(n) { return (await sb(`board_messages?select=id,created_at,name,text&removed=eq.false&order=created_at.desc&limit=${n}`)).map(toMsg); },
  async rateLimit(who, secs) {
    const now = new Date();
    const hit = await sb(`board_ratelimit?select=until&who=eq.${encodeURIComponent(who)}`);
    if (hit.length && new Date(hit[0].until) > now) return false;
    await sb('board_ratelimit', { method: 'POST', prefer: 'resolution=merge-duplicates,return=minimal', body: { who, until: new Date(now.getTime() + secs * 1000).toISOString() } });
    return true;
  },
  async add(msg, who, day, line) {
    await sb('board_messages', { method: 'POST', prefer: 'return=minimal', body: { id: msg.id, created_at: msg.t, day, name: msg.name, text: msg.text, who } });
    await sb('board_log', { method: 'POST', prefer: 'return=minimal', body: { day, line } });
  },
  async days() { return (await sb('board_log_days?select=day,lines&order=day.desc')).map(r => ({ day: r.day, lines: r.lines })); },
  async dayLines(day) { return (await sbAll(`board_log?select=line&day=eq.${day}&order=id.asc`)).map(r => r.line); },
  async remove(id, day, time) {
    const hit = await sb(`board_messages?select=id,name,text&id=eq.${encodeURIComponent(id)}&removed=eq.false`);
    if (!hit.length) return false;
    await sb(`board_messages?id=eq.${encodeURIComponent(id)}`, { method: 'PATCH', prefer: 'return=minimal', body: { removed: true } });
    await sb('board_log', { method: 'POST', prefer: 'return=minimal', body: { day, line: `[${time}] (admin removed a message by ${hit[0].name}: "${hit[0].text}")` } });
    return true;
  },
};

const redis = {
  kind: 'upstash',
  ready: R.ready,
  async recent(n) { return (await R.cmd('LRANGE', 'board:recent', 0, n - 1)).map(x => JSON.parse(x)); },
  async rateLimit(who, secs) { return Boolean(await R.cmd('SET', `rl:${who}`, '1', 'EX', secs, 'NX')); },
  async add(msg, who, day, line) {
    await R.pipe([['LPUSH', 'board:recent', JSON.stringify(msg)], ['LTRIM', 'board:recent', 0, 299], ['RPUSH', `log:${day}`, line], ['SADD', 'log:days', day]]);
  },
  async days() {
    const days = ((await R.cmd('SMEMBERS', 'log:days')) || []).sort().reverse();
    const counts = days.length ? await R.pipe(days.map(d => ['LLEN', `log:${d}`])) : [];
    return days.map((d, i) => ({ day: d, lines: counts[i] }));
  },
  async dayLines(day) { return R.cmd('LRANGE', `log:${day}`, 0, -1); },
  async remove(id, day, time) {
    const all = await R.cmd('LRANGE', 'board:recent', 0, -1); const hit = all.find(x => JSON.parse(x).id === id);
    if (!hit) return false; const m = JSON.parse(hit);
    await R.pipe([['LREM', 'board:recent', 1, hit], ['RPUSH', `log:${day}`, `[${time}] (admin removed a message by ${m.name}: "${m.text}")`], ['SADD', 'log:days', day]]);
    return true;
  },
};

module.exports = { store: useSB ? supa : redis, bkk: R.bkk };
