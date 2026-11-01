/* BLK HQ · Under Contract room. Live from lab_contracts (same table and checkboxes as the current Lab).
   Deadlines count business days from the contract date (weekends and US federal holidays skipped):
   TC added: instant · Title setup: day 2 · SPD: day 3 · Inspection + IRSA done: day 10 · IRSA response: day 15.
   Appraisal, Termite, Closing set, Closed, Loop done: no deadline, checked as they happen. */
(function () {
  'use strict';
  const esc = HQ.esc;
  const HEADS = { 'Brandon Bruning': '../img/agents/brandon.jpg', 'Shelley Lisko': '../img/agents/shelley.jpg', 'Amanda Mitchell': '../img/agents/amanda.jpg', 'Kevin Cloud': '../img/agents/kevin.jpg' };
  // Order of work (title setup now comes before SPD, per Brandon). k = lab_contracts column.
  const STEPS = [
    { k: 'offer_accepted', l: 'Offer accepted', bd: null },
    { k: 'tc_added', l: 'TC added', bd: 0, who: 'TC' },
    { k: 'title_setup', l: 'Title setup', bd: 2, who: 'TC' },
    { k: 'spd_completed', l: 'SPD done', bd: 3 },
    { k: 'inspection_scheduled', l: 'Inspection', bd: 10 },
    { k: 'irsa_done', l: 'IRSA done', bd: 10 },
    { k: 'irsa_responded', l: 'IRSA responded', bd: 15 },
    { k: 'appraisal_done', l: 'Appraisal', bd: null },
    { k: 'termite_done', l: 'Termite', bd: null },
    { k: 'closing_scheduled', l: 'Closing set', bd: null },
    { k: 'closed', l: 'Closed', bd: null },
    { k: 'loop_submitted', l: 'Loop done', bd: null },
  ];
  // Board columns: a deal sits in the column of its first unchecked step.
  const COLS = [
    { t: 'New file', keys: ['offer_accepted', 'tc_added'] },
    { t: 'Title + SPD', keys: ['title_setup', 'spd_completed'] },
    { t: 'Inspection + IRSA', keys: ['inspection_scheduled', 'irsa_done'] },
    { t: 'IRSA response', keys: ['irsa_responded'] },
    { t: 'Appraisal + termite', keys: ['appraisal_done', 'termite_done'] },
    { t: 'Closing', keys: ['closing_scheduled', 'closed'] },
    { t: 'Loop', keys: ['loop_submitted'] },
  ];
  const st = { rows: [], open: null };
  const pad = (n) => String(n).padStart(2, '0');
  const ymd = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const today = () => ymd(new Date());
  const short = (s) => s ? new Date(s + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '';
  const first = (n) => String(n || '').trim().split(/\s+/)[0] || '';
  const money = (n) => '$' + Math.round(Number(n) || 0).toLocaleString('en-US');
  const initials = (n) => String(n || '?').trim().split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase();
  const av = (name, size) => HEADS[name] ? `<img class="uc-av" style="width:${size}px;height:${size}px" src="${HEADS[name]}" alt="">` : `<span class="uc-av" style="width:${size}px;height:${size}px">${esc(initials(name || 'BLK'))}</span>`;
  const isTC = () => { try { return !!(userProfile && /tc|transaction/i.test(userProfile.role || '')); } catch (e) { return false; } };

  /* ---------- business days, skipping weekends and US federal holidays (observed) ---------- */
  const holCache = {};
  function holidays(y) {
    if (holCache[y]) return holCache[y];
    const set = new Set();
    const add = (d) => { if (d.getDay() === 6) d.setDate(d.getDate() - 1); else if (d.getDay() === 0) d.setDate(d.getDate() + 1); set.add(ymd(d)); };
    const nth = (m, wd, n) => { const d = new Date(y, m, 1); while (d.getDay() !== wd) d.setDate(d.getDate() + 1); d.setDate(d.getDate() + 7 * (n - 1)); return d; };
    const last = (m, wd) => { const d = new Date(y, m + 1, 0); while (d.getDay() !== wd) d.setDate(d.getDate() - 1); return d; };
    add(new Date(y, 0, 1)); set.add(ymd(nth(0, 1, 3))); set.add(ymd(nth(1, 1, 3))); set.add(ymd(last(4, 1)));
    add(new Date(y, 5, 19)); add(new Date(y, 6, 4)); set.add(ymd(nth(8, 1, 1))); set.add(ymd(nth(9, 1, 2)));
    add(new Date(y, 10, 11)); set.add(ymd(nth(10, 4, 4))); add(new Date(y, 11, 25));
    return (holCache[y] = set);
  }
  const isBiz = (d) => d.getDay() !== 0 && d.getDay() !== 6 && !holidays(d.getFullYear()).has(ymd(d));
  function bizAdd(dateStr, n) {
    const d = new Date(dateStr + 'T12:00:00');
    let k = 0; while (k < n) { d.setDate(d.getDate() + 1); if (isBiz(d)) k++; }
    return ymd(d);
  }
  function bizBetween(a, b) { // business days from a to b (b > a), signed
    if (a === b) return 0;
    const s = a < b ? 1 : -1; const d = new Date(a + 'T12:00:00'); let k = 0;
    while (ymd(d) !== b) { d.setDate(d.getDate() + s); if (isBiz(d)) k += s; if (Math.abs(k) > 400) break; }
    return k;
  }
  function due(r, s) { return (s.bd == null || !r.contract_date) ? null : (s.bd === 0 ? r.contract_date : bizAdd(r.contract_date, s.bd)); }
  function stepState(r, s) {
    if (r[s.k]) return 'done';
    const d = due(r, s); if (!d) return 'open';
    const t = today(); return d < t ? 'late' : d === t ? 'today' : 'open';
  }
  function nextStep(r) { return STEPS.find((s) => !r[s.k]) || null; }
  function colOf(r) { const n = nextStep(r); if (!n) return COLS.length - 1; return COLS.findIndex((c) => c.keys.includes(n.k)); }
  function lateSteps(r) { return STEPS.filter((s) => stepState(r, s) === 'late'); }

  /* ---------- data ---------- */
  async function load() {
    const { data, error } = await sb.from('lab_contracts').select('*').eq('status', 'active').order('contract_date', { ascending: true, nullsFirst: false });
    if (error) { $('ucBody').innerHTML = `<p style="padding:30px;color:#C2382E">Could not load deals: ${esc(error.message)}</p>`; return; }
    st.rows = data || [];
    render();
  }
  async function save(id, patch) {
    patch.updated_at = new Date().toISOString();
    const r = st.rows.find((x) => x.id === id); if (r) Object.assign(r, patch);
    const { error } = await sb.from('lab_contracts').update(patch).eq('id', id);
    if (error) alert('Could not save: ' + error.message);
  }
  function myComm(r) {
    let c = r.user_commissions; if (!c || !currentUser) return 0;
    if (typeof c === 'string') { try { c = JSON.parse(c); } catch (e) { return 0; } }
    return Number(c[currentUser.id] || 0);
  }

  /* ---------- the daily TC list (same groups as Shelley's morning email) ---------- */
  function groups() {
    const t = today(); const g = { late: [], today: [], title: [], spd: [], irsa: [], resp: [], appr: [], closing: [], loop: [] };
    st.rows.forEach((r) => {
      const late = lateSteps(r); if (late.length) g.late.push({ r, txt: late.map((s) => `${s.l} (due ${short(due(r, s))})`).join(', ') });
      STEPS.filter((s) => stepState(r, s) === 'today').forEach((s) => g.today.push({ r, txt: s.l }));
      if (!r.title_setup) g.title.push({ r, txt: due(r, STEPS[2]) ? 'due ' + short(due(r, STEPS[2])) : '' });
      else if (!r.spd_completed) g.spd.push({ r, txt: due(r, STEPS[3]) ? 'due ' + short(due(r, STEPS[3])) : '' });
      else if (!r.inspection_scheduled || !r.irsa_done) g.irsa.push({ r, txt: due(r, STEPS[5]) ? 'due ' + short(due(r, STEPS[5])) : '' });
      else if (!r.irsa_responded) g.resp.push({ r, txt: due(r, STEPS[6]) ? 'due ' + short(due(r, STEPS[6])) : '' });
      else if (!r.appraisal_done || !r.termite_done) g.appr.push({ r, txt: [!r.appraisal_done ? 'appraisal' : '', !r.termite_done ? 'termite' : ''].filter(Boolean).join(' + ') });
      else if (!r.closing_scheduled || !r.closed) g.closing.push({ r, txt: !r.closing_scheduled ? 'set closing' : 'closing set' });
      else if (!r.loop_submitted) g.loop.push({ r, txt: 'submit to Loop' });
    });
    return [
      { k: 'late', t: 'Late', items: g.late, red: true }, { k: 'today', t: 'Due today', items: g.today },
      { k: 'title', t: 'Needing title setup', items: g.title }, { k: 'spd', t: 'Needing SPD', items: g.spd },
      { k: 'irsa', t: 'Pending inspection + IRSA', items: g.irsa }, { k: 'resp', t: 'Pending IRSA response', items: g.resp },
      { k: 'appr', t: 'Waiting on appraisal / termite', items: g.appr }, { k: 'closing', t: 'Closing', items: g.closing }, { k: 'loop', t: 'Needs Loop', items: g.loop },
    ].filter((x) => x.items.length);
  }
  function todayList() {
    const gs = groups(); if (!gs.length) return '';
    return `<section class="uc-today"><h3>Today's TC list</h3><div class="grid">${gs.map((x) => `<div class="grp ${x.red ? 'red' : ''}"><b>${esc(x.t)}<span>${x.items.length}</span></b>
      <ul>${x.items.map((it) => `<li data-id="${it.r.id}">${esc((it.r.transaction_name || 'Untitled').split(',')[0])}${it.txt ? `<em>${esc(it.txt)}</em>` : ''}</li>`).join('')}</ul></div>`).join('')}</div></section>`;
  }

  /* ---------- render ---------- */
  function render() {
    top();
    const t = today();
    const cols = COLS.map(() => []); st.rows.forEach((r) => cols[colOf(r)].push(r));
    $('ucBody').innerHTML = `<div class="uc-note">${isTC() ? 'Your files. Check each step as you finish it; the due dates count business days from the contract date.' : 'Every live deal, in the column of its next step. Red means a deadline passed. Click a deal for its full checklist.'}</div>
      ${todayList()}
      <div class="uc-board">${COLS.map((c, i) => `<section class="uc-col"><header><b>${esc(c.t)}</b><span>${cols[i].length}</span></header>
        ${cols[i].map((r) => card(r, t)).join('') || '<div class="uc-empty">No deals here</div>'}</section>`).join('')}</div>
      ${isTC() ? '' : '<button class="uc-add" id="ucAdd">+ New deal</button>'}`;
    $('ucBody').querySelectorAll('.uc-card,.uc-today li').forEach((el) => el.onclick = () => drawer(el.dataset.id));
    $('ucBody').querySelectorAll('.uc-x').forEach((x) => x.onclick = async (e) => {
      e.stopPropagation(); const id = x.dataset.del; const r = st.rows.find((d) => d.id === id);
      if (!confirm(`Delete "${(r && r.transaction_name) || 'this deal'}" for good? This cannot be undone.`)) return;
      const { error } = await sb.from('lab_contracts').delete().eq('id', id);
      if (error) { alert('Could not delete: ' + error.message); return; }
      st.rows = st.rows.filter((d) => d.id !== id); render();
    });
    const add = $('ucAdd'); if (add) add.onclick = async () => {
      const ins = { transaction_name: 'New deal', status: 'active', offer_accepted: true, contract_date: today() };
      try { if (!isAdmin && currentUser) ins.agent_id = currentUser.id; } catch (e) {}
      const { data, error } = await sb.from('lab_contracts').insert(ins).select().single();
      if (error) { alert(error.message); return; }
      await load(); if (data) drawer(data.id);
    };
  }
  function card(r, t) {
    const n = nextStep(r), late = lateSteps(r);
    const nd = n ? due(r, n) : null;
    const dayN = r.contract_date ? Math.max(0, bizBetween(r.contract_date, t)) : null;
    const done = STEPS.filter((s) => r[s.k]).length;
    const dueTxt = !n ? 'All done' : nd ? (nd < t ? `${esc(n.l)} · ${bizBetween(nd, t)} bus. days late` : nd === t ? `${esc(n.l)} · due today` : `${esc(n.l)} · due ${short(nd)}`) : esc(n.l);
    return `<button class="uc-card ${late.length ? 'late' : ''}" data-id="${r.id}">${isTC() ? '' : `<span class="uc-x" data-del="${r.id}" title="Delete this deal" role="button" aria-label="Delete deal">×</span>`}
      <div class="top">${av(r.agent, 24)}<b>${esc(r.transaction_name || 'Untitled deal')}</b></div>
      <div class="meta">${r.contract_date ? `Contract ${short(r.contract_date)} · business day ${dayN}` : '<span style="color:#C2382E">Set the contract date</span>'}</div>
      <div class="next ${late.length ? 'late' : nd === t ? 'today' : ''}">${dueTxt}</div>
      <div class="dots">${STEPS.map((s) => `<i class="${stepState(r, s)}" title="${esc(s.l)}"></i>`).join('')}<span>${done}/${STEPS.length}</span></div>
    </button>`;
  }
  function top() {
    const t = today(); const vol = st.rows.reduce((a, r) => a + (Number(r.volume) || 0), 0);
    const late = st.rows.reduce((a, r) => a + lateSteps(r).length, 0);
    const comm = st.rows.reduce((a, r) => a + myComm(r), 0);
    const dueToday = st.rows.reduce((a, r) => a + STEPS.filter((s) => stepState(r, s) === 'today').length, 0);
    $('hqTop').innerHTML = `<header class="hq-mast"><div class="wm" aria-hidden="true">UC</div><div class="hq-in">${HQ.bar('contract')}
      <div style="display:flex;justify-content:space-between;align-items:flex-end;flex-wrap:wrap;gap:26px;padding:40px 0 34px">
        <div><div class="hq-kicker">Contract to close · every step · every deadline</div><div class="hq-title"><span class="chrome">Under contract.</span></div></div>
        <div class="hq-panel"><div><div class="hq-lab">Live deals</div><div class="chrome hq-big" style="margin-top:8px">${st.rows.length}</div><div class="hq-sub">${isTC() ? '' : money(vol) + ' volume'}</div></div>
          ${isTC() ? '' : `<div><div class="hq-lab">Your pending commission</div><div class="chrome hq-big" style="margin-top:8px;font-size:40px">${money(comm)}</div><div class="hq-sub">From your share on each deal</div></div>`}
          <div style="border-top:3px solid ${late ? '#C2956A' : '#7FA37E'}"><div class="hq-lab">Deadlines</div><div class="chrome hq-cond">${late ? late + ' late' : 'On time'}</div><div class="hq-sub">${dueToday} due today</div></div>
        </div></div></div></header>`;
    HQ.wireBar();
  }

  /* ---------- deal drawer: full checklist ---------- */
  function drawer(id) {
    const r = st.rows.find((x) => x.id === id); if (!r) return;
    document.querySelectorAll('.uc-veil').forEach((v) => v.remove());
    const v = document.createElement('div'); v.className = 'uc-veil';
    const t = today();
    v.innerHTML = `<aside class="uc-drawer" role="dialog" aria-modal="true" aria-label="Deal">
      <header>${av(r.agent, 40)}<div class="t"><input class="nm" data-f="transaction_name" value="${esc(r.transaction_name || '')}" placeholder="Property address" ${isTC() ? 'readonly' : ''}>
        <span>${esc(first(r.agent) || 'No agent')}${r.contract_date ? ` · contract ${short(r.contract_date)} · business day ${Math.max(0, bizBetween(r.contract_date, t))}` : ''}</span></div><button class="x" aria-label="Close">×</button></header>
      <div class="fields">
        <label>Contract date<input type="date" data-f="contract_date" value="${esc(r.contract_date || '')}" ${isTC() ? 'readonly' : ''}></label>
        ${isTC() ? '' : `<label>Agent<select data-f="agent"><option value="">No agent</option>${AGENTS.concat(r.agent && !AGENTS.includes(r.agent) ? [r.agent] : []).map((a) => `<option${a === r.agent ? ' selected' : ''}>${esc(a)}</option>`).join('')}</select></label>
        <label>Volume<input type="number" data-f="volume" value="${esc(r.volume || '')}" placeholder="0"></label>
        <label>Your commission<input type="number" data-comm value="${myComm(r) || ''}" placeholder="0"></label>`}
      </div>
      <ol class="steps">${STEPS.map((s) => { const d = due(r, s), ss = stepState(r, s); return `<li class="${ss}"><label><input type="checkbox" data-k="${s.k}" ${r[s.k] ? 'checked' : ''}><span>${esc(s.l)}${s.who ? ` <em>${s.who}</em>` : ''}</span></label>
        <time>${r[s.k] ? 'Done' : d ? (ss === 'late' ? `Late · was due ${short(d)}` : ss === 'today' ? 'Due today' : `Due ${short(d)}`) : s.bd == null ? 'When it happens' : 'Set contract date'}</time></li>`; }).join('')}</ol>
      ${isTC() ? '' : `<footer><button class="ghost danger" data-act="delete">Delete deal</button><button class="ghost" data-act="archive">Archive deal</button></footer>`}
    </aside>`;
    document.body.appendChild(v);
    const close = () => { v.remove(); document.removeEventListener('keydown', onKey); render(); };
    const onKey = (e) => { if (e.key === 'Escape') close(); };
    document.addEventListener('keydown', onKey);
    v.addEventListener('click', (e) => { if (e.target === v) close(); });
    v.querySelector('.x').onclick = close;
    v.querySelectorAll('[data-f]').forEach((inp) => inp.addEventListener('change', async () => {
      const f = inp.dataset.f; const patch = { [f]: inp.value || null };
      if (f === 'contract_date' && inp.value) { patch.spd_due = bizAdd(inp.value, 3); patch.irsa_due = bizAdd(inp.value, 10); }
      await save(id, patch); drawer(id);
    }));
    const cm = v.querySelector('[data-comm]'); if (cm) cm.addEventListener('change', async () => {
      let c = r.user_commissions || {}; if (typeof c === 'string') { try { c = JSON.parse(c); } catch (e) { c = {}; } }
      c[currentUser.id] = Number(cm.value) || 0; await save(id, { user_commissions: c });
    });
    v.querySelectorAll('input[type=checkbox][data-k]').forEach((cb) => cb.addEventListener('change', async () => {
      await save(id, { [cb.dataset.k]: cb.checked });
      if (cb.dataset.k === 'closed' && cb.checked) alert('Closed. The Sold chain starts here: Just Sold mailer, graphics, posts and the trophy case. (The agents pick this up as they come online.)');
      drawer(id);
    }));
    const del = v.querySelector('[data-act="delete"]'); if (del) del.onclick = async () => {
      if (!confirm(`Delete "${r.transaction_name || 'this deal'}" for good? This cannot be undone. (Archive keeps it out of sight instead.)`)) return;
      const { error } = await sb.from('lab_contracts').delete().eq('id', id);
      if (error) { alert('Could not delete: ' + error.message); return; }
      st.rows = st.rows.filter((x) => x.id !== id); close();
    };
    const ar = v.querySelector('[data-act="archive"]'); if (ar) ar.onclick = async () => {
      if (!confirm('Archive this deal? It leaves the board but stays in the database.')) return;
      await save(id, { status: 'archived' }); st.rows = st.rows.filter((x) => x.id !== id); close();
    };
  }

  HQ.gate(async () => {
    document.body.innerHTML = '<div id="hqTop"></div><div class="hq-body"><div id="ucBody" class="uc-wrap"></div></div>';
    await load();
  });
})();
