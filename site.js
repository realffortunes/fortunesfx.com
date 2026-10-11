/* FortunesFX Firm — shared page script
   Sections: nav, ticker tape, email capture, apply form, socials, motion.
   Each block checks for its elements, so every page can load the same file. */

// ---- nav -------------------------------------------------------------------
document.getElementById('year') && (document.getElementById('year').textContent = new Date().getFullYear());
const navToggle = document.querySelector('.nav-toggle'), navLinks = document.getElementById('nav-links');
if (navToggle && navLinks) {
  navToggle.addEventListener('click', () => { const o = navLinks.classList.toggle('open'); navToggle.setAttribute('aria-expanded', o); });
  navLinks.querySelectorAll('a').forEach(a => a.addEventListener('click', () => navLinks.classList.remove('open')));
}

// ---- floating glass nav: shows once the top bar has scrolled away ----------------
const floatNav = document.getElementById('float-nav'), topNav = document.querySelector('.nav');
if (floatNav && topNav) {
  const update = () => floatNav.classList.toggle('show', scrollY > topNav.offsetHeight + 40);
  addEventListener('scroll', update, { passive: true }); update();
  const here = location.pathname.split('/').pop() || 'index.html';
  floatNav.querySelectorAll('a').forEach(a => { if (a.getAttribute('href') === here) a.setAttribute('aria-current', 'page'); });
}

// ---- socials ---------------------------------------------------------------
// Fill in handles here. Entries without a url stay hidden.
const SOCIALS = [
  { key: 'instagram', name: 'Instagram', handle: '@fortunestrading', url: 'https://instagram.com/fortunestrading', featured: true, blurb: 'Daily charts, market notes, and the losses too.' },
  { key: 'x',         name: 'X',         handle: '@fortunestrading', url: 'https://x.com/fortunestrading' },
  { key: 'youtube',   name: 'YouTube',   handle: '@fortunestrading', url: 'https://youtube.com/@fortunestrading' },
  { key: 'tiktok',    name: 'TikTok',    handle: '',            url: '' },
  { key: 'linkedin',  name: 'LinkedIn',  handle: '',            url: '' },
  { key: 'telegram',  name: 'Telegram',  handle: '',            url: '' },
];
const ICON = {
  instagram: '<svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="5" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="17.3" cy="6.7" r="1.2" fill="currentColor"/></svg>',
  x: '<svg viewBox="0 0 24 24"><path d="M4 3h4.6l4.1 5.9L17.8 3H20l-6.3 7.4L20.5 21h-4.6l-4.4-6.3L6.1 21H4l6.6-7.7z" fill="currentColor"/></svg>',
  youtube: '<svg viewBox="0 0 24 24"><rect x="2.5" y="6" width="19" height="12" rx="4" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M10 9.5v5l4.5-2.5z" fill="currentColor"/></svg>',
  tiktok: '<svg viewBox="0 0 24 24"><path d="M14 3v10.5a3.5 3.5 0 1 1-3-3.46" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M14 3c.5 3 2.5 4.5 5 4.8" fill="none" stroke="currentColor" stroke-width="1.8"/></svg>',
  linkedin: '<svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="3" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M8 10v7M8 7v.5M12 17v-4a2 2 0 0 1 4 0v4M12 10v7" stroke="currentColor" stroke-width="1.8" fill="none"/></svg>',
  telegram: '<svg viewBox="0 0 24 24"><path d="M3 11l17-7-3 16-5-4-3 3v-4l8-7-10 6z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>',
};
const live = SOCIALS.filter(s => s.url);
const grid = document.getElementById('socials-grid');
if (grid) grid.innerHTML = live.map(s => `
  <a class="social ${s.featured ? 'featured' : ''}" href="${s.url}" target="_blank" rel="noopener">
    <span class="social-icon">${ICON[s.key] || ''}</span>
    <span class="social-body"><b>${s.name}</b><span>${s.handle}</span>${s.blurb ? `<em>${s.blurb}</em>` : ''}</span>
    <span class="social-go" aria-hidden="true">→</span>
  </a>`).join('');
const hf = document.getElementById('hero-follow');
if (hf) hf.insertAdjacentHTML('beforeend', live.filter(s=>['instagram','x','youtube'].includes(s.key)).map(s => `<a href="${s.url}" target="_blank" rel="noopener">${s.name}</a>`).join(''));
const fs = document.getElementById('footer-socials');
if (fs) fs.innerHTML = live.map(s => `<a href="${s.url}" target="_blank" rel="noopener" aria-label="${s.name}">${ICON[s.key] || s.name}</a>`).join('');

