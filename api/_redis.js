// Tiny Upstash Redis REST client (no npm packages needed).
// Vercel → Storage → Upstash Redis adds KV_REST_API_URL / KV_REST_API_TOKEN (or UPSTASH_REDIS_REST_*) automatically.
const URL_ = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

function ready() { return Boolean(URL_ && TOKEN); }

async function cmd(...args) {
  const r = await fetch(URL_, { method: 'POST', headers: { Authorization: `Bearer ${TOKEN}` }, body: JSON.stringify(args) });
  const j = await r.json();
  if (j.error) throw new Error(j.error);
  return j.result;
}

async function pipe(cmds) {
  const r = await fetch(URL_.replace(/\/$/, '') + '/pipeline', { method: 'POST', headers: { Authorization: `Bearer ${TOKEN}` }, body: JSON.stringify(cmds) });
  const j = await r.json();
  return j.map(x => { if (x.error) throw new Error(x.error); return x.result; });
}

// Date / time in Thailand (GMT+7)
function bkk(d = new Date()) {
  const t = new Date(d.getTime() + 7 * 3600e3).toISOString();
  return { day: t.slice(0, 10), time: t.slice(11, 19) };
}

module.exports = { ready, cmd, pipe, bkk };
