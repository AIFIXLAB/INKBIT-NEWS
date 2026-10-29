// Inkbit News board (front end). Talks to /api/board.
(function () {
  const list = document.getElementById('boardList'), form = document.getElementById('boardForm');
  const nameIn = document.getElementById('bName'), textIn = document.getElementById('bText'), msg = document.getElementById('bMsg'), left = document.getElementById('bLeft');
  if (!list || !form) return;
  try { nameIn.value = localStorage.getItem('inkbit-board-name') || ''; } catch (e) {}
  const fmt = iso => new Date(iso).toLocaleString('en-GB', { timeZone: 'Asia/Bangkok', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  const hue = s => { let h = 0; for (const c of s) h = (h * 31 + c.charCodeAt(0)) % 360; return h; };
  let seen = '';
  function render(ms) {
    const key = ms.map(m => m.id).join();
    if (key === seen) return; seen = key;
    list.innerHTML = '';
    if (!ms.length) { list.innerHTML = '<li class="empty">No messages yet. Say hi to the Kingdom!</li>'; return; }
    for (const m of ms) {
      const li = document.createElement('li');
      li.innerHTML = '<div class="bm-h"><span class="dot"></span><b></b><time></time></div><p></p>';
      li.querySelector('.dot').style.background = `hsl(${hue(m.name)},55%,45%)`;
      li.querySelector('b').textContent = m.name; li.querySelector('time').textContent = fmt(m.t); li.querySelector('p').textContent = m.text;
      list.appendChild(li);
    }
  }
  async function load() {
    try {
      const r = await fetch('/api/board', { cache: 'no-store' }); const j = await r.json();
      if (!r.ok) throw new Error(j.error || 'offline');
      render(j.messages || []); form.classList.remove('off');
    } catch (e) {
      list.innerHTML = '<li class="empty">The board is resting right now. Please come back a little later.</li>'; form.classList.add('off');
    }
  }
  textIn.addEventListener('input', () => { left.textContent = 400 - textIn.value.length; });
  form.addEventListener('submit', async ev => {
    ev.preventDefault(); msg.textContent = ''; msg.className = 'bmsg';
    const body = { name: nameIn.value.trim(), text: textIn.value.trim(), website: form.website.value };
    const btn = form.querySelector('button'); btn.disabled = true;
    try {
      const r = await fetch('/api/board', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || 'Could not post');
      try { localStorage.setItem('inkbit-board-name', body.name); } catch (e) {}
      textIn.value = ''; left.textContent = '400'; msg.textContent = 'Posted!'; msg.className = 'bmsg ok'; seen = ''; load();
    } catch (e) { msg.textContent = e.message; msg.className = 'bmsg bad'; }
    btn.disabled = false;
  });
  load(); setInterval(load, 10000);
})();
