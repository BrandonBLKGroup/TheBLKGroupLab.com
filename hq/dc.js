/* BLK HQ room runtime. Renders the HQ rooms (the .dc.html files built on the HQ canvas) as live React pages.
   Supports what the rooms use: {{holes}}, sc-for, sc-if, onClick/onChange handlers, state, and lifecycle.
   Written for BLK HQ; it reads the room files from /hq/rooms and their media from /hq/media. */
(function () {
  'use strict';
  const R = window.React, h = R.createElement;
  const EVENTS = { onclick: 'onClick', onchange: 'onChange', oninput: 'onInput', onsubmit: 'onSubmit', onkeydown: 'onKeyDown', onkeyup: 'onKeyUp', onmouseenter: 'onMouseEnter', onmouseleave: 'onMouseLeave', onfocus: 'onFocus', onblur: 'onBlur', ondragstart: 'onDragStart', ondragover: 'onDragOver', ondrop: 'onDrop', ondragend: 'onDragEnd' };
  const ATTRS = { class: 'className', for: 'htmlFor', tabindex: 'tabIndex', readonly: 'readOnly', maxlength: 'maxLength', colspan: 'colSpan', rowspan: 'rowSpan', autoplay: 'autoPlay', playsinline: 'playsInline', crossorigin: 'crossOrigin', srcset: 'srcSet', contenteditable: 'contentEditable', autocomplete: 'autoComplete', autofocus: 'autoFocus', frameborder: 'frameBorder', allowfullscreen: 'allowFullScreen', viewbox: 'viewBox', spellcheck: 'spellCheck', enterkeyhint: 'enterKeyHint', inputmode: 'inputMode', datetime: 'dateTime', novalidate: 'noValidate', accesskey: 'accessKey', 'accept-charset': 'acceptCharset', 'http-equiv': 'httpEquiv' };
  const BOOL = new Set(['muted', 'loop', 'autoplay', 'playsinline', 'controls', 'disabled', 'checked', 'selected', 'hidden', 'readonly', 'required', 'multiple', 'open', 'allowfullscreen', 'novalidate', 'defer', 'async']);
  const VOID = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'source', 'track', 'wbr']);
  const TABLEISH = new Set(['table', 'thead', 'tbody', 'tfoot', 'tr', 'colgroup', 'select', 'ul', 'ol']);
  const HOLE = /\{\{\s*([^}]+?)\s*\}\}/g;
  const camel = (s) => s.replace(/-([a-z])/g, (_, c) => c.toUpperCase());

  function get(scope, path) {
    path = String(path || '').trim();
    if (path === 'true') return true; if (path === 'false') return false; if (path === 'null') return null;
    if (/^-?\d+(\.\d+)?$/.test(path)) return Number(path);
    if (/^'.*'$|^".*"$/.test(path)) return path.slice(1, -1);
    return path.split('.').reduce((o, k) => (o == null ? undefined : o[k]), scope);
  }
  const whole = (str) => { const m = String(str).match(/^\s*\{\{\s*([^}]+?)\s*\}\}\s*$/); return m ? m[1] : null; };
  const interp = (str, scope) => String(str).replace(HOLE, (_, p) => { const v = get(scope, p); return v == null ? '' : String(v); });
  function styleObj(css) {
    const o = {}; let depth = 0, cur = '';
    const parts = [];
    for (const ch of String(css || '')) { if (ch === '(') depth++; if (ch === ')') depth--; if (ch === ';' && depth === 0) { parts.push(cur); cur = ''; } else cur += ch; }
    parts.push(cur);
    parts.forEach((p) => { const i = p.indexOf(':'); if (i < 0) return; const k = p.slice(0, i).trim(); const v = p.slice(i + 1).trim(); if (!k || v === '') return; o[k.startsWith('--') ? k : camel(k.toLowerCase())] = v; });
    return o;
  }

  const DC = {
    media: {}, routes: {},
    url(u) {
      if (typeof u !== 'string') return u;
      const b = u.match(/^\/_blob\/([0-9a-f]{32})/); if (b) return DC.media[b[1]] ? 'media/' + DC.media[b[1]] : u;
      const r = u.match(/^(?:\.\/|\/)?([A-Za-z0-9_-]+)\.dc\.html(#.*)?$/); if (r) return (DC.routes[r[1]] || ('room.html?r=' + r[1])) + (r[2] || '');
      if (DC.routes[u]) return DC.routes[u];
      return u;
    },
  };

  function kids(node, scope) {
    const out = []; const parentTag = node.nodeType === 1 ? node.tagName.toLowerCase() : '';
    node.childNodes.forEach((c, i) => {
      if (c.nodeType === 3 && TABLEISH.has(parentTag) && !c.nodeValue.trim()) return;
      const v = build(c, scope, i); if (v == null || v === '') return; if (Array.isArray(v)) v.forEach((x) => out.push(x)); else out.push(v);
    });
    return out;
  }
  function build(node, scope, key) {
    if (node.nodeType === 3) { const t = node.nodeValue; return t.indexOf('{{') < 0 ? t : interp(t, scope); }
    if (node.nodeType !== 1) return null;
    const tag = node.tagName.toLowerCase();
    if (tag === 'helmet' || tag === 'script') return null;
    if (tag === 'sc-for') {
      const list = get(scope, whole(node.getAttribute('list') || '') || '') || []; const as = node.getAttribute('as') || 'item';
      return (Array.isArray(list) ? list : []).map((it, i) => h(R.Fragment, { key: key + '-' + i }, ...kids(node, Object.assign({}, scope, { [as]: it, $index: i }))));
    }
    if (tag === 'sc-if') {
      const v = get(scope, whole(node.getAttribute('value') || '') || '');
      return (v && v !== 'false') ? h(R.Fragment, { key }, ...kids(node, scope)) : null;
    }
    const svg = node.namespaceURI === 'http://www.w3.org/2000/svg';
    const props = { key };
    for (const a of Array.from(node.attributes)) {
      const name = a.name; if (name.startsWith('hint-')) continue;
      const w = whole(a.value); let v = w !== null ? get(scope, w) : (a.value.indexOf('{{') >= 0 ? interp(a.value, scope) : a.value);
      if (EVENTS[name]) { if (typeof v === 'function') props[EVENTS[name]] = v; continue; }
      if (name === 'style') { props.style = styleObj(typeof v === 'string' ? v : ''); continue; }
      if ((name === 'src' || name === 'href' || name === 'poster' || name === 'xlink:href') && typeof v === 'string') v = DC.url(v);
      if (BOOL.has(name)) { if (v === '' || v === true || v === 'true' || v === name) v = true; else if (v === false || v === 'false' || v == null) v = false; }
      let pn = ATTRS[name] || ((svg && name.indexOf('-') > 0 && !name.startsWith('data-') && !name.startsWith('aria-')) ? camel(name) : name);
      if (name === 'xlink:href') pn = 'xlinkHref';
      if ((tag === 'input' || tag === 'textarea' || tag === 'select') && !node.hasAttribute('onchange') && !node.hasAttribute('oninput')) { if (pn === 'value') pn = 'defaultValue'; if (pn === 'checked') pn = 'defaultChecked'; }
      if (tag === 'a' && pn === 'href' && /^https?:/.test(v) && !node.hasAttribute('target')) { props.target = '_blank'; props.rel = 'noopener'; }
      if (v === undefined) continue;
      props[pn] = v;
    }
    if (tag === 'video') { props.muted = true; }
    if (VOID.has(tag)) return h(tag, props);
    return h(tag, props, ...kids(node, scope));
  }

  async function mount(file, el) {
    const res = await fetch(file, { cache: 'no-store' });
    if (!res.ok) throw new Error('Room not found: ' + file);
    const doc = new DOMParser().parseFromString(await res.text(), 'text/html');
    const t = doc.querySelector('title'); if (t) document.title = t.textContent + ' · BLK HQ';
    const helmet = doc.querySelector('helmet');
    if (helmet) helmet.childNodes.forEach((n) => { if (n.nodeType === 1 && /^(style|link)$/i.test(n.tagName)) { const c = document.createElement(n.tagName); Array.from(n.attributes).forEach((a) => c.setAttribute(a.name, a.value)); c.textContent = n.textContent; document.head.appendChild(c); } });
    const root = doc.querySelector('x-dc');
    const code = (doc.querySelector('script[data-dc-script]') || {}).textContent || 'class Component extends DCLogic { renderVals() { return {}; } }';
    class DCLogic extends R.Component {
      constructor(p) { super(p); if (!this.state) this.state = {}; }
      renderVals() { return {}; }
      render() { return h(R.Fragment, null, ...kids(root, Object.assign({}, this.renderVals() || {}))); }
    }
    const Component = new Function('DCLogic', 'React', '"use strict";\n' + code + '\nreturn Component;')(DCLogic, R);
    window.ReactDOM.createRoot(el).render(h(Component, { }));
  }
  DC.mount = mount;
  window.DC = DC;
})();
