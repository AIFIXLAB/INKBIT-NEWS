// Inkbit News board: GET = latest messages, POST = new message.
// Every message is also appended to a private daily log (log:YYYY-MM-DD) that only /api/admin can read.
const crypto = require('crypto');
const { store, bkk } = require('./_store');

const LINK = /(https?:\/\/|www\.|t\.me\/|discord\.gg|bit\.ly|\b[a-z0-9-]+\.(com|io|xyz|gg|me|net|org|app|link|site|top|club|online|live|co)\b)/i;
const RESERVED = /(admin|official|inkbit|moderator|\bmod\b|support|opensea|team)/i;
const clean = s => String(s || '').replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim();

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (!store.ready()) return res.status(503).json({ error: 'The board is not connected to storage yet.' });
  try {
    if (req.method === 'GET') {
      return res.status(200).json({ messages: await store.recent(100) });
    }
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const name = clean(body.name).slice(0, 24), text = clean(body.text);
    if (body.website) return res.status(200).json({ ok: true });           // honeypot: bots fill hidden field
    if (name.length < 2) return res.status(400).json({ error: 'Pick a name with at least 2 characters.' });
    if (RESERVED.test(name)) return res.status(400).json({ error: 'That name is reserved. Please pick another one.' });
    if (text.length < 1) return res.status(400).json({ error: 'Write something first.' });
    if (text.length > 400) return res.status(400).json({ error: 'Max 400 characters per message.' });
    if (LINK.test(text) || LINK.test(name)) return res.status(400).json({ error: 'Links are not allowed on the board (this keeps scam links out).' });

    const ip = String(req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '').split(',')[0].trim();
    const who = crypto.createHash('sha256').update(ip + (process.env.ADMIN_KEY || '')).digest('hex').slice(0, 12);
    const ok = await store.rateLimit(who, 8);
    if (!ok) return res.status(429).json({ error: 'Slow down a little: one message every few seconds.' });

    const now = new Date(), { day, time } = bkk(now);
    const msg = { id: now.getTime().toString(36) + crypto.randomBytes(3).toString('hex'), t: now.toISOString(), name, text };
    await store.add(msg, who, day, `[${time}] ${name} (#${who.slice(0, 6)}): ${text}`);
    return res.status(200).json({ ok: true, message: msg });
  } catch (e) {
    console.error('board', e);
    return res.status(500).json({ error: 'Board error, please try again.' });
  }
};