// ---- ticker tape -------------------------------------------------------------
const track = document.getElementById('tape-track');
if (track) {
  const FALLBACK = [
    {s:'XAU/USD', p:0, c:0},{s:'XAG/USD', p:0, c:0},{s:'US30', p:0, c:0},{s:'NAS100', p:0, c:0},
    {s:'USD/JPY', p:0, c:0},{s:'GBP/JPY', p:0, c:0},{s:'AUD/JPY', p:0, c:0},
    {s:'BTC/USD', p:0, c:0},{s:'ETH/USD', p:0, c:0}
  ];
  const fmt = (s,p) => s.includes('JPY') ? p.toFixed(3) : (p >= 1000 ? p.toLocaleString(undefined,{maximumFractionDigits:0}) : p.toFixed(p>=10?2:4));
  const render = items => {
    const cell = i => `<span class="tick ${i.c>0?'up':i.c<0?'dn':''}"><b>${i.s}</b><span>${i.p?fmt(i.s,i.p):'—'}</span><em>${i.c?((i.c>0?'+':'')+i.c.toFixed(2)+'%'):''}</em></span>`;
    const row = items.map(cell).join(''); track.innerHTML = row + row;
  };
  async function loadTape(){
    let metals=[], crypto=[], indices=[], fx=[];
    try { // gold/silver-backed tokens (1 token = 1 oz) + BTC/ETH: live, keyless
      const j = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=pax-gold,kinesis-silver,bitcoin,ethereum&vs_currencies=usd&include_24hr_change=true').then(r=>r.json());
      const q = (s,k) => j[k] ? [{s, p:j[k].usd, c:j[k].usd_24h_change}] : [];
      metals = [...q('XAU/USD','pax-gold'), ...q('XAG/USD','kinesis-silver')];
      crypto = [...q('BTC/USD','bitcoin'), ...q('ETH/USD','ethereum')];
    } catch(e){}
    try { // indices: written to data/quotes.json by the GitHub Action every 15 min
      const j = await fetch('data/quotes.json?t=' + Math.floor(Date.now()/3e5)).then(r=>r.json());
      if (j.US30)   indices.push({s:'US30',   p:j.US30.p,   c:j.US30.c});
      if (j.NAS100) indices.push({s:'NAS100', p:j.NAS100.p, c:j.NAS100.c});
    } catch(e){}
    try { // FX: daily ECB fixes, keyless; JPY crosses derived from USD rates
      const d = new Date(Date.now()-5*864e5).toISOString().slice(0,10);
      const [a,b] = await Promise.all([
        fetch('https://api.frankfurter.dev/v1/latest?from=USD&to=JPY,GBP,AUD').then(r=>r.json()),
        fetch('https://api.frankfurter.dev/v1/'+d+'?from=USD&to=JPY,GBP,AUD').then(r=>r.json())
      ]);
      const cross = (s,num,den) => { const now = den ? a.rates[num]/a.rates[den] : a.rates[num]; const prev = den ? b.rates[num]/b.rates[den] : b.rates[num]; return {s, p:now, c:(now/prev-1)*100}; };
      fx = [cross('USD/JPY','JPY'), cross('GBP/JPY','JPY','GBP'), cross('AUD/JPY','JPY','AUD')];
    } catch(e){}
    const out = [...metals, ...indices, ...fx, ...crypto];
    render(out.length ? out : FALLBACK);
  }
  render(FALLBACK); loadTape(); setInterval(loadTape, 5*60*1000);
}


// ---- newsletter popup -------------------------------------------------------------
// Shows once per visitor ~5s after landing (or at 35% scroll), unless they already
// subscribed or closed it in the last 7 days. State lives in localStorage.
(() => {
  const KEY = 'ffx_popup';
  let state = {}; try { state = JSON.parse(localStorage.getItem(KEY) || '{}'); } catch (e) {}
  const snoozed = state.until && Date.now() < state.until;
  if (state.subscribed || snoozed || location.search.includes('nopopup')) return;
  const save = o => { try { localStorage.setItem(KEY, JSON.stringify(o)); } catch (e) {} };

  document.body.insertAdjacentHTML('beforeend', `
  <div class="pop-backdrop" id="pop-backdrop" hidden>
    <div class="pop" role="dialog" aria-modal="true" aria-labelledby="pop-title">
      <button class="pop-close" id="pop-close" aria-label="Close">×</button>
      <img class="pop-logo" src="assets/logo-gold.png?v=2" alt="">
      <span class="eyebrow">The newsletter</span>
      <h2 id="pop-title">Get the notes before the moves.</h2>
      <p class="lead">Weekly market notes, new tools, and first access to 1-on-1 slots. One email a week.</p>
      <form class="capture-form" data-capture novalidate>
        <label class="sr-only" for="pop-email">Email address</label>
        <input id="pop-email" name="email" type="email" inputmode="email" autocomplete="email" placeholder="you@example.com" required>
        <button class="btn btn-primary" type="submit">Subscribe</button>
        <p class="capture-note">No spam. Unsubscribe any time.</p>
      </form>
      <button class="pop-later" id="pop-later" type="button">Maybe later</button>
    </div>
  </div>`);
  const bd = document.getElementById('pop-backdrop');
  let shown = false;
  const open = () => { if (shown || (window.FFXauth && !document.getElementById('auth-backdrop').hidden)) return; shown = true; bd.hidden = false; setTimeout(() => document.getElementById('pop-email').focus(), 60); };
  const close = () => { bd.hidden = true; save({ until: Date.now() + 7*864e5 }); };
  document.getElementById('pop-close').addEventListener('click', close);
  document.getElementById('pop-later').addEventListener('click', close);
  bd.addEventListener('click', e => { if (e.target === bd) close(); });
  addEventListener('keydown', e => { if (e.key === 'Escape' && !bd.hidden) close(); });
  bd.querySelector('form').addEventListener('submit', () => { save({ subscribed: true }); setTimeout(() => { bd.hidden = true; }, 1200); });
  setTimeout(open, 5000);
  addEventListener('scroll', () => { if (scrollY > document.body.scrollHeight * 0.35) open(); }, { passive: true });
})();

