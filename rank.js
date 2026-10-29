// Inkbit News rankings. Live data from /api/rank (OpenSea), otherwise the snapshot printed in the page.
(function () {
  const root = document.getElementById('rankLive'); if (!root) return;
  const short = a => a ? a.slice(0, 6) + '…' + a.slice(-4) : '—';
  const eth = (v, s = 'ETH') => v == null ? '—' : (v >= 1 ? v.toFixed(3) : v >= .01 ? v.toFixed(4) : v.toPrecision(2)) + ' ' + s;
  const pct = v => v == null ? '—' : (v >= 0 ? '+' : '') + (v * (Math.abs(v) <= 10 ? 100 : 1)).toFixed(1) + '%';
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const stamp = iso => new Date(iso).toLocaleString('en-GB', { timeZone: 'Asia/Bangkok', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  fetch('/api/rank').then(r => r.ok ? r.json() : Promise.reject()).then(d => {
    const cols = d.collections.slice().sort((a, b) => (b.volume_1d || 0) - (a.volume_1d || 0));
    let h = `<div class="sh"><h2>LIVE BOARD</h2><span>From OpenSea · updated ${esc(stamp(d.updated))} (GMT+7) · refreshes every 10 min</span></div>`;
    h += '<div class="tablewrap"><table class="rank"><thead><tr><th>#</th><th>Collection</th><th>Floor</th><th>24h volume</th><th>24h sales</th><th>Owners</th><th>Total volume</th></tr></thead><tbody>';
    cols.forEach((c, i) => { h += `<tr><td>${i + 1}</td><td><a href="${esc(c.key)}.html">${esc(c.name)}</a></td><td>${eth(c.floor, c.symbol)}</td><td>${eth(c.volume_1d)}</td><td>${c.sales_1d ?? '—'}</td><td>${c.owners ?? '—'}</td><td>${eth(c.volume)}</td></tr>`; });
    h += '</tbody></table></div>';
    h += '<div class="sh" style="margin-top:34px"><h2>HOTTEST SALES</h2><span>Highest recent sale prices across the Kingdom</span></div><div class="hot">';
    d.hot.forEach((s, i) => { h += `<a class="hotc" href="https://opensea.io/collection/${esc(d.collections.find(c => c.key === s.coll)?.slug || '')}" target="_blank" rel="noopener"><span class="no">${i + 1}</span>${s.image ? `<img src="${esc(s.image)}" alt="" loading="lazy">` : ''}<b>${esc(s.name)} #${esc(s.id)}</b><span>${eth(s.price, s.symbol)}</span></a>`; });
    if (!d.hot.length) h += '<p>No sales yet.</p>';
    h += '</div><div class="sh" style="margin-top:34px"><h2>TOP BUYERS</h2><span>Most purchases in recent sales · wallets shortened</span></div><div class="tablewrap"><table class="rank"><thead><tr><th>#</th><th>Wallet</th><th>Buys</th><th>Spent</th><th>Collections</th></tr></thead><tbody>';
    d.buyers.forEach((b, i) => { h += `<tr><td>${i + 1}</td><td><a href="https://opensea.io/${esc(b.address)}" target="_blank" rel="noopener">${esc(short(b.address))}</a></td><td>${b.buys}</td><td>${eth(b.spent)}</td><td>${esc(b.colls.join(', '))}</td></tr>`; });
    h += '</tbody></table></div><div class="sh" style="margin-top:34px"><h2>NO. 1 BUYER OF EACH COLLECTION</h2><span>Recent sales</span></div><div class="cols">';
    d.collections.forEach(c => { const b = (c.buyers || [])[0]; h += `<div class="col"><div><span class="tag">${esc(c.name)}</span><h4>${b ? `<a href="https://opensea.io/${esc(b.address)}" target="_blank" rel="noopener">${esc(short(b.address))}</a>` : 'No buyer yet'}</h4><p>${b ? `${b.buys} buys · ${eth(b.spent)}` : 'Waiting for the first sale'}${c.top_sale ? `<br>Top sale: #${esc(c.top_sale.id)} · ${eth(c.top_sale.price, c.top_sale.symbol)}` : ''}</p></div></div>`; });
    h += '</div>';
    root.innerHTML = h; document.getElementById('rankSnapNote')?.classList.add('muted');
  }).catch(() => { /* keep the printed snapshot */ });
})();
