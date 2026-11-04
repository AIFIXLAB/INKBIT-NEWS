const LINKS = {
 "x": "https://x.com/InkbitApes",
 "apes": "https://opensea.io/collection/inkbit-apes",
 "cards": "https://opensea.io/collection/inkbit-press-cards",
 "world": "https://opensea.io/collection/inkbit-world",
 "pets": "https://opensea.io/collection/inkbit-pets",
 "zombies": "https://opensea.io/collection/inkbit-zombie-punks",
 "wild": "https://opensea.io/collection/inkbit-wild-ones",
 "brokers": "https://opensea.io/collection/inkbit-brokers",
 "fighter": "https://opensea.io/collection/inkbit-fighter",
 "neon": "https://opensea.io/collection/inkbit-neon-city",
 "ghost": "https://opensea.io/collection/inkbit-ghost-kingdom",
 "shinobi": "https://opensea.io/collection/inkbit-shinobi",
 "tides": "https://opensea.io/collection/inkbit-tides",
 "vote": "https://opensea.io/collection/election-night-434895798"
};
const DROPS = {
 "apes": {
  "label": "Mint closed"
 },
 "cards": {
  "label": "Minted out"
 },
 "world": {
  "label": "Revealed"
 },
 "pets": {
  "label": "Mint closed"
 },
 "zombies": {
  "label": "Minted out"
 },
 "wild": {
  "label": "Minted out"
 },
 "brokers": {
  "start": "2026-11-01T11:56:00+07:00",
  "end": "2026-11-06T11:56:00+07:00"
 },
 "fighter": {
  "label": "Revealed"
 },
 "neon": {
  "start": "2026-11-01T11:43:00+07:00",
  "end": "2026-11-04T11:43:00+07:00"
 },
 "ghost": {
  "start": "2026-10-30T20:00:00+07:00",
  "end": "2026-11-04T20:00:00+07:00"
 },
 "shinobi": {
  "label": "Minted out"
 },
 "tides": {
  "label": "Minted out"
 },
 "vote": {
  "start": "2026-11-04T18:25:00+07:00",
  "end": "2026-11-07T18:25:00+07:00"
 }
};
const EVENTS = [["2026-10-26T21:15:00+07:00", "Inkbit Pets mint opens", "Free \u00b7 5,983 pets registered"], ["2026-10-28T20:00:00+07:00", "Inkbit World mint opens", "Minted out overnight"], ["2026-10-29T08:00:00+07:00", "Inkbit World and Wild Ones are minted out", "Wild Ones reveal date to be announced"], ["2026-10-29T19:30:00+07:00", "The government of the Capital is sworn in", "Governor #1616"], ["2026-10-30T10:00:00+07:00", "Inkbit Fighter minted out and revealed", "Grand Champion #536"], ["2026-10-30T20:00:00+07:00", "The ghost parade begins", "Inkbit Ghost Kingdom"], ["2026-10-30T20:00:00+07:00", "The quarantine breaks", "Zombie Punks \u00b7 now minted out"], ["2026-11-02T16:54:00+07:00", "Inkbit Apes reprint closes", "167 printed"], ["2026-11-03T20:36:00+07:00", "The Ink Village opens its gate", "Inkbit Shinobi \u00b7 free \u00b7 10 per wallet"], ["2026-11-04T11:43:00+07:00", "Inkbit Neon City mint closes", "Free until then \u00b7 ranks revealed after mint"], ["2026-11-04T20:00:00+07:00", "The ghost parade ends", "Free until then \u00b7 ranks revealed after mint"], ["2026-11-05T20:36:00+07:00", "The Ink Village gate closes", "Ninja ranks revealed after mint"], ["2026-11-06T11:56:00+07:00", "Inkbit Brokers final round closes", "Ranks revealed after mint"], ["2026-11-03T21:00:00+07:00", "Inkbit Tides card packs open", "Minted out \u00b7 547 owners"], ["2026-11-04T18:25:00+07:00", "Election Night party opens", "Free \u00b7 10 per wallet \u00b7 4,444 supporters"], ["2026-11-07T18:25:00+07:00", "Election Night mint closes", "Revealed after mint"]];
const now = () => new Date();
const fmt = d => d.toLocaleString("en-GB",{timeZone:"Asia/Bangkok",day:"numeric",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit"});
const el = document.getElementById("today");
if (el) el.textContent = now().toLocaleDateString("en-GB",{timeZone:"Asia/Bangkok",weekday:"long",day:"numeric",month:"long",year:"numeric"});
document.querySelectorAll("[data-link]").forEach(a=>{
  const u = LINKS[a.dataset.link];
  if(u){ a.href = u; a.target = "_blank"; a.rel = "noopener"; }
  else { a.classList.add("off"); a.removeAttribute("href"); if(a.classList.contains("btn")) a.textContent = "OpenSea link soon"; }
});
function stateOf(k){
  const w = DROPS[k] || {}, t = now();
  if(w.label) return ["ended", w.label];
  if(!w.start) return ["soon","Coming soon"];
  const s = new Date(w.start), e = w.end ? new Date(w.end) : null;
  if(t < s) return ["next","Opens " + s.toLocaleString("en-GB",{timeZone:"Asia/Bangkok",day:"numeric",month:"short",hour:"2-digit",minute:"2-digit"})];
  if(!e || t < e) return ["live","Minting now"];
  return ["ended","Mint ended"];
}
const paint = () => document.querySelectorAll("[data-status]").forEach(s=>{ const [c,l]=stateOf(s.dataset.status); s.classList.remove("live","next","ended","soon"); s.classList.add(c); s.textContent=l; });
paint(); setInterval(paint, 30000);
const ev = document.getElementById("eventList");
if (ev) [...EVENTS].sort((x,y)=>(x[0]?new Date(x[0]):Infinity)-(y[0]?new Date(y[0]):Infinity)).forEach(([d,t,s])=>{
  const li = document.createElement("li"); const dd = d ? new Date(d) : null, past = dd && dd < now();
  li.innerHTML = `<span class="d">${dd ? fmt(dd) : "TBA"}</span><span class="t"><b></b><small></small></span><span class="status ${past?"ended":(dd?"next":"soon")}">${past?"Done":(dd?"Upcoming":"Soon")}</span>`;
  li.querySelector("b").textContent = t; li.querySelector("small").textContent = s; ev.appendChild(li);
});
document.querySelectorAll("[data-countdown]").forEach(box=>{
  const k = box.dataset.countdown, w = DROPS[k], lab = document.getElementById("cdl-"+k);
  const tick = () => {
    const s = new Date(w.start), e = new Date(w.end), t = now(); let target = s, label = "Mint opens in";
    if(t >= s && t < e){ target = e; label = "Minting now · closes in"; }
    if(t >= e){ lab.textContent = "Mint closed · reveal soon"; box.querySelectorAll("b").forEach(b=>b.textContent="00"); return; }
    lab.textContent = label; let r = Math.max(0, target - t) / 1000; const p = n => String(Math.floor(n)).padStart(2,"0");
    const b = box.querySelectorAll("b"); b[0].textContent=p(r/86400); b[1].textContent=p(r%86400/3600); b[2].textContent=p(r%3600/60); b[3].textContent=p(r%60);
  };
  tick(); setInterval(tick, 1000);
});