// ---- email capture -------------------------------------------------------------
// Until data-endpoint/data-field are set (Google Form or newsletter tool), the form
// opens a pre-filled email so sign-ups still reach Fred.
document.querySelectorAll('#capture-form, [data-capture]').forEach(form => {
  const note = form.querySelector('.capture-note') || document.getElementById('capture-note');
  form.addEventListener('submit', async e => {
    e.preventDefault();
    const email = form.email.value.trim();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { note.textContent = 'Check that email address and try again.'; return; }
    const cfg = document.getElementById('capture-form') || form;
    const ep = cfg.dataset.endpoint, field = cfg.dataset.field;
    if (ep && field) {
      try { await fetch(ep, { method:'POST', mode:'no-cors', body:new URLSearchParams({ [field]: email }) });
        note.textContent = "You're on the list. Watch for the first note."; form.reset();
      } catch(err) { note.textContent = 'Something broke on our side. Email fred@fortunesfx.com and we will add you.'; }
    } else {
      location.href = 'mailto:fred@fortunesfx.com?subject=Add%20me%20to%20the%20newsletter&body=' + encodeURIComponent('Please add ' + email + ' to the list.');
      note.textContent = 'Opening your email app. Send it and you are on the list.';
    }
  });
});

// ---- apply form (Work with Me) ---------------------------------------------------
const apply = document.getElementById('apply-form');
if (apply) apply.addEventListener('submit', e => {
  e.preventDefault();
  const f = apply, body = `Name: ${f.name.value}\nEmail: ${f.email.value}\nExperience: ${f.experience.value}\n\nGoal:\n${f.goal.value}`;
  location.href = 'mailto:booking@fortunesfx.com?subject=' + encodeURIComponent('Work with me application: ' + f.name.value) + '&body=' + encodeURIComponent(body);
  document.getElementById('apply-note').textContent = 'Opening your email app with the application filled in. Hit send.';
});

// ---- motion (Motion library, loaded globally) ------------------------------------
if (window.Motion) {
  const { animate, inView, stagger } = window.Motion;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches || location.search.includes('nomotion');
  const ease = [0.22, 1, 0.36, 1];
  const h1 = document.querySelector('[data-split]');
  if (h1 && !reduce) {
    const wrap = node => { [...node.childNodes].forEach(n => {
      if (n.nodeType === 3) { const frag = document.createDocumentFragment();
        n.textContent.split(/(\s+)/).forEach(w => { if (!w.trim()) { frag.append(w); return; } const s = document.createElement('span'); s.className='w'; s.textContent=w; frag.append(s); });
        n.replaceWith(frag); } else if (n.nodeType === 1) wrap(n); }); };
    wrap(h1);
    animate(h1.querySelectorAll('.w'), { opacity:[0,1], y:[28,0] }, { duration:.7, delay: stagger(.06, { startDelay:.1 }), ease });
    const rest = document.querySelectorAll('.hero .pill, .hero .eyebrow, .hero .lead, .hero-meta, .hero-sub, .hero-row, .hero-actions, .hero .capture-note, .hero-corner, .chips');
    animate(rest, { opacity:[0,1], y:[18,0] }, { duration:.7, delay: stagger(.08, { startDelay:.45 }), ease });
  }
  if (!reduce) {
    const art = document.querySelector('.hero-art img, .hero-art svg');
    if (art) animate(art, { y:[0,-10,0] }, { duration:6, repeat:Infinity, ease:'easeInOut' });
    const stats = document.querySelectorAll('.stat');
    if (stats.length) { stats.forEach(s => s.style.opacity = 0);
      inView('.strip', () => { animate(stats, { opacity:[0,1], y:[14,0] }, { duration:.6, delay: stagger(.08), ease }); }, { amount:.4 }); }
    document.querySelectorAll('.reveal').forEach(el => { el.style.opacity = 0; });
    inView('.reveal', ({ target }) => { animate(target, { opacity:[0,1], y:[22,0] }, { duration:.7, ease }); }, { amount:.2 });
  }
  document.querySelectorAll('.btn').forEach(b => {
    b.addEventListener('pointerdown', () => animate(b, { scale:.97 }, { duration:.12 }));
    const up = () => animate(b, { scale:1 }, { duration:.25, ease }); b.addEventListener('pointerup', up); b.addEventListener('pointerleave', up);
  });
}
