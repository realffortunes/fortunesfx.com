/* FortunesFX accounts: sign up, log in (password or magic link), reset, sign out.
   Runs on every page. Needs window.FFX.supabaseUrl / supabaseAnonKey from config.js.
   Until those are set, the UI works but submissions say accounts aren't connected yet. */
(() => {
  const cfg = window.FFX || {};
  const ready = !!(cfg.supabaseUrl && cfg.supabaseAnonKey && window.supabase);
  const sb = ready ? window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey) : null;

  // ---- modal markup (one copy, injected) --------------------------------------
  document.body.insertAdjacentHTML('beforeend', `
  <div class="auth-backdrop" id="auth-backdrop" hidden>
    <div class="auth-modal" role="dialog" aria-modal="true" aria-labelledby="auth-title">
      <button class="auth-close" id="auth-close" aria-label="Close">×</button>
      <img class="auth-logo" src="assets/logo-gold.png?v=2" alt="">
      <div class="auth-tabs" role="tablist">
        <button role="tab" data-mode="login" aria-selected="true">Log In</button>
        <button role="tab" data-mode="signup" aria-selected="false">Sign Up</button>
      </div>
      <h2 id="auth-title">Welcome back.</h2>
      <p class="auth-sub" id="auth-sub">Log in to your FortunesFX account.</p>
      <form class="auth-form" id="auth-form" novalidate>
        <label>Email<input name="email" type="email" autocomplete="email" placeholder="you@example.com" required></label>
        <label id="auth-pass-wrap">Password<input name="password" type="password" autocomplete="current-password" placeholder="••••••••" minlength="8"></label>
        <button class="btn btn-primary" type="submit" id="auth-submit">Log in</button>
        <div class="auth-links"><a href="#" id="auth-forgot">Forgot password?</a></div>
        <p class="auth-note" id="auth-note">${ready ? '' : 'Accounts open soon. You can look around, but sign-ins are not connected yet.'}</p>
      </form>
    </div>
  </div>`);

  const $ = s => document.querySelector(s);
  const backdrop = $('#auth-backdrop'), form = $('#auth-form'), note = $('#auth-note');
  let mode = 'login';

  const setMode = m => {
    mode = m;
    document.querySelectorAll('.auth-tabs [role=tab]').forEach(t => t.setAttribute('aria-selected', t.dataset.mode === m));
    $('#auth-title').textContent = m === 'login' ? 'Welcome back.' : 'Get started.';
    $('#auth-sub').textContent = m === 'login' ? 'Log in to your FortunesFX account.' : 'One account for sessions, tools, and the newsletter.';
    $('#auth-submit').textContent = m === 'login' ? 'Log In' : 'Sign Up';
    form.password.autocomplete = m === 'login' ? 'current-password' : 'new-password';
    note.textContent = ready ? '' : 'Accounts open soon. You can look around, but sign-ins are not connected yet.';
  };
  const open = (m = 'login') => { setMode(m); backdrop.hidden = false; document.body.style.overflow = 'hidden'; setTimeout(() => form.email.focus(), 50); };
  const close = () => { backdrop.hidden = true; document.body.style.overflow = ''; };

  document.querySelectorAll('.auth-tabs [role=tab]').forEach(t => t.addEventListener('click', () => setMode(t.dataset.mode)));
  $('#auth-close').addEventListener('click', close);
  backdrop.addEventListener('click', e => { if (e.target === backdrop) close(); });
  addEventListener('keydown', e => { if (e.key === 'Escape' && !backdrop.hidden) close(); });
  document.addEventListener('click', e => {
    const a = e.target.closest('[data-auth]'); if (!a) return; e.preventDefault(); open(a.dataset.auth);
  });

  const say = (msg, ok = false) => { note.textContent = msg; note.classList.toggle('ok', ok); };
  const redirect = location.origin + location.pathname.replace(/[^/]*$/, '') + 'account.html';

  form.addEventListener('submit', async e => {
    e.preventDefault();
    const email = form.email.value.trim(), password = form.password.value;
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return say('Check that email address.');
    if (!ready) return say('Accounts open soon. Sign-ins are not connected yet.');
    if (password.length < 8) return say('Password needs at least 8 characters.');
    say(mode === 'login' ? 'Logging in…' : 'Creating your account…');
    const { error } = mode === 'login'
      ? await sb.auth.signInWithPassword({ email, password })
      : await sb.auth.signUp({ email, password, options: { emailRedirectTo: redirect } });
    if (error) return say(error.message);
    if (mode === 'signup') return say('Check your inbox to confirm your email, then log in.', true);
    location.href = 'account.html';
  });

  $('#auth-forgot').addEventListener('click', async e => {
    e.preventDefault();
    const email = form.email.value.trim();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return say('Enter your email first, then tap Forgot password.');
    if (!ready) return say('Accounts open soon. Sign-ins are not connected yet.');
    const { error } = await sb.auth.resetPasswordForEmail(email, { redirectTo: redirect + '#reset' });
    say(error ? error.message : 'Reset link sent. Check your inbox.', !error);
  });

  // ---- nav state ---------------------------------------------------------------
  const renderNav = user => {
    document.querySelectorAll('[data-auth-area]').forEach(el => {
      el.innerHTML = user
        ? `<a class="nav-user" href="account.html"><span class="avatar">${(user.email || '?')[0].toUpperCase()}</span>Account</a>`
        : `<a class="nav-login" href="#" data-auth="login">Log In</a><a class="btn btn-light nav-cta" href="#" data-auth="signup">Sign Up</a>`;
    });
    document.querySelectorAll('[data-auth-pill]').forEach(el => {
      el.innerHTML = user ? `<a href="account.html">Account</a>` : `<a href="#" data-auth="login">Log In</a><a class="float-cta" href="#" data-auth="signup">Sign Up</a>`;
    });
  };
  renderNav(null);
  if (ready) {
    sb.auth.getSession().then(({ data }) => renderNav(data.session?.user || null));
    sb.auth.onAuthStateChange((_e, session) => renderNav(session?.user || null));
  }
  window.FFXauth = { open, close, client: sb, ready };
})();
