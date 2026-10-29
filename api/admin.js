// Private back office for the board. Needs the ADMIN_KEY environment variable (set in Vercel, never in a file).
//   GET  (header x-admin-key)                 -> list of days with message counts
//   GET  ?day=YYYY-MM-DD                      -> that day's log as plain text
//   GET  ?all=1                               -> every day's log as one text file
//   POST {"del":"<message id>"}               -> remove a message from the public board (the log keeps a note)
const crypto = require('crypto');
const { ready, cmd, pipe, bkk } = require('./_redis');

function allowed(req) {
  const want = process.env.ADMIN_KEY || '', got = String(req.headers['x-admin-key'] || '');
  if (want.length < 8 || got.length !== want.length) return false;
  return crypto.timingSafeEqual(Buffer.from(got), Buffer.from(want));
}
async function dayText(day) {
  const lines = await cmd('LRANGE', `log:${day}`, 0, -1);
  return `INKBIT NEWS BOARD — ${day} (GMT+7) — ${lines.length} lines\n${'='.repeat(48)}\n${lines.join('\n')}\n`;
}

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Robots-Tag', 'noindex');
  if (!ready()) return res.status(503).json({ error: 'Storage not connected.' });
  if (!allowed(req)) return res.status(401).json({ error: 'Wrong key.' });
  try {
    const q = req.query || {};
    if (req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
      const all = await cmd('LRANGE', 'board:recent', 0, -1);
      const hit = all.find(x => JSON.parse(x).id === body.del);
      if (!hit) return res.status(404).json({ error: 'Message not found.' });
      const m = JSON.parse(hit), { day, time } = bkk();
      await pipe([['LREM', 'board:recent', 1, hit], ['RPUSH', `log:${day}`, `[${time}] (admin removed a message by ${m.name}: "${m.text}")`], ['SADD', 'log:days', day]]);
      return res.status(200).json({ ok: true });
    }
    if (q.day && /^\d{4}-\d{2}-\d{2}$/.test(q.day)) {
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      return res.status(200).send(await dayText(q.day));
    }
    const days = ((await cmd('SMEMBERS', 'log:days')) || []).sort();
    if (q.all) {
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      const parts = []; for (const d of days) parts.push(await dayText(d));
      return res.status(200).send(parts.join('\n'));
    }
    const counts = days.length ? await pipe(days.map(d => ['LLEN', `log:${d}`])) : [];
    const recent = (await cmd('LRANGE', 'board:recent', 0, 49)).map(x => JSON.parse(x));
    return res.status(200).json({ days: days.map((d, i) => ({ day: d, lines: counts[i] })).reverse(), recent });
  } catch (e) {
    return res.status(500).json({ error: 'Admin error.' });
  }
};
