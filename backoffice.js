// Private back office: read and download the board's daily logs. Key is kept only in this browser tab.
(function () {
  const keyIn = document.getElementById('aKey'), out = document.getElementById('aOut'), status = document.getElementById('aStatus');
  let key = ''; try { key = sessionStorage.getItem('inkbit-admin') || ''; } catch (e) {}
  keyIn.value = key;
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const call = (q = '', opt = {}) => fetch('/api/admin' + q, { ...opt, headers: { 'x-admin-key': key, 'Content-Type': 'application/json' } });
  function save(name, text) {
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' })); a.download = name; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  }
  async function load() {
    status.textContent = 'Loading…';
    if (/[^\x20-\x7e]/.test(key)) { status.textContent = 'The key has non-English characters. Switch your keyboard to English (EN) and type it again.'; return; }
    let r, j;
    try {
      const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), 15000);
      r = await call('', { signal: ctl.signal }); clearTimeout(t);
      j = await r.json().catch(() => ({}));
    } catch (e) { status.textContent = 'Could not reach the server (' + (e.name === 'AbortError' ? 'timed out' : e.message) + '). Try again.'; return; }
    if (!r.ok) { status.textContent = (j.error || 'Error') + ' (code ' + r.status + ')'; out.innerHTML = ''; return; }
    if (!Array.isArray(j.days)) { status.textContent = 'Unexpected reply from the server. Redeploy the site and try again.'; return; }
    try { sessionStorage.setItem('inkbit-admin', key); } catch (e) {}
    status.textContent = `${j.days.length} day(s) of logs`;
    let h = '<h2>DAILY LOGS</h2><p><button data-all>Download every day (.txt)</button></p><table class="rank"><thead><tr><th>Day (GMT+7)</th><th>Lines</th><th></th></tr></thead><tbody>';
    for (const d of j.days) h += `<tr><td>${esc(d.day)}</td><td>${d.lines}</td><td><button data-view="${esc(d.day)}">View</button> <button data-dl="${esc(d.day)}">Download .txt</button></td></tr>`;
    h += '</tbody></table><pre id="aView" class="logview"></pre><h2>ON THE BOARD NOW</h2><ul class="board">';
    for (const m of j.recent) h += `<li><div class="bm-h"><b>${esc(m.name)}</b><time>${esc(new Date(m.t).toLocaleString('en-GB', { timeZone: 'Asia/Bangkok' }))}</time> <button data-del="${esc(m.id)}">Remove</button></div><p>${esc(m.text)}</p></li>`;
    out.innerHTML = h + '</ul>';
  }
  out.addEventListener('click', async e => {
    const b = e.target.closest('button'); if (!b) return;
    if (b.dataset.view || b.dataset.dl) {
      const day = b.dataset.view || b.dataset.dl; const t = await (await call('?day=' + day)).text();
      if (b.dataset.dl) save(`inkbit-board-${day}.txt`, t); else document.getElementById('aView').textContent = t;
    } else if (b.dataset.all !== undefined) {
      save('inkbit-board-all.txt', await (await call('?all=1')).text());
    } else if (b.dataset.del && confirm('Remove this message from the public board?')) {
      await call('', { method: 'POST', body: JSON.stringify({ del: b.dataset.del }) }); load();
    }
  });
  document.getElementById('aForm').addEventListener('submit', e => { e.preventDefault(); key = keyIn.value.trim(); load(); });
  if (key) load();
})();
