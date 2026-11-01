/* BLK HQ shared runtime: Supabase (publishable key, shared Lab sign-in), sign-in gate, masthead nav.
   Private data only ever arrives from Supabase after sign-in; nothing private is written in these files. */
(function () {
  'use strict';
  const SUPA_URL = 'https://fzlwkbhpsklsgkinwljt.supabase.co';
  const SUPA_KEY = 'sb_publishable_CFtMUXYsGLfSb7QT1GEbQg_G_Buhvfx';
  window.sb = window.supabase.createClient(SUPA_URL, SUPA_KEY);
  window.$ = (id) => document.getElementById(id);
  window.AGENTS = ['Brandon Bruning', 'Shelley Lisko', 'Amanda Mitchell', 'Kevin Cloud'];
  window.LEAD_SOURCES = ['Buyer-Brain', 'Buyer', 'Expired Listing Backup', 'FSBO Backup', 'Circle Prospect Buyer', 'Circle Prospect Seller', 'Off-Market Brain', '30 Day Seller'];
  window.currentUser = null; window.userProfile = null; window.isAdmin = false;

  const NAV = [
    { k: 'opens', label: 'Opens', href: 'opens.html' },
    { k: 'contract', label: 'Under Contract', href: 'contract.html' },
    { k: 'floor', label: 'The Floor', href: 'https://claude.ai/artifact/Q2sYXv3w5726dbsY3qGhcH', ext: true, admin: true },
    
    { k: 'graphics', label: 'Graphics', href: 'https://theblk.group/graphics.html', ext: true },
    { k: 'algorithm', label: 'The Algorithm', href: 'http://localhost:4747', ext: true, admin: true },
    { k: 'optempo', label: 'OPTEMPO', href: '../optempo.html', ext: true, admin: true },
    { k: 'lab', label: 'Classic Lab', href: '../classic/', admin: true },
  ];
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  window.HQ = {
    esc,
    bar(active) {
      const items = NAV.filter((n) => (!n.admin || window.isAdmin) && (!HQ.isTC() || n.k === 'contract')).map((n) => n.soon
        ? `<a class="soon" title="Coming next">${esc(n.label)}</a>`
        : `<a href="${n.href}"${n.ext ? ' target="_blank" rel="noopener"' : ''} class="${n.k === active ? 'on' : ''}">${esc(n.label)}${n.ext ? ' ↗' : ''}</a>`).join('');
      const who = window.userProfile && (window.userProfile.full_name || window.userProfile.name) || (window.currentUser && window.currentUser.email) || '';
      return `<div class="hq-bar"><a class="hq-brand" href="${HQ.isTC() ? 'contract.html' : 'opens.html'}"><img src="img/blk-disc.png" alt="The BLK Group"><span>The BLK Group</span></a>
        <nav class="hq-nav" aria-label="HQ">${items}<a class="who" id="hqSignOut" title="Sign out">${esc(who.split('@')[0])} · Sign out</a></nav></div>`;
    },
    wireBar() { const so = $('hqSignOut'); if (so) so.onclick = async () => { await sb.auth.signOut(); location.reload(); }; },
    isTC() { const p = window.userProfile; return !!(p && /tc|transaction/i.test(p.role || '')); },
    async gate(onReady) {
      document.body.innerHTML = '<div class="hq-loading">Opening HQ</div>';
      const { data } = await sb.auth.getSession();
      if (data && data.session) { await HQ.profile(data.session.user); if (HQ.isTC() && !/contract\.html/.test(location.pathname)) { location.replace('contract.html'); return; } onReady(); return; }
      document.body.innerHTML = `<div class="hq-login"><form id="hqLogin"><img src="img/blk-disc.png" alt="" width="44" height="44"><h1 class="chrome">BLK HQ</h1>
        <label for="hqEmail">Email</label><input id="hqEmail" type="email" autocomplete="username" required>
        <label for="hqPass">Password</label><input id="hqPass" type="password" autocomplete="current-password" required>
        <button type="submit">Sign in</button><div class="err" id="hqErr"></div></form></div>`;
      $('hqLogin').onsubmit = async (e) => {
        e.preventDefault(); $('hqErr').textContent = '';
        const { data: d, error } = await sb.auth.signInWithPassword({ email: $('hqEmail').value.trim(), password: $('hqPass').value });
        if (error) { $('hqErr').textContent = error.message; return; }
        await HQ.profile(d.user); if (HQ.isTC() && !/contract\.html/.test(location.pathname)) { location.replace('contract.html'); return; } onReady();
      };
    },
    async profile(user) {
      window.currentUser = user;
      const { data } = await sb.from('agent_profiles').select('*').eq('user_id', user.id).maybeSingle();
      window.userProfile = data || null;
      window.isAdmin = !!(data && data.role === 'admin');
    },
  };

  // Same move as the current Lab: copy the open into Active Listings or Under Contract, then turn it black (Listed).
  window.moveOpen = async function (id, dest) {
    if (!dest) return;
    const { data: open } = await sb.from('lab_opens').select('*').eq('id', id).single();
    if (!open) return;
    const label = dest === 'listings' ? 'Active Listings' : 'Under Contract';
    if (!confirm(`Move "${open.name || open.address || 'this open'}" to ${label}?\n\nThe open stays in Opens and turns black.`)) return;
    if (dest === 'listings') await sb.from('lab_listings').insert({ agent: open.agent || null, address: open.address || '', listing_type: '', status: 'active', agent_id: open.agent_id || null });
    else await sb.from('lab_contracts').insert({ transaction_name: open.address || open.name || 'New Transaction', agent: open.agent || null, status: 'active', agent_id: open.agent_id || null });
    await sb.from('lab_opens').update({ status: 'black', updated_at: new Date().toISOString() }).eq('id', id);
    if (typeof window.loadOpens === 'function') window.loadOpens();
  };
})();
