/* BLK HQ · Opens room (theblkgrouplab.com/hq/opens.html). Built from Opens v2.
   Lead-type focus tabs, status bars, drag a bar onto another month, agent headshots,
   notes pop-up with a timestamped entry log, and Today's moves (DISPATCHER).
   All data stays in Supabase (lab_opens) behind the Lab login; nothing private lives in this file. */
(function () {
  'use strict';
  const HEADS = { 'Brandon Bruning': '../img/agents/brandon.jpg', 'Shelley Lisko': '../img/agents/shelley.jpg', 'Amanda Mitchell': '../img/agents/amanda.jpg', 'Kevin Cloud': '../img/agents/kevin.jpg' };
  const STATUS = [
    { v: 'purple', label: 'Highly likely to list' },
    { v: 'gold', label: 'Nurture' },
    { v: 'orange', label: 'Need to reconnect' },
    { v: 'black', label: 'Listed' },
    { v: 'active', label: 'Active' },
  ];
  const STATUS_COLOR = { purple: '#7451AE', gold: '#BD9530', orange: '#C8692E', black: '#111214', active: '#C9C6C0' };
  const NEW_SOURCES = ['Mailer Survey', 'Mailer Valuation', 'Mailer Strategy', 'Off-Market Yes'];
  try { NEW_SOURCES.forEach((s) => { if (!LEAD_SOURCES.includes(s)) LEAD_SOURCES.push(s); }); } catch (e) { /* LEAD_SOURCES not ready */ }
  const KINDS = ['Call', 'Text', 'Email', 'Met in person', 'Note'];
  const SUGGEST = {
    'FSBO Backup': 'Ask what they thought of the FSBO backup plan and offer to walk them through pricing.',
    'Expired Listing Backup': 'Remind them why it did not sell and offer the 30 Day, 3% plan.',
    '30 Day Seller': 'Check their timing and book the listing appointment.',
    'Buyer': 'Send 3 fresh matches and ask for a showing time.',
    'Buyer-Brain': 'Send 3 fresh matches and ask for a showing time.',
    'Circle Prospect Seller': 'Share the nearby sale and ask if they have thought about moving.',
    'Circle Prospect Buyer': 'Share what just hit the market near them and ask what they are looking for.',
    'Off-Market Brain': 'Tell them about the buyers you have and ask for a walkthrough.',
    'Off-Market Yes': 'They said yes to off-market. Call today, confirm their number, and line up a buyer.',
    'Mailer Valuation': 'Run the valuation and deliver it by phone, not email.',
    'Mailer Strategy': 'Check that they are a real homeowner, not an agent, before you send the strategy yourself.',
    'Mailer Survey': 'Thank them for entering the giveaway and ask about their timing.',
  };

  const st = { rows: [], type: 'All', status: new Set(), open: null, kind: 'Call' };
  try { st.type = localStorage.getItem('o2_type') || 'All'; } catch (e) {}

  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const pad = (n) => String(n).padStart(2, '0');
  const ymd = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const today = () => ymd(new Date());
  const addDays = (s, n) => { const d = s ? new Date(s + 'T12:00:00') : new Date(); d.setDate(d.getDate() + n); return ymd(d); };
  const dayDiff = (a, b) => Math.round((new Date(a + 'T12:00:00') - new Date(b + 'T12:00:00')) / 86400000);
  const short = (s) => s ? new Date(s + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '';
  const first = (n) => String(n || '').trim().split(/\s+/)[0] || '';
  const initials = (n) => String(n || '?').trim().split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase();
  const monthLabel = (mk) => { const [y, m] = mk.split('-'); return new Date(+y, +m - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }); };
  const curMK = () => { const d = new Date(); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`; };
  const statusOf = (r) => (r.status && STATUS_COLOR[r.status]) ? r.status : 'active';
  function av(name, cls) {
    const src = HEADS[name];
    return src ? `<img class="o2-av ${cls || ''}" src="${src}" alt="">` : `<span class="o2-av ${cls || ''}">${esc(initials(name || 'BLK'))}</span>`;
  }
  function me() {
    try {
      const p = userProfile || {};
      return first(p.full_name || p.name || p.display_name || p.agent_name) || first((currentUser && currentUser.email || '').split('@')[0].replace(/[._-]+/g, ' ')).replace(/^./, (c) => c.toUpperCase()) || 'Team';
    } catch (e) { return 'Team'; }
  }

  /* ---------- notes log: entries are stored newest first inside lab_opens.notes ---------- */
  const HEAD_RX = /^\[\[(\d{4}-\d{2}-\d{2} \d{2}:\d{2}) \| ([^|\]]+) \| ([^\]]+)\]\]\s*$/;
  function parseLog(notes) {
    const out = []; let cur = null; const legacy = [];
    String(notes || '').split('\n').forEach((line) => {
      const m = line.match(HEAD_RX);
      if (m) { cur = { at: m[1], who: m[2].trim(), kind: m[3].trim(), text: '' }; out.push(cur); }
      else if (cur) cur.text += (cur.text ? '\n' : '') + line;
      else legacy.push(line);
    });
    out.forEach((e) => { e.text = e.text.trim(); });
    const old = legacy.join('\n').trim();
    if (old) out.push({ at: '', who: '', kind: 'Earlier notes', text: old, old: true });
    return out;
  }
  function stamp() { const d = new Date(); return `${ymd(d)} ${pad(d.getHours())}:${pad(d.getMinutes())}`; }
  function whenLabel(at) {
    if (!at) return '';
    const [d, t] = at.split(' '); const [h, mi] = t.split(':').map(Number);
    const tt = `${((h + 11) % 12) + 1}:${pad(mi)} ${h < 12 ? 'AM' : 'PM'}`;
    return (d === today() ? 'Today' : short(d)) + ' · ' + tt;
  }
  const latest = (r) => { const l = parseLog(r.notes); return l.length ? l[0].text : ''; };

  /* ---------- data ---------- */
  async function load() {
    const { data, error } = await sb.from('lab_opens').select('*').order('sort_order');
    if (error) { $('page-opens').innerHTML = `<p style="padding:20px;color:#C2382E">Could not load opens: ${esc(error.message)}</p>`; return; }
    st.rows = data || [];
    render();
  }
  async function save(id, patch) {
    patch.updated_at = new Date().toISOString();
    const r = st.rows.find((x) => x.id === id); if (r) Object.assign(r, patch);
    const { error } = await sb.from('lab_opens').update(patch).eq('id', id);
    if (error) alert('Could not save: ' + error.message);
  }

  /* ---------- Today's moves ---------- */
  function moves() {
    const t = today(); const list = [];
    const now = new Date(); const curIdx = now.getFullYear() * 12 + now.getMonth();
    st.rows.forEach((r) => {
      const s = statusOf(r);
      if (s === 'black') return;
      const mk = String(r.month_year || '').split('-'); const age = mk.length === 2 ? curIdx - (+mk[0] * 12 + (+mk[1] - 1)) : 0;
      if (age > 4 && s !== 'purple') return; // old opens stay on the board but do not crowd today's list
      const next = r.next_contact, last = r.last_contact;
      const since = last ? dayDiff(t, last) : null;
      let score = 0, why = '', cls = '';
      if (next && next < t) { const n = dayDiff(t, next); score = 100 + Math.min(n, 21); why = `Follow-up ${n} day${n === 1 ? '' : 's'} late`; }
      else if (next === t) { score = 110; why = 'Due today'; cls = 'warm'; }
      else if (!next && s === 'purple') { score = 95; why = 'Highly likely, but no next step is set'; cls = 'cool'; }
      else if (!next && (since === null || since >= 14)) { score = 60 + Math.min(since || 20, 30); why = since === null ? 'No contact logged yet, no next step set' : `${since} days since anyone talked to them`; }
      else return;
      score += (s === 'purple' ? 30 : s === 'gold' ? 10 : 0) - age * 8;
      if (r.lead_source === 'Off-Market Yes') score += 60;
      list.push({ r, score, why, cls });
    });
    return list.sort((a, b) => b.score - a.score).slice(0, 8);
  }

  /* ---------- render ---------- */
  function filtered() {
    return st.rows.filter((r) => (st.type === 'All' || (r.lead_source || 'No source') === st.type) && (!st.status.size || st.status.has(statusOf(r))));
  }
  function nextCell(r) {
    const s = statusOf(r), t = today(), n = r.next_contact;
    let pill;
    if (s === 'black') pill = '<span class="o2-tag">LISTED</span>';
    else if (!n) pill = '<span class="o2-due none">Set a date</span>';
    else if (n < t) { const d = dayDiff(t, n); pill = `<span class="o2-due late">${short(n)} · ${d}d late</span>`; }
    else if (n === t) pill = '<span class="o2-due today">Today</span>';
    else pill = `<span class="o2-due ok">${short(n)}</span>`;
    return `<span class="o2-date" data-f="next_contact">${pill}<input class="o2-pick" type="date" value="${esc(n || '')}" data-id="${r.id}" data-f="next_contact" aria-label="Next contact"></span>`;
  }
  function bar(r) {
    const s = statusOf(r), note = latest(r);
    const agentOpts = '<option value="">No agent</option>' + (typeof AGENTS !== 'undefined' ? AGENTS : []).concat(r.agent && !(AGENTS || []).includes(r.agent) ? [r.agent] : [])
      .map((a) => `<option${a === r.agent ? ' selected' : ''}>${esc(a)}</option>`).join('');
    const srcList = LEAD_SOURCES.concat(r.lead_source && !LEAD_SOURCES.includes(r.lead_source) ? [r.lead_source] : []);
    const srcOpts = '<option value="">No source</option>' + srcList.map((a) => `<option${a === r.lead_source ? ' selected' : ''}>${esc(a)}</option>`).join('');
    const tel = r.phone ? `<a class="o2-ib" href="tel:${esc(String(r.phone).replace(/[^0-9+]/g, ''))}" title="Call ${esc(r.phone)}">${ICON.ph}</a>` : '';
    return `<div class="o2-bar s-${s}" data-id="${r.id}" data-mk="${esc(r.month_year || '')}">
      <span class="o2-grip" title="Drag to another month" draggable="true">⋮⋮</span>
      <button class="o2-dot" data-act="status" title="Status"><i></i></button>
      <div class="o2-who">${av(r.agent)}<span>${esc(first(r.agent) || 'No agent')}</span><select data-f="agent" aria-label="Agent">${agentOpts}</select></div>
      <select class="o2-src" data-f="lead_source" aria-label="Lead type">${srcOpts}</select>
      <div class="o2-addr"><input data-f="address" value="${esc(r.address || '')}" placeholder="Address"><input class="nm" data-f="name" value="${esc(r.name || '')}" placeholder="Seller name"></div>
      <span class="o2-date" title="Last contact">${r.last_contact ? short(r.last_contact) : '<span style="color:#BDBAB4">None</span>'}<input class="o2-pick" type="date" value="${esc(r.last_contact || '')}" data-f="last_contact" aria-label="Last contact"></span>
      ${nextCell(r)}
      <button class="o2-note ${note ? '' : 'empty'}" data-act="notes">${note ? esc(note.split('\n')[0]) : '+ Note'}</button>
      <span class="o2-acts">${tel}<button class="o2-ib" data-act="more" title="More">${ICON.more}</button></span>
    </div>`;
  }
  const ICON = {
    ph: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z"/></svg>',
    more: '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="19" cy="12" r="1.6"/></svg>',
  };
  let render = function () {
    const page = $('page-opens'); if (!page) return;
    const all = st.rows, rows = filtered(), t = today();
    const counts = {}; all.forEach((r) => { const k = r.lead_source || 'No source'; counts[k] = (counts[k] || 0) + 1; });
    const typeKeys = LEAD_SOURCES.filter((s) => counts[s]).concat(Object.keys(counts).filter((k) => !LEAD_SOURCES.includes(k)));
    if (st.type !== 'All' && !counts[st.type]) st.type = 'All';
    const scount = {}; all.forEach((r) => { const s = statusOf(r); scount[s] = (scount[s] || 0) + 1; });
    const months = {}; rows.forEach((r) => { (months[r.month_year || curMK()] = months[r.month_year || curMK()] || []).push(r); });
    if (!months[curMK()]) months[curMK()] = [];
    const order = Object.keys(months).sort().reverse();
    const mv = moves();
    page.innerHTML = `<div class="o2-wrap"><main>
      <div class="o2-top"><p>Every open by the month it opened. Drag a bar by its handle onto another month to move it.</p></div>
      <div class="o2-types">${['All'].concat(typeKeys).map((k) => `<button data-type="${esc(k)}" class="${k === st.type ? 'on' : ''}">${esc(k)}<span>${k === 'All' ? all.length : counts[k]}</span></button>`).join('')}</div>
      <div class="o2-status">${STATUS.map((s) => `<button data-st="${s.v}" class="${st.status.has(s.v) ? 'on' : ''}"><i class="k-${s.v}"></i>${s.label}<span style="color:#9298A0">${scount[s.v] || 0}</span></button>`).join('')}</div>
      ${order.map((mk) => {
        const list = months[mk];
        const listed = list.filter((r) => statusOf(r) === 'black').length;
        const late = list.filter((r) => statusOf(r) !== 'black' && r.next_contact && r.next_contact < t).length;
        return `<section class="o2-month" data-mk="${mk}"><div class="o2-mh"><h2>${esc(monthLabel(mk))}</h2>
          <span class="meta">${window.HQ_OPENS_COND ? `<b>${esc(window.HQ_OPENS_COND(list.length).name)}</b> · ` : ''}<b>${list.length}</b> open${list.length === 1 ? '' : 's'} · <b>${listed}</b> listed${list.length ? ` · ${Math.round(listed / list.length * 100)}% listed` : ''}${late ? ` · <span class="od">${late} follow-up${late === 1 ? '' : 's'} overdue</span>` : ''}</span>
          <span class="hint">Drop here to move to ${esc(monthLabel(mk).split(' ')[0])}</span></div>
          <div class="o2-scroll">${list.length ? `<div class="o2-cols"><span></span><span></span><span>Agent</span><span>Lead type</span><span>Address · seller</span><span>Last</span><span>Next contact</span><span>Notes</span><span></span></div>` : ''}
          ${list.map(bar).join('')}</div>
          <button class="o2-add" data-act="add" data-mk="${mk}">+ Add open to ${esc(monthLabel(mk).split(' ')[0])}</button></section>`;
      }).join('')}
    </main>
    <aside class="o2-ai"><div class="hd"><span class="orb"></span><h3>Today's moves</h3></div>
      <p class="k">DISPATCHER read every open's dates and notes. ${mv.length ? `${mv.length} need${mv.length === 1 ? 's' : ''} you.` : ''}</p>
      ${mv.length ? mv.map((m) => `<div class="o2-sg" data-id="${m.r.id}"><div class="top">${av(m.r.agent)}<b>${esc(m.r.name || m.r.address || 'Unnamed open')}${m.r.name && m.r.address ? ' · ' + esc(m.r.address.split(',')[0]) : ''}</b></div>
        <div class="why ${m.cls}">● ${esc(m.why)}</div><div class="do">${esc(SUGGEST[m.r.lead_source] || 'Call and log what you learn.')}${latest(m.r) ? `<span class="last">Last note: ${esc(latest(m.r).slice(0, 140))}${latest(m.r).length > 140 ? '…' : ''}</span>` : ''}</div>
        <div class="btns"><button class="p" data-act="log">Log it</button><button data-act="snooze">Snooze 2 days</button></div></div>`).join('')
        : '<div class="empty">Nothing overdue. Every open has a next step.</div>'}
    </aside></div>`;
    wire(page);
  };

  /* ---------- interactions ---------- */
  function wire(page) {
    page.querySelectorAll('.o2-types button').forEach((b) => b.onclick = () => { st.type = b.dataset.type; try { localStorage.setItem('o2_type', st.type); } catch (e) {} render(); });
    page.querySelectorAll('.o2-status button').forEach((b) => b.onclick = () => { const v = b.dataset.st; st.status.has(v) ? st.status.delete(v) : st.status.add(v); render(); });
    page.querySelectorAll('.o2-bar').forEach((el) => {
      const id = el.dataset.id;
      el.querySelectorAll('[data-f]').forEach((inp) => {
        if (!('value' in inp) || inp.tagName === 'SPAN') return;
        const f = inp.dataset.f;
        inp.addEventListener('change', async () => { await save(id, { [f]: inp.value || null }); render(); });
        if (inp.classList.contains('o2-pick')) inp.addEventListener('click', () => { try { inp.showPicker && inp.showPicker(); } catch (e) {} });
      });
      el.querySelector('[data-act="status"]').onclick = (ev) => menu(ev.currentTarget, STATUS.map((s) => ({ label: s.label, color: STATUS_COLOR[s.v], run: async () => { await save(id, { status: s.v }); render(); } })));
      el.querySelector('[data-act="notes"]').onclick = () => notes(id);
      el.querySelector('[data-act="more"]').onclick = () => details(el, id);
      const grip = el.querySelector('.o2-grip');
      grip.addEventListener('dragstart', (e) => { e.dataTransfer.setData('text/plain', id); e.dataTransfer.effectAllowed = 'move'; try { e.dataTransfer.setDragImage(el, 20, 20); } catch (x) {} el.classList.add('dragging'); });
      grip.addEventListener('dragend', () => { el.classList.remove('dragging'); page.querySelectorAll('.o2-month.drop').forEach((m) => m.classList.remove('drop')); });
    });
    page.querySelectorAll('.o2-month').forEach((sec) => {
      sec.addEventListener('dragover', (e) => { e.preventDefault(); page.querySelectorAll('.o2-month.drop').forEach((m) => m !== sec && m.classList.remove('drop')); sec.classList.add('drop'); });
      sec.addEventListener('dragleave', (e) => { if (!sec.contains(e.relatedTarget)) sec.classList.remove('drop'); });
      sec.addEventListener('drop', async (e) => {
        e.preventDefault(); sec.classList.remove('drop');
        const id = e.dataTransfer.getData('text/plain'); const r = st.rows.find((x) => x.id === id);
        if (r && r.month_year !== sec.dataset.mk) { await save(id, { month_year: sec.dataset.mk }); render(); }
      });
    });
    page.querySelectorAll('[data-act="add"]').forEach((b) => b.onclick = async () => {
      const mk = b.dataset.mk; const n = st.rows.filter((r) => r.month_year === mk).length;
      const ins = { month_year: mk, sort_order: n, number: n + 1, status: 'active' };
      try { if (!isAdmin && currentUser) ins.agent_id = currentUser.id; if (!isAdmin && userProfile && (userProfile.full_name || userProfile.name)) ins.agent = userProfile.full_name || userProfile.name; } catch (e) {}
      const { error } = await sb.from('lab_opens').insert(ins); if (error) { alert('Could not add: ' + error.message); return; }
      await load();
    });
    page.querySelectorAll('.o2-sg').forEach((c) => {
      const id = c.dataset.id;
      c.querySelector('[data-act="log"]').onclick = () => notes(id);
      c.querySelector('[data-act="snooze"]').onclick = async () => { await save(id, { next_contact: addDays(today(), 2) }); render(); };
    });
  }
  function menu(anchor, items) {
    document.querySelectorAll('.o2-menu').forEach((m) => m.remove());
    const m = document.createElement('div'); m.className = 'o2-menu';
    m.innerHTML = items.map((it, i) => `<button data-i="${i}">${it.color ? `<i style="background:${it.color}"></i>` : ''}${esc(it.label)}</button>`).join('');
    document.body.appendChild(m);
    const r = anchor.getBoundingClientRect();
    m.style.left = Math.min(r.left, innerWidth - m.offsetWidth - 10) + 'px';
    m.style.top = (r.bottom + m.offsetHeight + 8 > innerHeight ? r.top - m.offsetHeight - 6 : r.bottom + 6) + 'px';
    m.querySelectorAll('button').forEach((b) => b.onclick = () => { m.remove(); items[+b.dataset.i].run(); });
    setTimeout(() => document.addEventListener('click', function off(e) { if (!m.contains(e.target)) { m.remove(); document.removeEventListener('click', off); } }), 0);
  }
  function details(el, id) {
    const open = el.querySelector('.o2-det'); if (open) { open.remove(); return; }
    const r = st.rows.find((x) => x.id === id); if (!r) return;
    const d = document.createElement('div'); d.className = 'o2-det';
    d.innerHTML = `<label>Seller name<input data-f="name" value="${esc(r.name || '')}"></label>
      <label>Phone<input data-f="phone" value="${esc(r.phone || '')}"></label>
      <label>Email<input data-f="email" value="${esc(r.email || '')}"></label>
      <label>Move to<select data-move><option value="">Choose</option><option value="listings">Active Listings</option><option value="contracts">Under Contract</option></select></label>
      <button class="del">Remove open</button>`;
    el.appendChild(d);
    d.querySelectorAll('input[data-f]').forEach((inp) => inp.addEventListener('change', async () => { await save(id, { [inp.dataset.f]: inp.value || null }); }));
    d.querySelector('[data-move]').onchange = async (e) => { if (e.target.value && typeof moveOpen === 'function') { await moveOpen(id, e.target.value); } };
    d.querySelector('.del').onclick = async () => { if (!confirm('Remove this open?')) return; const { error } = await sb.from('lab_opens').delete().eq('id', id); if (error) { alert(error.message); return; } await load(); };
  }

  /* ---------- notes pop-up ---------- */
  function notes(id) {
    const r = st.rows.find((x) => x.id === id); if (!r) return;
    st.open = id; st.kind = 'Call';
    const veil = document.createElement('div'); veil.className = 'o2-veil';
    const s = statusOf(r);
    const log = parseLog(r.notes);
    veil.innerHTML = `<div class="o2-md" role="dialog" aria-modal="true" aria-label="Notes">
      <div class="o2-mdh">${av(r.agent)}<div class="t"><b>${esc(r.address || r.name || 'Open')}</b><span>${esc([r.name, r.lead_source, r.month_year ? 'opened ' + monthLabel(r.month_year) : '', first(r.agent)].filter(Boolean).join(' · '))}</span></div>
        <span class="o2-tag" style="background:${STATUS_COLOR[s]};${s === 'active' ? 'color:#111214' : ''}">${esc((STATUS.find((x) => x.v === s) || {}).label || '')}</span><button class="x" aria-label="Close">×</button></div>
      <div class="o2-mdb"><div class="o2-write">
        <div class="o2-kinds">${KINDS.map((k) => `<button data-k="${k}" class="${k === st.kind ? 'on' : ''}">${k}</button>`).join('')}</div>
        <textarea class="o2-ta" placeholder="What happened? What did they say? What is the next step?"></textarea>
        <div class="o2-foot"><label>Next contact</label><input type="date" value="${esc(r.next_contact || '')}">
          <button class="q" data-d="1">Tomorrow</button><button class="q" data-d="3">+3 days</button><button class="q" data-d="7">+1 week</button><button class="q" data-d="14">+2 weeks</button>
          <button class="o2-save">Log entry</button></div>
      </div>
      <div class="o2-log"><h4>Entry log · ${log.length} entr${log.length === 1 ? 'y' : 'ies'}</h4>
        ${log.length ? log.map((e) => `<div class="o2-en ${e.old ? 'old' : ''}"><div class="h">${e.who ? av(nameFor(e.who)).replace('o2-av', 'o2-av" style="width:18px;height:18px;font-size:8px;box-shadow:none;border:0') : ''}<span class="k">${esc(e.kind)}</span>${esc(e.who)}<time>${esc(whenLabel(e.at))}</time></div><p>${esc(e.text)}</p></div>`).join('') : '<p class="none">No entries yet. The first one you log starts this seller\'s history.</p>'}
      </div></div></div>`;
    document.body.appendChild(veil);
    const ta = veil.querySelector('.o2-ta'), dt = veil.querySelector('input[type=date]'), saveBtn = veil.querySelector('.o2-save');
    setTimeout(() => ta.focus(), 60);
    const close = () => { veil.remove(); st.open = null; document.removeEventListener('keydown', onKey); };
    const onKey = (e) => { if (e.key === 'Escape') close(); if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') saveBtn.click(); };
    document.addEventListener('keydown', onKey);
    veil.addEventListener('click', (e) => { if (e.target === veil) close(); });
    veil.querySelector('.x').onclick = close;
    veil.querySelectorAll('.o2-kinds button').forEach((b) => b.onclick = () => { st.kind = b.dataset.k; veil.querySelectorAll('.o2-kinds button').forEach((x) => x.classList.toggle('on', x === b)); });
    veil.querySelectorAll('.q').forEach((b) => b.onclick = () => { dt.value = addDays(today(), +b.dataset.d); });
    saveBtn.onclick = async () => {
      const text = ta.value.trim();
      const patch = {};
      if (text) {
        patch.notes = `[[${stamp()} | ${me()} | ${st.kind}]]\n${text}` + (r.notes ? '\n\n' + r.notes : '');
        if (st.kind !== 'Note') patch.last_contact = today();
      }
      if ((dt.value || null) !== (r.next_contact || null)) patch.next_contact = dt.value || null;
      if (!Object.keys(patch).length) { close(); return; }
      saveBtn.disabled = true;
      await save(id, patch);
      close(); render();
    };
  }
  function nameFor(firstName) { const all = Object.keys(HEADS); return all.find((n) => first(n) === firstName) || firstName; }

  /* ---------- HQ masthead: month opens vs target, condition (same scale as the current Lab) ---------- */
  // The current Lab's Monthly Performance scale: % of target -> condition, with its formulas.
  function condition(val, target) {
    const pct = target ? val / target * 100 : 0;
    if (pct >= 93) return { name: 'Power', good: true, formula: "Don't change anything. Write up what you're doing so others can follow it." };
    if (pct >= 73) return { name: 'Affluence', good: true, formula: "Economize. Don't spend recklessly. Every investment must pay for itself. Push, don't relax." };
    if (pct >= 60) return { name: 'Normal', good: true, formula: "Don't change anything successful. Improve what isn't perfect. Push every piece forward." };
    if (pct >= 47) return { name: 'Emergency', formula: 'Promote. Change nothing. Produce, produce, produce. Get known. Deliver what you promise.' };
    if (pct >= 27) return { name: 'Danger', formula: 'Handle the bypassed charge. Reorganize. Deliver a viable product. Stabilize.' };
    return { name: 'Non-Existence', formula: 'Find and do a communication line. Make yourself known. Deliver what is needed or wanted.' };
  }
  // Opens target: the team's 75 a month for Brandon (as in the current Lab); each agent's own opens goal for agents.
  function opensTarget() {
    try { if (!isAdmin && userProfile && userProfile.opens_goal) return Number(userProfile.opens_goal); } catch (e) {}
    return isAdmin ? 75 : 10;
  }
  async function loadTargets() { /* targets come from the profile (see opensTarget); kept for later rooms */ }
  function prevMK(mk) { const [y, m] = mk.split('-').map(Number); const d = new Date(y, m - 2, 1); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`; }
  window.HQ_OPENS_COND = (n) => condition(n, opensTarget());
  function top() {
    const now = new Date(); const day = now.getDate(); const dim = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const early = day < 5; const mk = early ? prevMK(curMK()) : curMK();
    const n = st.rows.filter((r) => r.month_year === mk).length;
    const prev = st.rows.filter((r) => r.month_year === prevMK(mk)).length;
    const tgt = opensTarget();
    const c = condition(n, tgt);
    const pct = Math.round(n / tgt * 100);
    const need = early ? 0 : Math.max(0, tgt - n);
    const perDay = early || day >= dim ? 0 : Math.ceil(need / (dim - day));
    const mname = new Date(+mk.split('-')[0], +mk.split('-')[1] - 1, 1).toLocaleDateString('en-US', { month: 'long' });
    $('hqTop').innerHTML = `<header class="hq-mast"><div class="wm" aria-hidden="true">#1</div><div class="hq-in">${HQ.bar('opens')}
      <div style="display:flex;justify-content:space-between;align-items:flex-end;flex-wrap:wrap;gap:26px;padding:40px 0 34px">
        <div><div class="hq-kicker">Every open · every month · every agent</div><div class="hq-title"><span class="chrome">Opens.</span></div></div>
        <div class="hq-panel"><div><div class="hq-lab">${esc(mname)} · opens${early ? ' (final)' : ' so far'}</div>
          <div style="display:flex;align-items:baseline;gap:8px;margin-top:8px"><span class="chrome hq-big">${n}</span><span style="font:500 13px Montserrat,sans-serif;letter-spacing:2px;color:#9FA4A8">/ ${tgt}</span></div>
          <div class="hq-sub">${pct}% of target · ${prev} the month before${perDay ? ` · ${perDay} a day to hit ${tgt}` : ''}</div></div>
          <div style="border-top:3px solid ${c.good ? '#7FA37E' : '#C2956A'}"><div class="hq-lab">Condition</div><div class="chrome hq-cond">${esc(c.name)}</div><div class="hq-sub">${esc(c.formula)}</div></div>
        </div></div></div></header>`;
    HQ.wireBar();
  }

  /* ---------- boot ---------- */
  window.loadOpens = load;
  window.renderOpens = render;
  const _render = render;
  render = function () { top(); _render(); };
  HQ.gate(async () => {
    document.body.innerHTML = '<div id="hqTop"></div><div class="hq-body"><div id="page-opens"></div></div>';
    await loadTargets();
    await load();
  });
})();
