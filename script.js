(function () {
/* =========================================================================
   01 · CORE — DOM helpers, formatters, storage, toasts
   ========================================================================= */
'use strict';

const YT = {};

/* ------------------------------- DOM ----------------------------------- */
YT.$ = (sel, root) => (root || document).querySelector(sel);
YT.$$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));

YT.icon = function (name, cls) {
  return '<svg class="' + (cls || 'icon') + '" aria-hidden="true"><use href="#i-' + name + '"></use></svg>';
};

const ESC_MAP = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
YT.esc = function (value) {
  return String(value == null ? '' : value).replace(/[&<>"']/g, c => ESC_MAP[c]);
};

YT.plain = function (value) {
  if (value == null) return '';
  const s = String(value);
  if (!/[&<>]/.test(s)) return s;
  try {
    const doc = new DOMParser().parseFromString('<textarea>' + s.replace(/<\/textarea/gi, '') + '</textarea>', 'text/html');
    return doc.querySelector('textarea') ? doc.querySelector('textarea').textContent : s;
  } catch (e) { return s; }
};

YT.stripTags = function (html) {
  if (html == null) return '';
  try {
    const doc = new DOMParser().parseFromString(String(html), 'text/html');
    return doc.body ? (doc.body.textContent || '') : '';
  } catch (e) { return String(html); }
};

YT.attr = function (value) { return YT.esc(value); };

YT.el = function (tag, cls, html) {
  const node = document.createElement(tag);
  if (cls) node.className = cls;
  if (html != null) node.innerHTML = html;
  return node;
};

YT.isTyping = function (el) {
  if (!el) return false;
  const tag = el.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || el.isContentEditable;
};

/* ------------------------------ format --------------------------------- */
YT.pad = n => (n < 10 ? '0' : '') + n;

YT.fmtNum = function (n) {
  const num = Number(n);
  if (!isFinite(num)) return '';
  return num.toLocaleString('en-US');
};

YT.fmtShort = function (n) {
  let num = Number(n);
  if (!isFinite(num) || num < 0) return '';
  if (num < 1000) return String(num);
  let out;
  if (num < 1e6) out = (num / 1e3).toFixed(num < 1e4 ? 1 : 0) + 'K';
  else if (num < 1e9) out = (num / 1e6).toFixed(num < 1e7 ? 1 : 0) + 'M';
  else out = (num / 1e9).toFixed(1) + 'B';
  return out.replace(/\.0([KMB])$/, '$1');
};

YT.fmtViews = function (n, text) {
  if (text) return text;
  const num = Number(n);
  if (!isFinite(num) || num < 0) return '';
  if (num === 0) return 'No views';
  return (num === 1 ? '1 view' : YT.fmtShort(num) + ' views');
};

YT.fmtSubs = function (n) {
  const num = Number(n);
  if (!isFinite(num) || num <= 0) return '';
  return YT.fmtShort(num) + ' subscribers';
};

YT.timeAgo = function (ts) {
  if (!ts) return '';
  const diff = Math.max(1000, Date.now() - Number(ts));
  const s = Math.floor(diff / 1000);
  if (s < 60) return 'just now';
  const m = Math.floor(s / 60);
  if (m < 60) return m + (m === 1 ? ' minute ago' : ' minutes ago');
  const h = Math.floor(m / 60);
  if (h < 24) return h + (h === 1 ? ' hour ago' : ' hours ago');
  const d = Math.floor(h / 24);
  if (d < 7) return d + (d === 1 ? ' day ago' : ' days ago');
  if (d < 30) { const w = Math.floor(d / 7); return w + (w === 1 ? ' week ago' : ' weeks ago'); }
  if (d < 365) { const mo = Math.floor(d / 30); return mo + (mo === 1 ? ' month ago' : ' months ago'); }
  const y = Math.floor(d / 365);
  return y + (y === 1 ? ' year ago' : ' years ago');
};

YT.parseAgo = function (text) {
  if (!text) return 0;
  const m = String(text).toLowerCase().match(/(\d+)\s*(second|minute|hour|day|week|month|year)/);
  if (!m) return 0;
  const n = Number(m[1]);
  const unit = m[2];
  const mult = {
    second: 1e3, minute: 6e4, hour: 36e5, day: 864e5,
    week: 6048e5, month: 2592e6, year: 31536e6
  }[unit];
  return mult ? Date.now() - n * mult : 0;
};

YT.fmtDuration = function (seconds) {
  const s = Math.floor(Number(seconds) || 0);
  if (s <= 0) return '';
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return h ? h + ':' + YT.pad(m) + ':' + YT.pad(sec) : m + ':' + YT.pad(sec);
};

YT.parseDuration = function (text) {
  if (!text) return 0;
  return String(text).split(':').map(Number).reduce((acc, n) => acc * 60 + (isFinite(n) ? n : 0), 0);
};

YT.fmtDate = function (ts) {
  if (!ts) return '';
  try {
    return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch (e) { return ''; }
};

YT.fmtFullDate = function (ts) {
  if (!ts) return '';
  try {
    return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch (e) { return ''; }
};

/* ------------------------------ misc ----------------------------------- */
YT.uid = function () {
  try {
    if (crypto && crypto.randomUUID) return crypto.randomUUID().replace(/-/g, '').slice(0, 16);
  } catch (e) {}
  return 'l' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
};

YT.clamp = (n, min, max) => Math.min(max, Math.max(min, n));

YT.debounce = function (fn, wait) {
  let t;
  return function () {
    const args = arguments, self = this;
    clearTimeout(t);
    t = setTimeout(() => fn.apply(self, args), wait);
  };
};

YT.throttle = function (fn, wait) {
  let last = 0, timer = null;
  return function () {
    const args = arguments, self = this, now = Date.now();
    const remaining = wait - (now - last);
    if (remaining <= 0) {
      clearTimeout(timer); timer = null; last = now; fn.apply(self, args);
    } else if (!timer) {
      timer = setTimeout(() => { last = Date.now(); timer = null; fn.apply(self, args); }, remaining);
    }
  };
};

YT.sleep = ms => new Promise(r => setTimeout(r, ms));

YT.pool = async function (items, limit, worker) {
  const list = Array.from(items);
  const out = new Array(list.length);
  let cursor = 0;
  const n = Math.max(1, Math.min(limit || 4, list.length || 1));
  async function run() {
    while (cursor < list.length) {
      const i = cursor++;
      try { out[i] = await worker(list[i], i); }
      catch (e) { out[i] = null; }
    }
  }
  await Promise.all(Array.from({ length: n }, run));
  return out;
};

YT.uniqBy = function (list, keyFn) {
  const seen = new Set(), out = [];
  for (const item of list) {
    if (!item) continue;
    const key = keyFn(item);
    if (!key || seen.has(key)) continue;
    seen.add(key); out.push(item);
  }
  return out;
};

YT.shuffle = function (list) {
  const a = list.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const t = a[i]; a[i] = a[j]; a[j] = t;
  }
  return a;
};

YT.normalizeText = function (s) {
  return String(s || '').toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '');
};

YT.tokens = function (text, max) {
  const STOP = YT.STOPWORDS;
  const found = YT.normalizeText(text).split(/[^\p{L}\p{N}]+/u);
  const set = new Set();
  for (const raw of found) {
    if (raw.length < 3 || raw.length > 26) continue;
    if (STOP.has(raw)) continue;
    set.add(raw);
    if (max && set.size >= max) break;
  }
  return set;
};

YT.STOPWORDS = new Set(('the a an and or for to of in on with at from by is are was were be this that these those ' +
  'you your yours my we our ours it its as how what why when who whom i me he she they them his her their ' +
  'not no do does did done can could would should will shall may might must just very too also than then ' +
  'there here all any some more most much many few other into over under about after before between ' +
  'video videos official full hd 4k live new best vs ft feat featuring ep part').split(' '));

YT.linkify = function (text) {
  const safe = YT.esc(text);
  return safe.replace(/(https?:\/\/[^\s<]+[^\s<.,:;"')\]}])/g, function (url) {
    return '<a href="' + url + '" target="_blank" rel="noopener noreferrer nofollow">' + url + '</a>';
  });
};

YT.hashtags = function (text) {
  const out = [];
  const re = /(^|\s)#([\p{L}\p{N}_]{2,40})/gu;
  let m;
  while ((m = re.exec(String(text || '')))) {
    if (!out.includes(m[2])) out.push(m[2]);
    if (out.length >= 8) break;
  }
  return out;
};

/* ------------------------------ storage -------------------------------- */
YT.storage = {
  get(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      if (raw == null) return fallback;
      return JSON.parse(raw);
    } catch (e) { return fallback; }
  },
  set(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); return true; }
    catch (e) { return false; }
  },
  del(key) {
    try { localStorage.removeItem(key); } catch (e) {}
  },
  keys(prefix) {
    const out = [];
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.indexOf(prefix) === 0) out.push(k);
      }
    } catch (e) {}
    return out;
  }
};

YT.copy = async function (text) {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch (e) {}
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed'; ta.style.opacity = '0'; ta.style.pointerEvents = 'none';
    document.body.appendChild(ta); ta.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    return ok;
  } catch (e) { return false; }
};

YT.download = function (filename, text, mime) {
  const blob = new Blob([text], { type: mime || 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
};

/* ------------------------------ toast ---------------------------------- */
YT.toast = function (message, opts) {
  const options = opts || {};
  const root = YT.$('#toastRoot');
  if (!root) return;
  const node = document.createElement('div');
  node.className = 'toast';
  const msg = document.createElement('div');
  msg.className = 'toast-msg';
  msg.textContent = message;
  node.appendChild(msg);
  if (options.action) {
    const btn = document.createElement('button');
    btn.className = 'toast-action';
    btn.textContent = options.action;
    btn.addEventListener('click', function () {
      if (options.onAction) options.onAction();
      close();
    });
    node.appendChild(btn);
  }
  const x = document.createElement('button');
  x.className = 'toast-close';
  x.setAttribute('aria-label', 'Dismiss');
  x.innerHTML = YT.icon('close', 'icon icon-xs');
  node.appendChild(x);
  root.appendChild(node);

  let timer = null;
  function close() {
    clearTimeout(timer);
    node.style.opacity = '0';
    node.style.transition = 'opacity .15s';
    setTimeout(() => node.remove(), 180);
  }
  x.addEventListener('click', close);
  timer = setTimeout(close, options.timeout || 4200);
  return close;
};

/* ------------------------------ images --------------------------------- */
YT.PH = {
  thumb: 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360"><rect width="640" height="360" fill="#1f1f1f"/><path d="M298 148v64l54-32z" fill="#3a3a3a"/></svg>'),
  avatar: 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="88" height="88"><rect width="88" height="88" rx="44" fill="#2b2b2b"/><circle cx="44" cy="35" r="14" fill="#555"/><path d="M18 78a26 26 0 0 1 52 0z" fill="#555"/></svg>')
};

YT.thumbAttrs = function (id, opts) {
  const o = opts || {};
  const list = o.short
    ? ['oar2.jpg', 'hq720.jpg', 'hqdefault.jpg']
    : o.small
      ? ['mqdefault.jpg', 'hqdefault.jpg', 'default.jpg']
      : ['hq720.jpg', 'hqdefault.jpg', 'mqdefault.jpg'];
  const urls = list.map(q => 'https://i.ytimg.com/vi/' + id + '/' + q);
  return 'src="' + urls[0] + '" data-fb="' + urls.slice(1).join('|') + '" data-fbi="0"';
};

/* Global image fallback chain. */
document.addEventListener('error', function (event) {
  const img = event.target;
  if (!img || img.tagName !== 'IMG') return;
  if (img.classList.contains('avatar') || img.closest('.card-avatar') || img.closest('.comment-avatar') ||
      img.closest('.channel-bar-avatar') || img.closest('.side-avatar') || img.closest('.ch-avatar') ||
      img.closest('.channel-head-avatar') || img.closest('.you-avatar') || img.classList.contains('ch-avatar')) {
    img.classList.add('failed');
    if (img.parentElement) img.parentElement.classList.add('failed');
    return;
  }
  const chain = (img.getAttribute('data-fb') || '').split('|').filter(Boolean);
  const i = Number(img.getAttribute('data-fbi') || 0);
  if (i < chain.length && chain[i]) {
    img.setAttribute('data-fbi', String(i + 1));
    img.src = chain[i];
    return;
  }
  if (!img.dataset.phDone) {
    img.dataset.phDone = '1';
    img.src = YT.PH.thumb;
  }
}, true);

/* ------------------------------ scroll --------------------------------- */
YT.scrollTop = function (smooth) {
  try { window.scrollTo({ top: 0, behavior: smooth ? 'smooth' : 'auto' }); }
  catch (e) { window.scrollTo(0, 0); }
};
/* =========================================================================
   02 · API — real YouTube data without an API key
   Primary source: Piped (public instances, CORS enabled, proxies YouTube).
   Fallback: Invidious (channel pages, shorts, playlists).
   Nothing here needs a key or a server.
   ========================================================================= */
'use strict';

YT.api = (function () {
  const PIPED = [
    'https://api.piped.private.coffee',
    'https://pipedapi.ducks.party'
  ];
  const INVIDIOUS = [
    'https://yt.chocolatemoo53.com'
  ];
  const ORDER_KEY = 'yt.apiorder.v1';
  const CACHE_PREFIX = 'yt.cache.v1:';
  const memory = new Map();
  const cooling = Object.create(null);
  const api = { lastStale: false, using: '' };
  let invBase = INVIDIOUS[0];

  function order() {
    const saved = YT.storage.get(ORDER_KEY, null);
    if (Array.isArray(saved) && saved.length) {
      const clean = saved.filter(b => PIPED.includes(b));
      for (const b of PIPED) if (!clean.includes(b)) clean.push(b);
      return clean;
    }
    return PIPED.slice();
  }

  function promote(base) {
    const list = order().filter(b => b !== base);
    list.unshift(base);
    YT.storage.set(ORDER_KEY, list);
  }

  function isCooling(base) {
    return cooling[base] && cooling[base] > Date.now();
  }

  function cool(base) {
    cooling[base] = Date.now() + 25000;
  }

  async function fetchJson(url, timeout) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeout || 12000);
    try {
      const res = await fetch(url, {
        signal: ctrl.signal,
        mode: 'cors',
        credentials: 'omit',
        cache: 'default',
        referrerPolicy: 'no-referrer'
      });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const text = await res.text();
      let data;
      try { data = JSON.parse(text); }
      catch (e) { throw new Error('Unexpected response'); }
      if (data && data.error && !data.items && !data.comments) throw new Error(String(data.error));
      return data;
    } finally {
      clearTimeout(timer);
    }
  }

  function setCache(key, data) {
    const entry = { t: Date.now(), d: data };
    memory.set(key, entry);
    if (memory.size > 160) {
      const first = memory.keys().next().value;
      memory.delete(first);
    }
    try {
      const json = JSON.stringify(data);
      if (json.length > 420000) return;
      localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(entry));
    } catch (e) {}
    prune();
  }

  function prune() {
    try {
      const keys = YT.storage.keys(CACHE_PREFIX);
      if (keys.length < 70) return;
      const rows = keys.map(k => {
        let t = 0;
        try { t = JSON.parse(localStorage.getItem(k) || '{}').t || 0; } catch (e) {}
        return { k, t };
      }).sort((a, b) => a.t - b.t);
      const remove = rows.slice(0, rows.length - 60);
      for (const row of remove) localStorage.removeItem(row.k);
    } catch (e) {}
  }

  function cached(key, ttl, producer) {
    const now = Date.now();
    const mem = memory.get(key);
    if (mem && now - mem.t < ttl) return Promise.resolve(mem.d);
    let stored = null;
    try {
      stored = JSON.parse(localStorage.getItem(CACHE_PREFIX + key) || 'null');
    } catch (e) { stored = null; }
    if (stored && stored.d != null && now - stored.t < ttl) {
      memory.set(key, stored);
      return Promise.resolve(stored.d);
    }
    return producer().then(data => {
      api.lastStale = false;
      setCache(key, data);
      return data;
    }).catch(err => {
      if (stored && stored.d != null) {
        api.lastStale = true;
        memory.set(key, stored);
        return stored.d;
      }
      throw err;
    });
  }

  api.cached = cached;

  api.piped = async function (path, opts) {
    const o = opts || {};
    const list = order();
    let lastErr = null;
    let tried = 0;
    for (const base of list) {
      if (isCooling(base)) continue;
      tried++;
      try {
        const data = await fetchJson(base + path, o.timeout || 12000);
        api.using = base;
        promote(base);
        return data;
      } catch (err) {
        lastErr = err;
        cool(base);
      }
    }
    if (!tried) {
      // Everything is cooling down: retry the freshest instance once.
      const base = list[0];
      const data = await fetchJson(base + path, o.timeout || 12000);
      api.using = base;
      return data;
    }
    throw lastErr || new Error('YouTube data source unavailable');
  };

  api.inv = async function (path, opts) {
    const o = opts || {};
    const bases = [invBase].concat(INVIDIOUS.filter(b => b !== invBase));
    let lastErr = null;
    for (const base of bases) {
      try {
        const data = await fetchJson(base + path, o.timeout || 12000);
        if (data && (data.error || data._raw)) throw new Error('Invidious error');
        invBase = base;
        return data;
      } catch (err) {
        lastErr = err;
      }
    }
    throw lastErr || new Error('Channel data unavailable');
  };

  /* --------------------------- normalisers ------------------------------ */
  function idFromUrl(url) {
    if (!url) return '';
    try {
      const u = new URL(url, 'https://www.youtube.com');
      const v = u.searchParams.get('v');
      if (v) return v;
      const m = u.pathname.match(/\/(?:shorts|embed|live)\/([A-Za-z0-9_-]{6,})/);
      return m ? m[1] : '';
    } catch (e) {
      const m = String(url).match(/[?&]v=([A-Za-z0-9_-]{6,})/);
      return m ? m[1] : '';
    }
  }

  function channelIdFromUrl(url) {
    if (!url) return '';
    const s = String(url);
    const m = s.match(/\/channel\/([A-Za-z0-9_-]+)/);
    if (m) return m[1];
    const c = s.match(/\/c\/([^/?#]+)/);
    if (c) return '@' + decodeURIComponent(c[1]);
    const a = s.match(/\/@([^/?#]+)/);
    if (a) return '@' + decodeURIComponent(a[1]);
    return s.replace(/^\//, '');
  }

  function listIdFromUrl(url) {
    if (!url) return '';
    try { return new URL(url, 'https://www.youtube.com').searchParams.get('list') || ''; }
    catch (e) { return ''; }
  }

  function cleanAvatar(url, size) {
    if (!url) return '';
    let u = String(url).trim();
    if (!u) return '';
    if (u.indexOf('//') === 0) u = 'https:' + u;
    if (u.indexOf('?host=') > -1) {
      try {
        const parsed = new URL(u);
        const host = parsed.searchParams.get('host');
        if (host) u = 'https://' + host + parsed.pathname;
      } catch (e) {}
    }
    const gi = u.indexOf('/ggpht/');
    if (gi > -1) u = 'https://yt3.ggpht.com/' + u.slice(gi + 7);
    if (u.indexOf('yt3.ggpht.com') > -1 || u.indexOf('yt3.googleusercontent.com') > -1) {
      u = u.replace(/=[swh]\d+[^/]*$/, '') + '=s' + (size || 88) + '-c-k-c0x00ffffff-no-rj';
    }
    return u;
  }

  function cleanBanner(url) {
    if (!url) return '';
    let u = String(url);
    if (u.indexOf('//') === 0) u = 'https:' + u;
    if (u.indexOf('?host=') > -1) {
      try {
        const parsed = new URL(u);
        const host = parsed.searchParams.get('host');
        if (host) u = 'https://' + host + parsed.pathname + parsed.search;
      } catch (e) {}
    }
    const gi = u.indexOf('/ggpht/');
    if (gi > -1) u = 'https://yt3.ggpht.com/' + u.slice(gi + 7);
    return u;
  }

  function pickThumb(list) {
    if (!Array.isArray(list) || !list.length) return '';
    let best = list[0];
    for (const t of list) {
      if ((t.width || 0) > (best.width || 0)) best = t;
    }
    return best.url || '';
  }

  function publishedFromInv(v) {
    if (v.published) return Number(v.published) * 1000;
    if (v.publishedText) return YT.parseAgo(v.publishedText) || null;
    return null;
  }

  function normPipedStream(s, opts) {
    const o = opts || {};
    if (!s) return null;
    const id = s.id || idFromUrl(s.url);
    if (!id) return null;
    const views = Number(s.views);
    const dur = Number(s.duration);
    const published = Number(s.uploaded) > 0
      ? Number(s.uploaded)
      : (s.uploadDate ? Date.parse(s.uploadDate) : (s.uploadedDate ? YT.parseAgo(s.uploadedDate) : null));
    return {
      id: id,
      title: String(s.title || ''),
      thumb: 'https://i.ytimg.com/vi/' + id + '/hq720.jpg',
      channel: {
        id: channelIdFromUrl(s.uploaderUrl || ''),
        name: String(s.uploaderName || s.uploader || ''),
        avatar: cleanAvatar(s.uploaderAvatar || ''),
        verified: !!(s.uploaderVerified)
      },
      views: isFinite(views) && views >= 0 ? views : null,
      viewsText: isFinite(views) && views >= 0 ? YT.fmtViews(views) : '',
      published: published || null,
      publishedText: s.uploadedDate || (published ? YT.timeAgo(published) : ''),
      duration: isFinite(dur) && dur > 0 ? dur : 0,
      isShort: !!s.isShort || !!o.short,
      live: !!(s.livestream),
      description: String(s.shortDescription || s.description || ''),
      tags: Array.isArray(s.tags) ? s.tags : []
    };
  }

  function normInvVideo(v, opts) {
    const o = opts || {};
    if (!v || !v.videoId) return null;
    const published = publishedFromInv(v);
    const views = Number(v.viewCount);
    return {
      id: v.videoId,
      title: String(v.title || ''),
      thumb: 'https://i.ytimg.com/vi/' + v.videoId + '/hq720.jpg',
      channel: {
        id: v.authorId || '',
        name: String(v.author || ''),
        avatar: cleanAvatar(pickThumb(v.authorThumbnails)),
        verified: !!v.authorVerified
      },
      views: isFinite(views) && views >= 0 ? views : null,
      viewsText: isFinite(views) && views > 0 ? YT.fmtViews(views) : '',
      published: published || null,
      publishedText: published ? YT.timeAgo(published) : '',
      duration: Number(v.lengthSeconds) || 0,
      isShort: !!o.short || !!v.isShort,
      live: !!v.liveNow,
      description: String(v.description || ''),
      tags: Array.isArray(v.keywords) ? v.keywords : []
    };
  }

  function normPipedChannel(c) {
    if (!c) return null;
    const id = c.id || channelIdFromUrl(c.url || c.uploaderUrl || '');
    if (!id) return null;
    const subs = Number(c.subscribers);
    return {
      id: id,
      name: String(c.name || c.uploader || ''),
      avatar: cleanAvatar(c.thumbnail || c.uploaderAvatar || '', 176),
      banner: cleanBanner(c.bannerUrl || ''),
      subs: isFinite(subs) && subs >= 0 ? subs : null,
      subsText: isFinite(subs) && subs > 0 ? YT.fmtSubs(subs) : '',
      description: String(c.description || ''),
      verified: !!c.verified
    };
  }

  function normInvChannel(c) {
    if (!c) return null;
    const subs = Number(c.subCount);
    return {
      id: c.authorId,
      name: String(c.author || ''),
      avatar: cleanAvatar(pickThumb(c.authorThumbnails), 176),
      banner: cleanBanner(pickThumb(c.authorBanners)),
      subs: isFinite(subs) && subs >= 0 ? subs : null,
      subsText: isFinite(subs) && subs > 0 ? YT.fmtSubs(subs) : '',
      description: String(c.description || ''),
      verified: !!c.authorVerified,
      joined: c.joined || null,
      totalViews: c.totalViews || 0,
      tabs: c.tabs || [],
      latestVideos: Array.isArray(c.latestVideos) ? c.latestVideos.map(v => normInvVideo(v)).filter(Boolean) : [],
      relatedChannels: c.relatedChannels || []
    };
  }

  function normPipedPlaylist(p) {
    if (!p) return null;
    const id = listIdFromUrl(p.url || '') || p.id || '';
    if (!id) return null;
    const count = Number(p.videoCount);
    return {
      id: id,
      title: String(p.name || p.title || ''),
      thumb: cleanBanner(p.thumbnail || p.thumbnailUrl || ''),
      channel: { id: channelIdFromUrl(p.uploaderUrl || ''), name: String(p.uploaderName || p.uploader || ''), avatar: cleanAvatar(p.uploaderAvatar || ''), verified: !!p.uploaderVerified },
      count: isFinite(count) ? count : 0
    };
  }

  function normInvPlaylist(p) {
    if (!p) return null;
    const count = Number(p.videoCount);
    return {
      id: p.playlistId,
      title: String(p.title || ''),
      thumb: p.playlistThumbnail || '',
      channel: { id: p.authorId || '', name: String(p.author || ''), avatar: '', verified: !!p.authorVerified },
      count: isFinite(count) ? count : 0
    };
  }

  function normPipedComment(c) {
    return {
      id: c.commentId || '',
      author: YT.stripTags(c.author || ''),
      authorId: channelIdFromUrl(c.commentorUrl || ''),
      avatar: cleanAvatar(c.thumbnail || ''),
      text: YT.stripTags(c.commentText || ''),
      likes: Number(c.likeCount) || 0,
      time: c.commentedTime || '',
      pinned: !!c.pinned,
      hearted: !!c.hearted,
      owner: !!c.channelOwner,
      verified: !!c.verified,
      replyCount: Number(c.replyCount) || 0,
      repliesToken: c.repliesPage || null
    };
  }

  function normInvComment(c) {
    return {
      id: c.commentId || '',
      author: YT.stripTags(c.author || ''),
      authorId: c.authorId || '',
      avatar: cleanAvatar(c.authorThumbnail || ''),
      text: YT.stripTags(c.content || c.contentHtml || ''),
      likes: Number(c.likeCount) || 0,
      time: c.published ? YT.timeAgo(c.published * 1000) : (c.publishedText || ''),
      pinned: !!c.isPinned,
      hearted: !!c.creatorHeart,
      owner: !!c.authorIsChannelOwner,
      verified: !!c.verified,
      replyCount: Number(c.replyCount) || 0,
      repliesToken: c.continuation || null
    };
  }

  function normPipedChannelDetail(c) {
    const base = normPipedChannel(c);
    if (!base) return null;
    const subs = Number(c.subscriberCount);
    base.subs = isFinite(subs) && subs >= 0 ? subs : base.subs;
    base.subsText = isFinite(subs) && subs > 0 ? YT.fmtSubs(subs) : base.subsText;
    return base;
  }

  api.cleanAvatar = cleanAvatar;
  api.cleanBanner = cleanBanner;
  api.idFromUrl = idFromUrl;
  api.channelIdFromUrl = channelIdFromUrl;
  api.listIdFromUrl = listIdFromUrl;
  api.norm = {
    pipedStream: normPipedStream,
    invVideo: normInvVideo,
    pipedChannel: normPipedChannel,
    invChannel: normInvChannel,
    pipedPlaylist: normPipedPlaylist,
    invPlaylist: normInvPlaylist,
    pipedComment: normPipedComment,
    invComment: normInvComment
  };

  /* ------------------------------ search -------------------------------- */
  api.search = function (query, filter, nextpage) {
    const f = filter || 'videos';
    const q = String(query || '').trim();
    if (!q) return Promise.resolve({ items: [], nextpage: null });
    if (nextpage) {
      const path = '/nextpage/search?nextpage=' + encodeURIComponent(nextpage) +
        '&q=' + encodeURIComponent(q) + '&filter=' + encodeURIComponent(f);
      return api.piped(path).then(d => ({
        items: (d.items || []).map(it => normalizeSearchItem(it, f)).filter(Boolean),
        nextpage: d.nextpage || null
      }));
    }
    return cached('search:' + f + ':' + q.toLowerCase(), 10 * 60e3, async () => {
      try {
        const d = await api.piped('/search?q=' + encodeURIComponent(q) + '&filter=' + encodeURIComponent(f));
        return {
          items: (d.items || []).map(it => normalizeSearchItem(it, f)).filter(Boolean),
          nextpage: d.nextpage || null,
          suggestion: d.suggestion || null,
          corrected: !!d.corrected
        };
      } catch (err) {
        return searchFromInvidious(q, f);
      }
    });
  };

  async function searchFromInvidious(q, filter) {
    const type = filter === 'channels' ? 'channel' : filter === 'playlists' ? 'playlist' : filter === 'all' ? 'all' : 'video';
    const d = await api.inv('/api/v1/search?q=' + encodeURIComponent(q) + '&type=' + type);
    const arr = Array.isArray(d) ? d : [];
    const items = [];
    for (const it of arr) {
      if (it && it.type === 'video' && (filter === 'videos' || filter === 'all')) {
        const v = normInvVideo(it);
        if (v) items.push({ kind: 'video', value: v });
      } else if (it && it.type === 'channel' && (filter === 'channels' || filter === 'all')) {
        const c = normInvChannel(it);
        if (c) items.push({ kind: 'channel', value: c });
      } else if (it && it.type === 'playlist' && (filter === 'playlists' || filter === 'all')) {
        const p = normInvPlaylist(it);
        if (p) items.push({ kind: 'playlist', value: p });
      }
    }
    return { items: items, nextpage: null };
  }

  function normalizeSearchItem(it, filter) {
    if (!it) return null;
    if (it.type === 'stream' || it.url && /\/watch\?/.test(it.url)) {
      return { kind: 'video', value: normPipedStream(it) };
    }
    if (it.type === 'channel' || it.url && /\/channel\//.test(it.url)) {
      return { kind: 'channel', value: normPipedChannel(it) };
    }
    if (it.type === 'playlist' || it.url && /\/playlist\?/.test(it.url)) {
      return { kind: 'playlist', value: normPipedPlaylist(it) };
    }
    return null;
  }

  api.suggestions = function (query) {
    const q = String(query || '').trim();
    if (!q) return Promise.resolve([]);
    return cached('sug:' + q.toLowerCase(), 60 * 60e3, async () => {
      try {
        const d = await api.piped('/suggestions?query=' + encodeURIComponent(q), { timeout: 7000 });
        if (Array.isArray(d)) return d.slice(0, 12).map(String);
      } catch (e) {}
      try {
        const d = await api.inv('/api/v1/search/suggestions?q=' + encodeURIComponent(q), { timeout: 7000 });
        if (d && Array.isArray(d.suggestions)) return d.suggestions.slice(0, 12).map(String);
      } catch (e) {}
      return [];
    });
  };

  /* ------------------------------ video --------------------------------- */
  api.video = function (id) {
    return cached('video:' + id, 30 * 60e3, async () => {
      try {
        const s = await api.piped('/streams/' + encodeURIComponent(id));
        const base = normPipedStream(s);
        if (!base) throw new Error('No video');
        return Object.assign(base, {
          description: String(s.description || ''),
          likes: Number(s.likes) || 0,
          dislikes: Number(s.dislikes) || 0,
          subs: Number(s.uploaderSubscriberCount) || null,
          tags: Array.isArray(s.tags) ? s.tags : [],
          category: s.category || '',
          live: !!s.livestream,
          isNew: false,
          related: (s.relatedStreams || []).map(x => normPipedStream(x)).filter(Boolean)
        });
      } catch (e) {
        const v = await api.inv('/api/v1/videos/' + encodeURIComponent(id));
        const base = normInvVideo(v);
        if (!base) throw e;
        return Object.assign(base, {
          description: String(v.description || ''),
          likes: Number(v.likeCount) || 0,
          dislikes: 0,
          subs: null,
          tags: Array.isArray(v.keywords) ? v.keywords : [],
          category: v.genre || '',
          live: !!v.liveNow,
          isNew: !!v.isNew,
          related: (v.recommendedVideos || []).map(x => normInvVideo(x)).filter(Boolean)
        });
      }
    });
  };

  /* ----------------------------- comments ------------------------------- */
  api.comments = function (id) {
    return cached('comments:' + id, 10 * 60e3, async () => {
      try {
        const d = await api.piped('/comments/' + encodeURIComponent(id));
        return {
          disabled: !!d.disabled,
          count: Number(d.commentCount) || 0,
          comments: (d.comments || []).map(normPipedComment),
          nextpage: d.nextpage || null,
          source: 'piped'
        };
      } catch (e) {
        const d = await api.inv('/api/v1/comments/' + encodeURIComponent(id));
        return {
          disabled: false,
          count: Number(d.commentCount) || 0,
          comments: (d.comments || []).map(normInvComment),
          nextpage: null,
          source: 'invidious'
        };
      }
    });
  };

  api.moreComments = async function (id, token) {
    if (!token) return { comments: [], nextpage: null };
    const d = await api.piped('/nextpage/comments/' + encodeURIComponent(id) + '?nextpage=' + encodeURIComponent(token));
    return {
      comments: (d.comments || []).map(normPipedComment),
      nextpage: d.nextpage || null
    };
  };

  api.replies = async function (id, token) {
    if (!token) return [];
    const d = await api.piped('/nextpage/comments/' + encodeURIComponent(id) + '?nextpage=' + encodeURIComponent(token));
    return (d.comments || []).map(normPipedComment);
  };

  /* ----------------------------- channels ------------------------------- */
  api.channel = function (id) {
    return cached('channel:' + id, 30 * 60e3, async () => {
      try {
        const c = await api.inv('/api/v1/channels/' + encodeURIComponent(id));
        const base = normInvChannel(c);
        if (!base) throw new Error('No channel');
        return base;
      } catch (e) {
        const path = id.charAt(0) === '@' || id.indexOf('/') === -1 && id.indexOf('UC') !== 0
          ? '/c/' + encodeURIComponent(id.replace(/^@/, ''))
          : '/channel/' + encodeURIComponent(id);
        const c = await api.piped(path);
        const base = normPipedChannelDetail(c);
        if (!base) throw e;
        base.latestVideos = (c.relatedStreams || []).map(x => normPipedStream(x)).filter(Boolean);
        return base;
      }
    });
  };

  api.channelVideos = function (id, sort, page, force) {
    const s = sort || 'newest';
    const p = page || 1;
    const key = 'chvideos2:' + id + ':' + s + ':' + p;
    return cached(key, force ? 0 : 15 * 60e3, async () => {
      if (p > 1) {
        try {
          const d = await api.inv('/api/v1/channels/' + encodeURIComponent(id) + '/videos?sort_by=' + s + '&page=' + p, { timeout: 9000 });
          const videos = (d.videos || []).map(v => normInvVideo(v)).filter(Boolean);
          return { videos: videos, more: videos.length >= 20 };
        } catch (e) {
          return { videos: [], more: false };
        }
      }

      try {
        const d = await api.inv('/api/v1/channels/' + encodeURIComponent(id) + '/videos?sort_by=' + s + '&page=1', { timeout: 9000 });
        const videos = (d.videos || []).map(v => normInvVideo(v)).filter(Boolean);
        if (videos.length) return { videos: videos, more: videos.length >= 20 };
      } catch (e) { /* try Piped below */ }

      try {
        const c = await api.piped('/channel/' + encodeURIComponent(id), { timeout: 9000 });
        if (!c.nextpage) {
          const videos = (c.relatedStreams || []).map(x => normPipedStream(x)).filter(Boolean);
          if (videos.length) return { videos: videos, more: false };
        } else {
          const d = await api.piped('/nextpage/channel/' + encodeURIComponent(id) + '?nextpage=' + encodeURIComponent(c.nextpage), { timeout: 9000 });
          const videos = (d.relatedStreams || []).map(x => normPipedStream(x)).filter(Boolean);
          if (videos.length) return { videos: videos, more: !!d.nextpage };
        }
      } catch (e) { /* channel view falls back to latestVideos */ }

      // Never cache an empty first page. It would make a temporarily busy
      // Invidious instance look like the channel has no videos for 15 minutes.
      throw new Error('No channel videos');
    });
  };

  api.channelShorts = function (id, force, name) {
    return cached('chshorts2:' + id, force ? 0 : 30 * 60e3, async () => {
      let list = [];
      try {
        const d = await api.inv('/api/v1/channels/' + encodeURIComponent(id) + '/shorts', { timeout: 9000 });
        list = (d.videos || []).map(v => normInvVideo(v, { short: true })).filter(Boolean);
      } catch (e) { /* try a duration-filtered search below */ }

      if (!list.length && name) {
        try {
          const arr = await api.inv('/api/v1/search?q=' + encodeURIComponent(name + ' #shorts') + '&type=video&duration=short', { timeout: 9000 });
          list = (Array.isArray(arr) ? arr : [])
            .filter(v => v && v.authorId === id && v.lengthSeconds > 0 && v.lengthSeconds <= 180 && !v.liveNow && !v.isUpcoming)
            .map(v => normInvVideo(v, { short: true }))
            .filter(Boolean);
        } catch (e) { /* no channel shorts available */ }
      }

      if (!list.length) throw new Error('No Shorts');
      return list;
    }).catch(() => []);
  };

  api.channelPlaylists = function (id, force) {
    return cached('chpl2:' + id, force ? 0 : 30 * 60e3, async () => {
      const d = await api.inv('/api/v1/channels/' + encodeURIComponent(id) + '/playlists', { timeout: 9000 });
      return (d.playlists || []).map(normInvPlaylist).filter(Boolean);
    });
  };

  /* ----------------------------- playlist ------------------------------- */
  api.playlist = function (id) {
    return cached('playlist:' + id, 30 * 60e3, async () => {
      try {
        const d = await api.inv('/api/v1/playlists/' + encodeURIComponent(id));
        const videos = (d.videos || []).map(v => normInvVideo(v)).filter(Boolean);
        return {
          id: id,
          title: d.title || 'Playlist',
          description: d.description || '',
          author: d.author || '',
          authorId: d.authorId || '',
          thumb: d.playlistThumbnail || '',
          count: Number(d.videoCount) || videos.length,
          videos: videos,
          incomplete: videos.length === 0
        };
      } catch (e) {
        const d = await api.piped('/playlists/' + encodeURIComponent(id));
        const videos = (d.relatedStreams || []).map(x => normPipedStream(x)).filter(Boolean);
        return {
          id: id,
          title: d.name || 'Playlist',
          description: d.description || '',
          author: d.uploader || '',
          authorId: channelIdFromUrl(d.uploaderUrl || ''),
          thumb: d.thumbnailUrl || '',
          count: Number(d.videos) || videos.length,
          videos: videos,
          incomplete: videos.length === 0
        };
      }
    });
  };

  /* ----------------------------- feeds ---------------------------------- */
  api.trending = function (region) {
    const r = region || 'US';
    return cached('trending:' + r, 10 * 60e3, async () => {
      const d = await api.piped('/trending?region=' + encodeURIComponent(r));
      const arr = Array.isArray(d) ? d : (d.items || []);
      return arr.map(x => normPipedStream(x)).filter(Boolean);
    });
  };

  api.invTrending = function (type, region) {
    const t = type || 'Default';
    const r = region || 'US';
    return cached('invtrending:' + r + ':' + t, 10 * 60e3, async () => {
      const d = await api.inv('/api/v1/trending?region=' + encodeURIComponent(r) + '&type=' + encodeURIComponent(t));
      return (Array.isArray(d) ? d : []).map(v => normInvVideo(v)).filter(Boolean);
    });
  };

  api.shortsForChannels = async function (ids, perChannel) {
    const list = Array.from(new Set((ids || []).filter(Boolean))).slice(0, 10);
    const batches = await YT.pool(list, 3, id => api.channelShorts(id));
    let out = [];
    for (const batch of batches) {
      if (!batch) continue;
      out = out.concat(batch.slice(0, perChannel || 6));
    }
    return YT.uniqBy(out, v => v.id);
  };

  // Last-resort Shorts source. Invidious supports duration=short searches,
  // which reliably return short-form videos even when a channel's /shorts
  // endpoint is empty or the channel is not indexed in the Shorts tab.
  api.searchShorts = function (queries) {
    const list = Array.from(new Set((queries || []).filter(Boolean))).slice(0, 6);
    if (!list.length) return Promise.resolve([]);
    const key = 'shortsearch2:' + list.map(q => q.toLowerCase()).sort().join('|');
    return cached(key, 20 * 60e3, async () => {
      const batches = await YT.pool(list, 3, async function (q) {
        const query = /shorts?/i.test(q) ? q : q + ' #shorts';
        try {
          const arr = await api.inv('/api/v1/search?q=' + encodeURIComponent(query) + '&type=video&duration=short', { timeout: 9000 });
          return (Array.isArray(arr) ? arr : [])
            .filter(v => v && v.videoId && v.lengthSeconds > 0 && v.lengthSeconds <= 180 && !v.liveNow && !v.isUpcoming)
            .map(v => normInvVideo(v, { short: true }))
            .filter(Boolean);
        } catch (e) {
          try {
            const d = await api.piped('/search?q=' + encodeURIComponent(query) + '&filter=videos', { timeout: 9000 });
            return (d.items || [])
              .filter(x => x && x.duration > 0 && x.duration <= 180 && !x.livestream)
              .map(x => normPipedStream(x, { short: true }))
              .filter(Boolean);
          } catch (err) { return []; }
        }
      });
      let out = [];
      for (const batch of batches) if (batch) out = out.concat(batch);
      out = YT.uniqBy(out, v => v.id);
      if (!out.length) throw new Error('No short search results');
      return out;
    });
  };

  api.ping = async function () {
    try { await api.piped('/search?q=test&filter=videos', { timeout: 8000 }); return true; }
    catch (e) { return false; }
  };

  return api;
})();
/* =========================================================================
   03 · STORE — preferences, watch history, subscriptions, playlists and the
   self-training recommendation graph. Everything is stored on this device.
   ========================================================================= */
'use strict';

YT.store = (function () {
  const KEY = {
    settings: 'yt.settings.v1',
    profile: 'yt.profile.v1',
    history: 'yt.history.v1',
    likes: 'yt.likes.v1',
    dislikes: 'yt.dislikes.v1',
    later: 'yt.later.v1',
    subs: 'yt.subs.v1',
    playlists: 'yt.playlists.v1',
    searches: 'yt.searches.v1',
    hiddenV: 'yt.hiddenvideos.v1',
    hiddenC: 'yt.hiddenchannels.v1',
    notifSeen: 'yt.notifseen.v1'
  };

  const DEFAULT_SETTINGS = {
    theme: 'dark',
    autoplay: true,
    notifications: true,
    historyPaused: false,
    onboardDismissed: false,
    region: 'US',
    shortsMuted: true,
    restoreProgress: true
  };

  const CATEGORIES = ['All', 'Music', 'Gaming', 'Movies', 'News', 'Sports', 'Learning', 'Live',
    'Podcasts', 'Comedy', 'Cooking', 'Travel', 'Fitness', 'Tech', 'Art', 'Nature', 'Fashion', 'Science'];

  const CATEGORY_QUERY = {
    Music: 'music',
    Gaming: 'gaming',
    Movies: 'movie trailers',
    News: 'news',
    Sports: 'sports highlights',
    Learning: 'educational videos',
    Live: 'live news',
    Podcasts: 'podcast',
    Comedy: 'comedy',
    Cooking: 'cooking recipes',
    Travel: 'travel vlog',
    Fitness: 'fitness workout',
    Tech: 'tech reviews',
    Art: 'art tutorial',
    Nature: 'nature documentary',
    Fashion: 'fashion',
    Science: 'science explained',
    All: ''
  };

  const DEFAULT_QUERIES = [
    'lofi music', 'gaming highlights', 'tech reviews',
    'cooking recipes', 'science explained', 'comedy sketches',
    'travel vlog', 'movie trailers'
  ];

  const state = {
    settings: Object.assign({}, DEFAULT_SETTINGS),
    profile: { topics: {}, channels: {}, updated: Date.now(), events: 0 },
    history: [],
    likes: [],
    dislikes: [],
    later: [],
    subs: [],
    playlists: [],
    searches: [],
    hiddenVideos: [],
    hiddenChannels: [],
    notifSeen: 0,
    loaded: false
  };

  const tokenCache = new WeakMap();
  let saveHistoryTimer = null;

  /* ------------------------------- load --------------------------------- */
  function sanitizeArray(value) { return Array.isArray(value) ? value : []; }

  function load() {
    state.settings = Object.assign({}, DEFAULT_SETTINGS, YT.storage.get(KEY.settings, {}) || {});
    const p = YT.storage.get(KEY.profile, null);
    if (p && typeof p === 'object') {
      state.profile = {
        topics: p.topics && typeof p.topics === 'object' ? p.topics : {},
        channels: p.channels && typeof p.channels === 'object' ? p.channels : {},
        updated: Number(p.updated) || Date.now(),
        events: Number(p.events) || 0
      };
    }
    state.history = sanitizeArray(YT.storage.get(KEY.history, []));
    state.likes = sanitizeArray(YT.storage.get(KEY.likes, []));
    state.dislikes = sanitizeArray(YT.storage.get(KEY.dislikes, []));
    state.later = sanitizeArray(YT.storage.get(KEY.later, []));
    state.subs = sanitizeArray(YT.storage.get(KEY.subs, []));
    state.playlists = sanitizeArray(YT.storage.get(KEY.playlists, []));
    state.searches = sanitizeArray(YT.storage.get(KEY.searches, []));
    state.hiddenVideos = sanitizeArray(YT.storage.get(KEY.hiddenV, []));
    state.hiddenChannels = sanitizeArray(YT.storage.get(KEY.hiddenC, []));
    state.notifSeen = Number(YT.storage.get(KEY.notifSeen, 0)) || 0;
    state.loaded = true;
    decay();
  }

  /* ------------------------------ persist ------------------------------- */
  function saveProfile() { YT.storage.set(KEY.profile, state.profile); }
  function saveHistory() { YT.storage.set(KEY.history, state.history); }
  function saveLikes() { YT.storage.set(KEY.likes, state.likes); }
  function saveDislikes() { YT.storage.set(KEY.dislikes, state.dislikes); }
  function saveLater() { YT.storage.set(KEY.later, state.later); }
  function saveSubs() { YT.storage.set(KEY.subs, state.subs); }
  function savePlaylists() { YT.storage.set(KEY.playlists, state.playlists); }
  function saveSearches() { YT.storage.set(KEY.searches, state.searches); }
  function saveHidden() {
    YT.storage.set(KEY.hiddenV, state.hiddenVideos);
    YT.storage.set(KEY.hiddenC, state.hiddenChannels);
  }
  function saveSettings() { YT.storage.set(KEY.settings, state.settings); }

  /* ------------------------------- decay -------------------------------- */
  function decay() {
    const p = state.profile;
    const days = (Date.now() - (p.updated || Date.now())) / 864e5;
    if (days > 0.75) {
      const f = Math.pow(0.985, Math.min(days, 180));
      for (const k in p.topics) p.topics[k] *= f;
      for (const k in p.channels) {
        if (p.channels[k] && typeof p.channels[k].score === 'number') p.channels[k].score *= f;
      }
      p.updated = Date.now();
      pruneProfile();
      saveProfile();
    }
  }

  function pruneProfile() {
    const p = state.profile;
    const topics = Object.entries(p.topics)
      .filter(([, v]) => isFinite(v) && Math.abs(v) > 0.06)
      .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))
      .slice(0, 280);
    p.topics = {};
    for (const [k, v] of topics) p.topics[k] = v;

    const channels = Object.entries(p.channels)
      .filter(([, v]) => v && isFinite(v.score) && Math.abs(v.score) > 0.08)
      .sort((a, b) => Math.abs(b[1].score) - Math.abs(a[1].score))
      .slice(0, 220);
    p.channels = {};
    for (const [k, v] of channels) p.channels[k] = v;
  }

  /* ------------------------------- learn -------------------------------- */
  function addTopic(key, weight) {
    const k = String(key || '').trim().toLowerCase();
    if (k.length < 3 || k.length > 64) return;
    const p = state.profile;
    p.topics[k] = (p.topics[k] || 0) + weight;
  }

  function bumpChannel(channel, weight) {
    if (!channel || !channel.id) return;
    const p = state.profile;
    const entry = p.channels[channel.id] || (p.channels[channel.id] = { score: 0, name: '', avatar: '' });
    entry.score = (entry.score || 0) + weight;
    if (channel.name) entry.name = channel.name;
    if (channel.avatar) entry.avatar = channel.avatar;
  }

  function learnFromText(text, weight, cap) {
    const set = YT.tokens(text, cap || 26);
    for (const t of set) addTopic(t, weight);
  }

  function learn(kind, payload) {
    const p = state.profile;
    if (kind === 'search' || kind === 'interest') {
      const q = String((payload && payload.q) || payload || '').trim();
      if (!q) return;
      addTopic(q, kind === 'search' ? 6 : 5);
      learnFromText(q, 1.8, 10);
      if (kind === 'search') recordSearch(q);
    } else if (kind === 'watch' && payload) {
      bumpChannel(payload.channel, 6);
      learnFromText(payload.title, 2.2, 22);
      learnFromText(payload.description, 0.45, 22);
    } else if (kind === 'like' && payload) {
      bumpChannel(payload.channel, 9);
      learnFromText(payload.title, 4, 20);
    } else if (kind === 'dislike' && payload) {
      bumpChannel(payload.channel, -6);
      learnFromText(payload.title, -2.4, 16);
    } else if (kind === 'subscribe' && payload) {
      bumpChannel(payload, 12);
    } else if (kind === 'unsubscribe' && payload) {
      bumpChannel(payload, -4);
    } else if (kind === 'notInterested' && payload) {
      bumpChannel(payload.channel, -7);
      learnFromText(payload.title, -2, 14);
    } else if (kind === 'hideChannel' && payload) {
      bumpChannel(payload, -14);
    } else if (kind === 'save' && payload) {
      bumpChannel(payload.channel, 2);
      learnFromText(payload.title, 1, 10);
    }
    p.events = (p.events || 0) + 1;
    p.updated = Date.now();
    pruneProfile();
    saveProfile();
  }

  function recordSearch(q) {
    const query = String(q || '').trim();
    if (!query) return;
    state.searches = state.searches.filter(s => s && s.q && s.q.toLowerCase() !== query.toLowerCase());
    state.searches.unshift({ q: query, ts: Date.now() });
    state.searches = state.searches.slice(0, 40);
    saveSearches();
  }

  /* --------------------------- recommendations -------------------------- */
  function textFor(video) {
    return (video.title || '') + ' ' + ((video.channel && video.channel.name) || '') + ' ' +
      String(video.description || '').slice(0, 260);
  }

  function tokensFor(video) {
    let set = tokenCache.get(video);
    if (!set) {
      set = YT.tokens(textFor(video), 38);
      tokenCache.set(video, set);
    }
    return set;
  }

  function topTopics(limit, phrasesOnly) {
    return Object.entries(state.profile.topics)
      .filter(([k, v]) => v > 0.07 && k.length >= 3 && (!phrasesOnly || k.indexOf(' ') > -1))
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit || 12);
  }

  function topChannels(limit) {
    return Object.entries(state.profile.channels)
      .filter(([, v]) => v && v.score > 0.1)
      .sort((a, b) => b[1].score - a[1].score)
      .slice(0, limit || 10)
      .map(([id, v]) => ({ id: id, score: v.score, name: v.name || '', avatar: v.avatar || '' }));
  }

  function interestQueries(limit) {
    const out = [];
    const push = value => {
      const q = String(value || '').trim();
      if (q.length < 3) return;
      if (out.some(x => x.toLowerCase() === q.toLowerCase())) return;
      out.push(q);
    };
    for (const s of state.searches.slice(0, 4)) push(s.q);
    for (const [topic] of topTopics(6, true)) push(topic);
    for (const ch of topChannels(3)) push(ch.name);
    for (const [topic] of topTopics(8, false)) {
      if (topic.indexOf(' ') === -1 && topic.length >= 4) push(topic);
    }
    if (out.length < 5) {
      for (const q of DEFAULT_QUERIES) { if (out.length >= 6) break; push(q); }
    }
    return out.slice(0, limit || 6);
  }

  function scoreVideo(video, opts) {
    const p = state.profile;
    const now = Date.now();
    const text = textFor(video).toLowerCase();
    const tokens = tokensFor(video);
    let score = 0;

    const entries = Object.entries(p.topics).slice(0, 220);
    let maxWeight = 0.001;
    for (const [, w] of entries) if (w > 0 && w > maxWeight) maxWeight = w;

    for (const [topic, weight] of entries) {
      if (!isFinite(weight) || Math.abs(weight) < 0.08) continue;
      const norm = weight / maxWeight;
      if (topic.indexOf(' ') > -1) {
        if (text.indexOf(topic) > -1) score += norm * 3.4;
      } else if (tokens.has(topic)) {
        score += norm * 2.1;
      }
    }

    const ch = video.channel && p.channels[video.channel.id];
    if (ch && isFinite(ch.score)) score += Math.tanh(ch.score / 11) * 2.5;

    if (video.channel && isSub(video.channel.id)) score += 1.1;

    if (video.views && video.views > 0) score += Math.log10(1 + video.views) * 0.26;

    if (video.published) {
      const days = Math.max(0, (now - video.published) / 864e5);
      score += Math.max(0, 1.5 - Math.log10(1 + days) * 0.72);
    }

    const seen = historyMap.get(video.id);
    if (seen) {
      const frac = seen.duration ? seen.progress / seen.duration : 0;
      score -= frac > 0.9 ? 2.4 : 0.55;
    }

    if (video.isShort) score -= 0.35;

    const jitter = opts && isFinite(opts.explore) ? opts.explore : 1.1;
    score += (Math.random() - 0.5) * jitter;

    if (opts && opts.boostQuery) {
      const q = String(opts.boostQuery).toLowerCase();
      if (q && text.indexOf(q) > -1) score += 2.2;
    }
    return score;
  }

  const historyMap = new Map();
  function refreshHistoryMap() {
    historyMap.clear();
    for (const h of state.history) if (h && h.id) historyMap.set(h.id, h);
  }

  function rank(input, opts) {
    const o = opts || {};
    const limit = o.limit || 60;
    refreshHistoryMap();
    const hiddenV = new Set(state.hiddenVideos);
    const hiddenC = new Set(state.hiddenChannels);
    const seenIds = new Set();
    const scored = [];

    for (const v of input || []) {
      if (!v || !v.id || seenIds.has(v.id)) continue;
      seenIds.add(v.id);
      if (hiddenV.has(v.id)) continue;
      if (v.channel && v.channel.id && hiddenC.has(v.channel.id)) continue;
      scored.push({ v: v, s: scoreVideo(v, o) });
    }
    scored.sort((a, b) => b.s - a.s);

    if (o.diversify === false) return scored.slice(0, limit).map(x => x.v);

    const picked = [];
    const pickedTokens = [];
    const chCount = Object.create(null);
    const channelCap = o.channelCap || 2;

    for (const item of scored) {
      if (picked.length >= limit) break;
      const cid = (item.v.channel && item.v.channel.id) || '';
      if ((chCount[cid] || 0) >= channelCap) continue;

      const tokens = tokensFor(item.v);
      let maxOverlap = 0;
      for (const set of pickedTokens) {
        if (!set.size) continue;
        let inter = 0;
        for (const t of tokens) if (set.has(t)) inter++;
        const overlap = inter / Math.max(4, Math.min(tokens.size, set.size));
        if (overlap > maxOverlap) maxOverlap = overlap;
      }
      if (maxOverlap > 0.72 && picked.length < limit * 0.82) continue;

      picked.push(item.v);
      pickedTokens.push(tokens);
      chCount[cid] = (chCount[cid] || 0) + 1;
    }

    if (picked.length < limit) {
      for (const item of scored) {
        if (picked.length >= limit) break;
        if (picked.some(v => v.id === item.v.id)) continue;
        picked.push(item.v);
      }
    }
    return picked;
  }

  /* ------------------------------ history ------------------------------- */
  function snapshot(video) {
    return {
      id: video.id,
      title: video.title || '',
      thumb: video.thumb || '',
      channel: {
        id: (video.channel && video.channel.id) || '',
        name: (video.channel && video.channel.name) || '',
        avatar: (video.channel && video.channel.avatar) || '',
        verified: !!(video.channel && video.channel.verified)
      },
      views: video.views || null,
      viewsText: video.viewsText || '',
      published: video.published || null,
      publishedText: video.publishedText || '',
      duration: video.duration || 0,
      isShort: !!video.isShort
    };
  }

  function addHistory(video, meta) {
    if (!video || !video.id) return;
    if (state.settings.historyPaused) return;
    const m = meta || {};
    const existing = state.history.find(h => h.id === video.id);
    const entry = snapshot(video);
    entry.ts = Date.now();
    let progress = m.progress != null ? Number(m.progress) || 0 : (existing ? existing.progress || 0 : 0);
    let duration = m.duration || entry.duration || (existing ? existing.duration : 0);
    if (duration > 86400 || progress > 86400) { duration = 0; progress = 0; }
    if (duration > 0 && progress > duration) progress = 0;
    entry.progress = Math.max(0, progress);
    entry.duration = Math.max(0, duration);
    entry.query = m.query || (existing && existing.query) || '';
    state.history = state.history.filter(h => h.id !== video.id);
    state.history.unshift(entry);
    state.history = state.history.slice(0, 500);
    saveHistory();
    if (!existing || Date.now() - (existing.ts || 0) > 3600e3) learn('watch', video);
  }

  function updateProgress(id, seconds, duration) {
    const entry = state.history.find(h => h.id === id);
    if (!entry) return;
    if ((entry.duration || 0) > 86400) { entry.duration = 0; entry.progress = 0; }
    const sec = Math.max(0, Number(seconds) || 0);
    const dur = Math.max(0, Number(duration) || 0);
    if (sec > 86400 || dur > 86400) return;
    entry.progress = sec;
    entry.duration = Math.max(entry.duration || 0, dur);
    if (entry.duration > 0 && entry.progress > entry.duration) entry.progress = entry.duration;
    entry.ts = Date.now();
    clearTimeout(saveHistoryTimer);
    saveHistoryTimer = setTimeout(saveHistory, 700);
  }

  function removeHistory(id) {
    state.history = state.history.filter(h => h.id !== id);
    saveHistory();
  }

  function clearHistory() {
    state.history = [];
    saveHistory();
  }

  function progressFor(id) {
    const h = state.history.find(x => x.id === id);
    if (!h || !h.duration || h.duration > 86400 || h.progress <= 0 || h.progress > 86400) return null;
    const pct = YT.clamp((h.progress / h.duration) * 100, 0, 100);
    if (pct < 1 || pct > 97) return null;
    return { progress: h.progress, duration: h.duration, pct: pct };
  }

  function continueWatching(limit) {
    return state.history
      .filter(h => h && h.duration > 25 && h.duration < 86400 && h.progress > 3 && h.progress / h.duration < 0.95)
      .sort((a, b) => (b.ts || 0) - (a.ts || 0))
      .slice(0, limit || 10);
  }

  function historyGroups() {
    const now = new Date();
    const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const startYesterday = startToday - 864e5;
    const startWeek = startToday - 6 * 864e5;
    const groups = [
      { title: 'Today', items: [] },
      { title: 'Yesterday', items: [] },
      { title: 'This week', items: [] },
      { title: 'Earlier', items: [] }
    ];
    for (const h of state.history) {
      const t = h.ts || 0;
      if (t >= startToday) groups[0].items.push(h);
      else if (t >= startYesterday) groups[1].items.push(h);
      else if (t >= startWeek) groups[2].items.push(h);
      else groups[3].items.push(h);
    }
    return groups.filter(g => g.items.length);
  }

  /* ------------------------------- likes -------------------------------- */
  function isLiked(id) { return state.likes.some(x => x.id === id); }
  function isDisliked(id) { return state.dislikes.some(x => x.id === id); }

  function toggleLike(video) {
    if (isLiked(video.id)) {
      state.likes = state.likes.filter(x => x.id !== video.id);
      saveLikes();
      return false;
    }
    state.likes.unshift(snapshot(video));
    state.likes = state.likes.slice(0, 1000);
    state.dislikes = state.dislikes.filter(x => x.id !== video.id);
    saveLikes(); saveDislikes();
    learn('like', video);
    return true;
  }

  function toggleDislike(video) {
    if (isDisliked(video.id)) {
      state.dislikes = state.dislikes.filter(x => x.id !== video.id);
      saveDislikes();
      return false;
    }
    state.dislikes.push({ id: video.id, ts: Date.now() });
    state.likes = state.likes.filter(x => x.id !== video.id);
    saveDislikes(); saveLikes();
    learn('dislike', video);
    return true;
  }

  function removeLike(id) {
    state.likes = state.likes.filter(x => x.id !== id);
    saveLikes();
  }

  /* ---------------------------- watch later ----------------------------- */
  function isLater(id) { return state.later.some(x => x.id === id); }

  function toggleLater(video) {
    if (isLater(video.id)) {
      state.later = state.later.filter(x => x.id !== video.id);
      saveLater();
      return false;
    }
    state.later.unshift(snapshot(video));
    state.later = state.later.slice(0, 1000);
    saveLater();
    learn('save', video);
    return true;
  }

  function removeLater(id) {
    state.later = state.later.filter(x => x.id !== id);
    saveLater();
  }

  /* --------------------------- subscriptions ---------------------------- */
  function isSub(id) { return state.subs.some(s => s.id === id); }
  function getSub(id) { return state.subs.find(s => s.id === id) || null; }

  function toggleSub(channel) {
    if (!channel || !channel.id) return false;
    if (isSub(channel.id)) {
      state.subs = state.subs.filter(s => s.id !== channel.id);
      saveSubs();
      learn('unsubscribe', channel);
      return false;
    }
    state.subs.unshift({
      id: channel.id,
      name: channel.name || '',
      avatar: channel.avatar || '',
      subs: channel.subs || null,
      notif: 'all',
      ts: Date.now()
    });
    state.subs = state.subs.slice(0, 200);
    saveSubs();
    learn('subscribe', channel);
    return true;
  }

  function cycleNotif(id) {
    const sub = getSub(id);
    if (!sub) return null;
    const order = ['all', 'personalized', 'none'];
    const i = order.indexOf(sub.notif || 'all');
    sub.notif = order[(i + 1) % order.length];
    saveSubs();
    return sub.notif;
  }

  /* ------------------------------ playlists ----------------------------- */
  function createPlaylist(name) {
    const clean = String(name || '').trim().slice(0, 80) || 'New playlist';
    const pl = { id: 'local_' + YT.uid(), name: clean, videos: [], ts: Date.now() };
    state.playlists.unshift(pl);
    savePlaylists();
    return pl;
  }

  function getPlaylist(id) { return state.playlists.find(p => p.id === id) || null; }

  function addToPlaylist(pid, video) {
    const pl = getPlaylist(pid);
    if (!pl || !video) return false;
    if (pl.videos.some(v => v.id === video.id)) return false;
    pl.videos.unshift(snapshot(video));
    savePlaylists();
    learn('save', video);
    return true;
  }

  function removeFromPlaylist(pid, vid) {
    const pl = getPlaylist(pid);
    if (!pl) return;
    pl.videos = pl.videos.filter(v => v.id !== vid);
    savePlaylists();
  }

  function deletePlaylist(pid) {
    state.playlists = state.playlists.filter(p => p.id !== pid);
    savePlaylists();
  }

  function renamePlaylist(pid, name) {
    const pl = getPlaylist(pid);
    if (!pl) return;
    pl.name = String(name || '').trim().slice(0, 80) || pl.name;
    savePlaylists();
  }

  /* ------------------------------- hidden -------------------------------- */
  function notInterested(video) {
    if (!video) return;
    if (!state.hiddenVideos.includes(video.id)) {
      state.hiddenVideos.unshift(video.id);
      state.hiddenVideos = state.hiddenVideos.slice(0, 500);
    }
    saveHidden();
    learn('notInterested', video);
  }

  function hideChannel(channel) {
    if (!channel || !channel.id) return;
    if (!state.hiddenChannels.includes(channel.id)) {
      state.hiddenChannels.unshift(channel.id);
      state.hiddenChannels = state.hiddenChannels.slice(0, 200);
    }
    saveHidden();
    learn('hideChannel', channel);
  }

  /* ------------------------------ settings ------------------------------ */
  function setSetting(key, value) {
    state.settings[key] = value;
    saveSettings();
    if (key === 'theme') applyTheme();
  }

  function applyTheme() {
    const theme = state.settings.theme || 'dark';
    let effective = theme;
    if (theme === 'system') {
      effective = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
    }
    document.documentElement.setAttribute('data-theme', effective === 'light' ? 'light' : 'dark');
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', effective === 'light' ? '#ffffff' : '#0f0f0f');
  }

  function resetProfile() {
    state.profile = { topics: {}, channels: {}, updated: Date.now(), events: 0 };
    saveProfile();
  }

  function removeTopic(topic) {
    delete state.profile.topics[topic];
    saveProfile();
  }

  function removeChannelAffinity(id) {
    delete state.profile.channels[id];
    saveProfile();
  }

  function clearSearches() {
    state.searches = [];
    saveSearches();
  }

  function clearAllData() {
    const keys = [
      KEY.settings, KEY.profile, KEY.history, KEY.likes, KEY.dislikes, KEY.later,
      KEY.subs, KEY.playlists, KEY.searches, KEY.hiddenV, KEY.hiddenC, KEY.notifSeen
    ];
    for (const k of keys) YT.storage.del(k);
    for (const k of YT.storage.keys('yt.cache.v1:')) YT.storage.del(k);
    YT.storage.del('yt.apiorder.v1');
  }

  function exportData() {
    return {
      app: 'youtube-clone',
      version: 1,
      exportedAt: new Date().toISOString(),
      settings: state.settings,
      profile: state.profile,
      history: state.history,
      likes: state.likes,
      dislikes: state.dislikes,
      later: state.later,
      subs: state.subs,
      playlists: state.playlists,
      searches: state.searches,
      hiddenVideos: state.hiddenVideos,
      hiddenChannels: state.hiddenChannels
    };
  }

  function importData(data) {
    if (!data || typeof data !== 'object') throw new Error('Invalid file');
    if (data.settings) { state.settings = Object.assign({}, DEFAULT_SETTINGS, data.settings); saveSettings(); }
    if (data.profile && data.profile.topics) {
      state.profile = {
        topics: data.profile.topics || {},
        channels: data.profile.channels || {},
        updated: Date.now(),
        events: Number(data.profile.events) || 0
      };
      saveProfile();
    }
    const map = [
      ['history', KEY.history, saveHistory],
      ['likes', KEY.likes, saveLikes],
      ['dislikes', KEY.dislikes, saveDislikes],
      ['later', KEY.later, saveLater],
      ['subs', KEY.subs, saveSubs],
      ['playlists', KEY.playlists, savePlaylists],
      ['searches', KEY.searches, saveSearches],
      ['hiddenVideos', KEY.hiddenV, saveHidden],
      ['hiddenChannels', KEY.hiddenC, saveHidden]
    ];
    for (const [field, key, save] of map) {
      if (Array.isArray(data[field])) {
        state[field] = data[field];
        save();
      }
    }
    applyTheme();
  }

  /* ------------------------------- feed --------------------------------- */
  async function feedPool(queries, tag, force) {
    const qs = Array.from(new Set(queries.filter(Boolean)));
    const cacheKey = 'feedpool:' + tag + ':' + qs.map(q => q.toLowerCase()).sort().join('|') + ':' + state.settings.region;
    const ttl = force ? 0 : 25 * 60e3;
    return YT.api.cached(cacheKey, ttl, async () => {
      const searchTasks = qs.map(q => YT.api.search(q, 'videos').then(r => {
        return (r.items || []).filter(x => x.kind === 'video').map(x => x.value);
      }));
      const trendingTask = tag === 'home' ? YT.api.trending(state.settings.region).catch(() => []) : Promise.resolve([]);
      const settled = await Promise.all(searchTasks.map(p => p.catch(() => [])));
      let pool = [];
      for (const list of settled) pool = pool.concat(list);
      const trending = await trendingTask;
      pool = pool.concat(trending || []);
      pool = YT.uniqBy(pool, v => v.id).slice(0, 170);
      if (!pool.length) throw new Error('No results');
      return pool;
    });
  }

  async function getFeed(category, force) {
    const cat = category || 'All';
    if (cat !== 'All') {
      const q = CATEGORY_QUERY[cat] || cat;
      const pool = await feedPool([q, q + ' videos'], 'cat_' + cat, force);
      return rank(pool, { limit: 66, explore: 1.7, boostQuery: q, channelCap: 2 });
    }
    const queries = interestQueries(6);
    const pool = await feedPool(queries, 'home', force);
    const explore = state.profile.events < 3 ? 2.6 : 1.15;
    return rank(pool, { limit: 66, explore: explore, channelCap: 2 });
  }

  async function getShortsFeed(force) {
    const subsIds = state.subs.slice(0, 4).map(s => s.id);
    const topicQueries = interestQueries(4);
    const queries = Array.from(new Set(['shorts', 'viral'].concat(topicQueries)));
    const cacheKey = 'shortsfeed2:' + queries.map(q => q.toLowerCase()).sort().join('|') + ':' + subsIds.slice().sort().join(',');
    const ttl = force ? 0 : 20 * 60e3;

    return YT.api.cached(cacheKey, ttl, async () => {
      const channelBatches = await YT.pool(queries.slice(0, 4), 3, q =>
        YT.api.search(q, 'channels').then(r => (r.items || []).filter(x => x.kind === 'channel').map(x => x.value)));
      let ids = [];
      for (const batch of channelBatches) if (batch) ids = ids.concat(batch.map(c => c && c.id).filter(Boolean));
      ids = Array.from(new Set(subsIds.concat(ids))).slice(0, 8);

      const [channelShorts, searchShorts] = await Promise.all([
        ids.length ? YT.api.shortsForChannels(ids, 8).catch(() => []) : Promise.resolve([]),
        YT.api.searchShorts(queries).catch(() => [])
      ]);
      const shorts = YT.uniqBy(channelShorts.concat(searchShorts), v => v.id);
      if (!shorts.length) throw new Error('No shorts');
      const ranked = rank(shorts, { limit: 48, explore: 2.2, channelCap: 4 });
      return YT.shuffle(ranked.slice(0, 20)).concat(ranked.slice(20));
    });
  }

  async function trending(type) {
    const region = state.settings.region;
    if (type && type !== 'Now') {
      try { return await YT.api.invTrending(type, region); }
      catch (e) { /* fall through */ }
    }
    try { return await YT.api.trending(region); }
    catch (e) { return YT.api.invTrending(type === 'Now' ? 'Default' : type, region); }
  }

  async function subscriptionFeed(force) {
    const subs = state.subs.slice(0, 16);
    if (!subs.length) return [];
    const key = 'subfeed:' + subs.map(s => s.id).sort().join(',');
    return YT.api.cached(key, force ? 0 : 8 * 60e3, async () => {
      const batches = await YT.pool(subs, 4, s => YT.api.channelVideos(s.id, 'newest', 1));
      let list = [];
      batches.forEach(batch => { if (batch && batch.videos) list = list.concat(batch.videos.slice(0, 12)); });
      list = YT.uniqBy(list, v => v.id);
      list = list.filter(v => v && v.id && v.title && v.published && String(v.title).replace(/[\uFFFC\u200B\s]/g, ''));
      list.sort((a, b) => (b.published || 0) - (a.published || 0));
      return list.slice(0, 80);
    });
  }

  async function notifications(force) {
    const subs = state.subs.slice(0, 12);
    if (!subs.length) return [];
    const key = 'notifs:' + subs.map(s => s.id).sort().join(',');
    return YT.api.cached(key, force ? 0 : 10 * 60e3, async () => {
      const batches = await YT.pool(subs, 4, s => YT.api.channelVideos(s.id, 'newest', 1));
      let list = [];
      batches.forEach(batch => {
        if (batch && batch.videos) list = list.concat(batch.videos.slice(0, 2));
      });
      list = YT.uniqBy(list, v => v.id);
      list = list.filter(v => v && v.id && v.title && v.published && String(v.title).replace(/[\uFFFC\u200B\s]/g, ''));
      list.sort((a, b) => (b.published || 0) - (a.published || 0));
      return list.slice(0, 18);
    });
  }

  function newNotifCount(items) {
    if (!items || !items.length) return 0;
    const cutoff = Math.max(state.notifSeen || 0, Date.now() - 14 * 864e5);
    return items.filter(v => v.published && v.published > cutoff).length;
  }

  function markNotifsSeen() {
    state.notifSeen = Date.now();
    YT.storage.set(KEY.notifSeen, state.notifSeen);
  }

  function addInterest(topic) {
    learn('interest', { q: topic });
  }

  /* ------------------------------ stats --------------------------------- */
  function stats() {
    const watched = state.history.length;
    return {
      watched: watched,
      likes: state.likes.length,
      subs: state.subs.length,
      playlists: state.playlists.length,
      topics: Object.keys(state.profile.topics).length,
      events: state.profile.events || 0
    };
  }

  /* ------------------------------ expose -------------------------------- */
  const api = {
    state: state,
    KEY: KEY,
    CATEGORIES: CATEGORIES,
    CATEGORY_QUERY: CATEGORY_QUERY,
    load: load,
    learn: learn,
    rank: rank,
    interestQueries: interestQueries,
    topTopics: topTopics,
    topChannels: topChannels,
    addInterest: addInterest,
    recordSearch: recordSearch,
    getFeed: getFeed,
    getShortsFeed: getShortsFeed,
    trending: trending,
    subscriptionFeed: subscriptionFeed,
    notifications: notifications,
    newNotifCount: newNotifCount,
    markNotifsSeen: markNotifsSeen,
    addHistory: addHistory,
    updateProgress: updateProgress,
    removeHistory: removeHistory,
    clearHistory: clearHistory,
    progressFor: progressFor,
    continueWatching: continueWatching,
    historyGroups: historyGroups,
    isLiked: isLiked,
    isDisliked: isDisliked,
    toggleLike: toggleLike,
    toggleDislike: toggleDislike,
    removeLike: removeLike,
    isLater: isLater,
    toggleLater: toggleLater,
    removeLater: removeLater,
    isSub: isSub,
    getSub: getSub,
    toggleSub: toggleSub,
    cycleNotif: cycleNotif,
    createPlaylist: createPlaylist,
    getPlaylist: getPlaylist,
    addToPlaylist: addToPlaylist,
    removeFromPlaylist: removeFromPlaylist,
    deletePlaylist: deletePlaylist,
    renamePlaylist: renamePlaylist,
    notInterested: notInterested,
    hideChannel: hideChannel,
    setSetting: setSetting,
    applyTheme: applyTheme,
    resetProfile: resetProfile,
    removeTopic: removeTopic,
    removeChannelAffinity: removeChannelAffinity,
    clearSearches: clearSearches,
    clearAllData: clearAllData,
    exportData: exportData,
    importData: importData,
    stats: stats,
    snapshot: snapshot
  };

  return api;
})();
/* =========================================================================
   04 · UI — cards, shelves, menus, modals and shared components
   ========================================================================= */
'use strict';

YT.ui = (function () {
  const videoRegistry = new Map();
  const channelRegistry = new Map();
  let modalWired = false;
  let lastFocus = null;

  const ui = {};

  function rememberVideo(video) {
    if (video && video.id) videoRegistry.set(video.id, video);
    return video;
  }
  function rememberChannel(channel) {
    if (channel && channel.id) channelRegistry.set(channel.id, channel);
    return channel;
  }
  function getVideo(id) { return videoRegistry.get(id) || null; }
  function getChannel(id) { return channelRegistry.get(id) || null; }

  function initials(name) {
    const clean = String(name || '').replace(/^@/, '').trim();
    if (!clean) return '?';
    return clean.split(/\s+/).slice(0, 2).map(w => w.charAt(0).toUpperCase()).join('');
  }

  function avatarTag(url, name, cls, size) {
    const c = cls || '';
    const src = url ? YT.api.cleanAvatar(url, size || 88) : '';
    return '<span class="' + c + '">' +
      (src ? '<img src="' + YT.esc(src) + '" alt="" loading="lazy" decoding="async">' : '<img class="failed" alt="">') +
      '<span class="avatar-fallback">' + YT.esc(initials(name)) + '</span>' +
      '</span>';
  }

  function verifiedIcon(channel, cls) {
    if (!channel || !channel.verified) return '';
    return '<span title="Verified" aria-label="Verified">' + YT.icon('verified', 'verified ' + (cls || '')) + '</span>';
  }

  function channelHref(channel) {
    if (!channel || !channel.id) return '#/results?search_query=' + encodeURIComponent((channel && channel.name) || '');
    return '#/channel/' + encodeURIComponent(channel.id);
  }

  function watchHref(id) { return '#/watch?v=' + encodeURIComponent(id); }
  function shortHref(id) { return '#/shorts/' + encodeURIComponent(id); }
  function playlistHref(id) { return '#/playlist?list=' + encodeURIComponent(id); }

  function metaLine(video) {
    const bits = [];
    if (video.viewsText) bits.push(YT.esc(video.viewsText));
    else if (video.views && video.views > 0) bits.push(YT.esc(YT.fmtViews(video.views)));
    if (video.publishedText) bits.push(YT.esc(video.publishedText));
    else if (video.published) bits.push(YT.esc(YT.timeAgo(video.published)));
    return bits.join(' <span class="dot">•</span> ');
  }

  function durationBadge(video) {
    if (video.live) return '<span class="badge live">Live</span>';
    if (video.duration > 0 && video.duration < 86400) return '<span class="badge duration">' + YT.esc(YT.fmtDuration(video.duration)) + '</span>';
    return '';
  }

  function progressBar(video) {
    const p = YT.store.progressFor(video.id);
    if (!p) return '';
    return '<span class="progress"><i style="width:' + p.pct.toFixed(1) + '%"></i></span>';
  }

  function subscribeButton(channel, extra) {
    if (!channel || !channel.id) return '';
    const sub = YT.store.isSub(channel.id);
    rememberChannel(channel);
    return '<button class="subscribe-btn ' + (sub ? 'subscribed' : '') + ' ' + (extra || '') + '"' +
      ' data-act="subscribe" data-channel="' + YT.esc(channel.id) + '"' +
      ' data-name="' + YT.esc(channel.name || '') + '"' +
      ' data-avatar="' + YT.esc(channel.avatar || '') + '"' +
      ' data-subs="' + (channel.subs || '') + '">' +
      (sub ? 'Subscribed' : 'Subscribe') +
      '</button>';
  }

  ui.rememberVideo = rememberVideo;
  ui.rememberChannel = rememberChannel;
  ui.getVideo = getVideo;
  ui.getChannel = getChannel;
  ui.subscribeButton = subscribeButton;
  ui.watchHref = watchHref;
  ui.shortHref = shortHref;
  ui.channelHref = channelHref;
  ui.playlistHref = playlistHref;

  /* ------------------------------ cards --------------------------------- */
  ui.videoCard = function (video, opts) {
    if (!video || !video.id) return '';
    rememberVideo(video);
    const o = opts || {};
    const ch = video.channel || {};
    const progress = o.showProgress === false ? '' : progressBar(video);
    return '<article class="card" data-video-id="' + YT.esc(video.id) + '">' +
      '<a class="thumb" href="' + watchHref(video.id) + '" aria-label="' + YT.esc(video.title) + '">' +
        '<img ' + YT.thumbAttrs(video.id, { small: !!o.small }) + ' alt="" loading="lazy" decoding="async">' +
        durationBadge(video) +
        progress +
      '</a>' +
      '<div class="card-body">' +
        '<a class="card-avatar" href="' + channelHref(ch) + '" aria-label="' + YT.esc(ch.name || 'Channel') + '">' +
          (ch.avatar ? '<img src="' + YT.esc(ch.avatar) + '" alt="" loading="lazy" decoding="async">' : '<img class="failed" alt="">') +
          '<span class="avatar-fallback">' + YT.esc(initials(ch.name)) + '</span>' +
        '</a>' +
        '<div class="card-meta">' +
          '<a class="card-title" href="' + watchHref(video.id) + '">' + YT.esc(video.title) + '</a>' +
          '<a class="card-channel" href="' + channelHref(ch) + '">' +
            '<span class="name">' + YT.esc(ch.name || 'Unknown') + '</span>' + verifiedIcon(ch) +
          '</a>' +
          '<div class="card-stats">' + metaLine(video) + '</div>' +
        '</div>' +
        (o.showMenu === false ? '' : '<button class="card-menu" data-act="video-menu" data-id="' + YT.esc(video.id) + '" aria-label="Action menu" title="Action menu">' + YT.icon('more') + '</button>') +
      '</div>' +
    '</article>';
  };

  ui.compactCard = function (video, opts) {
    if (!video || !video.id) return '';
    rememberVideo(video);
    const o = opts || {};
    const ch = video.channel || {};
    return '<div class="compact" data-video-id="' + YT.esc(video.id) + '">' +
      '<a class="compact-thumb" href="' + watchHref(video.id) + '" aria-label="' + YT.esc(video.title) + '">' +
        '<img ' + YT.thumbAttrs(video.id, { small: true }) + ' alt="" loading="lazy" decoding="async">' +
        durationBadge(video) + progressBar(video) +
      '</a>' +
      '<div class="compact-info">' +
        '<a class="compact-title" href="' + watchHref(video.id) + '">' + YT.esc(video.title) + '</a>' +
        '<a class="compact-channel" href="' + channelHref(ch) + '">' + YT.esc(ch.name || '') + verifiedIcon(ch) + '</a>' +
        '<div class="compact-meta">' + (metaLine(video) || '') + '</div>' +
      '</div>' +
      (o.showMenu === false ? '' : '<button class="card-menu" data-act="video-menu" data-id="' + YT.esc(video.id) + '" aria-label="Action menu">' + YT.icon('more') + '</button>') +
    '</div>';
  };

  ui.shortCard = function (video, opts) {
    if (!video || !video.id) return '';
    rememberVideo(video);
    const ch = video.channel || {};
    const views = video.viewsText || (video.views ? YT.fmtViews(video.views) : '');
    return '<a class="short-card" href="' + shortHref(video.id) + '" data-video-id="' + YT.esc(video.id) + '">' +
      '<div class="short-thumb">' +
        '<img ' + YT.thumbAttrs(video.id, { short: true }) + ' alt="" loading="lazy" decoding="async">' +
        '<span class="short-play"><span>' + YT.icon('play') + '</span></span>' +
      '</div>' +
      '<div class="short-title">' + YT.esc(video.title) + '</div>' +
      '<div class="short-meta">' + YT.esc(views) + '</div>' +
    '</a>';
  };

  ui.channelCard = function (channel, opts) {
    if (!channel || !channel.id) return '';
    rememberChannel(channel);
    const o = opts || {};
    return '<div class="ch-card ' + (o.row ? 'row' : '') + '">' +
      '<a class="ch-avatar ' + (o.large ? 'lg' : '') + '" href="' + channelHref(channel) + '">' +
        (channel.avatar ? '<img src="' + YT.esc(channel.avatar) + '" alt="" loading="lazy" decoding="async">' : '<img class="failed" alt="">') +
        '<span class="avatar-fallback">' + YT.esc(initials(channel.name)) + '</span>' +
      '</a>' +
      '<div class="ch-info">' +
        '<a class="ch-name" href="' + channelHref(channel) + '">' + YT.esc(channel.name) + verifiedIcon(channel) + '</a>' +
        '<div class="ch-subs">' + YT.esc(channel.subsText || YT.fmtSubs(channel.subs)) + '</div>' +
        (channel.description ? '<div class="ch-desc">' + YT.esc(channel.description) + '</div>' : '') +
        subscribeButton(channel, 'sm') +
      '</div>' +
    '</div>';
  };

  ui.playlistCard = function (playlist, opts) {
    if (!playlist || !playlist.id) return '';
    const thumb = playlist.thumb || '';
    const href = playlist.id.indexOf('local_') === 0 ? '#/feed/playlists' : playlistHref(playlist.id);
    return '<a class="pl-card" href="' + href + '">' +
      '<div class="pl-thumb">' +
        (thumb ? '<img src="' + YT.esc(thumb) + '" alt="" loading="lazy" decoding="async" data-fb="">' : '<img src="' + YT.PH.thumb + '" alt="">') +
        '<span class="pl-cover-bar">' + YT.icon('list') + '<span>' + YT.esc(String(playlist.count || 0)) + '</span></span>' +
        '<span class="pl-count">' + YT.esc(String(playlist.count || 0)) + ' videos</span>' +
      '</div>' +
      '<div class="pl-title">' + YT.esc(playlist.title || 'Playlist') + '</div>' +
      '<div class="pl-meta">' + YT.esc((playlist.channel && playlist.channel.name) || '') + '</div>' +
    '</a>';
  };

  ui.grid = function (list, opts) {
    const items = (list || []).filter(Boolean);
    if (!items.length) return '';
    return '<div class="grid ' + ((opts && opts.className) || '') + '">' +
      items.map(v => ui.videoCard(v, opts)).join('') +
    '</div>';
  };

  ui.compactList = function (list, opts) {
    return '<div class="compact-list">' +
      (list || []).filter(Boolean).map(v => ui.compactCard(v, opts)).join('') +
    '</div>';
  };

  ui.shelf = function (title, list, opts) {
    const items = (list || []).filter(Boolean);
    if (!items.length) return '';
    const o = opts || {};
    return '<section class="shelf">' +
      '<div class="shelf-head">' +
        '<h2 class="shelf-title">' + (o.icon ? YT.icon(o.icon) : '') + YT.esc(title) + '</h2>' +
        (o.href ? '<a class="shelf-link" href="' + o.href + '">' + YT.esc(o.linkText || 'View all') + '</a>' : '') +
      '</div>' +
      '<div class="shelf-scroll-wrap">' +
        '<button class="shelf-arrow left" data-act="shelf-scroll" data-dir="-1" aria-label="Scroll left">' + YT.icon('chevron-left') + '</button>' +
        '<div class="shelf-row ' + (o.short ? 'shorts-row' : '') + '">' +
          items.map(v => o.short ? ui.shortCard(v, o) : ui.videoCard(v, o)).join('') +
        '</div>' +
        '<button class="shelf-arrow right" data-act="shelf-scroll" data-dir="1" aria-label="Scroll right">' + YT.icon('chevron-right') + '</button>' +
      '</div>' +
    '</section>';
  };

  ui.chips = function (labels, active, opts) {
    const o = opts || {};
    return (labels || []).map(label => {
      const isActive = label.toLowerCase() === String(active || '').toLowerCase();
      const href = o.href ? o.href(label) : null;
      const attrs = href ? ' href="' + href + '"' : ' data-act="' + (o.act || 'chip') + '" data-value="' + YT.esc(label) + '"';
      return '<a class="chip ' + (isActive ? 'active' : '') + '"' + attrs + '>' +
        (o.icon ? YT.icon(o.icon) : '') + YT.esc(label) + '</a>';
    }).join('');
  };

  /* ---------------------------- placeholders ---------------------------- */
  ui.skeletonGrid = function (n, opts) {
    const count = n || 12;
    const cards = [];
    for (let i = 0; i < count; i++) {
      cards.push('<div class="card sk">' +
        '<div class="sk-thumb"></div>' +
        '<div class="card-body">' +
          '<div class="sk-avatar"></div>' +
          '<div class="sk-lines"><div class="sk-line w80"></div><div class="sk-line w60"></div><div class="sk-line w40"></div></div>' +
        '</div>' +
      '</div>');
    }
    return '<div class="grid">' + cards.join('') + '</div>';
  };

  ui.skeletonWatch = function () {
    return '<div class="sk-watch">' +
      '<div class="sk-line" style="height:24px;width:72%"></div>' +
      '<div class="sk-line" style="margin-top:12px;width:40%;height:16px"></div>' +
      '<div class="sk-line" style="margin-top:20px;width:100%;height:88px"></div>' +
    '</div>';
  };

  ui.empty = function (opts) {
    const o = opts || {};
    return '<div class="empty">' +
      (o.icon ? YT.icon(o.icon) : '') +
      (o.title ? '<h2>' + YT.esc(o.title) + '</h2>' : '') +
      (o.text ? '<p>' + YT.esc(o.text) + '</p>' : '') +
      (o.action || '') +
    '</div>';
  };

  ui.errorBox = function (message, opts) {
    const o = opts || {};
    return '<div class="error-box">' + YT.icon('warning') +
      '<div><h3>' + YT.esc(o.title || 'Could not load YouTube data') + '</h3>' +
      '<p>' + YT.esc(message || 'The public YouTube data services did not respond. This is usually temporary.') + '</p>' +
      (o.retry === false ? '' : '<button class="btn btn-sm" data-act="retry-view">' + YT.icon('refresh', 'icon icon-xs') + ' Try again</button>') +
      '</div></div>';
  };

  ui.staleBar = function () {
    return '<div class="stale-bar">' + YT.icon('info') +
      '<span>Showing saved results — the live YouTube sources did not respond.</span>' +
      '<button data-act="retry-view">Retry</button>' +
      '</div>';
  };

  /* ------------------------------- menus -------------------------------- */
  let closeMenuFn = null;

  ui.closeMenu = function () {
    if (closeMenuFn) { closeMenuFn(); closeMenuFn = null; }
  };

  function position(el, rect, opts) {
    const o = opts || {};
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const mw = el.offsetWidth;
    const mh = el.offsetHeight;
    let left = o.align === 'left' ? rect.left : rect.right - mw;
    left = YT.clamp(left, 8, Math.max(8, vw - mw - 8));
    let top = rect.bottom + 6;
    if (top + mh > vh - 8) {
      const above = rect.top - mh - 6;
      top = above > 8 ? above : Math.max(8, vh - mh - 8);
    }
    el.style.left = left + 'px';
    el.style.top = top + 'px';
  }

  ui.popover = function (anchor, html, opts) {
    ui.closeMenu();
    const o = opts || {};
    const root = YT.$('#menuRoot');
    root.classList.add('open');
    const backdrop = document.createElement('div');
    backdrop.className = 'menu-backdrop';
    const panel = document.createElement('div');
    panel.className = 'menu ' + (o.className || '');
    if (o.width) panel.style.width = o.width + 'px';
    panel.style.visibility = 'hidden';
    panel.innerHTML = html;
    root.appendChild(backdrop);
    root.appendChild(panel);

    const rect = anchor && anchor.getBoundingClientRect
      ? anchor.getBoundingClientRect()
      : { top: 56, bottom: 56, left: window.innerWidth / 2, right: window.innerWidth / 2 };
    panel.style.visibility = '';
    position(panel, rect, o);

    function close() {
      panel.remove();
      backdrop.remove();
      root.classList.remove('open');
      document.removeEventListener('keydown', onKey, true);
      window.removeEventListener('resize', close);
      document.removeEventListener('scroll', onScroll, true);
      closeMenuFn = null;
    }
    function onKey(e) {
      if (e.key === 'Escape') { e.preventDefault(); close(); }
    }
    function onScroll(e) {
      if (panel.contains(e.target)) return;
      close();
    }
    backdrop.addEventListener('click', close);
    document.addEventListener('keydown', onKey, true);
    window.addEventListener('resize', close);
    document.addEventListener('scroll', onScroll, true);

    closeMenuFn = close;
    panel.querySelectorAll('[data-menu-close]').forEach(el => el.addEventListener('click', close));
    const first = panel.querySelector('button, a, input');
    if (first) first.focus({ preventScroll: true });

    return { el: panel, close: close };
  };

  ui.menu = function (anchor, items, opts) {
    const html = (items || []).map((item, i) => {
      if (!item) return '';
      if (item.type === 'sep') return '<div class="menu-sep"></div>';
      if (item.type === 'custom') return item.html || '';
      return '<button class="menu-item ' + (item.danger ? 'danger ' : '') + (item.selected ? 'selected' : '') + '"' +
        ' data-mi="' + i + '">' +
        (item.icon ? YT.icon(item.icon) : '<span class="icon"></span>') +
        '<span class="menu-label">' + YT.esc(item.label) + '</span>' +
        (item.hint ? '<span class="menu-hint">' + YT.esc(item.hint) + '</span>' : '') +
        (item.selected ? YT.icon('check', 'check') : '') +
      '</button>';
    }).join('');

    const pop = ui.popover(anchor, html, opts);
    const buttons = Array.from(pop.el.querySelectorAll('.menu-item'));
    buttons.forEach(btn => {
      btn.addEventListener('click', function () {
        const item = items[Number(btn.getAttribute('data-mi'))];
        pop.close();
        if (item && item.onClick) setTimeout(() => item.onClick(), 0);
      });
    });
    return pop;
  };

  /* ------------------------------- modal -------------------------------- */
  function wireModalRoot() {
    if (modalWired) return;
    modalWired = true;
    const root = YT.$('#modalRoot');
    root.addEventListener('click', function (e) {
      if (e.target.closest('[data-close]')) ui.closeModal();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && root.classList.contains('open')) {
        e.preventDefault();
        ui.closeModal();
      }
    }, true);
  }

  ui.modal = function (opts) {
    wireModalRoot();
    ui.closeModal();
    const o = opts || {};
    lastFocus = document.activeElement;
    const root = YT.$('#modalRoot');
    root.className = 'modal-root open';
    root.innerHTML =
      '<div class="modal-backdrop" data-close></div>' +
      '<div class="modal ' + (o.wide ? 'wide' : '') + '" role="dialog" aria-modal="true" aria-label="' + YT.esc(o.title || '') + '">' +
        '<div class="modal-head">' +
          '<h2 class="modal-title">' + YT.esc(o.title || '') + '</h2>' +
          '<button class="modal-close" data-close aria-label="Close">' + YT.icon('close') + '</button>' +
        '</div>' +
        '<div class="modal-body">' + (o.body || '') + '</div>' +
        (o.actions ? '<div class="modal-actions">' + o.actions + '</div>' : '') +
      '</div>';
    document.body.classList.add('no-scroll');
    const modalEl = root.querySelector('.modal');
    const bodyEl = root.querySelector('.modal-body');
    if (o.onMount) o.onMount(modalEl, bodyEl, ui.closeModal);
    const focusable = modalEl.querySelector('input, textarea, button:not(.modal-close)');
    if (focusable) setTimeout(() => focusable.focus({ preventScroll: true }), 30);
    return { root: root, el: modalEl, body: bodyEl, close: ui.closeModal };
  };

  ui.closeModal = function () {
    const root = YT.$('#modalRoot');
    if (!root || !root.classList.contains('open')) return;
    root.className = 'modal-root';
    root.innerHTML = '';
    document.body.classList.remove('no-scroll');
    if (lastFocus && lastFocus.focus) {
      try { lastFocus.focus({ preventScroll: true }); } catch (e) {}
    }
    lastFocus = null;
  };

  ui.confirmModal = function (opts) {
    const o = opts || {};
    return ui.modal({
      title: o.title || 'Are you sure?',
      body: '<p>' + YT.esc(o.message || '') + '</p>',
      actions: '<button class="btn" data-close>Cancel</button>' +
        '<button class="btn ' + (o.danger ? 'btn-danger' : 'btn-filled') + '" data-confirm>' + YT.esc(o.confirmLabel || 'Confirm') + '</button>',
      onMount: function (modalEl, body, close) {
        const btn = modalEl.querySelector('[data-confirm]');
        if (btn) btn.addEventListener('click', function () {
          close();
          if (o.onConfirm) o.onConfirm();
        });
      }
    });
  };

  /* ------------------------------- share -------------------------------- */
  ui.shareModal = function (video) {
    if (!video) return;
    const url = 'https://youtu.be/' + video.id;
    const pageUrl = location.href;
    const text = encodeURIComponent(video.title || 'Watch this video');
    const enc = encodeURIComponent(url);
    const body =
      '<div class="share-grid">' +
        '<button class="share-tile" data-act="copy" data-copy="' + YT.esc(url) + '"><span class="tile">' + YT.icon('link') + '</span>Copy link</button>' +
        '<a class="share-tile" href="https://wa.me/?text=' + text + '%20' + enc + '" target="_blank" rel="noopener"><span class="tile">' + YT.icon('comment') + '</span>WhatsApp</a>' +
        '<a class="share-tile" href="https://twitter.com/intent/tweet?url=' + enc + '&text=' + text + '" target="_blank" rel="noopener"><span class="tile">' + YT.icon('external') + '</span>X</a>' +
        '<a class="share-tile" href="https://www.facebook.com/sharer/sharer.php?u=' + enc + '" target="_blank" rel="noopener"><span class="tile">' + YT.icon('globe') + '</span>Facebook</a>' +
        '<a class="share-tile" href="https://www.reddit.com/submit?url=' + enc + '&title=' + text + '" target="_blank" rel="noopener"><span class="tile">' + YT.icon('fire') + '</span>Reddit</a>' +
        '<a class="share-tile" href="mailto:?subject=' + text + '&body=' + enc + '"><span class="tile">' + YT.icon('send') + '</span>Email</a>' +
      '</div>' +
      '<div class="field"><label>Link</label><div class="copy-row">' +
        '<input class="modal-input" readonly value="' + YT.esc(url) + '">' +
        '<button class="btn btn-sm" data-act="copy" data-copy="' + YT.esc(url) + '">Copy</button>' +
      '</div></div>' +
      '<div class="field"><label>Embed</label><div class="copy-row">' +
        '<input class="modal-input" readonly value="' + YT.esc('<iframe width="560" height="315" src="https://www.youtube.com/embed/' + video.id + '" allowfullscreen></iframe>') + '">' +
        '<button class="btn btn-sm" data-act="copy" data-copy="' + YT.esc('<iframe width="560" height="315" src="https://www.youtube.com/embed/' + video.id + '" allowfullscreen></iframe>') + '">Copy</button>' +
      '</div></div>' +
      '<div class="settings-note">Videos play through YouTube. The link above opens the original video on YouTube.</div>';
    ui.modal({ title: 'Share', body: body });
  };

  /* -------------------------------- save -------------------------------- */
  ui.saveModal = function (video) {
    if (!video) return;
    const later = YT.store.isLater(video.id);
    const rows = ['<button class="pick-row" data-act="pick-later" data-id="' + YT.esc(video.id) + '">' +
      '<span class="pick-icon">' + YT.icon('clock') + '</span>' +
      '<span class="pick-label">Watch later</span>' +
      (later ? YT.icon('check', 'check') : '') + '</button>'];

    for (const pl of YT.store.state.playlists) {
      const has = pl.videos.some(v => v.id === video.id);
      rows.push('<button class="pick-row" data-act="pick-playlist" data-id="' + YT.esc(video.id) + '" data-pl="' + YT.esc(pl.id) + '">' +
        '<span class="pick-icon">' + YT.icon('list') + '</span>' +
        '<span class="pick-label">' + YT.esc(pl.name) + '</span>' +
        (has ? YT.icon('check', 'check') : '') + '</button>');
    }

    ui.modal({
      title: 'Save video to...',
      body: '<div class="playlist-pick">' + rows.join('') + '</div>' +
        '<div class="menu-sep"></div>' +
        '<button class="pick-row" data-act="new-playlist" data-id="' + YT.esc(video.id) + '">' +
        '<span class="pick-icon">' + YT.icon('plus') + '</span><span class="pick-label">New playlist</span></button>'
    });
  };

  ui.newPlaylistModal = function (video) {
    ui.modal({
      title: 'New playlist',
      body: '<div class="field"><label>Name</label><input class="modal-input" id="newPlName" maxlength="80" placeholder="Enter a name"></div>' +
        '<div class="settings-note">Playlists are stored in this browser.</div>',
      actions: '<button class="btn" data-close>Cancel</button>' +
        '<button class="btn btn-filled" id="createPlBtn">Create</button>',
      onMount: function (modalEl, body, close) {
        const input = modalEl.querySelector('#newPlName');
        const create = function () {
          const name = input.value.trim();
          if (!name) { input.focus(); return; }
          const pl = YT.store.createPlaylist(name);
          if (video) YT.store.addToPlaylist(pl.id, video);
          close();
          YT.toast('Playlist created', { action: 'See it', onAction: () => { location.hash = '#/feed/playlists'; } });
          if (location.hash.indexOf('#/feed/playlists') > -1) YT.app.refreshCurrent();
        };
        modalEl.querySelector('#createPlBtn').addEventListener('click', create);
        input.addEventListener('keydown', function (e) { if (e.key === 'Enter') create(); });
        setTimeout(() => input.focus(), 40);
      }
    });
  };

  /* ---------------------------- tune modal ------------------------------ */
  ui.tuneModal = function () {
    const topics = YT.store.topTopics(14, false);
    const channels = YT.store.topChannels(8);
    const maxT = topics.length ? Math.abs(topics[0][1]) || 1 : 1;
    const maxC = channels.length ? Math.abs(channels[0].score) || 1 : 1;

    let body = '<p style="color:var(--text-2);line-height:1.6;margin-bottom:16px">' +
      'This feed learns only from what you do here — searches, videos you play, likes and subscriptions. ' +
      'Remove anything you no longer want to influence it.</p>';

    if (!topics.length && !channels.length) {
      body += ui.empty({ icon: 'sparkle', title: 'Nothing learned yet', text: 'Search for something or watch a video, and it will appear here.' });
    } else {
      body += '<h3 style="font-size:14px;font-weight:500;margin-bottom:8px">Topics</h3><div class="tune-list">' +
        topics.map(([topic, weight]) =>
          '<div class="tune-item">' +
            '<div class="tune-name" title="' + YT.esc(topic) + '">' + YT.esc(topic) + '</div>' +
            '<div class="tune-track"><i style="width:' + Math.max(4, Math.round(Math.abs(weight) / maxT * 100)) + '%"></i></div>' +
            '<button class="tune-x" data-act="tune-remove-topic" data-topic="' + YT.esc(topic) + '" aria-label="Remove topic">' + YT.icon('close', 'icon icon-xs') + '</button>' +
          '</div>').join('') + '</div>';

      if (channels.length) {
        body += '<h3 style="font-size:14px;font-weight:500;margin:18px 0 8px">Channels</h3><div class="tune-list">' +
          channels.map(ch =>
            '<div class="tune-item">' +
              '<div class="tune-name" style="display:flex;align-items:center;gap:8px">' +
                (ch.avatar ? '<img src="' + YT.esc(ch.avatar) + '" alt="" style="width:22px;height:22px;border-radius:50%;object-fit:cover">' : '') +
                '<span style="overflow:hidden;text-overflow:ellipsis">' + YT.esc(ch.name || ch.id) + '</span>' +
              '</div>' +
              '<div class="tune-track"><i style="width:' + Math.max(4, Math.round(Math.abs(ch.score) / maxC * 100)) + '%"></i></div>' +
              '<button class="tune-x" data-act="tune-remove-channel" data-channel="' + YT.esc(ch.id) + '" aria-label="Remove channel">' + YT.icon('close', 'icon icon-xs') + '</button>' +
            '</div>').join('') + '</div>';
      }

      body += '<div class="menu-sep" style="margin-top:20px"></div>' +
        '<button class="btn btn-danger btn-sm" data-act="reset-profile">Reset recommendations</button>';
    }

    ui.modal({ title: 'Tune recommendations', body: body, wide: true });
  };

  /* ---------------------------- shortcuts ------------------------------- */
  ui.shortcutsModal = function () {
    const rows = [
      ['Play / pause', 'k'], ['Seek forward 5s', 'l'], ['Seek back 5s', 'j'],
      ['Mute / unmute', 'm'], ['Fullscreen', 'f'], ['Theater mode', 't'],
      ['Focus search', '/'], ['Close menu / dialog', 'Esc'], ['Shortcuts', '?']
    ];
    ui.modal({
      title: 'Keyboard shortcuts',
      body: '<div class="kbd-list">' + rows.map(r =>
        '<div class="kbd-row"><span>' + YT.esc(r[0]) + '</span><kbd>' + YT.esc(r[1]) + '</kbd></div>').join('') + '</div>'
    });
  };

  ui.aboutModal = function () {
    ui.modal({
      title: 'About this YouTube clone',
      body:
        '<p style="line-height:1.7">This is a browser-only YouTube front end. Search, channels, Shorts, comments and related videos come from YouTube through public <b>Piped</b> and <b>Invidious</b> instances. No API key, account or server is required.</p>' +
        '<div class="menu-sep"></div>' +
        '<p style="line-height:1.7;color:var(--text-2)">Your subscriptions, likes, playlists, watch history and the recommendation model live in this browser only. Nothing is uploaded anywhere. Videos play through YouTube\'s official embed player.</p>' +
        '<div class="menu-sep"></div>' +
        '<p class="settings-note">Public instances can occasionally rate-limit requests. The app remembers the fastest working source and falls back automatically. If a panel fails, hit Retry.</p>' +
        '<div style="margin-top:14px"><a class="btn btn-sm" href="https://www.youtube.com" target="_blank" rel="noopener">Open YouTube</a></div>'
    });
  };

  /* ------------------------------ video menu ---------------------------- */
  ui.videoMenu = function (video, anchor) {
    if (!video) return;
    ui.menu(anchor, [
      {
        icon: 'clock', label: YT.store.isLater(video.id) ? 'Remove from Watch later' : 'Save to Watch later',
        onClick: function () {
          const on = YT.store.toggleLater(video);
          YT.toast(on ? 'Saved to Watch later' : 'Removed from Watch later');
          YT.app.syncVideoButtons(video.id);
        }
      },
      { icon: 'save', label: 'Save to playlist', onClick: function () { ui.saveModal(video); } },
      { type: 'sep' },
      { icon: 'share', label: 'Share', onClick: function () { ui.shareModal(video); } },
      { icon: 'external', label: 'Open on YouTube', onClick: function () { window.open('https://www.youtube.com/watch?v=' + video.id, '_blank', 'noopener'); } },
      { type: 'sep' },
      {
        icon: 'eye', label: 'Not interested',
        onClick: function () {
          YT.store.notInterested(video);
          YT.toast('Video hidden. Your feed will learn from this.');
          YT.app.refreshCurrent();
        }
      },
      {
        icon: 'close', label: "Don't recommend channel",
        onClick: function () {
          YT.store.hideChannel(video.channel);
          YT.toast('Channel hidden from recommendations');
          YT.app.refreshCurrent();
        }
      },
      { icon: 'flag', label: 'Report', onClick: function () { YT.toast('Thanks — reports are not sent from this clone.'); } }
    ]);
  };

  ui.channelMenu = function (channel, anchor) {
    if (!channel) return;
    ui.menu(anchor, [
      {
        icon: YT.store.isSub(channel.id) ? 'bell-fill' : 'bell',
        label: YT.store.isSub(channel.id) ? 'Unsubscribe' : 'Subscribe',
        onClick: function () { ui.toggleSubscribe(channel); }
      },
      { icon: 'share', label: 'Share channel', onClick: function () { YT.copy('https://www.youtube.com/channel/' + channel.id).then(() => YT.toast('Channel link copied')); } },
      { icon: 'external', label: 'Open on YouTube', onClick: function () { window.open('https://www.youtube.com/channel/' + channel.id, '_blank', 'noopener'); } },
      { type: 'sep' },
      {
        icon: 'close', label: "Don't recommend channel",
        onClick: function () { YT.store.hideChannel(channel); YT.toast('Channel hidden'); YT.app.refreshCurrent(); }
      }
    ]);
  };

  ui.toggleSubscribe = function (channel) {
    if (!channel || !channel.id) return;
    const was = YT.store.isSub(channel.id);
    const now = YT.store.toggleSub(channel);
    YT.app.syncSubscribeButtons(channel.id);
    YT.toast(now ? 'Subscribed to ' + (channel.name || 'channel') : 'Unsubscribed');
    YT.app.refreshSidebar();
  };

  return ui;
})();
/* =========================================================================
   05a · VIEWS — shared helpers, Home / For You, and Search
   ========================================================================= */
'use strict';

YT.views = (function () {
  const views = {};
  const h = {};
  let seq = 0;
  let pageAction = null;
  let viewCleanup = null;
  let current = { name: 'home', params: null, more: null, loading: false };
  let forceNext = false;

  /* ------------------------------ helpers ------------------------------- */
  h.esc = YT.esc;
  h.icon = YT.icon;
  h.ui = YT.ui;

  h.page = function () { return YT.$('#page'); };
  h.setPage = function (html) {
    const p = h.page();
    if (p) p.innerHTML = html;
  };
  h.alive = function (token) { return token === seq; };
  h.token = function () { return seq; };
  h.setAction = function (fn) { pageAction = fn; };
  h.setCleanup = function (fn) { viewCleanup = fn; };
  h.setMore = function (fn) { current.more = fn; };
  h.getCurrent = function () { return current; };
  h.force = function () { return forceNext; };
  h.title = function (text) { document.title = text ? (text + ' - YouTube') : 'YouTube'; };
  h.watchHref = id => '#/watch?v=' + encodeURIComponent(id);
  h.shortHref = id => '#/shorts/' + encodeURIComponent(id);
  h.channelHref = ch => (ch && ch.id ? '#/channel/' + encodeURIComponent(ch.id) : '#/results?search_query=' + encodeURIComponent((ch && ch.name) || ''));
  h.playlistHref = id => '#/playlist?list=' + encodeURIComponent(id);
  h.searchHref = q => '#/results?search_query=' + encodeURIComponent(q).replace(/%20/g, '+');

  h.initials = function (name) {
    const clean = String(name || '').replace(/^@/, '').trim();
    if (!clean) return '?';
    return clean.split(/\s+/).slice(0, 2).map(w => w.charAt(0).toUpperCase()).join('');
  };

  h.avatar = function (url, name, cls, size) {
    const src = url ? YT.api.cleanAvatar(url, size || 88) : '';
    return '<span class="' + (cls || '') + '">' +
      (src ? '<img src="' + YT.esc(src) + '" alt="" loading="lazy" decoding="async">' : '<img class="failed" alt="">') +
      '<span class="avatar-fallback">' + YT.esc(h.initials(name)) + '</span>' +
    '</span>';
  };

  h.verified = function (ch) {
    return ch && ch.verified ? '<span title="Verified" aria-label="Verified">' + YT.icon('verified', 'verified') + '</span>' : '';
  };

  h.metaLine = function (v) {
    const bits = [];
    if (v.viewsText) bits.push(YT.esc(v.viewsText));
    else if (v.views) bits.push(YT.esc(YT.fmtViews(v.views)));
    if (v.publishedText) bits.push(YT.esc(v.publishedText));
    else if (v.published) bits.push(YT.esc(YT.timeAgo(v.published)));
    return bits.join(' <span class="dot">•</span> ');
  };

  h.badge = function (v) {
    if (v.live) return '<span class="badge live">Live</span>';
    if (v.duration > 0 && v.duration < 86400) return '<span class="badge duration">' + YT.esc(YT.fmtDuration(v.duration)) + '</span>';
    return '';
  };

  h.chipsWrap = function (inner, opts) {
    const o = opts || {};
    return '<div class="chips-wrap">' +
      '<div class="chips">' + inner + '</div>' +
      (o.right || '') +
    '</div>';
  };

  h.statLine = function (v, includeChannel) {
    const bits = [];
    if (includeChannel && v.channel && v.channel.name) bits.push(YT.esc(v.channel.name));
    if (v.viewsText) bits.push(YT.esc(v.viewsText));
    else if (v.views) bits.push(YT.esc(YT.fmtViews(v.views)));
    if (v.publishedText) bits.push(YT.esc(v.publishedText));
    return bits.join(' <span class="dot">•</span> ');
  };

  h.libRow = function (v, opts) {
    const o = opts || {};
    const kind = o.kind || 'history';
    const ch = v.channel || {};
    YT.ui.rememberVideo(v);
    let pct = 0;
    if (v.duration && v.duration < 86400 && v.progress) pct = YT.clamp((v.progress / v.duration) * 100, 0, 100);
    const prog = pct > 1 && pct < 97 ? '<span class="progress"><i style="width:' + pct.toFixed(1) + '%"></i></span>' : '';
    return '<div class="lib-row" data-video-id="' + YT.esc(v.id) + '">' +
      '<a class="lib-thumb" href="' + h.watchHref(v.id) + '">' +
        '<img ' + YT.thumbAttrs(v.id, { small: true }) + ' alt="" loading="lazy" decoding="async">' +
        h.badge(v) + prog +
      '</a>' +
      '<div class="lib-info">' +
        '<a class="lib-title" href="' + h.watchHref(v.id) + '">' + YT.esc(v.title) + '</a>' +
        '<div class="lib-meta">' +
          (ch.id ? '<a href="' + h.channelHref(ch) + '">' + YT.esc(ch.name || '') + '</a>' : YT.esc(ch.name || '')) +
          (h.metaLine(v) ? ' <span class="dot">•</span> ' + h.metaLine(v) : '') +
        '</div>' +
        (o.description && v.description ? '<div class="lib-desc">' + YT.esc(v.description) + '</div>' : '') +
      '</div>' +
      '<button class="card-menu" data-act="lib-menu" data-id="' + YT.esc(v.id) + '" data-kind="' + YT.esc(kind) + '"' +
        (o.playlist ? ' data-pl="' + YT.esc(o.playlist) + '"' : '') + ' aria-label="Action menu">' + YT.icon('more') + '</button>' +
    '</div>';
  };

  h.pageHead = function (title, actions) {
    return '<div class="page-head"><h1>' + YT.esc(title) + '</h1>' +
      (actions ? '<div class="head-actions">' + actions + '</div>' : '') + '</div>';
  };

  h.empty = function (icon, title, text, action) {
    return YT.ui.empty({ icon: icon, title: title, text: text, action: action });
  };

  h.error = function (message, opts) {
    return YT.ui.errorBox(message, opts);
  };

  h.skeleton = function (n) { return YT.ui.skeletonGrid(n || 12); };

  h.channelPill = function (ch) {
    return '<a class="card-channel" href="' + h.channelHref(ch) + '"><span class="name">' + YT.esc(ch.name || '') + '</span>' + h.verified(ch) + '</a>';
  };

  h.notFound = function () {
    return '<div class="page-inner">' + YT.ui.empty({
      icon: 'warning',
      title: 'This page isn\'t available',
      text: 'The link may be broken, or the page may have been removed.',
      action: '<a class="btn btn-filled" href="#/">Go to Home</a>'
    }) + '</div>';
  };

  /* ------------------------------- show --------------------------------- */
  async function show(name, params, opts) {
    seq++;
    const token = seq;
    current = { name: name, params: params, more: null, loading: false };
    pageAction = null;
    if (viewCleanup) {
      try { viewCleanup(); } catch (e) {}
      viewCleanup = null;
    }
    if (YT.player) YT.player.destroy();
    if (YT.ui) YT.ui.closeMenu();
    document.title = 'YouTube';
    if (YT.app && YT.app.setLoading) YT.app.setLoading(true);
    const view = views[name];
    if (!view) {
      h.setPage(h.notFound());
      if (YT.app && YT.app.setLoading) YT.app.setLoading(false);
      return;
    }
    try {
      await view(params, token, opts || {});
    } catch (err) {
      if (h.alive(token)) {
        h.setPage('<div class="page-inner">' + YT.ui.errorBox(err && err.message ? err.message : 'Something went wrong while loading this page.') + '</div>');
      }
    } finally {
      if (h.alive(token) && YT.app && YT.app.setLoading) YT.app.setLoading(false);
    }
  }

  function refresh(force) {
    forceNext = !!force;
    const p = current.params || new URLSearchParams();
    return show(current.name || 'home', p, { force: forceNext });
  }

  function handleAction(act, ds, el) {
    if (pageAction) {
      try { if (pageAction(act, ds, el)) return true; }
      catch (e) { console.error(e); }
    }
    return false;
  }

  function loadMore() {
    if (!current.more || current.loading) return;
    current.loading = true;
    Promise.resolve(current.more()).catch(() => {}).then(() => { current.loading = false; });
  }

  /* ================================ HOME ================================ */
  function homeChips(active) {
    const items = YT.store.CATEGORIES.map(cat => {
      const href = cat === 'All' ? '#/' : '#/?cat=' + encodeURIComponent(cat);
      return '<a class="chip ' + (cat === active ? 'active' : '') + '" href="' + href + '">' + YT.esc(cat) + '</a>';
    }).join('');
    return h.chipsWrap(items);
  }

  function onboardHtml() {
    const topics = ['Music', 'Gaming', 'Tech', 'Cooking', 'Science', 'Comedy', 'Sports', 'Movies', 'Fitness', 'Travel'];
    return '<div class="onboard">' +
      '<div class="onboard-head"><div><h2>Train your For You feed</h2>' +
      '<p>Pick a few things you like. Your feed also learns automatically from every search and every video you watch.</p></div>' +
      '<button class="icon-btn dismiss" data-act="dismiss-onboard" aria-label="Dismiss">' + YT.icon('close') + '</button></div>' +
      '<div class="onboard-chips">' + topics.map(t =>
        '<button class="chip" data-act="interest" data-topic="' + YT.esc(t) + '">' + YT.esc(t) + '</button>').join('') +
      '</div></div>';
  }

  views.home = async function (params, token, opts) {
    const cat = params.get('cat') || 'All';
    h.title(cat === 'All' ? '' : cat);
    h.setPage('<div class="page-inner">' + homeChips(cat) +
      '<div class="feed-topline"><div><div class="feed-title">' + YT.icon('sparkle') +
      (cat === 'All' ? 'For you' : YT.esc(cat)) + '</div><div class="feed-sub">' +
      (cat === 'All' ? 'Recommended from your searches and watch history' : 'Popular right now in ' + YT.esc(cat)) +
      '</div></div><button class="feed-tune" data-act="tune">' + YT.icon('tune') + 'Tune</button></div>' +
      h.skeleton(12) + '</div>');

    h.setAction(function (act, ds, el) {
      if (act === 'interest') {
        YT.store.addInterest(ds.topic || '');
        YT.toast('Added ' + (ds.topic || 'topic') + ' — your feed will learn from this');
        show('home', new URLSearchParams(cat === 'All' ? '' : 'cat=' + cat), {});
        return true;
      }
      if (act === 'dismiss-onboard') {
        YT.store.setSetting('onboardDismissed', true);
        const box = el.closest('.onboard');
        if (box) box.remove();
        return true;
      }
      if (act === 'tune') { YT.ui.tuneModal(); return true; }
      return false;
    });

    let videos;
    YT.api.lastStale = false;
    try {
      videos = await YT.store.getFeed(cat, !!opts.force);
    } catch (err) {
      if (!h.alive(token)) return;
      h.setPage('<div class="page-inner">' + homeChips(cat) +
        YT.ui.errorBox('The YouTube data services did not respond. Public instances occasionally rate-limit; try again in a moment.') + '</div>');
      return;
    }
    if (!h.alive(token)) return;

    const stale = YT.api.lastStale;
    const stats = YT.store.stats();
    const continueList = cat === 'All' ? YT.store.continueWatching(8) : [];
    let html = '<div class="page-inner">' + homeChips(cat) +
      (stale ? YT.ui.staleBar() : '') +
      '<div class="feed-topline"><div><div class="feed-title">' + YT.icon('sparkle') +
        (cat === 'All' ? 'For you' : YT.esc(cat)) + '</div><div class="feed-sub">' +
        (cat === 'All'
          ? (stats.events > 0 ? 'Tuned to ' + stats.topics + ' interests and ' + stats.watched + ' watched videos' : 'Recommended from your searches and watch history')
          : 'Popular right now in ' + YT.esc(cat)) +
        '</div></div><button class="feed-tune" data-act="tune">' + YT.icon('tune') + 'Tune</button></div>';

    if (cat === 'All' && !YT.store.state.settings.onboardDismissed && stats.events < 4) html += onboardHtml();
    if (continueList.length) html += YT.ui.shelf('Continue watching', continueList, { icon: 'history', href: '#/feed/history' });
    html += '<div id="homeShorts"></div>';
    html += '<div class="grid">' + videos.map(v => YT.ui.videoCard(v)).join('') + '</div>';
    if (!videos.length) {
      html += h.empty('sparkle', 'Nothing here yet', 'Search for something you like — your home feed will start learning immediately.');
    }
    html += '</div>';
    h.setPage(html);

    // Shorts load after the feed so the main grid paints immediately.
    loadHomeShorts(token);
  };

  async function loadHomeShorts(token) {
    const mount = YT.$('#homeShorts');
    if (!mount) return;
    try {
      const shorts = await YT.store.getShortsFeed();
      if (!h.alive(token) || !mount.isConnected) return;
      if (shorts && shorts.length) {
        mount.innerHTML = YT.ui.shelf('Shorts', shorts.slice(0, 12), { short: true, icon: 'shorts-fill', href: '#/shorts', linkText: 'View all' });
      }
    } catch (e) { /* Shorts are optional on home. */ }
  }

  /* =============================== SEARCH ============================== */
  const searchState = { date: 'any', dur: 'any', sort: 'rel' };
  let searchData = { q: '', sp: 'all', videos: [], channels: [], playlists: [], nextpage: null, loading: false };
  let filterOpen = false;

  const SP_TABS = [['all', 'All'], ['videos', 'Videos'], ['channels', 'Channels'], ['playlists', 'Playlists'], ['shorts', 'Shorts']];

  function filterCount() {
    let n = 0;
    if (searchState.date !== 'any') n++;
    if (searchState.dur !== 'any') n++;
    if (searchState.sort !== 'rel') n++;
    return n;
  }

  function filterButton() {
    const n = filterCount();
    return '<div class="filter-wrap"><button class="filters-btn ' + (n ? 'btn-blue' : '') + '" data-act="filter-toggle">' +
      YT.icon('filter') + 'Filters' + (n ? ' <span class="filter-n">' + n + '</span>' : '') + '</button><div id="filterPanel"></div></div>';
  }

  function filterPanelHtml() {
    function group(key, title, options) {
      return '<h3>' + title + '</h3><div class="filter-row">' + options.map(o =>
        '<button class="chip ' + (searchState[key] === o[0] ? 'active' : '') + '" data-act="filter-set" data-key="' + key + '" data-value="' + o[0] + '">' + YT.esc(o[1]) + '</button>').join('') + '</div>';
    }
    return '<div class="filter-panel">' +
      group('date', 'Upload date', [['any', 'Any'], ['hour', 'Last hour'], ['today', 'Today'], ['week', 'This week'], ['month', 'This month'], ['year', 'This year']]) +
      group('dur', 'Duration', [['any', 'Any'], ['short', 'Under 4 minutes'], ['medium', '4 – 20 minutes'], ['long', 'Over 20 minutes']]) +
      group('sort', 'Sort by', [['rel', 'Relevance'], ['date', 'Upload date'], ['views', 'View count']]) +
      '<div class="settings-note" style="margin-top:12px">Filters apply to the results already loaded.</div>' +
      '<div class="filter-actions"><button class="btn btn-sm" data-act="filter-reset">Reset</button><button class="btn btn-sm btn-filled" data-act="filter-toggle">Done</button></div>' +
    '</div>';
  }

  function renderFilterPanel() {
    const mount = YT.$('#filterPanel');
    if (!mount) return;
    mount.innerHTML = filterOpen ? filterPanelHtml() : '';
    const btn = YT.$('.filters-btn');
    if (btn) {
      const n = filterCount();
      btn.classList.toggle('btn-blue', n > 0);
      btn.innerHTML = YT.icon('filter') + 'Filters' + (n ? ' <span class="filter-n">' + n + '</span>' : '');
    }
  }

  function applyFilters(list) {
    let out = (list || []).slice();
    const now = Date.now();
    const hiddenV = new Set(YT.store.state.hiddenVideos);
    const hiddenC = new Set(YT.store.state.hiddenChannels);
    out = out.filter(v => v && !hiddenV.has(v.id) && !(v.channel && hiddenC.has(v.channel.id)));
    if (searchState.date !== 'any') {
      const span = { hour: 36e5, today: 864e5, week: 7 * 864e5, month: 30 * 864e5, year: 365 * 864e5 }[searchState.date] || 0;
      if (span) out = out.filter(v => v.published && now - v.published < span);
    }
    if (searchState.dur !== 'any') {
      out = out.filter(v => {
        if (!v.duration) return false;
        if (searchState.dur === 'short') return v.duration < 240;
        if (searchState.dur === 'medium') return v.duration >= 240 && v.duration <= 1200;
        return v.duration > 1200;
      });
    }
    if (searchState.sort === 'date') out.sort((a, b) => (b.published || 0) - (a.published || 0));
    else if (searchState.sort === 'views') out.sort((a, b) => (b.views || 0) - (a.views || 0));
    return out;
  }

  function searchChips(q, sp) {
    const chips = SP_TABS.map(tab =>
      '<a class="chip ' + (sp === tab[0] ? 'active' : '') + '" href="#/results?search_query=' + encodeURIComponent(q) + '&sp=' + tab[0] + '">' + tab[1] + '</a>').join('');
    return h.chipsWrap(chips + '<span class="chip-sep"></span>', { right: (sp === 'all' || sp === 'videos') ? filterButton() : '' });
  }

  function videoSection(list) {
    const filtered = applyFilters(list);
    return '<div class="search-shelf-title">Videos</div>' +
      '<div id="searchVideos">' + (filtered.length
        ? '<div class="search-videos">' + filtered.map(v => YT.ui.videoCard(v)).join('') + '</div>'
        : h.empty('search', 'No videos match these filters', 'Try clearing the filters or searching something else.')) + '</div>' +
      '<div id="searchMore">' + (searchData.nextpage
        ? '<button class="btn" data-act="search-more">Show more results</button>' : '') + '</div>';
  }

  function channelSection(channels) {
    if (!channels.length) return '';
    return '<div class="search-shelf-title">' + YT.icon('user') + 'Channels</div>' +
      '<div class="search-channel-row">' + channels.map(c => YT.ui.channelCard(c)).join('') + '</div>';
  }

  function playlistSection(playlists) {
    if (!playlists.length) return '';
    return '<div class="search-shelf-title">' + YT.icon('list') + 'Playlists</div>' +
      '<div class="grid">' + playlists.map(p => YT.ui.playlistCard(p)).join('') + '</div>';
  }

  views.search = async function (params, token, opts) {
    const q = String(params.get('search_query') || '').trim();
    const sp = String(params.get('sp') || 'all');
    const previousQuery = searchData.q;
    if (previousQuery.toLowerCase() !== q.toLowerCase()) {
      searchState.date = 'any';
      searchState.dur = 'any';
      searchState.sort = 'rel';
    }
    filterOpen = false;
    h.title(q ? q : 'Search');
    searchData = { q: q, sp: sp, videos: [], channels: [], playlists: [], nextpage: null, loading: false };

    if (!q) {
      const recent = YT.store.state.searches.slice(0, 10);
      h.setPage('<div class="search-page">' + h.pageHead('Search YouTube') +
        (recent.length
          ? '<div class="chips" style="flex-wrap:wrap;margin-bottom:20px">' + recent.map(s =>
            '<a class="chip" href="' + h.searchHref(s.q) + '">' + YT.icon('history', 'icon icon-xs') + YT.esc(s.q) + '</a>').join('') + '</div>'
          : h.empty('search', 'Search YouTube', 'Find videos, channels and Shorts from all of YouTube.')) +
        '</div>');
      return;
    }

    h.setPage('<div class="search-page">' + searchChips(q, sp) +
      '<div class="search-summary">Showing results for <b>' + YT.esc(q) + '</b></div>' +
      '<div id="searchBody">' + h.skeleton(sp === 'channels' ? 6 : 9) + '</div></div>');

    h.setAction(function (act, ds, el) {
      if (act === 'filter-toggle') {
        filterOpen = !filterOpen;
        renderFilterPanel();
        return true;
      }
      if (act === 'filter-set') {
        searchState[ds.key] = ds.value;
        renderFilterPanel();
        renderVideoSection();
        return true;
      }
      if (act === 'filter-reset') {
        searchState.date = 'any'; searchState.dur = 'any'; searchState.sort = 'rel';
        renderFilterPanel();
        renderVideoSection();
        return true;
      }
      if (act === 'search-more') { loadMoreSearch(); return true; }
      return false;
    });

    function renderVideoSection() {
      const mount = YT.$('#searchVideos');
      if (!mount) return;
      const filtered = applyFilters(searchData.videos);
      mount.innerHTML = filtered.length
        ? '<div class="search-videos">' + filtered.map(v => YT.ui.videoCard(v)).join('') + '</div>'
        : h.empty('search', 'No videos match these filters', 'Try resetting the filters.');
      const more = YT.$('#searchMore');
      if (more) more.innerHTML = searchData.nextpage ? '<button class="btn" data-act="search-more">Show more results</button>' : '';
    }

    async function loadMoreSearch() {
      if (searchData.loading || !searchData.nextpage) return;
      searchData.loading = true;
      try {
        const res = await YT.api.search(q, 'videos', searchData.nextpage);
        if (!h.alive(token)) return;
        const values = (res.items || []).filter(x => x.kind === 'video').map(x => x.value);
        searchData.videos = YT.uniqBy(searchData.videos.concat(values), v => v.id);
        searchData.nextpage = res.nextpage;
        if (sp === 'videos') renderVideoSection(); else renderAllVideos();
      } catch (e) {
        YT.toast('Could not load more results');
      } finally {
        searchData.loading = false;
      }
    }

    function renderAllVideos() {
      const mount = YT.$('#searchVideos');
      if (!mount) return;
      const filtered = applyFilters(searchData.videos);
      mount.innerHTML = filtered.length
        ? '<div class="search-videos">' + filtered.map(v => YT.ui.videoCard(v)).join('') + '</div>'
        : h.empty('search', 'No videos match these filters', 'Try resetting the filters.');
      const more = YT.$('#searchMore');
      if (more) more.innerHTML = searchData.nextpage ? '<button class="btn" data-act="search-more">Show more results</button>' : '';
    }

    try {
      if (sp === 'channels') {
        const res = await YT.api.search(q, 'channels');
        if (!h.alive(token)) return;
        const channels = YT.uniqBy((res.items || []).filter(x => x.kind === 'channel').map(x => x.value), c => c.id);
        searchData.channels = channels;
        YT.$('#searchBody').innerHTML = channels.length
          ? '<div class="ch-list">' + channels.map(c => YT.ui.channelCard(c)).join('') + '</div>'
          : h.empty('user', 'No channels found', 'Try different keywords.');
        return;
      }

      if (sp === 'playlists') {
        const res = await YT.api.search(q, 'playlists');
        if (!h.alive(token)) return;
        const playlists = YT.uniqBy((res.items || []).filter(x => x.kind === 'playlist').map(x => x.value), p => p.id);
        searchData.playlists = playlists;
        YT.$('#searchBody').innerHTML = playlists.length
          ? '<div class="grid">' + playlists.map(p => YT.ui.playlistCard(p)).join('') + '</div>'
          : h.empty('list', 'No playlists found', 'Try different keywords.');
        return;
      }

      if (sp === 'shorts') {
        const chans = await YT.api.search(q, 'channels');
        if (!h.alive(token)) return;
        const ids = YT.uniqBy((chans.items || []).filter(x => x.kind === 'channel').map(x => x.value), c => c.id).slice(0, 4).map(c => c.id);
        let shorts = [];
        try { shorts = await YT.api.shortsForChannels(ids, 10); } catch (e) {}
        if (!h.alive(token)) return;
        YT.$('#searchBody').innerHTML = shorts.length
          ? '<div class="shorts-grid">' + shorts.map(v => YT.ui.shortCard(v)).join('') + '</div>'
          : h.empty('shorts', 'No Shorts found', 'Try a different search for Shorts.');
        return;
      }

      if (sp === 'videos') {
        const res = await YT.api.search(q, 'videos');
        if (!h.alive(token)) return;
        searchData.videos = (res.items || []).filter(x => x.kind === 'video').map(x => x.value);
        searchData.nextpage = res.nextpage;
        YT.$('#searchBody').innerHTML = videoSection(searchData.videos);
        return;
      }

      // All
      const [vids, chans, pls] = await Promise.all([
        YT.api.search(q, 'videos').catch(() => ({ items: [], nextpage: null })),
        YT.api.search(q, 'channels').catch(() => ({ items: [] })),
        YT.api.search(q, 'playlists').catch(() => ({ items: [] }))
      ]);
      if (!h.alive(token)) return;

      searchData.videos = (vids.items || []).filter(x => x.kind === 'video').map(x => x.value);
      searchData.nextpage = vids.nextpage || null;
      searchData.channels = YT.uniqBy((chans.items || []).filter(x => x.kind === 'channel').map(x => x.value), c => c.id);
      searchData.playlists = YT.uniqBy((pls.items || []).filter(x => x.kind === 'playlist').map(x => x.value), p => p.id);

      if (!searchData.videos.length && !searchData.channels.length && !searchData.playlists.length) {
        YT.$('#searchBody').innerHTML = h.empty('search', 'No results found', 'Try different keywords or check your spelling.');
        return;
      }

      YT.$('#searchBody').innerHTML =
        channelSection(searchData.channels) +
        '<div id="searchShorts"></div>' +
        videoSection(searchData.videos) +
        playlistSection(searchData.playlists);

      // Shorts for the query, from channels that matched it.
      const ids = searchData.channels.slice(0, 4).map(c => c.id);
      if (ids.length) {
        YT.api.shortsForChannels(ids, 8).then(shorts => {
          const mount = YT.$('#searchShorts');
          if (!mount || !h.alive(token) || !shorts.length) return;
          mount.innerHTML = YT.ui.shelf('Shorts', shorts, { short: true, icon: 'shorts-fill', href: '#/shorts', linkText: 'More Shorts' });
        }).catch(() => {});
      }
    } catch (err) {
      if (!h.alive(token)) return;
      YT.$('#searchBody').innerHTML = YT.ui.errorBox('Search could not reach YouTube. Public data instances can be briefly rate-limited.');
    }
  };

  /* ------------------------------ expose -------------------------------- */
  const publicApi = {
    show: show,
    refresh: refresh,
    handleAction: handleAction,
    loadMore: loadMore,
    _h: h,
    _views: views,
    _current: () => current
  };

  return publicApi;
})();
/* =========================================================================
   05b · PLAYER + WATCH — official YouTube embed, click to play, resume,
   comments, replies, related videos and autoplay-next.
   ========================================================================= */
'use strict';

/* ------------------------------- player --------------------------------- */
YT.player = (function () {
  let apiPromise = null;
  let apiFailed = false;
  let player = null;
  let current = null;
  let timer = null;
  let loadToken = 0;

  function loadApi() {
    if (apiPromise) return apiPromise;
    apiPromise = new Promise(function (resolve, reject) {
      if (window.YT && window.YT.Player) { resolve(window.YT); return; }
      const previous = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = function () {
        if (typeof previous === 'function') {
          try { previous(); } catch (e) {}
        }
        if (window.YT && window.YT.Player) resolve(window.YT);
      };
      const script = document.createElement('script');
      script.src = 'https://www.youtube.com/iframe_api';
      script.async = true;
      script.onerror = function () { reject(new Error('YouTube player failed to load')); };
      document.head.appendChild(script);
      setTimeout(function () {
        if (window.YT && window.YT.Player) resolve(window.YT);
        else reject(new Error('YouTube player timed out'));
      }, 9000);
    });
    return apiPromise;
  }

  function cleanup() {
    if (timer) { clearInterval(timer); timer = null; }
    try { if (player && typeof player.destroy === 'function') player.destroy(); } catch (e) {}
    player = null;
    if (current && current.container) current.container.innerHTML = '';
    current = null;
  }

  function fallback() {
    if (!current) return;
    const opts = current.opts || {};
    const start = Math.max(0, Number(opts.start) || 0);
    const token = current.token;
    const iframe = document.createElement('iframe');
    iframe.src = 'https://www.youtube.com/embed/' + encodeURIComponent(current.id) +
      '?autoplay=1&playsinline=1&rel=0&enablejsapi=0&start=' + Math.floor(start) +
      (opts.loop ? '&loop=1&playlist=' + encodeURIComponent(current.id) : '');
    iframe.title = 'YouTube video player';
    iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
    iframe.allowFullscreen = true;
    iframe.frameBorder = '0';
    current.container.innerHTML = '';
    current.container.appendChild(iframe);
    // Without the JS API we cannot read playback state; record a watch after
    // a reasonable amount of time on the page instead.
    setTimeout(function () {
      if (token !== loadToken) return;
      if (opts.onPlay) opts.onPlay();
    }, 15000);
  }

  function load(id, opts) {
    cleanup();
    loadToken++;
    const o = opts || {};
    const token = loadToken;
    current = { id: id, container: o.container, opts: o, token: token };
    if (!o.container) return;
    o.container.innerHTML = '<div class="player-spinner"><span class="spinner"></span></div>';

    if (apiFailed) { fallback(); return; }

    loadApi().then(function (API) {
      if (!current || token !== loadToken || !o.container.isConnected) return;
      o.container.innerHTML = '<div id="ytPlayerMount"></div>';
      const mount = o.container.querySelector('#ytPlayerMount');
      const start = Math.max(0, Number(o.start) || 0);
      const playerVars = {
        autoplay: 1,
        playsinline: 1,
        rel: 0,
        start: Math.floor(start),
        enablejsapi: 1,
        iv_load_policy: 3,
        color: 'white'
      };
      if (o.loop) {
        playerVars.loop = 1;
        playerVars.playlist = id;
      }
      if (location.protocol === 'http:' || location.protocol === 'https:') playerVars.origin = location.origin;

      let started = false;
      player = new API.Player(mount, {
        videoId: id,
        playerVars: playerVars,
        events: {
          onReady: function (event) {
            if (token !== loadToken) return;
            const spinner = o.container.querySelector('.player-spinner');
            if (spinner) spinner.remove();
            try { event.target.playVideo(); } catch (e) {}
          },
          onStateChange: function (event) {
            if (token !== loadToken) return;
            const state = event.data;
            if (state === 1) {
              if (!started) {
                started = true;
                if (o.onPlay) o.onPlay();
              }
              if (!timer) {
                timer = setInterval(function () {
                  if (!player || token !== loadToken) return;
                  try {
                    if (o.onProgress) o.onProgress(player.getCurrentTime() || 0, player.getDuration() || 0);
                  } catch (e) {}
                }, 5000);
              }
            } else if (state === 2) {
              if (timer) { clearInterval(timer); timer = null; }
            } else if (state === 0) {
              if (timer) { clearInterval(timer); timer = null; }
              if (o.onEnded) o.onEnded();
            }
          },
          onError: function (event) {
            if (token !== loadToken) return;
            if (o.onError) o.onError(event.data || 0);
          }
        }
      });
    }).catch(function () {
      apiFailed = true;
      if (current && token === loadToken) fallback();
    });
  }

  function destroy() {
    loadToken++;
    cleanup();
  }

  function toggle() {
    if (!player || !player.getPlayerState) return;
    try {
      if (player.getPlayerState() === 1) player.pauseVideo();
      else player.playVideo();
    } catch (e) {}
  }

  function seek(delta) {
    if (!player || !player.getCurrentTime) return;
    try { player.seekTo(Math.max(0, player.getCurrentTime() + delta), true); } catch (e) {}
  }

  function mute(force) {
    if (!player) return;
    try {
      if (force === false) player.unMute();
      else if (force === true) player.mute();
      else if (player.isMuted && player.isMuted()) player.unMute();
      else player.mute();
    } catch (e) {}
  }

  function fullscreen() {
    const el = player && player.getIframe ? player.getIframe() : (current && current.container);
    if (!el) return;
    try {
      if (document.fullscreenElement) document.exitFullscreen();
      else if (el.requestFullscreen) el.requestFullscreen();
    } catch (e) {}
  }

  return {
    load: load,
    destroy: destroy,
    toggle: toggle,
    seek: seek,
    mute: mute,
    fullscreen: fullscreen,
    getTime: function () { try { return player ? player.getCurrentTime() : 0; } catch (e) { return 0; } },
    getDuration: function () { try { return player ? player.getDuration() : 0; } catch (e) { return 0; } },
    isReady: function () { return !!player; }
  };
})();

/* --------------------------------- watch -------------------------------- */
(function () {
  const h = YT.views._h;
  const views = YT.views._views;

  let state = {
    id: '', video: null, resume: 0, started: false, recorded: false,
    related: [], commentsToken: null, commentCount: 0, commentLikes: new Set(),
    countdown: null, nextVideo: null
  };

  function playerShell(id) {
    return '<div class="player-shell" id="playerShell" data-id="' + YT.esc(id) + '" data-act="play">' +
      '<img class="player-poster" ' + YT.thumbAttrs(id, {}) + ' alt="">' +
      '<div class="player-poster-shade"></div>' +
      '<button class="play-big" data-act="play" aria-label="Play video">' + YT.icon('play') + '</button>' +
    '</div>';
  }

  function relatedSkeleton() {
    let out = '';
    for (let i = 0; i < 6; i++) {
      out += '<div class="compact">' +
        '<div class="compact-thumb sk-block"></div>' +
        '<div class="compact-info"><div class="sk-line w80" style="margin-bottom:8px"></div>' +
        '<div class="sk-line w60" style="margin-bottom:8px"></div><div class="sk-line w40"></div></div></div>';
    }
    return out;
  }

  function shell(id) {
    return '<div class="watch"><div class="watch-grid"><div class="watch-main">' +
      playerShell(id) +
      '<div id="watchMeta">' + YT.ui.skeletonWatch() + '</div>' +
      '<div id="commentsMount"></div>' +
      '</div><aside class="watch-side">' +
        '<div class="related-head"><h2>Up next</h2>' +
          '<button class="autoplay-toggle" data-act="toggle-autoplay" role="switch" aria-checked="' +
            (YT.store.state.settings.autoplay ? 'true' : 'false') + '"><span>Autoplay</span>' +
            '<span class="switch ' + (YT.store.state.settings.autoplay ? 'on' : '') + '"></span></button>' +
        '</div>' +
        '<div class="related-list" id="relatedList">' + relatedSkeleton() + '</div>' +
      '</aside></div></div>';
  }

  function timeTitle(ts) {
    return ts ? YT.timeAgo(ts) : '';
  }

  function renderMeta(v) {
    const meta = YT.$('#watchMeta');
    if (!meta) return;
    YT.ui.rememberVideo(v);
    const ch = v.channel || {};
    YT.ui.rememberChannel(ch);
    if (state.started && !state.recorded) recordWatch(v);
    const liked = YT.store.isLiked(v.id);
    const disliked = YT.store.isDisliked(v.id);
    const sub = ch.id ? YT.store.getSub(ch.id) : null;
    const notif = sub ? (sub.notif || 'all') : '';
    const likeText = v.likes && v.likes > 0 ? YT.fmtShort(v.likes + (liked ? 1 : 0)) : (liked ? '1' : 'Like');
    const published = v.published ? YT.fmtDate(v.published) : (v.publishedText || '');
    const viewsText = v.views && v.views > 0 ? YT.fmtNum(v.views) + ' views' : (v.viewsText || '');
    const hashtags = YT.hashtags((v.title || '') + ' ' + (v.description || '')).slice(0, 5);
    const descText = YT.linkify(v.description || '').replace(/\n/g, '<br>');
    const bellIcon = notif === 'none' ? 'bell' : 'bell-fill';
    const bellTitle = notif === 'none' ? 'Notifications off' : notif === 'personalized' ? 'Personalized notifications' : 'All notifications';

    meta.innerHTML =
      '<h1 class="watch-title">' + YT.esc(v.title) + '</h1>' +
      '<div class="watch-actions-row">' +
        '<div class="channel-bar">' +
          '<a class="channel-bar-avatar" href="' + h.channelHref(ch) + '">' +
            (ch.avatar ? '<img src="' + YT.esc(ch.avatar) + '" alt="">' : '<img class="failed" alt="">') +
            '<span class="avatar-fallback">' + YT.esc(h.initials(ch.name)) + '</span>' +
          '</a>' +
          '<div class="channel-bar-info">' +
            '<a class="channel-bar-name" href="' + h.channelHref(ch) + '"><span class="name">' + YT.esc(ch.name || 'Unknown channel') + '</span>' + h.verified(ch) + '</a>' +
            '<div class="channel-bar-subs">' + YT.esc(v.subs ? YT.fmtSubs(v.subs) : (sub ? YT.fmtSubs(sub.subs) : 'YouTube channel')) + '</div>' +
          '</div>' +
          '<div class="subscribe-group">' +
            YT.ui.subscribeButton(ch) +
            (sub ? '<button class="bell-sub-btn ' + notif + '" data-act="notif-level" data-bell-for="' + YT.esc(ch.id) + '" title="' + YT.esc(bellTitle) + '" aria-label="' + YT.esc(bellTitle) + '">' + YT.icon(bellIcon) + '</button>' : '') +
          '</div>' +
        '</div>' +
        '<div class="watch-actions">' +
          '<div class="action-group">' +
            '<button class="action-btn ' + (liked ? 'liked' : '') + '" data-act="watch-like" data-like-id="' + YT.esc(v.id) + '" aria-label="Like">' +
              YT.icon(liked ? 'like-fill' : 'like') + '<span data-like-count>' + YT.esc(likeText) + '</span></button>' +
            '<button class="action-btn ' + (disliked ? 'disliked' : '') + '" data-act="watch-dislike" aria-label="Dislike">' + YT.icon('dislike') + '</button>' +
          '</div>' +
          '<button class="action-btn" data-act="watch-share">' + YT.icon('share') + 'Share</button>' +
          '<button class="action-btn" data-act="watch-save">' + YT.icon('save') + 'Save</button>' +
          '<button class="action-btn" data-act="watch-more" aria-label="More actions">' + YT.icon('more-h') + '</button>' +
        '</div>' +
      '</div>' +
      '<div class="desc-box" data-act="toggle-desc">' +
        '<div class="desc-stats">' + YT.esc(viewsText) + (published ? ' <span class="dot">•</span> ' + YT.esc(published) : '') + '</div>' +
        '<div class="desc-text collapsed" id="descText">' + descText + '</div>' +
        (hashtags.length ? '<div class="desc-hashtags">' + hashtags.map(t => '<a href="' + h.searchHref('#' + t) + '">#' + YT.esc(t) + '</a>').join('') + '</div>' : '') +
        '<button class="desc-toggle" data-act="toggle-desc">Show more</button>' +
      '</div>';

    h.title(v.title);
  }

  function renderRelated(v) {
    const mount = YT.$('#relatedList');
    if (!mount) return;
    const related = YT.store.rank(v.related || [], { limit: 26, explore: 0.5, diversify: false, channelCap: 3 });
    const shorts = related.filter(x => x.isShort).slice(0, 6);
    const plain = related.filter(x => !x.isShort).slice(0, 22);
    state.related = plain.concat(shorts);

    if (!plain.length && !shorts.length) {
      YT.api.search(v.title || 'trending', 'videos').then(res => {
        if (!mount.isConnected) return;
        const list = (res.items || []).filter(x => x.kind === 'video').map(x => x.value).filter(x => x.id !== v.id);
        if (!list.length) { mount.innerHTML = h.empty('play', 'No related videos', ''); return; }
        const ranked = YT.store.rank(list, { limit: 20, explore: 0.5, diversify: false });
        state.related = ranked;
        mount.innerHTML = YT.ui.compactList(ranked);
      }).catch(() => {
        mount.innerHTML = h.empty('play', 'No related videos', '');
      });
      return;
    }

    mount.innerHTML = YT.ui.compactList(plain) +
      (shorts.length ? '<div class="related-shorts"><h3>' + YT.icon('shorts-fill') + 'Shorts</h3>' +
        '<div class="related-shorts-grid">' + shorts.map(s => YT.ui.shortCard(s)).join('') + '</div></div>' : '');
  }

  function commentHtml(c, videoId) {
    const liked = state.commentLikes.has(c.id);
    const count = Number(c.likes) || 0;
    const display = liked ? YT.fmtShort(count + 1) : (count > 0 ? YT.fmtShort(count) : '');
    return '<div class="comment" data-comment-id="' + YT.esc(c.id) + '">' +
      '<a class="comment-avatar" href="' + (c.authorId ? h.channelHref({ id: c.authorId, name: c.author }) : '#') + '">' +
        (c.avatar ? '<img src="' + YT.esc(c.avatar) + '" alt="" loading="lazy">' : '<img class="failed" alt="">') +
        '<span class="avatar-fallback">' + YT.esc(h.initials(c.author)) + '</span>' +
      '</a>' +
      '<div class="comment-body">' +
        '<div class="comment-head">' +
          '<a class="comment-author" href="' + (c.authorId ? h.channelHref({ id: c.authorId, name: c.author }) : '#') + '">' + YT.esc(c.author) + '</a>' +
          (c.verified ? YT.icon('verified', 'verified icon-xs') : '') +
          '<span class="comment-time">' + YT.esc(c.time) + '</span>' +
          (c.pinned ? '<span class="comment-badge pinned">Pinned</span>' : '') +
          (c.owner ? '<span class="comment-badge owner">Creator</span>' : '') +
        '</div>' +
        '<div class="comment-text">' + YT.esc(c.text) + '</div>' +
        '<div class="comment-actions">' +
          '<button class="comment-like ' + (liked ? 'liked' : '') + '" data-act="like-comment" data-id="' + YT.esc(c.id) + '" data-count="' + count + '">' +
            YT.icon('like', 'icon icon-xs') + '<span>' + display + '</span></button>' +
          (c.replyCount > 0 && c.repliesToken
            ? '<button class="comment-replies-btn" data-act="load-replies" data-token="' + YT.esc(c.repliesToken) + '">' +
              YT.esc(c.replyCount === 1 ? '1 reply' : c.replyCount + ' replies') + YT.icon('chevron-down', 'icon icon-xs') + '</button>'
            : '') +
        '</div>' +
      '</div>' +
    '</div>';
  }

  function commentsShell(data) {
    return '<div class="comments" id="comments">' +
      '<div class="comments-head"><h2>' + YT.esc(data.count > 0 ? YT.fmtNum(data.count) + ' Comments' : 'Comments') + '</h2>' +
        (data.comments.length ? '<span class="comments-sort">' + YT.icon('sort', 'icon icon-xs') + 'Top comments</span>' : '') +
      '</div>' +
      (data.disabled
        ? '<div class="empty" style="padding:24px 0;align-items:flex-start"><p>Comments are turned off for this video.</p></div>'
        : (data.comments.length
          ? '<div id="commentList">' + data.comments.map(c => commentHtml(c, state.id)).join('') + '</div>' +
            (data.nextpage ? '<button class="btn btn-text comments-more" data-act="more-comments">Show more comments</button>' : '')
          : '<div class="empty" style="padding:24px 0;align-items:flex-start"><p>No comments yet.</p></div>')) +
    '</div>';
  }

  async function loadComments(id, token) {
    const mount = YT.$('#commentsMount');
    if (!mount) return;
    mount.innerHTML = '<div class="comments"><div class="comments-head"><h2>Comments</h2></div><div class="sk-line" style="width:60%;margin-bottom:12px"></div><div class="sk-line" style="width:40%"></div></div>';
    try {
      const data = await YT.api.comments(id);
      if (!h.alive(token) || !mount.isConnected) return;
      state.commentsToken = data.nextpage;
      state.commentCount = data.count;
      mount.innerHTML = commentsShell(data);
    } catch (e) {
      if (!h.alive(token) || !mount.isConnected) return;
      mount.innerHTML = '<div class="comments" id="comments"><div class="comments-head"><h2>Comments</h2></div>' +
        YT.ui.errorBox('Comments could not be loaded from YouTube right now.', { retry: false }) + '</div>';
    }
  }

  function showPlayerError(code) {
    const shell = YT.$('#playerShell');
    if (!shell) return;
    const reason = (code === 101 || code === 150)
      ? 'The video owner has disabled playback on other websites.'
      : code === 100 ? 'This video is unavailable or has been removed.'
        : code === 2 ? 'The video ID is invalid.'
          : 'The video could not be played in this browser.';
    shell.innerHTML = '<div class="player-error">' + YT.icon('warning', 'icon icon-lg') +
      '<h3>Playback error</h3><p>' + YT.esc(reason) + '</p>' +
      '<a class="btn" href="https://www.youtube.com/watch?v=' + encodeURIComponent(state.id) + '" target="_blank" rel="noopener">Watch on YouTube</a>' +
      '</div>';
  }

  function recordWatch(video, progress) {
    if (state.recorded) return;
    const v = video || state.video;
    if (!v || !v.title) return;
    state.recorded = true;
    YT.store.addHistory(v, {
      progress: Number.isFinite(progress) ? progress : (state.resume || 0),
      duration: v.duration || 0
    });
  }

  function startPlayback() {
    const shell = YT.$('#playerShell');
    if (!shell) return;
    const start = state.resume || 0;
    state.started = true;
    recordWatch(state.video, start);
    state.resume = 0;
    YT.player.load(state.id, {
      container: shell,
      start: start,
      onPlay: function () {
        if (state.video) recordWatch(state.video);
        else {
          YT.api.video(state.id).then(v => {
            if (!state.video) { state.video = v; renderMeta(v); renderRelated(v); }
            recordWatch(v);
          }).catch(() => recordWatch(null));
        }
      },
      onProgress: function (t, d) { YT.store.updateProgress(state.id, t, d); },
      onEnded: onEnded,
      onError: showPlayerError
    });
  }

  function clearNext() {
    if (state.countdown) { clearInterval(state.countdown); state.countdown = null; }
    const overlay = YT.$('#nextOverlay');
    if (overlay) overlay.remove();
  }

  function onEnded() {
    const duration = YT.player.getDuration() || (state.video && state.video.duration) || 0;
    if (duration) YT.store.updateProgress(state.id, duration, duration);
    if (!YT.store.state.settings.autoplay) return;
    const next = state.related.filter(v => !v.isShort)[0] || state.related[0];
    if (!next) return;
    state.nextVideo = next;
    const shell = YT.$('#playerShell');
    if (!shell) return;
    clearNext();
    const overlay = document.createElement('div');
    overlay.className = 'next-overlay';
    overlay.id = 'nextOverlay';
    overlay.innerHTML = '<div class="next-label">Up next in <span id="nextSec">5</span>s</div>' +
      '<a class="next-card" href="' + h.watchHref(next.id) + '">' +
        '<img ' + YT.thumbAttrs(next.id, { small: true }) + ' alt="">' +
        '<div class="next-info"><div class="next-title">' + YT.esc(next.title) + '</div>' +
        '<div class="next-meta">' + YT.esc(next.channel && next.channel.name || '') + '</div></div>' +
      '</a>' +
      '<div class="next-actions"><button class="btn btn-filled btn-sm" data-act="play-next">Play now</button>' +
      '<button class="btn btn-sm" data-act="cancel-next">Cancel</button></div>';
    shell.appendChild(overlay);
    let seconds = 5;
    state.countdown = setInterval(function () {
      seconds--;
      const el = YT.$('#nextSec');
      if (el) el.textContent = String(Math.max(0, seconds));
      if (seconds <= 0) {
        clearNext();
        location.hash = h.watchHref(next.id).slice(1);
      }
    }, 1000);
  }

  function action(act, ds, el) {
    if (act === 'play') {
      startPlayback();
      return true;
    }
    if (act === 'toggle-autoplay') {
      const on = !YT.store.state.settings.autoplay;
      YT.store.setSetting('autoplay', on);
      const sw = el.querySelector('.switch');
      if (sw) sw.classList.toggle('on', on);
      el.setAttribute('aria-checked', String(on));
      YT.toast(on ? 'Autoplay is on' : 'Autoplay is off');
      return true;
    }
    if (act === 'watch-like' || act === 'watch-dislike') {
      const v = state.video;
      if (!v) return true;
      if (act === 'watch-like') YT.store.toggleLike(v);
      else YT.store.toggleDislike(v);
      const liked = YT.store.isLiked(v.id);
      const disliked = YT.store.isDisliked(v.id);
      const likeBtn = YT.$('[data-act="watch-like"]');
      const disBtn = YT.$('[data-act="watch-dislike"]');
      if (likeBtn) {
        likeBtn.classList.toggle('liked', liked);
        const iconUse = likeBtn.querySelector('use');
        if (iconUse) iconUse.setAttribute('href', liked ? '#i-like-fill' : '#i-like');
        const count = likeBtn.querySelector('[data-like-count]');
        if (count) count.textContent = v.likes && v.likes > 0 ? YT.fmtShort(v.likes + (liked ? 1 : 0)) : (liked ? '1' : 'Like');
      }
      if (disBtn) disBtn.classList.toggle('disliked', disliked);
      return true;
    }
    if (act === 'watch-share') { if (state.video) YT.ui.shareModal(state.video); return true; }
    if (act === 'watch-save') { if (state.video) YT.ui.saveModal(state.video); return true; }
    if (act === 'watch-more') { if (state.video) YT.ui.videoMenu(state.video, el); return true; }
    if (act === 'notif-level') {
      const id = ds.bellFor || (state.video && state.video.channel && state.video.channel.id);
      if (!id) return true;
      const level = YT.store.cycleNotif(id);
      if (!level) return true;
      const btn = YT.$('[data-bell-for="' + id.replace(/"/g, '') + '"]');
      if (btn) {
        btn.className = 'bell-sub-btn ' + level;
        btn.title = level === 'none' ? 'Notifications off' : level === 'personalized' ? 'Personalized notifications' : 'All notifications';
        const use = btn.querySelector('use');
        if (use) use.setAttribute('href', level === 'none' ? '#i-bell' : '#i-bell-fill');
      }
      YT.toast(level === 'none' ? 'Notifications off' : level === 'personalized' ? 'Personalized notifications' : 'All notifications');
      return true;
    }
    if (act === 'toggle-desc') {
      const text = YT.$('#descText');
      const box = YT.$('.desc-box');
      if (!text || !box) return true;
      const collapsed = text.classList.toggle('collapsed');
      const toggle = box.querySelector('.desc-toggle');
      if (toggle) toggle.textContent = collapsed ? 'Show more' : 'Show less';
      return true;
    }
    if (act === 'more-comments') {
      if (!state.commentsToken) return true;
      el.disabled = true;
      el.textContent = 'Loading...';
      YT.api.moreComments(state.id, state.commentsToken).then(res => {
        const list = YT.$('#commentList');
        if (list) list.insertAdjacentHTML('beforeend', (res.comments || []).map(c => commentHtml(c, state.id)).join(''));
        state.commentsToken = res.nextpage;
        if (!state.commentsToken) el.remove();
        else { el.disabled = false; el.textContent = 'Show more comments'; }
      }).catch(() => { el.disabled = false; el.textContent = 'Show more comments'; YT.toast('Could not load more comments'); });
      return true;
    }
    if (act === 'load-replies') {
      const token = ds.token;
      if (!token) return true;
      el.disabled = true;
      const old = el.textContent;
      el.textContent = 'Loading...';
      YT.api.replies(state.id, token).then(list => {
        const concept = el.closest('.comment');
        const body = concept && concept.querySelector('.comment-body');
        if (body) {
          const box = document.createElement('div');
          box.className = 'replies';
          box.innerHTML = (list || []).map(c => commentHtml(c, state.id)).join('');
          body.appendChild(box);
        }
        el.remove();
      }).catch(() => { el.disabled = false; el.textContent = old; YT.toast('Could not load replies'); });
      return true;
    }
    if (act === 'like-comment') {
      const id = ds.id;
      if (!id) return true;
      const count = Number(ds.count) || 0;
      let liked;
      if (state.commentLikes.has(id)) { state.commentLikes.delete(id); liked = false; }
      else { state.commentLikes.add(id); liked = true; }
      el.classList.toggle('liked', liked);
      const span = el.querySelector('span');
      if (span) span.textContent = liked ? YT.fmtShort(count + 1) : (count ? YT.fmtShort(count) : '');
      return true;
    }
    if (act === 'play-next') {
      const next = state.nextVideo;
      clearNext();
      if (next) location.hash = h.watchHref(next.id).slice(1);
      return true;
    }
    if (act === 'cancel-next') { clearNext(); return true; }
    if (act === 'retry-watch') {
      YT.views.show('watch', new URLSearchParams('v=' + state.id), {});
      return true;
    }
    return false;
  }

  views.watch = async function (params, token, opts) {
    const id = String(params.get('v') || '').trim();
    if (!id) { h.setPage(h.notFound()); return; }
    const time = Number(params.get('t')) || 0;
    const hist = YT.store.state.history.find(x => x.id === id);
    const resume = time || (YT.store.state.settings.restoreProgress && hist ? Math.floor(hist.progress || 0) : 0);
    state = {
      id: id, video: null, resume: resume > 8 && resume < 86400 ? resume : 0, started: false, recorded: false,
      related: [], commentsToken: null, commentCount: 0, commentLikes: new Set(),
      countdown: null, nextVideo: null
    };
    h.title('Video');
    h.setPage(shell(id));
    h.setAction(action);
    h.setCleanup(function () { clearNext(); });

    try {
      const video = await YT.api.video(id);
      if (!h.alive(token)) return;
      state.video = video;
      renderMeta(video);
      renderRelated(video);
      loadComments(id, token);
    } catch (err) {
      if (!h.alive(token)) return;
      const meta = YT.$('#watchMeta');
      if (meta) meta.innerHTML = '<h1 class="watch-title">Video unavailable</h1>' +
        YT.ui.errorBox('This video could not be loaded. It may be private, removed, or the data service is busy.');
      const related = YT.$('#relatedList');
      if (related) related.innerHTML = h.empty('play', 'Nothing to show', '');
      const comments = YT.$('#commentsMount');
      if (comments) comments.innerHTML = '';
    }
  };
})();
/* =========================================================================
   05c · PAGES — Shorts, Channel, Playlist, Library, Subscriptions,
   Trending, You and Settings
   ========================================================================= */
'use strict';

(function () {
  const h = YT.views._h;
  const views = YT.views._views;

  /* =============================== SHORTS =============================== */
  let shortsState = { list: [] };

  function shortFrameInner(v) {
    return '<img class="short-poster" ' + YT.thumbAttrs(v.id, { short: true }) + ' alt="">' +
      '<div class="short-shade"></div>' +
      '<button class="short-play-big" data-act="short-play" data-id="' + YT.esc(v.id) + '" aria-label="Play Short">' + YT.icon('play') + '</button>';
  }

  function resetShortFrame(frame) {
    const v = YT.ui.getVideo(frame.dataset.id);
    frame.dataset.playing = '0';
    frame.innerHTML = v ? shortFrameInner(v) : '';
  }

  function shortSection(v) {
    YT.ui.rememberVideo(v);
    YT.ui.rememberChannel(v.channel);
    const ch = v.channel || {};
    const liked = YT.store.isLiked(v.id);
    const disliked = YT.store.isDisliked(v.id);
    const sub = YT.store.isSub(ch.id);
    const views = v.viewsText || (v.views ? YT.fmtViews(v.views) : '');
    const published = v.publishedText || (v.published ? YT.timeAgo(v.published) : '');
    return '<section class="short" data-short-id="' + YT.esc(v.id) + '">' +
      '<div class="short-stage">' +
        '<div class="short-frame" data-act="short-play" data-id="' + YT.esc(v.id) + '" data-playing="0">' + shortFrameInner(v) + '</div>' +
        '<div class="short-shade"></div>' +
        '<div class="short-overlay">' +
          '<div class="short-channel-row">' +
            '<a class="short-channel-avatar" href="' + h.channelHref(ch) + '">' +
              (ch.avatar ? '<img src="' + YT.esc(ch.avatar) + '" alt="">' : '<img class="failed" alt="">') +
              '<span class="avatar-fallback">' + YT.esc(h.initials(ch.name)) + '</span>' +
            '</a>' +
            '<a class="short-channel-name" href="' + h.channelHref(ch) + '">' + YT.esc(ch.name || 'Channel') + h.verified(ch) + '</a>' +
            '<button class="short-subs-btn ' + (sub ? 'subscribed' : '') + '" data-act="subscribe" data-channel="' + YT.esc(ch.id || '') + '"' +
              ' data-name="' + YT.esc(ch.name || '') + '" data-avatar="' + YT.esc(ch.avatar || '') + '" data-subs="' + (ch.subs || '') + '">' +
              (sub ? 'Subscribed' : 'Subscribe') + '</button>' +
          '</div>' +
          '<div class="short-title">' + YT.esc(v.title) + '</div>' +
          '<div class="short-views">' + YT.esc([views, published].filter(Boolean).join(' • ')) + '</div>' +
        '</div>' +
        '<div class="short-rail">' +
          '<button class="rail-btn ' + (liked ? 'liked' : '') + '" data-act="short-like" data-id="' + YT.esc(v.id) + '" aria-label="Like">' +
            '<span class="rail-icon">' + YT.icon(liked ? 'like-fill' : 'like') + '</span></button>' +
          '<button class="rail-btn ' + (disliked ? 'liked' : '') + '" data-act="short-dislike" data-id="' + YT.esc(v.id) + '" aria-label="Dislike">' +
            '<span class="rail-icon">' + YT.icon('dislike') + '</span></button>' +
          '<button class="rail-btn" data-act="short-comments" data-id="' + YT.esc(v.id) + '" aria-label="Comments">' +
            '<span class="rail-icon">' + YT.icon('comment') + '</span></button>' +
          '<button class="rail-btn" data-act="short-share" data-id="' + YT.esc(v.id) + '" aria-label="Share">' +
            '<span class="rail-icon">' + YT.icon('share') + '</span></button>' +
          '<button class="rail-btn" data-act="short-more" data-id="' + YT.esc(v.id) + '" aria-label="More">' +
            '<span class="rail-icon">' + YT.icon('more') + '</span></button>' +
        '</div>' +
        '<button class="short-nav prev" data-act="short-prev" aria-label="Previous Short">' + YT.icon('chevron-up') + '</button>' +
        '<button class="short-nav next" data-act="short-next" aria-label="Next Short">' + YT.icon('chevron-down') + '</button>' +
      '</div>' +
    '</section>';
  }

  function openShortComments(v) {
    if (!v) return;
    YT.ui.modal({
      title: 'Comments',
      wide: true,
      body: '<div id="shortComments"><div class="sk-line" style="width:70%;margin-bottom:12px"></div><div class="sk-line" style="width:50%"></div></div>'
    });
    YT.api.comments(v.id).then(data => {
      const mount = YT.$('#shortComments');
      if (!mount) return;
      if (data.disabled) { mount.innerHTML = '<p class="muted">Comments are turned off for this Short.</p>'; return; }
      if (!data.comments.length) { mount.innerHTML = '<p class="muted">No comments yet.</p>'; return; }
      mount.innerHTML = '<div class="comments" style="margin-top:0">' + data.comments.slice(0, 30).map(c =>
        '<div class="comment"><a class="comment-avatar" href="' + (c.authorId ? h.channelHref({ id: c.authorId, name: c.author }) : '#') + '">' +
          (c.avatar ? '<img src="' + YT.esc(c.avatar) + '" alt="">' : '<img class="failed" alt="">') +
          '<span class="avatar-fallback">' + YT.esc(h.initials(c.author)) + '</span></a>' +
        '<div class="comment-body"><div class="comment-head"><a class="comment-author" href="#">' + YT.esc(c.author) + '</a>' +
          '<span class="comment-time">' + YT.esc(c.time) + '</span></div>' +
        '<div class="comment-text">' + YT.esc(c.text) + '</div>' +
        '<div class="comment-actions"><span class="comment-like">' + YT.icon('like', 'icon icon-xs') + ' ' +
          (c.likes ? YT.fmtShort(c.likes) : '') + '</span></div></div></div>').join('') + '</div>';
    }).catch(() => {
      const mount = YT.$('#shortComments');
      if (mount) mount.innerHTML = '<p class="muted">Comments could not be loaded right now.</p>';
    });
  }

  views.shorts = async function (params, token, opts) {
    const target = String(params.get('id') || '');
    h.title(target ? 'Shorts' : 'Shorts');
    h.setPage('<div class="shorts-page"><div class="short-empty"><span class="spinner"></span><p>Loading Shorts…</p></div></div>');

    h.setAction(function (act, ds, el) {
      if (act === 'short-play') {
        const frame = el.closest('.short-frame');
        if (!frame) return true;
        const id = frame.dataset.id;
        const video = YT.ui.getVideo(id);
        YT.player.destroy();
        YT.$$('.short-frame').forEach(f => { if (f.dataset.playing === '1') resetShortFrame(f); });
        frame.dataset.playing = '1';
        YT.player.load(id, {
          container: frame,
          loop: true,
          onPlay: function () {
            if (video) YT.store.addHistory(video, { duration: video.duration || 0 });
          },
          onError: function () {
            const v = YT.ui.getVideo(id);
            if (v && !YT.store.isLiked(id)) { /* no-op */ }
            frame.innerHTML = '<div class="player-error"><p>This Short cannot be played here.</p>' +
              '<a class="btn" href="https://www.youtube.com/shorts/' + encodeURIComponent(id) + '" target="_blank" rel="noopener">Open on YouTube</a></div>';
          }
        });
        return true;
      }
      if (act === 'short-next' || act === 'short-prev') {
        const section = el.closest('.short');
        const next = act === 'short-next' ? section.nextElementSibling : section.previousElementSibling;
        if (next) {
          YT.player.destroy();
          YT.$$('.short-frame').forEach(f => { if (f.dataset.playing === '1') resetShortFrame(f); });
          next.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else {
          YT.toast(act === 'short-next' ? 'No more Shorts right now' : 'This is the first Short');
        }
        return true;
      }
      if (act === 'short-like' || act === 'short-dislike') {
        const v = YT.ui.getVideo(ds.id);
        if (!v) return true;
        if (act === 'short-like') YT.store.toggleLike(v);
        else YT.store.toggleDislike(v);
        const liked = YT.store.isLiked(v.id);
        const disliked = YT.store.isDisliked(v.id);
        const likeBtn = el;
        const disBtn = el.parentElement.querySelector('[data-act="short-dislike"]');
        if (likeBtn) {
          likeBtn.classList.toggle('liked', liked);
          const use = likeBtn.querySelector('use');
          if (use) use.setAttribute('href', liked ? '#i-like-fill' : '#i-like');
        }
        if (disBtn) disBtn.classList.toggle('liked', disliked);
        return true;
      }
      if (act === 'short-comments') { openShortComments(YT.ui.getVideo(ds.id)); return true; }
      if (act === 'short-share') { const v = YT.ui.getVideo(ds.id); if (v) YT.ui.shareModal(v); return true; }
      if (act === 'short-more') { const v = YT.ui.getVideo(ds.id); if (v) YT.ui.videoMenu(v, el); return true; }
      return false;
    });

    let list = [];
    let video = null;
    if (target) video = YT.ui.getVideo(target) || null;
    try {
      list = await YT.store.getShortsFeed(!!opts.force);
    } catch (e) {
      list = [];
    }
    if (!h.alive(token)) return;

    if (target && !list.some(v => v.id === target)) {
      if (!video) {
        try { video = await YT.api.video(target); } catch (e) {}
      }
      if (video) list = [video].concat(list);
    }
    list = YT.uniqBy(list, v => v.id);
    if (!list.length) {
      h.setPage('<div class="shorts-page"><div class="short-empty">' + YT.icon('warning', 'icon icon-lg') +
        '<h2>Shorts are unavailable</h2><p>The YouTube sources did not return Shorts. Try again in a moment.</p>' +
        '<button class="btn btn-filled" data-act="retry-view">Retry</button></div></div>');
      return;
    }

    shortsState.list = list;
    h.setPage('<div class="shorts-page"><div class="shorts-feed" id="shortsFeed">' +
      list.map(v => shortSection(v)).join('') + '</div></div>');

    if (target) {
      requestAnimationFrame(function () {
        const el = document.querySelector('.short[data-short-id="' + target.replace(/"/g, '') + '"]');
        if (el) el.scrollIntoView({ block: 'start' });
      });
    }
  };

  /* =============================== CHANNEL ============================== */
  const channelState = { id: '', tab: 'home', sort: 'newest', page: 1, videos: [], more: false, channel: null };

  function channelHeader(ch, tab) {
    const tabs = [['home', 'Home'], ['videos', 'Videos'], ['shorts', 'Shorts'], ['playlists', 'Playlists'], ['about', 'About']];
    const id = encodeURIComponent(ch.id);
    return '<div class="channel-banner ' + (ch.banner ? '' : 'no-banner') + '">' +
        (ch.banner ? '<img src="' + YT.esc(ch.banner) + '" alt="">' : '') +
      '</div>' +
      '<div class="channel-header">' +
        '<a class="channel-head-avatar" href="#/channel/' + id + '">' +
          (ch.avatar ? '<img src="' + YT.esc(ch.avatar) + '" alt="">' : '<img class="failed" alt="">') +
          '<span class="avatar-fallback">' + YT.esc(h.initials(ch.name)) + '</span>' +
        '</a>' +
        '<div class="channel-head-info">' +
          '<h1 class="channel-head-name">' + YT.esc(ch.name) + h.verified(ch) + '</h1>' +
          '<div class="channel-head-meta">' + YT.esc(ch.subsText || 'YouTube channel') +
            (ch.latestVideos && ch.latestVideos.length ? '<span class="dot">•</span>' + ch.latestVideos.length + '+ videos' : '') +
          '</div>' +
          (ch.description ? '<div class="channel-head-desc">' + YT.esc(ch.description) + '</div>' : '') +
          '<div class="channel-head-actions">' +
            YT.ui.subscribeButton(ch) +
            (YT.store.isSub(ch.id) ? '<button class="bell-sub-btn ' + ((YT.store.getSub(ch.id) || {}).notif || 'all') + '" data-act="channel-notif" data-channel="' + YT.esc(ch.id) + '" title="Notification settings">' + YT.icon('bell-fill') + '</button>' : '') +
            '<button class="btn" data-act="channel-share">' + YT.icon('share', 'icon icon-sm') + 'Share</button>' +
          '</div>' +
        '</div>' +
      '</div>' +
      '<div class="channel-tabs">' + tabs.map(t =>
        '<a class="ch-tab ' + (tab === t[0] ? 'active' : '') + '" href="#/channel/' + id + '/' + t[0] + '">' + t[1] + '</a>').join('') +
      '</div>';
  }

  function channelAbout(ch) {
    const joined = ch.joined ? (typeof ch.joined === 'number' ? (ch.joined < 1e12 ? ch.joined * 1000 : ch.joined) : ch.joined) : null;
    return '<div class="about-grid"><div>' +
      '<h2 style="font-size:18px;font-weight:500;margin-bottom:10px">About</h2>' +
      '<div class="about-desc">' + (YT.linkify(ch.description || 'No description has been added to this channel.') || '').replace(/\n/g, '<br>') + '</div>' +
      (ch.relatedChannels && ch.relatedChannels.length ? '<h2 style="font-size:16px;font-weight:500;margin:26px 0 10px">Related channels</h2><div class="ch-list">' +
        ch.relatedChannels.slice(0, 6).map(c => YT.ui.channelCard({
          id: c.authorId, name: c.author, avatar: c.authorThumbnails ? (c.authorThumbnails[c.authorThumbnails.length - 1] || {}).url : '',
          subs: c.subCount, subsText: c.subCount ? YT.fmtSubs(c.subCount) : '', verified: c.authorVerified
        })).join('') + '</div>' : '') +
      '</div><div class="about-stats">' +
        '<div class="about-stat">' + YT.icon('bell') + '<div><div>' + YT.esc(ch.subsText || '—') + '</div><div class="settings-note">Subscribers</div></div></div>' +
        (ch.totalViews ? '<div class="about-stat">' + YT.icon('eye') + '<div><div>' + YT.esc(YT.fmtNum(ch.totalViews)) + ' views</div><div class="settings-note">Total channel views</div></div></div>' : '') +
        (joined ? '<div class="about-stat">' + YT.icon('calendar') + '<div><div>Joined ' + YT.esc(YT.fmtDate(joined)) + '</div><div class="settings-note">Channel creation date</div></div></div>' : '') +
        '<div class="about-stat">' + YT.icon('link') + '<div><a class="about-link" href="https://www.youtube.com/channel/' + encodeURIComponent(ch.id) + '" target="_blank" rel="noopener">youtube.com/channel/' + YT.esc(ch.id) + '</a></div></div>' +
        '<div class="about-stat">' + YT.icon('info') + '<div class="settings-note">Channel data comes from YouTube through public Piped / Invidious instances.</div></div>' +
      '</div></div>';
  }

  function channelShortsGrid(list) {
    if (!list.length) return h.empty('shorts', 'No Shorts on this channel', 'This channel may not have any, or the public source did not return them.', '<button class="btn" data-act="channel-retry-shorts">Retry</button>');
    return '<div class="shorts-grid">' + list.map(v => YT.ui.shortCard(v)).join('') + '</div>';
  }

  function channelVideosView() {
    return '<div class="sort-row">' +
      [['newest', 'Latest'], ['popular', 'Popular'], ['oldest', 'Oldest']].map(s =>
        '<button class="chip ' + (channelState.sort === s[0] ? 'active' : '') + '" data-act="channel-sort" data-sort="' + s[0] + '">' + s[1] + '</button>').join('') +
      '</div>' +
      '<div id="channelGrid">' + (channelState.videos.length
        ? '<div class="grid">' + channelState.videos.map(v => YT.ui.videoCard(v)).join('') + '</div>'
        : h.empty('play', 'No videos yet', '', '<button class="btn btn-filled" data-act="channel-retry-videos">Retry</button>')) + '</div>' +
      (channelState.more ? '<div style="margin-top:20px"><button class="btn" data-act="channel-more">Show more</button></div>' : '');
  }

  async function loadChannelVideos(token, ch, force) {
    const mount = YT.$('#channelContent');
    if (!mount) return;
    const sortRow = '<div class="sort-row">' +
      [['newest', 'Latest'], ['popular', 'Popular'], ['oldest', 'Oldest']].map(s =>
        '<button class="chip ' + (channelState.sort === s[0] ? 'active' : '') + '" data-act="channel-sort" data-sort="' + s[0] + '">' + s[1] + '</button>').join('') +
      '</div>';
    mount.innerHTML = sortRow + h.skeleton(8);
    try {
      const res = await YT.api.channelVideos(ch.id, channelState.sort, 1, !!force);
      if (!h.alive(token) || !mount.isConnected) return;
      let videos = res.videos || [];
      if (!videos.length && ch.latestVideos && ch.latestVideos.length) {
        videos = ch.latestVideos.slice(0, 20);
        YT.toast('Showing latest uploads');
      }
      channelState.videos = videos;
      channelState.more = (res.videos && res.videos.length) ? !!res.more : false;
      channelState.page = 1;
      mount.innerHTML = channelVideosView();
    } catch (e) {
      if (!h.alive(token) || !mount.isConnected) return;
      if (ch.latestVideos && ch.latestVideos.length) {
        channelState.videos = ch.latestVideos.slice(0, 20);
        channelState.more = false;
        channelState.page = 1;
        mount.innerHTML = channelVideosView();
        YT.toast('Showing latest uploads');
      } else {
        mount.innerHTML = YT.ui.errorBox('This channel\'s videos could not be loaded.') +
          '<div style="margin-top:16px"><button class="btn btn-filled" data-act="channel-retry-videos">Retry</button></div>';
      }
    }
  }

  views.channel = async function (params, token, opts) {
    const id = String(params.get('id') || '');
    const tab = String(params.get('tab') || 'home');
    if (!id) { h.setPage(h.notFound()); return; }
    h.title('Channel');
    h.setPage('<div class="channel-page"><div class="channel-banner no-banner"></div>' +
      '<div class="channel-header"><div class="channel-head-avatar sk-block"></div>' +
      '<div class="channel-head-info" style="flex:1"><div class="sk-line" style="width:40%;height:28px;margin-bottom:12px"></div>' +
      '<div class="sk-line" style="width:25%;margin-bottom:20px"></div></div></div>' +
      '<div class="channel-content">' + h.skeleton(9) + '</div></div>');

    let ch;
    try { ch = await YT.api.channel(id); }
    catch (e) {
      if (!h.alive(token)) return;
      h.setPage('<div class="page-inner">' + YT.ui.errorBox('This channel could not be loaded. It may not exist, or the public YouTube data source is busy.') + '</div>');
      return;
    }
    if (!h.alive(token)) return;
    channelState.id = ch.id;
    channelState.tab = tab;
    channelState.channel = ch;
    h.title(ch.name);
    h.setPage('<div class="channel-page">' + channelHeader(ch, tab) + '<div class="channel-content" id="channelContent">' + h.skeleton(9) + '</div></div>');

    h.setAction(function (act, ds, el) {
      if (act === 'channel-share') {
        YT.copy('https://www.youtube.com/channel/' + ch.id).then(() => YT.toast('Channel link copied'));
        return true;
      }
      if (act === 'channel-notif') {
        const level = YT.store.cycleNotif(ch.id);
        if (level) {
          el.className = 'bell-sub-btn ' + level;
          const use = el.querySelector('use');
          if (use) use.setAttribute('href', level === 'none' ? '#i-bell' : '#i-bell-fill');
          YT.toast(level === 'none' ? 'Notifications off' : level === 'personalized' ? 'Personalized notifications' : 'All notifications');
        }
        return true;
      }
      if (act === 'channel-sort') {
        channelState.sort = ds.sort;
        loadChannelVideos(token, ch, true);
        return true;
      }
      if (act === 'channel-retry-videos') {
        loadChannelVideos(token, ch, true);
        return true;
      }
      if (act === 'channel-retry-shorts') {
        YT.views.show('channel', new URLSearchParams('id=' + encodeURIComponent(ch.id) + '&tab=shorts'), {});
        return true;
      }
      if (act === 'channel-more') {
        if (channelState.page > 20) return true;
        el.disabled = true; el.textContent = 'Loading...';
        YT.api.channelVideos(ch.id, channelState.sort, channelState.page + 1).then(res => {
          const list = res.videos || [];
          channelState.page += 1;
          channelState.more = !!res.more && list.length > 0;
          channelState.videos = YT.uniqBy(channelState.videos.concat(list), v => v.id);
          const mount = YT.$('#channelContent');
          if (mount) mount.innerHTML = channelVideosView();
        }).catch(() => { el.disabled = false; el.textContent = 'Show more'; });
        return true;
      }
      return false;
    });

    const mount = YT.$('#channelContent');

    if (tab === 'videos') {
      channelState.sort = 'newest';
      loadChannelVideos(token, ch, true);
      return;
    }

    if (tab === 'shorts') {
      mount.innerHTML = '<div class="shorts-grid">' + Array.from({ length: 8 }).map(() => '<div class="short-card sk"><div class="sk-thumb" style="aspect-ratio:9/16"></div></div>').join('') + '</div>';
      try {
        const shorts = await YT.api.channelShorts(ch.id, false, ch.name);
        if (!h.alive(token) || !mount.isConnected) return;
        mount.innerHTML = channelShortsGrid(shorts);
      } catch (e) {
        if (!h.alive(token)) return;
        mount.innerHTML = YT.ui.errorBox('Shorts for this channel could not be loaded.');
      }
      return;
    }

    if (tab === 'playlists') {
      mount.innerHTML = h.skeleton(6);
      try {
        const playlists = await YT.api.channelPlaylists(ch.id, false);
        if (!h.alive(token) || !mount.isConnected) return;
        mount.innerHTML = playlists.length
          ? '<div class="grid">' + playlists.map(p => YT.ui.playlistCard(p)).join('') + '</div>'
          : h.empty('list', 'No playlists', 'This channel has no public playlists.');
      } catch (e) {
        mount.innerHTML = YT.ui.errorBox('Playlists could not be loaded.');
      }
      return;
    }

    if (tab === 'about') {
      mount.innerHTML = channelAbout(ch);
      return;
    }

    // Home
    let latest = ch.latestVideos && ch.latestVideos.length ? ch.latestVideos : [];
    if (!latest.length) {
      try { latest = (await YT.api.channelVideos(ch.id, 'newest', 1)).videos || []; } catch (e) {}
    }
    if (!h.alive(token) || !mount.isConnected) return;
    mount.innerHTML = '<h2 class="section-head" style="margin-top:0"><span>Latest</span></h2>' +
      '<div class="grid">' + latest.slice(0, 20).map(v => YT.ui.videoCard(v)).join('') + '</div>' +
      '<div id="channelShortsShelf"></div>';
    if (!latest.length) mount.innerHTML = h.empty('play', 'No videos yet', '');

    YT.api.channelShorts(ch.id, false, ch.name).then(shorts => {
      const shelf = YT.$('#channelShortsShelf');
      if (!shelf || !h.alive(token) || !shorts.length) return;
      shelf.innerHTML = YT.ui.shelf('Shorts', shorts, { short: true, icon: 'shorts-fill', href: '#/channel/' + encodeURIComponent(ch.id) + '/shorts' });
    }).catch(() => {});
  };

  /* =============================== PLAYLIST ============================= */
  function playlistHead(opts) {
    return '<div class="playlist-head">' +
      '<div class="playlist-cover-lg">' + (opts.cover || '') + '</div>' +
      '<div class="playlist-info">' +
        '<div class="playlist-title">' + YT.esc(opts.title) + '</div>' +
        '<div class="playlist-meta">' + opts.meta + '</div>' +
        '<div class="playlist-actions">' + opts.actions + '</div>' +
      '</div></div>';
  }

  function numberedPlaylistRows(videos, playlistId) {
    return '<div class="lib-list">' + videos.map((v, i) => {
      YT.ui.rememberVideo(v);
      return '<div class="lib-row playlist-row" data-video-id="' + YT.esc(v.id) + '">' +
        '<span class="pl-index">' + (i + 1) + '</span>' +
        '<a class="lib-thumb" href="' + h.watchHref(v.id) + '">' +
          '<img ' + YT.thumbAttrs(v.id, { small: true }) + ' alt="">' + h.badge(v) +
        '</a>' +
        '<div class="lib-info">' +
          '<a class="lib-title" href="' + h.watchHref(v.id) + '">' + YT.esc(v.title) + '</a>' +
          '<div class="lib-meta">' + (v.channel && v.channel.name ? YT.esc(v.channel.name) : '') + ' ' + h.metaLine(v) + '</div>' +
        '</div>' +
        '<button class="card-menu" data-act="lib-menu" data-id="' + YT.esc(v.id) + '" data-kind="playlist" data-pl="' + YT.esc(playlistId) + '" aria-label="Action menu">' + YT.icon('more') + '</button>' +
      '</div>';
    }).join('') + '</div>';
  }

  views.playlist = async function (params, token, opts) {
    const id = String(params.get('list') || '');
    if (!id) { h.setPage(h.notFound()); return; }
    if (id === 'WL') return views.later(params, token, opts);
    if (id === 'LL') return views.liked(params, token, opts);
    if (id.indexOf('local_') === 0) return localPlaylist(id, token);

    h.title('Playlist');
    h.setPage('<div class="playlist-page"><div class="sk-line" style="width:40%;height:32px;margin-bottom:24px"></div>' + h.skeleton(8) + '</div>');
    let data;
    try { data = await YT.api.playlist(id); }
    catch (e) {
      if (!h.alive(token)) return;
      h.setPage('<div class="page-inner">' + YT.ui.errorBox('This playlist could not be loaded.') + '</div>');
      return;
    }
    if (!h.alive(token)) return;
    h.title(data.title);
    for (const v of data.videos) {
      if (!v.channel.name) v.channel.name = data.author || 'YouTube';
      if (!v.channel.id) v.channel.id = data.authorId || '';
    }
    const cover = data.thumb
      ? '<img src="' + YT.esc(data.thumb) + '" alt="" style="width:100%;height:100%;object-fit:cover">'
      : '<div class="channel-banner no-banner" style="border-radius:12px"></div>';
    h.setPage('<div class="playlist-page">' + playlistHead({
      cover: cover,
      title: data.title,
      meta: YT.esc(data.author || '') + (data.count ? ' <span class="dot">•</span> ' + data.count + ' videos' : '') +
        (data.description ? '<div class="lib-desc" style="display:block;margin-top:8px">' + YT.esc(data.description.slice(0, 220)) + '</div>' : ''),
      actions: (data.videos.length ? '<button class="btn btn-filled" data-act="play-all" data-id="' + YT.esc(data.videos[0].id) + '">' + YT.icon('play', 'icon icon-sm') + 'Play all</button>' : '') +
        '<button class="btn" data-act="save-playlist" data-id="' + YT.esc(id) + '">' + YT.icon('save', 'icon icon-sm') + 'Save playlist</button>' +
        '<button class="btn" data-act="share-playlist" data-id="' + YT.esc(id) + '">' + YT.icon('share', 'icon icon-sm') + 'Share</button>'
    }) +
      (data.videos.length
        ? numberedPlaylistRows(data.videos, id)
        : YT.ui.errorBox(data.incomplete ? 'The videos in this playlist could not be read. Open it on YouTube to watch.' : 'This playlist is empty.', { retry: false })) +
      '</div>');

    h.setAction(function (act, ds, el) {
      if (act === 'play-all' && ds.id) {
        location.hash = h.watchHref(ds.id).slice(1);
        return true;
      }
      if (act === 'save-playlist') {
        const pl = YT.store.createPlaylist((data.title || 'Playlist') + ' (saved)');
        (data.videos || []).slice(0, 80).forEach(v => YT.store.addToPlaylist(pl.id, v));
        YT.toast('Playlist saved to your library');
        return true;
      }
      if (act === 'share-playlist') {
        YT.copy('https://www.youtube.com/playlist?list=' + id).then(() => YT.toast('Playlist link copied'));
        return true;
      }
      if (act === 'lib-menu') {
        const v = YT.ui.getVideo(ds.id);
        if (v) openLibMenu(v, 'playlist', id, el);
        return true;
      }
      return false;
    });
  };

  function localPlaylist(id, token) {
    const pl = YT.store.getPlaylist(id);
    if (!pl) { h.setPage(h.notFound()); return; }
    h.title(pl.name);
    const covers = pl.videos.slice(0, 4);
    const cover = '<div class="local-pl-cover">' +
      Array.from({ length: 4 }).map((_, i) => covers[i]
        ? '<img ' + YT.thumbAttrs(covers[i].id, { small: true }) + ' alt="">'
        : '<div style="background:var(--bg-chip)"></div>').join('') + '</div>';
    h.setPage('<div class="playlist-page">' + playlistHead({
      cover: cover,
      title: pl.name,
      meta: pl.videos.length + ' videos <span class="dot">•</span> Saved in this browser',
      actions: (pl.videos.length ? '<button class="btn btn-filled" data-act="play-all" data-id="' + YT.esc(pl.videos[0].id) + '">' + YT.icon('play', 'icon icon-sm') + 'Play all</button>' : '') +
        '<button class="btn" data-act="rename-loop" data-pl="' + YT.esc(pl.id) + '">' + YT.icon('edit', 'icon icon-sm') + 'Rename</button>' +
        '<button class="btn btn-danger" data-act="delete-local-pl" data-pl="' + YT.esc(pl.id) + '">' + YT.icon('trash', 'icon icon-sm') + 'Delete</button>'
    }) +
      (pl.videos.length ? numberedPlaylistRows(pl.videos, pl.id) : h.empty('list', 'This playlist is empty', 'Use the Save button on any video to add it here.')) + '</div>');

    h.setAction(function (act, ds, el) {
      if (act === 'play-all' && ds.id) {
        location.hash = h.watchHref(ds.id).slice(1);
        return true;
      }
      if (act === 'lib-menu') {
        const v = YT.ui.getVideo(ds.id) || pl.videos.find(x => x.id === ds.id);
        if (v) openLibMenu(v, 'playlist', pl.id, el);
        return true;
      }
      if (act === 'delete-local-pl') {
        YT.ui.confirmModal({
          title: 'Delete playlist?', message: 'This removes “' + pl.name + '” from this browser.', confirmLabel: 'Delete', danger: true,
          onConfirm: function () {
            YT.store.deletePlaylist(pl.id);
            YT.toast('Playlist deleted');
            location.hash = '#/feed/playlists';
          }
        });
        return true;
      }
      if (act === 'rename-loop') {
        YT.ui.modal({
          title: 'Rename playlist',
          body: '<input class="modal-input" id="renameInput" value="' + YT.esc(pl.name) + '" maxlength="80">',
          actions: '<button class="btn" data-close>Cancel</button><button class="btn btn-filled" id="renameSave">Save</button>',
          onMount: function (modalEl, body, close) {
            modalEl.querySelector('#renameSave').addEventListener('click', function () {
              YT.store.renamePlaylist(pl.id, modalEl.querySelector('#renameInput').value);
              close();
              YT.views.refresh();
            });
          }
        });
        return true;
      }
      return false;
    });
  }

  /* =============================== LIBRARY ============================== */
  function openLibMenu(v, kind, plId, anchor) {
    const items = [];
    if (kind === 'history') {
      items.push({ icon: 'trash', label: 'Remove from watch history', onClick: function () { YT.store.removeHistory(v.id); YT.views.refresh(); } });
    }
    if (kind === 'liked') {
      items.push({ icon: 'trash', label: 'Remove from liked videos', onClick: function () { YT.store.removeLike(v.id); YT.views.refresh(); } });
    }
    if (kind === 'later') {
      items.push({ icon: 'trash', label: 'Remove from Watch later', onClick: function () { YT.store.removeLater(v.id); YT.views.refresh(); } });
    }
    if (kind === 'playlist' && plId) {
      items.push({ icon: 'trash', label: 'Remove from playlist', onClick: function () { YT.store.removeFromPlaylist(plId, v.id); YT.views.refresh(); } });
    }
    items.push({
      icon: 'clock', label: YT.store.isLater(v.id) ? 'Remove from Watch later' : 'Save to Watch later',
      onClick: function () { YT.store.toggleLater(v); YT.toast(YT.store.isLater(v.id) ? 'Saved to Watch later' : 'Removed from Watch later'); }
    });
    items.push({ icon: 'save', label: 'Save to playlist', onClick: function () { YT.ui.saveModal(v); } });
    items.push({ type: 'sep' });
    items.push({ icon: 'share', label: 'Share', onClick: function () { YT.ui.shareModal(v); } });
    items.push({ icon: 'external', label: 'Open on YouTube', onClick: function () { window.open('https://www.youtube.com/watch?v=' + v.id, '_blank', 'noopener'); } });
    YT.ui.menu(anchor, items);
  }

  function libraryRows(list, kind, playlistId) {
    if (!list.length) return '';
    return '<div class="lib-list">' + list.map(v => h.libRow(v, { kind: kind, playlist: playlistId, description: kind === 'history' })).join('') + '</div>';
  }

  function emptyLibrary(kind) {
    if (kind === 'history') return h.empty('history', 'No watch history', 'Videos you watch will appear here.', '<a class="btn btn-filled" href="#/">Browse videos</a>');
    if (kind === 'liked') return h.empty('like', 'No liked videos', 'Videos you like will appear here.', '<a class="btn btn-filled" href="#/">Find something to like</a>');
    return h.empty('clock', 'No videos in Watch later', 'Save videos to watch them later.', '<a class="btn btn-filled" href="#/">Browse videos</a>');
  }

  function libraryView(kind, params, token) {
    const titles = { history: 'Watch history', liked: 'Liked videos', later: 'Watch later' };
    const icons = { history: 'history', liked: 'like', later: 'clock' };
    h.title(titles[kind]);
    let items = [];
    let body = '';

    if (kind === 'history') {
      const groups = YT.store.historyGroups();
      items = YT.store.state.history;
      body = groups.map(g =>
        '<h2 class="section-head"><span>' + g.title + '</span></h2>' + libraryRows(g.items, 'history')).join('');
    } else if (kind === 'liked') {
      items = YT.store.state.likes;
      body = libraryRows(items, 'liked');
    } else {
      items = YT.store.state.later;
      body = libraryRows(items, 'later');
    }

    const paused = YT.store.state.settings.historyPaused;
    const actions = (kind === 'history'
      ? '<button class="btn" data-act="toggle-history-pause">' + YT.icon(paused ? 'play' : 'pause', 'icon icon-sm') + (paused ? 'Resume watch history' : 'Pause watch history') + '</button>' +
        (items.length ? '<button class="btn btn-danger" data-act="clear-history">' + YT.icon('trash', 'icon icon-sm') + 'Clear all</button>' : '')
      : (items.length ? '<button class="btn btn-filled" data-act="play-all" data-id="' + YT.esc(items[0].id) + '">' + YT.icon('play', 'icon icon-sm') + 'Play all</button>' : '') +
        (kind === 'later' ? '<button class="btn" data-act="create-playlist">' + YT.icon('plus', 'icon icon-sm') + 'New playlist</button>' : ''));

    let html = '<div class="library-page">' + h.pageHead(titles[kind], actions);
    if (kind === 'history' && paused) {
      html += '<div class="stale-bar">' + YT.icon('info') + '<span>Watch history is paused. New videos will not be added and will not train your feed.</span><button data-act="toggle-history-pause">Resume</button></div>';
    }
    html += body || emptyLibrary(kind);

    if (kind === 'history' && YT.store.state.searches.length) {
      html += '<h2 class="section-head"><span>Search history</span><button class="section-link" data-act="clear-searches" style="color:var(--blue);font-size:13px">Clear search history</button></h2>' +
        '<div class="chips" style="flex-wrap:wrap">' + YT.store.state.searches.slice(0, 20).map(s =>
          '<a class="chip" href="' + h.searchHref(s.q) + '">' + YT.icon('search', 'icon icon-xs') + YT.esc(s.q) + '</a>').join('') + '</div>';
    }
    html += '</div>';
    h.setPage(html);

    h.setAction(function (act, ds, el) {
      if (act === 'lib-menu') {
        const v = YT.ui.getVideo(ds.id) || (items.find(x => x.id === ds.id));
        if (v) openLibMenu(v, ds.kind, ds.pl, el);
        return true;
      }
      if (act === 'play-all' && ds.id) {
        location.hash = h.watchHref(ds.id).slice(1);
        return true;
      }
      if (act === 'toggle-history-pause') {
        YT.store.setSetting('historyPaused', !YT.store.state.settings.historyPaused);
        YT.views.refresh();
        return true;
      }
      if (act === 'clear-history') {
        YT.ui.confirmModal({
          title: 'Clear watch history?', message: 'This removes your entire watch history and the watch signal from your recommendations.', confirmLabel: 'Clear history', danger: true,
          onConfirm: function () { YT.store.clearHistory(); YT.toast('Watch history cleared'); YT.views.refresh(); }
        });
        return true;
      }
      if (act === 'clear-searches') { YT.store.clearSearches(); YT.toast('Search history cleared'); YT.views.refresh(); return true; }
      if (act === 'create-playlist') { YT.ui.newPlaylistModal(); return true; }
      return false;
    });
  }

  views.history = function (params, token) { libraryView('history', params, token); };
  views.liked = function (params, token) { libraryView('liked', params, token); };
  views.later = function (params, token) { libraryView('later', params, token); };

  /* =========================== SUBSCRIPTIONS =========================== */
  let subFilter = 'all';

  function manageSubsModal() {
    const subs = YT.store.state.subs;
    YT.ui.modal({
      title: 'Manage subscriptions',
      wide: true,
      body: subs.length ? '<div class="playlist-pick">' + subs.map(s =>
        '<div class="pick-row" data-sub-row="' + YT.esc(s.id) + '">' +
          '<span class="ch-avatar" style="width:28px;height:28px">' +
            (s.avatar ? '<img src="' + YT.esc(s.avatar) + '" alt="">' : '<img class="failed" alt="">') +
            '<span class="avatar-fallback">' + YT.esc(h.initials(s.name)) + '</span>' +
          '</span><span class="pick-label">' + YT.esc(s.name) + '</span>' +
          '<button class="btn btn-sm" data-unsub="' + YT.esc(s.id) + '">Unsubscribe</button>' +
        '</div>').join('') + '</div>' : '<p class="muted">You are not subscribed to any channels.</p>',
      onMount: function (modalEl) {
        modalEl.querySelectorAll('[data-unsub]').forEach(btn => {
          btn.addEventListener('click', function () {
            const id = btn.getAttribute('data-unsub');
            const sub = YT.store.getSub(id);
            if (sub) YT.store.toggleSub({ id: sub.id, name: sub.name, avatar: sub.avatar });
            const row = btn.closest('[data-sub-row]');
            if (row) row.remove();
            YT.app.refreshSidebar();
            YT.views.refresh();
          });
        });
      }
    });
  }

  views.subscriptions = async function (params, token, opts) {
    h.title('Subscriptions');
    const subs = YT.store.state.subs;
    if (!subs.length) {
      h.setPage('<div class="page-inner">' + h.pageHead('Subscriptions') + h.empty('subs', 'No subscriptions yet',
        'Subscribe to channels and their newest videos will show up here.',
        '<a class="btn btn-filled" href="#/">Find channels</a>') + '</div>');
      return;
    }
    h.setPage('<div class="page-inner">' + h.pageHead('Subscriptions',
      '<button class="btn btn-sm" data-act="manage-subs">Manage</button>') +
      '<div class="search-channel-row">' + subs.map(s => YT.ui.channelCard({
        id: s.id, name: s.name, avatar: s.avatar, subs: s.subs, subsText: s.subs ? YT.fmtSubs(s.subs) : ''
      })).join('') + '</div>' +
      '<div id="subFeed">' + h.skeleton(9) + '</div></div>');

    h.setAction(function (act, ds, el) {
      if (act === 'manage-subs') { manageSubsModal(); return true; }
      if (act === 'sub-filter') {
        subFilter = ds.id || 'all';
        YT.$$('[data-act="sub-filter"]').forEach(b => b.classList.toggle('active', b.getAttribute('data-id') === subFilter));
        renderSubFeed();
        return true;
      }
      return false;
    });

    let feed = [];
    try { feed = await YT.store.subscriptionFeed(!!opts.force); }
    catch (e) {
      const mount = YT.$('#subFeed');
      if (mount) mount.innerHTML = YT.ui.errorBox('Your subscription feed could not be loaded right now.');
      return;
    }
    if (!h.alive(token)) return;

    function renderSubFeed() {
      const mount = YT.$('#subFeed');
      if (!mount) return;
      const list = subFilter === 'all' ? feed : feed.filter(v => v.channel && v.channel.id === subFilter);
      mount.innerHTML = (list.length ? '<div class="grid">' + list.map(v => YT.ui.videoCard(v)).join('') + '</div>'
        : h.empty('subs', 'Nothing new here', 'Try another channel filter.'));
    }

    const chips = '<div class="chips" style="flex-wrap:wrap;margin-bottom:16px">' +
      '<button class="chip ' + (subFilter === 'all' ? 'active' : '') + '" data-act="sub-filter" data-id="all">All</button>' +
      subs.map(s => '<button class="chip ' + (subFilter === s.id ? 'active' : '') + '" data-act="sub-filter" data-id="' + YT.esc(s.id) + '">' + YT.esc(s.name) + '</button>').join('') +
      '</div>';
    const feedMount = YT.$('#subFeed');
    if (feedMount) feedMount.insertAdjacentHTML('beforebegin', chips);
    renderSubFeed();
  };

  /* =============================== TRENDING ============================= */
  views.trending = async function (params, token, opts) {
    const type = params.get('type') || 'Now';
    h.title('Trending');
    h.setPage('<div class="page-inner">' + h.pageHead('Trending') +
      '<div class="chips" style="margin-bottom:20px">' + ['Now', 'Music', 'Gaming', 'Movies'].map(t =>
        '<a class="chip ' + (type === t ? 'active' : '') + '" href="#/feed/trending?type=' + t + '">' + t + '</a>').join('') +
      '</div><div id="trendingBody">' + h.skeleton(12) + '</div></div>');
    try {
      const list = await YT.store.trending(type);
      if (!h.alive(token)) return;
      const body = YT.$('#trendingBody');
      if (!list.length) { body.innerHTML = h.empty('fire', 'Nothing trending', 'Try again in a moment.'); return; }
      body.innerHTML = '<div class="grid">' + YT.store.rank(list, { limit: 40, explore: 0.8, diversify: true }).map(v => YT.ui.videoCard(v)).join('') + '</div>';
    } catch (e) {
      const body = YT.$('#trendingBody');
      if (body) body.innerHTML = YT.ui.errorBox('Trending videos could not be loaded.');
    }
  };

  /* ================================ YOU ================================= */
  views.you = async function (params, token, opts) {
    h.title('You');
    const s = YT.store.stats();
    const cont = YT.store.continueWatching(8);
    const recent = YT.store.state.history.slice(0, 6);
    const cards = [
      ['history', 'History', s.watched + (s.watched === 1 ? ' video watched' : ' videos watched'), '#/feed/history'],
      ['clock', 'Watch later', YT.store.state.later.length + ' videos', '#/playlist?list=WL'],
      ['like', 'Liked videos', s.likes + ' videos', '#/playlist?list=LL'],
      ['list', 'Playlists', s.playlists + ' playlists', '#/feed/playlists'],
      ['subs', 'Subscriptions', s.subs + ' channels', '#/feed/subscriptions']
    ];
    let html = '<div class="page-inner"><div class="you-header"><div class="you-avatar">Y</div>' +
      '<div><div class="you-name">You</div><div class="you-handle">@you · this browser</div>' +
      '<div class="you-stats">' + s.events + ' learning signals · feed tuned to ' + s.topics + ' interests</div></div>' +
      '<div style="margin-left:auto;display:flex;gap:8px"><button class="btn" data-act="tune">' + YT.icon('tune', 'icon icon-sm') + 'Tune recommendations</button></div></div>' +
      '<div class="you-grid">' + cards.map(c =>
        '<a class="you-card" href="' + c[3] + '"><h3>' + YT.icon(c[0]) + c[1] + '</h3><p>' + YT.esc(c[2]) + '</p><span style="color:var(--blue);font-size:13px;font-weight:500">Open</span></a>').join('') +
      '</div>';

    if (cont.length) html += YT.ui.shelf('Continue watching', cont, { icon: 'history', href: '#/feed/history' });
    if (recent.length) {
      html += '<h2 class="section-head"><span>Recent activity</span><a class="section-link" href="#/feed/history">View all</a></h2>' +
        '<div class="lib-list">' + recent.map(v => h.libRow(v, { kind: 'history' })).join('') + '</div>';
    }
    html += '</div>';
    h.setPage(html);

    h.setAction(function (act, ds, el) {
      if (act === 'tune') { YT.ui.tuneModal(); return true; }
      if (act === 'lib-menu') {
        const v = YT.ui.getVideo(ds.id);
        if (v) openLibMenu(v, ds.kind || 'history', ds.pl, el);
        return true;
      }
      return false;
    });
  };

  /* ============================== PLAYLISTS ============================= */
  views.playlists = async function (params, token, opts) {
    h.title('Playlists');
    const lists = YT.store.state.playlists;
    let html = '<div class="library-page">' + h.pageHead('Playlists',
      '<button class="btn btn-sm btn-filled" data-act="create-playlist">' + YT.icon('plus', 'icon icon-sm') + 'New playlist</button>') +
      (lists.length ? lists.map(pl => {
        const covers = pl.videos.slice(0, 4);
        return '<a class="local-pl-row" href="#/playlist?list=' + encodeURIComponent(pl.id) + '">' +
          '<div class="local-pl-cover">' + Array.from({ length: 4 }).map((_, i) => covers[i]
            ? '<img ' + YT.thumbAttrs(covers[i].id, { small: true }) + ' alt="">'
            : '<div style="background:var(--bg-chip)"></div>').join('') + '</div>' +
          '<div class="local-pl-info"><div class="local-pl-name">' + YT.esc(pl.name) + '</div>' +
          '<div class="local-pl-meta">' + pl.videos.length + ' videos · Private</div></div>' +
          '<span style="color:var(--text-2)">' + YT.icon('chevron-right') + '</span></a>';
      }).join('') : h.empty('list', 'No playlists yet', 'Create a playlist and add videos from the Save button.', '<button class="btn btn-filled" data-act="create-playlist">Create playlist</button>')) +
      '<h2 class="section-head"><span>Watch later & liked</span></h2>' +
      '<div class="you-grid">' +
        '<a class="you-card" href="#/playlist?list=WL"><h3>' + YT.icon('clock') + 'Watch later</h3><p>' + YT.store.state.later.length + ' videos saved</p><span style="color:var(--blue);font-size:13px">Open</span></a>' +
        '<a class="you-card" href="#/playlist?list=LL"><h3>' + YT.icon('like') + 'Liked videos</h3><p>' + YT.store.state.likes.length + ' videos liked</p><span style="color:var(--blue);font-size:13px">Open</span></a>' +
      '</div></div>';
    h.setPage(html);
    h.setAction(function (act) {
      if (act === 'create-playlist') { YT.ui.newPlaylistModal(); return true; }
      return false;
    });
  };

  /* =============================== SETTINGS ============================ */
  function switchRow(label, desc, key, on) {
    return '<div class="set-row"><div class="set-row-text"><div class="set-label">' + YT.esc(label) + '</div>' +
      '<div class="set-desc">' + YT.esc(desc) + '</div></div>' +
      '<button class="switch ' + (on ? 'on' : '') + '" data-act="set-toggle" data-key="' + key + '" role="switch" aria-checked="' + (on ? 'true' : 'false') + '" aria-label="' + YT.esc(label) + '"></button></div>';
  }

  views.settings = async function (params, token, opts) {
    h.title('Settings');
    const s = YT.store.state.settings;
    const theme = s.theme || 'dark';
    const seg = [['dark', 'Dark'], ['light', 'Light'], ['system', 'System']].map(t =>
      '<button class="' + (theme === t[0] ? 'active' : '') + '" data-act="set-theme" data-value="' + t[0] + '">' + t[1] + '</button>').join('');
    h.setPage('<div class="settings-page"><h1>Settings</h1>' +

      '<div class="set-group"><h2>Appearance</h2><p>Choose how this YouTube clone looks on this device.</p>' +
        '<div class="set-row"><div class="set-row-text"><div class="set-label">Theme</div><div class="set-desc">Dark follows YouTube\'s default look.</div></div>' +
        '<div class="segmented">' + seg + '</div></div></div>' +

      '<div class="set-group"><h2>Playback</h2>' +
        switchRow('Autoplay next video', 'When a video ends, play the next recommendation automatically.', 'autoplay', !!s.autoplay) +
        switchRow('Resume where you left off', 'Continue a video from your saved progress.', 'restoreProgress', !!s.restoreProgress) +
        switchRow('Notifications', 'Show a badge and a menu for new videos from the channels you follow.', 'notifications', !!s.notifications) +
        '<div class="set-row"><div class="set-row-text"><div class="set-label">Country for trending</div><div class="set-desc">Used by the Trending page.</div></div>' +
        '<select class="select" data-region>' + [['US', 'United States'], ['GB', 'United Kingdom'], ['CA', 'Canada'], ['AU', 'Australia'], ['DE', 'Germany'], ['IN', 'India'], ['JP', 'Japan'], ['BR', 'Brazil']].map(r =>
          '<option value="' + r[0] + '" ' + (s.region === r[0] ? 'selected' : '') + '>' + r[1] + '</option>').join('') + '</select></div>' +
      '</div>' +

      '<div class="set-group"><h2>Recommendations</h2><p>The For You feed is trained locally from your searches, watches, likes and subscriptions.</p>' +
        '<div class="set-row"><div class="set-row-text"><div class="set-label">Your taste profile</div><div class="set-desc">' +
          YT.store.stats().topics + ' topics learned · ' + YT.store.stats().events + ' signals</div></div>' +
          '<div class="set-actions"><button class="btn btn-sm" data-act="settings-tune">Tune</button>' +
          '<button class="btn btn-sm btn-danger" data-act="settings-reset-profile">Reset</button></div></div>' +
      '</div>' +

      '<div class="set-group"><h2>History &amp; privacy</h2>' +
        switchRow('Pause watch history', 'Stop recording videos and stop training your feed.', 'historyPaused', !!s.historyPaused) +
        '<div class="set-row"><div class="set-row-text"><div class="set-label">Clear watch history</div><div class="set-desc">' + YT.store.state.history.length + ' videos saved.</div></div>' +
          '<button class="btn btn-sm btn-danger" data-act="settings-clear-history">Clear</button></div>' +
        '<div class="set-row"><div class="set-row-text"><div class="set-label">Clear search history</div><div class="set-desc">' + YT.store.state.searches.length + ' searches saved.</div></div>' +
          '<button class="btn btn-sm btn-danger" data-act="settings-clear-searches">Clear</button></div>' +
      '</div>' +

      '<div class="set-group"><h2>Your data</h2><p>Everything is stored in this browser. Export a backup or move it to another browser.</p>' +
        '<div class="set-row"><div class="set-row-text"><div class="set-label">Export data</div><div class="set-desc">Subscriptions, playlists, history and the taste profile as JSON.</div></div>' +
          '<div class="data-actions"><button class="btn btn-sm" data-act="settings-export">Export</button>' +
          '<button class="btn btn-sm" data-act="settings-import">Import</button></div></div>' +
        '<div class="set-row"><div class="set-row-text"><div class="set-label">Delete all data</div><div class="set-desc">Clears every setting, subscription, playlist and cached result.</div></div>' +
          '<button class="btn btn-sm btn-danger" data-act="settings-clear-all">Delete</button></div>' +
      '</div>' +

      '<div class="set-group"><h2>About</h2><p>Search, channels, Shorts and comments are real YouTube data fetched through public Piped and Invidious instances. No API key, account or server is used.</p>' +
        '<div class="set-row"><div class="set-row-text"><div class="set-label">Keyboard shortcuts</div><div class="set-desc">Playback and search shortcuts.</div></div>' +
          '<button class="btn btn-sm" data-act="settings-shortcuts">View</button></div>' +
        '<div class="set-row"><div class="set-row-text"><div class="set-label">About this clone</div><div class="set-desc">How the data and recommendations work.</div></div>' +
          '<button class="btn btn-sm" data-act="settings-about">Read</button></div>' +
      '</div>' +

      '<p class="settings-note">Videos are embedded from YouTube. This site is not affiliated with YouTube.</p>' +
      '<input type="file" id="importFile" accept="application/json,.json" hidden>' +
      '</div>');

    h.setAction(function (act, ds, el) {
      if (act === 'set-toggle') {
        const key = ds.key;
        const value = !YT.store.state.settings[key];
        YT.store.setSetting(key, value);
        el.classList.toggle('on', value);
        el.setAttribute('aria-checked', String(value));
        return true;
      }
      if (act === 'set-theme') {
        YT.store.setSetting('theme', ds.value);
        YT.$$('.segmented button').forEach(b => b.classList.toggle('active', b === el));
        return true;
      }
      if (act === 'settings-tune') { YT.ui.tuneModal(); return true; }
      if (act === 'settings-reset-profile') {
        YT.ui.confirmModal({ title: 'Reset recommendations?', message: 'Your feed will forget every topic and channel it learned.', confirmLabel: 'Reset', danger: true,
          onConfirm: function () { YT.store.resetProfile(); YT.toast('Recommendations reset'); YT.views.refresh(); } });
        return true;
      }
      if (act === 'settings-clear-history') {
        YT.ui.confirmModal({ title: 'Clear watch history?', message: 'This cannot be undone.', confirmLabel: 'Clear', danger: true,
          onConfirm: function () { YT.store.clearHistory(); YT.toast('Watch history cleared'); YT.views.refresh(); } });
        return true;
      }
      if (act === 'settings-clear-searches') {
        YT.store.clearSearches(); YT.toast('Search history cleared'); YT.views.refresh(); return true;
      }
      if (act === 'settings-export') {
        YT.download('youtube-clone-data.json', JSON.stringify(YT.store.exportData(), null, 2));
        YT.toast('Backup downloaded');
        return true;
      }
      if (act === 'settings-import') {
        const input = YT.$('#importFile');
        if (input) input.click();
        return true;
      }
      if (act === 'settings-clear-all') {
        YT.ui.confirmModal({ title: 'Delete all data?', message: 'Every subscription, playlist, watch and recommendation is removed from this browser.', confirmLabel: 'Delete everything', danger: true,
          onConfirm: function () { YT.store.clearAllData(); YT.toast('All data deleted'); setTimeout(() => location.reload(), 500); } });
        return true;
      }
      if (act === 'settings-shortcuts') { YT.ui.shortcutsModal(); return true; }
      if (act === 'settings-about') { YT.ui.aboutModal(); return true; }
      return false;
    });
  };

  /* ============================== NOT FOUND ============================ */
  views.notfound = function (params, token) {
    h.title('Not found');
    h.setPage(h.notFound());
  };

  YT.views.pauseShorts = function () {
    YT.player.destroy();
    YT.$$('.short-frame[data-playing="1"]').forEach(resetShortFrame);
  };
})();
/* =========================================================================
   06 · APP — router, guide, header search, menus, shortcuts and actions
   ========================================================================= */
'use strict';

YT.app = (function () {
  let suggestItems = [];
  let suggestActive = -1;
  let suggestSeq = 0;
  let suggestTimer = null;
  let loadingCount = 0;
  let notificationsPrimed = false;
  let recognition = null;

  const state = () => YT.store.state;
  const $ = YT.$;
  const $$ = YT.$$;
  const esc = YT.esc;

  /* ------------------------------- router -------------------------------- */
  function parseHash() {
    let raw = location.hash.replace(/^#/, '');
    if (!raw) raw = '/';
    if (raw.charAt(0) === '?') raw = '/' + raw;
    const qi = raw.indexOf('?');
    const path = qi > -1 ? raw.slice(0, qi) : raw;
    const query = qi > -1 ? raw.slice(qi + 1) : '';
    return { path: path || '/', params: new URLSearchParams(query) };
  }

  function decode(part) {
    try { return decodeURIComponent(part); } catch (e) { return part; }
  }

  function resolve(path, params) {
    const segs = path.split('/').filter(Boolean).map(decode);
    if (!segs.length) return { view: 'home', nav: 'home' };
    const a = segs[0];

    if (a === 'results') return { view: 'search', nav: '' };
    if (a === 'watch') {
      if (!params.get('v') && segs[1]) params.set('v', segs[1]);
      return { view: 'watch', nav: '' };
    }
    if (a === 'shorts' || a === 'short') {
      if (segs[1]) params.set('id', segs[1]);
      return { view: 'shorts', nav: 'shorts' };
    }
    if (a === 'channel') {
      params.set('id', segs[1] || '');
      params.set('tab', segs[2] || 'home');
      return { view: 'channel', nav: '' };
    }
    if (a === 'c') {
      params.set('id', '@' + (segs[1] || ''));
      params.set('tab', segs[2] || 'home');
      return { view: 'channel', nav: '' };
    }
    if (a === 'playlist') {
      const list = params.get('list') || '';
      return { view: 'playlist', nav: list === 'WL' ? 'later' : list === 'LL' ? 'liked' : '' };
    }
    if (a === 'feed') {
      const b = segs[1] || '';
      if (b === 'subscriptions') return { view: 'subscriptions', nav: 'subs' };
      if (b === 'history') return { view: 'history', nav: 'history' };
      if (b === 'trending') return { view: 'trending', nav: 'trending' };
      if (b === 'playlists') return { view: 'playlists', nav: 'playlists' };
      if (b === 'you') return { view: 'you', nav: 'you' };
      return { view: 'notfound', nav: '' };
    }
    if (a === 'you') return { view: 'you', nav: 'you' };
    if (a === 'history') return { view: 'history', nav: 'history' };
    if (a === 'liked') return { view: 'liked', nav: 'liked' };
    if (a === 'later') return { view: 'later', nav: 'later' };
    if (a === 'trending') return { view: 'trending', nav: 'trending' };
    if (a === 'settings') return { view: 'settings', nav: 'settings' };
    return { view: 'notfound', nav: '' };
  }

  function route() {
    const parsed = parseHash();
    const target = resolve(parsed.path, parsed.params);
    document.body.classList.remove('theater');
    document.body.classList.remove('mobile-search');
    document.body.classList.toggle('shorts-mode', target.view === 'shorts');
    YT.ui.closeMenu();
    closeSuggest();
    setActiveNav(target.nav);
    if (target.view === 'search') {
      const input = $('#searchInput');
      if (input) {
        input.value = parsed.params.get('search_query') || '';
        updateSearchUI();
      }
    }
    YT.scrollTop(false);
    if (target.view === 'playlist' && parsed.params.get('list') === 'WL') {
      // system playlist routes map to the library views
      YT.views.show('later', parsed.params);
    } else if (target.view === 'playlist' && parsed.params.get('list') === 'LL') {
      YT.views.show('liked', parsed.params);
    } else {
      YT.views.show(target.view, parsed.params);
    }
  }

  function setActiveNav(nav) {
    $$('[data-nav]').forEach(el => {
      el.classList.toggle('active', !!nav && el.getAttribute('data-nav') === nav);
    });
  }

  /* ------------------------------- loading ------------------------------- */
  function setLoading(on) {
    loadingCount = Math.max(0, loadingCount + (on ? 1 : -1));
    const el = $('#loader');
    if (!el) return;
    if (loadingCount > 0) {
      el.classList.remove('done');
      el.classList.add('on');
    } else {
      el.classList.remove('on');
      el.classList.add('done');
      setTimeout(() => el.classList.remove('done'), 340);
    }
  }

  /* ------------------------------- sidebar ------------------------------- */
  function sideItem(nav, href, icon, label, extra) {
    return '<a class="side-item" href="' + href + '"' + (nav ? ' data-nav="' + nav + '"' : '') + '>' +
      YT.icon(icon, 'side-icon icon') + '<span class="side-label">' + esc(label) + '</span>' + (extra || '') + '</a>';
  }

  function renderSidebar() {
    const nav = $('#sideNav');
    if (!nav) return;
    const subs = state().subs;
    let html = '<div class="side-group">' +
      sideItem('home', '#/', 'home', 'Home') +
      sideItem('shorts', '#/shorts', 'shorts', 'Shorts') +
      sideItem('subs', '#/feed/subscriptions', 'subs', 'Subscriptions') +
      '</div>';

    html += '<div class="side-group">' +
      '<a class="side-heading" href="#/you">You ' + YT.icon('chevron-right') + '</a>' +
      sideItem('history', '#/feed/history', 'history', 'History') +
      sideItem('playlists', '#/feed/playlists', 'playlist', 'Playlists') +
      sideItem('later', '#/playlist?list=WL', 'clock', 'Watch later') +
      sideItem('liked', '#/playlist?list=LL', 'like', 'Liked videos') +
      '</div>';

    html += '<div class="side-group">' +
      '<div class="side-heading">Explore</div>' +
      sideItem('', '#/feed/trending', 'fire', 'Trending') +
      sideItem('', '#/?cat=Music', 'music', 'Music') +
      sideItem('', '#/?cat=Gaming', 'gaming', 'Gaming') +
      sideItem('', '#/?cat=News', 'news', 'News') +
      sideItem('', '#/?cat=Sports', 'sports', 'Sports') +
      sideItem('', '#/?cat=Learning', 'learning', 'Learning') +
      '</div>';

    html += '<div class="side-group">' +
      '<div class="side-heading">More from YouTube</div>' +
      sideItem('settings', '#/settings', 'settings', 'Settings') +
      '<button class="side-item" data-act="about">' + YT.icon('info', 'side-icon icon') + '<span class="side-label">About this clone</span></button>' +
      '<button class="side-item" data-act="shortcuts">' + YT.icon('keyboard', 'side-icon icon') + '<span class="side-label">Keyboard shortcuts</span></button>' +
      '</div>';

    if (subs.length) {
      html += '<div class="side-group"><div class="side-heading">Subscriptions</div>' +
        subs.map(s => {
          const initial = esc((s.name || '?').charAt(0).toUpperCase());
          return '<a class="side-sub" href="#/channel/' + encodeURIComponent(s.id) + '">' +
            (s.avatar
              ? '<img class="side-avatar" src="' + esc(s.avatar) + '" alt="" loading="lazy">'
              : '<span class="side-avatar" style="display:flex;align-items:center;justify-content:center;background:var(--bg-active);font-size:11px;font-weight:700">' + initial + '</span>') +
            '<span class="side-label">' + esc(s.name) + '</span></a>';
        }).join('') + '</div>';
    }

    html += '<div class="side-footer">' +
      '<a href="#/settings">Settings</a><a href="#/settings">Data &amp; privacy</a>' +
      '<a href="#" data-act="about">About</a>' +
      '<div class="copyright">© 2026 YouTube clone<br>Real YouTube data · local recommendations</div>' +
      '</div>';

    nav.innerHTML = html;
    const active = getActiveNav();
    setActiveNav(active);
  }

  function getActiveNav() {
    const parsed = parseHash();
    return resolve(parsed.path, parsed.params).nav;
  }

  function renderMiniNav() {
    const mini = document.querySelector('.mini-nav');
    if (!mini) return;
    mini.innerHTML =
      '<a class="mini-item" href="#/" data-nav="home">' + YT.icon('home') + '<span>Home</span></a>' +
      '<a class="mini-item" href="#/shorts" data-nav="shorts">' + YT.icon('shorts') + '<span>Shorts</span></a>' +
      '<a class="mini-item" href="#/feed/subscriptions" data-nav="subs">' + YT.icon('subs') + '<span>Subscriptions</span></a>' +
      '<a class="mini-item" href="#/you" data-nav="you">' + YT.icon('user') + '<span>You</span></a>' +
      '<div class="mini-sep"></div>' +
      '<a class="mini-item" href="#/feed/history" data-nav="history">' + YT.icon('history') + '<span>History</span></a>' +
      '<a class="mini-item" href="#/settings" data-nav="settings">' + YT.icon('settings') + '<span>Settings</span></a>';
  }

  function refreshSidebar() {
    renderSidebar();
    renderMiniNav();
  }

  function toggleGuide() {
    const narrow = window.innerWidth <= 1312;
    if (narrow) {
      const open = document.body.classList.toggle('guide-open');
      const scrim = $('#scrim');
      if (scrim) scrim.hidden = !open;
    } else {
      const collapsed = document.body.classList.toggle('guide-collapsed');
      YT.storage.set('yt.guide.v1', collapsed);
    }
  }

  function closeGuide() {
    document.body.classList.remove('guide-open');
    const scrim = $('#scrim');
    if (scrim) scrim.hidden = true;
  }

  /* ------------------------------- search -------------------------------- */
  function updateSearchUI() {
    const input = $('#searchInput');
    const box = $('#searchBox');
    const clear = $('#clearSearch');
    if (!input) return;
    const has = !!input.value;
    if (box) box.classList.toggle('has-text', has);
    if (clear) clear.classList.toggle('hidden', !has);
  }

  function highlight(text, query) {
    const q = String(query || '').trim();
    if (!q) return esc(text);
    const lower = text.toLowerCase();
    const i = lower.indexOf(q.toLowerCase());
    if (i < 0) return esc(text);
    return esc(text.slice(0, i)) + '<b>' + esc(text.slice(i, i + q.length)) + '</b>' + esc(text.slice(i + q.length));
  }

  function renderSuggest(items, opts) {
    const o = opts || {};
    const box = $('#suggest');
    const input = $('#searchInput');
    if (!box || !input) return;
    if (!items || !items.length) { closeSuggest(); return; }
    const q = input.value.trim();
    let html = '';
    if (o.recent) {
      html += '<div class="suggest-section"><span>Recent searches</span><button type="button" data-suggest-clear>Clear</button></div>';
    } else if (o.trending) {
      html += '<div class="suggest-section"><span>Trending searches</span></div>';
    }
    html += items.map(item =>
      '<div class="suggest-item" role="option" data-q="' + esc(item) + '" aria-selected="false">' +
        YT.icon(o.recent ? 'history' : 'search', 'suggest-icon icon-sm') +
        '<span class="suggest-text">' + highlight(item, q) + '</span>' +
      '</div>').join('');
    box.innerHTML = html;
    box.hidden = false;
    input.setAttribute('aria-expanded', 'true');
    suggestItems = items.slice();
    suggestActive = -1;
  }

  function showSuggestLoading() {
    const box = $('#suggest');
    const input = $('#searchInput');
    if (!box) return;
    box.innerHTML = '<div class="suggest-item" style="pointer-events:none;color:var(--text-3)">' +
      YT.icon('search', 'suggest-icon icon-sm') + '<span class="suggest-text">Searching…</span></div>';
    box.hidden = false;
    if (input) input.setAttribute('aria-expanded', 'true');
    suggestItems = [];
    suggestActive = -1;
  }

  function showRecent() {
    const recent = state().searches.slice(0, 8).map(s => s.q);
    if (recent.length) renderSuggest(recent, { recent: true });
    else renderSuggest(['music', 'gaming', 'news', 'movie trailers', 'lofi hip hop', 'cooking recipes'], { trending: true });
  }

  function closeSuggest() {
    const box = $('#suggest');
    const input = $('#searchInput');
    if (box) { box.hidden = true; box.innerHTML = ''; }
    if (input) input.setAttribute('aria-expanded', 'false');
    suggestItems = [];
    suggestActive = -1;
    suggestSeq++;
  }

  function moveSuggest(dir) {
    if (!suggestItems.length) return;
    suggestActive += dir;
    if (suggestActive < 0) suggestActive = suggestItems.length - 1;
    if (suggestActive >= suggestItems.length) suggestActive = 0;
    const nodes = $$('#suggest .suggest-item');
    nodes.forEach((node, i) => {
      node.classList.toggle('active', i === suggestActive);
      node.setAttribute('aria-selected', String(i === suggestActive));
      if (i === suggestActive) node.scrollIntoView({ block: 'nearest' });
    });
  }

  function submitSearch(query) {
    const q = String(query || '').trim();
    if (!q) return;
    const input = $('#searchInput');
    if (input) input.value = q;
    updateSearchUI();
    YT.store.learn('search', { q: q });
    closeSuggest();
    if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
    document.body.classList.remove('mobile-search');
    const hash = '#/results?search_query=' + encodeURIComponent(q);
    if (location.hash === hash) route();
    else location.hash = hash;
  }

  function onSearchInput() {
    const input = $('#searchInput');
    if (!input) return;
    updateSearchUI();
    const q = input.value.trim();
    if (!q) { showRecent(); return; }
    const local = state().searches.map(s => s.q)
      .filter(v => v.toLowerCase().indexOf(q.toLowerCase()) > -1)
      .slice(0, 3);
    if (!local.length) showSuggestLoading();
    const seq = ++suggestSeq;
    clearTimeout(suggestTimer);
    suggestTimer = setTimeout(function () {
      YT.api.suggestions(q).then(list => {
        if (seq !== suggestSeq) return;
        if (input.value.trim() !== q) return;
        const merged = [];
        for (const item of local.concat(list || [])) {
          const clean = String(item || '').trim();
          if (clean && merged.indexOf(clean) === -1) merged.push(clean);
        }
        renderSuggest(merged.slice(0, 10), {});
      }).catch(() => {
        if (seq === suggestSeq && local.length) renderSuggest(local, {});
      });
    }, 220);
  }

  function onSearchKey(e) {
    if (e.key === 'ArrowDown') { e.preventDefault(); moveSuggest(1); return; }
    if (e.key === 'ArrowUp') { e.preventDefault(); moveSuggest(-1); return; }
    if (e.key === 'Enter') {
      e.preventDefault();
      if (suggestActive > -1 && suggestItems[suggestActive]) submitSearch(suggestItems[suggestActive]);
      else submitSearch($('#searchInput').value);
      return;
    }
    if (e.key === 'Escape') { closeSuggest(); e.target.blur(); }
  }

  function focusSearch() {
    if (window.innerWidth <= 791) document.body.classList.add('mobile-search');
    const input = $('#searchInput');
    if (!input) return;
    setTimeout(function () {
      input.focus();
      input.select();
      if (!input.value.trim()) showRecent();
    }, 30);
  }

  function voiceSearch() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const btn = $('#micBtn');
    if (!SR) {
      YT.toast('Voice search is not supported in this browser');
      return;
    }
    if (recognition) {
      try { recognition.stop(); } catch (e) {}
      recognition = null;
      if (btn) btn.classList.remove('listening');
      return;
    }
    try {
      recognition = new SR();
      recognition.lang = 'en-US';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;
      recognition.onresult = function (event) {
        const q = event.results && event.results[0] && event.results[0][0]
          ? event.results[0][0].transcript : '';
        if (q) submitSearch(q);
      };
      recognition.onerror = function () { YT.toast('Voice search did not catch that'); };
      recognition.onend = function () {
        recognition = null;
        if (btn) btn.classList.remove('listening');
      };
      recognition.start();
      if (btn) btn.classList.add('listening');
    } catch (e) {
      YT.toast('Voice search could not start');
      recognition = null;
    }
  }

  /* ------------------------------- menus --------------------------------- */
  function openCreateMenu(anchor) {
    YT.ui.menu(anchor, [
      { icon: 'playlist', label: 'Create playlist', onClick: function () { YT.ui.newPlaylistModal(); } },
      { type: 'sep' },
      { icon: 'upload', label: 'Upload video', onClick: function () { YT.toast('Uploads need a YouTube account. This clone is for watching and learning.'); } },
      { icon: 'live', label: 'Go live', onClick: function () { YT.toast('Going live needs a YouTube account.'); } }
    ]);
  }

  function openAvatarMenu(anchor) {
    const theme = state().settings.theme;
    const avatar = '<div class="menu-head">' +
      '<span class="avatar avatar-user">Y</span>' +
      '<div class="menu-head-info"><div class="menu-head-name">You</div>' +
      '<div class="menu-head-sub">Profile stored in this browser</div></div></div>';
    YT.ui.menu(anchor, [
      { type: 'custom', html: avatar },
      { icon: 'user', label: 'Your profile', onClick: function () { location.hash = '#/you'; } },
      { icon: 'history', label: 'Watch history', onClick: function () { location.hash = '#/feed/history'; } },
      { type: 'sep' },
      { icon: theme === 'light' ? 'moon' : 'sun', label: 'Appearance: ' + (theme === 'light' ? 'light' : theme === 'system' ? 'system' : 'dark'), onClick: toggleTheme },
      { icon: 'settings', label: 'Settings', onClick: function () { location.hash = '#/settings'; } },
      { icon: 'keyboard', label: 'Keyboard shortcuts', onClick: function () { YT.ui.shortcutsModal(); } },
      { type: 'sep' },
      { icon: 'tune', label: 'Tune recommendations', onClick: function () { YT.ui.tuneModal(); } },
      { icon: 'info', label: 'About this clone', onClick: function () { YT.ui.aboutModal(); } }
    ]);
  }

  function toggleTheme() {
    const current = state().settings.theme;
    const next = current === 'light' ? 'dark' : 'light';
    YT.store.setSetting('theme', next);
    YT.toast(next === 'light' ? 'Light theme on' : 'Dark theme on');
  }

  function notifHead() {
    return '<div class="notif-head"><span>Notifications</span>' +
      '<button class="icon-btn" data-menu-close aria-label="Close">' + YT.icon('close', 'icon icon-sm') + '</button></div>';
  }

  function openNotifications(anchor) {
    const pop = YT.ui.popover(anchor, notifHead() +
      '<div class="notif-empty"><span class="spinner"></span></div>',
      { width: 400, className: 'notif-menu' });

    function wire() {
      pop.el.querySelectorAll('[data-menu-close]').forEach(el => el.addEventListener('click', pop.close));
    }

    if (!state().settings.notifications) {
      pop.el.innerHTML = notifHead() + '<div class="notif-empty">Notifications are turned off in Settings.' +
        '<div style="margin-top:12px"><a class="btn btn-sm" href="#/settings" data-menu-close>Open settings</a></div></div>';
      wire();
      return;
    }

    if (!state().subs.length) {
      pop.el.innerHTML = notifHead() + '<div class="notif-empty">No notifications yet.<br>Subscribe to channels to see their newest videos here.' +
        '<div style="margin-top:12px"><a class="btn btn-sm" href="#/feed/subscriptions" data-menu-close>Browse subscriptions</a></div></div>';
      wire();
      return;
    }

    YT.store.notifications().then(function (items) {
      if (!items || !items.length) {
        pop.el.innerHTML = notifHead() + '<div class="notif-empty">Nothing new from your subscriptions yet.</div>';
        wire();
        return;
      }
      const rows = items.slice(0, 10).map(v =>
        '<a class="notif-row" href="' + '#/watch?v=' + encodeURIComponent(v.id) + '" data-menu-close>' +
          '<span class="notif-thumb"><img ' + YT.thumbAttrs(v.id, { small: true }) + ' alt=""></span>' +
          '<span class="notif-info"><span class="notif-title">' + esc(v.title) + '</span>' +
          '<span class="notif-meta">' + esc(v.channel && v.channel.name || '') + ' · ' + esc(v.publishedText || YT.timeAgo(v.published)) + '</span></span>' +
        '</a>').join('');
      pop.el.innerHTML = notifHead() +
        '<div class="notif-list">' + rows + '</div>' +
        '<div class="notif-foot"><a href="#/feed/subscriptions" data-menu-close>View all subscriptions</a></div>';
      wire();
      YT.store.markNotifsSeen();
      updateNotifBadge(0);
    }).catch(function () {
      pop.el.innerHTML = notifHead() + '<div class="notif-empty">Notifications could not be loaded right now.</div>';
      wire();
    });
  }

  function updateNotifBadge(count) {
    const badge = $('#notifBadge');
    if (!badge) return;
    const n = Number(count) || 0;
    if (n > 0 && state().settings.notifications) {
      badge.textContent = n > 9 ? '9+' : String(n);
      badge.classList.remove('hidden');
    } else {
      badge.textContent = '';
      badge.classList.add('hidden');
    }
  }

  async function primeNotifications() {
    if (notificationsPrimed) return;
    notificationsPrimed = true;
    if (!state().settings.notifications) return;
    if (!state().subs.length || state().subs.length > 6) return;
    try {
      const items = await YT.store.notifications();
      updateNotifBadge(YT.store.newNotifCount(items));
    } catch (e) {}
  }

  /* ------------------------------ actions -------------------------------- */
  function channelFrom(ds) {
    return YT.ui.getChannel(ds.channel) || {
      id: ds.channel,
      name: ds.name || '',
      avatar: ds.avatar || '',
      subs: Number(ds.subs) || null
    };
  }

  function syncSubscribeButtons(id) {
    if (!id) return;
    const sub = YT.store.isSub(id);
    const record = YT.store.getSub(id);
    $$('[data-act="subscribe"]').forEach(btn => {
      if (btn.getAttribute('data-channel') !== id) return;
      btn.classList.toggle('subscribed', sub);
      btn.textContent = sub ? 'Subscribed' : 'Subscribe';
    });

    const group = document.querySelector('.subscribe-group');
    if (group) {
      let bell = group.querySelector('[data-bell-for]');
      if (sub && !bell) {
        bell = document.createElement('button');
        bell.className = 'bell-sub-btn ' + ((record && record.notif) || 'all');
        bell.setAttribute('data-act', 'notif-level');
        bell.setAttribute('data-bell-for', id);
        bell.innerHTML = YT.icon('bell-fill');
        group.appendChild(bell);
      } else if (!sub && bell) {
        bell.remove();
      } else if (sub && bell) {
        bell.className = 'bell-sub-btn ' + ((record && record.notif) || 'all');
      }
    }

    const head = document.querySelector('.channel-head-actions');
    if (head) {
      let bell = head.querySelector('[data-act="channel-notif"]');
      if (sub && !bell) {
        bell = document.createElement('button');
        bell.className = 'bell-sub-btn ' + ((record && record.notif) || 'all');
        bell.setAttribute('data-act', 'channel-notif');
        bell.setAttribute('data-channel', id);
        bell.innerHTML = YT.icon('bell-fill');
        const btn = head.querySelector('[data-act="subscribe"]');
        if (btn && btn.nextSibling) head.insertBefore(bell, btn.nextSibling);
        else head.appendChild(bell);
      } else if (!sub && bell) {
        bell.remove();
      }
    }
  }

  function syncVideoButtons() {
    // Card-level states are read fresh from the store whenever a menu opens.
  }

  function refreshCurrent() {
    const cur = YT.views._current();
    if (!cur) { route(); return; }
    if (cur.name === 'watch' || cur.name === 'shorts' || cur.name === 'channel') {
      location.hash = '#/';
      return;
    }
    YT.views.refresh();
  }

  function handleAction(act, ds, el) {
    if (YT.views.handleAction(act, ds, el)) return;

    switch (act) {
      case 'video-menu': {
        const v = YT.ui.getVideo(ds.id);
        if (v) YT.ui.videoMenu(v, el);
        else {
          YT.api.video(ds.id).then(video => YT.ui.videoMenu(video, el)).catch(() => YT.toast('Could not load this video'));
        }
        return;
      }
      case 'channel-menu': {
        const ch = YT.ui.getChannel(ds.channel) || channelFrom(ds);
        YT.ui.channelMenu(ch, el);
        return;
      }
      case 'subscribe': {
        YT.ui.toggleSubscribe(channelFrom(ds));
        return;
      }
      case 'shelf-scroll': {
        const row = el.closest('.shelf').querySelector('.shelf-row');
        if (row) row.scrollBy({ left: (Number(ds.dir) || 1) * row.clientWidth * 0.8, behavior: 'smooth' });
        return;
      }
      case 'copy': {
        YT.copy(ds.copy || '').then(ok => YT.toast(ok ? 'Copied to clipboard' : 'Copy failed'));
        return;
      }
      case 'tune': { YT.ui.tuneModal(); return; }
      case 'tune-remove-topic': {
        if (YT.store.removeTopic) YT.store.removeTopic(ds.topic);
        YT.ui.tuneModal();
        return;
      }
      case 'tune-remove-channel': {
        if (YT.store.removeChannelAffinity) YT.store.removeChannelAffinity(ds.channel);
        YT.ui.tuneModal();
        return;
      }
      case 'reset-profile': {
        YT.ui.confirmModal({
          title: 'Reset recommendations?',
          message: 'Your feed will forget every topic and channel it has learned.',
          confirmLabel: 'Reset', danger: true,
          onConfirm: function () {
            YT.store.resetProfile();
            YT.ui.closeModal();
            YT.toast('Recommendations reset');
            refreshCurrent();
          }
        });
        return;
      }
      case 'pick-later': {
        const v = YT.ui.getVideo(ds.id);
        if (v) {
          const on = YT.store.toggleLater(v);
          YT.toast(on ? 'Saved to Watch later' : 'Removed from Watch later');
        }
        YT.ui.closeModal();
        return;
      }
      case 'pick-playlist': {
        const v = YT.ui.getVideo(ds.id);
        if (v) {
          const added = YT.store.addToPlaylist(ds.pl, v);
          YT.toast(added ? 'Added to playlist' : 'Already in this playlist');
        }
        YT.ui.closeModal();
        return;
      }
      case 'new-playlist': {
        const v = YT.ui.getVideo(ds.id);
        YT.ui.newPlaylistModal(v);
        return;
      }
      case 'retry-view': { YT.views.refresh(true); return; }
      case 'refresh-view': { YT.views.refresh(); return; }
      case 'about': { YT.ui.aboutModal(); return; }
      case 'shortcuts': { YT.ui.shortcutsModal(); return; }
      case 'open-settings': { location.hash = '#/settings'; return; }
      case 'theme-toggle': { toggleTheme(); return; }
      default: return;
    }
  }

  function onGlobalClick(e) {
    const target = e.target;
    if (!target || !target.closest) return;
    if (target.closest('.side-item,.side-sub,.mini-item')) closeGuide();
    const plainLink = target.closest('a[href]');
    if (plainLink && !plainLink.hasAttribute('data-act')) return;
    const el = target.closest('[data-act]');
    if (!el) return;
    if (el.tagName === 'A' && (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey)) return;
    e.preventDefault();
    handleAction(el.getAttribute('data-act'), el.dataset, el);
  }

  /* ------------------------------ keyboard ------------------------------- */
  function onKeydown(e) {
    if (e.defaultPrevented) return;
    if (e.key === 'Escape') {
      closeSuggest();
      closeGuide();
      document.body.classList.remove('mobile-search');
      return;
    }
    if (YT.isTyping(e.target)) return;
    if (e.key === '/' || (e.key === '/' && !e.shiftKey)) {
      e.preventDefault();
      focusSearch();
      return;
    }
    if (e.key === '?') {
      e.preventDefault();
      YT.ui.shortcutsModal();
      return;
    }
    const cur = YT.views._current();
    const modalOpen = $('#modalRoot') && $('#modalRoot').classList.contains('open');
    if (modalOpen) return;

    if (cur && cur.name === 'watch') {
      if (e.key === 'k' || e.key === ' ') { e.preventDefault(); YT.player.toggle(); return; }
      if (e.key === 'j') { e.preventDefault(); YT.player.seek(-5); return; }
      if (e.key === 'l') { e.preventDefault(); YT.player.seek(5); return; }
      if (e.key === 'ArrowRight') { e.preventDefault(); YT.player.seek(5); return; }
      if (e.key === 'ArrowLeft') { e.preventDefault(); YT.player.seek(-5); return; }
      if (e.key === 'm') { e.preventDefault(); YT.player.mute(); return; }
      if (e.key === 'f') { e.preventDefault(); YT.player.fullscreen(); return; }
      if (e.key === 't') { e.preventDefault(); document.body.classList.toggle('theater'); return; }
    }

    if (cur && cur.name === 'shorts' && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
      e.preventDefault();
      const sections = $$('.short');
      if (!sections.length) return;
      const center = window.innerHeight / 2;
      let best = sections[0], bestD = Infinity;
      for (const s of sections) {
        const r = s.getBoundingClientRect();
        const d = Math.abs((r.top + r.bottom) / 2 - center);
        if (d < bestD) { bestD = d; best = s; }
      }
      const next = e.key === 'ArrowDown' ? best.nextElementSibling : best.previousElementSibling;
      if (next) {
        if (YT.views.pauseShorts) YT.views.pauseShorts();
        else YT.player.destroy();
        next.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  }

  /* -------------------------------- init --------------------------------- */
  function bindHeader() {
    const menuBtn = $('#menuBtn');
    if (menuBtn) menuBtn.addEventListener('click', toggleGuide);
    const scrim = $('#scrim');
    if (scrim) scrim.addEventListener('click', closeGuide);

    const create = $('#createBtn');
    if (create) create.addEventListener('click', function () { openCreateMenu(create); });
    const bottomCreate = $('#bottomCreate');
    if (bottomCreate) bottomCreate.addEventListener('click', function () { openCreateMenu(bottomCreate); });
    const notif = $('#notifBtn');
    if (notif) notif.addEventListener('click', function () { openNotifications(notif); });
    const avatar = $('#avatarBtn');
    if (avatar) avatar.addEventListener('click', function () { openAvatarMenu(avatar); });

    const mobileSearch = $('#mobileSearchBtn');
    if (mobileSearch) mobileSearch.addEventListener('click', function () {
      document.body.classList.add('mobile-search');
      setTimeout(function () { const i = $('#searchInput'); if (i) { i.focus(); i.select(); } }, 30);
      showRecent();
    });
    const mobileBack = $('#mobileSearchBack');
    if (mobileBack) mobileBack.addEventListener('click', function () {
      document.body.classList.remove('mobile-search');
      closeSuggest();
    });

    const form = $('#searchForm');
    if (form) form.addEventListener('submit', function (e) {
      e.preventDefault();
      submitSearch($('#searchInput').value);
    });
    const input = $('#searchInput');
    if (input) {
      input.addEventListener('input', onSearchInput);
      input.addEventListener('keydown', onSearchKey);
      input.addEventListener('focus', function () {
        if (!input.value.trim()) showRecent();
      });
      input.addEventListener('blur', function () { setTimeout(closeSuggest, 160); });
    }
    const clear = $('#clearSearch');
    if (clear) clear.addEventListener('click', function () {
      const i = $('#searchInput');
      i.value = '';
      updateSearchUI();
      i.focus();
      showRecent();
    });
    const mic = $('#micBtn');
    if (mic) mic.addEventListener('click', voiceSearch);

    const suggest = $('#suggest');
    if (suggest) {
      suggest.addEventListener('mousedown', function (e) {
        if (e.target.closest('.suggest-item') || e.target.closest('[data-suggest-clear]')) e.preventDefault();
      });
      suggest.addEventListener('click', function (e) {
        const clearBtn = e.target.closest('[data-suggest-clear]');
        if (clearBtn) {
          YT.store.clearSearches();
          showRecent();
          return;
        }
        const item = e.target.closest('[data-q]');
        if (item) submitSearch(item.getAttribute('data-q'));
      });
    }
  }

  function bindGlobal() {
    document.addEventListener('click', onGlobalClick, false);
    document.addEventListener('keydown', onKeydown, false);
    window.addEventListener('hashchange', route);
    window.addEventListener('resize', YT.debounce(function () {
      if (window.innerWidth > 791) document.body.classList.remove('mobile-search');
      if (window.innerWidth > 1312) closeGuide();
    }, 200));
    window.addEventListener('scroll', YT.throttle(function () {
      const doc = document.documentElement;
      if (doc.scrollHeight - (window.scrollY + window.innerHeight) < 900) YT.views.loadMore();
    }, 250), { passive: true });

    document.addEventListener('change', function (e) {
      const target = e.target;
      if (!target) return;
      if (target.id === 'importFile' && target.files && target.files[0]) {
        const file = target.files[0];
        const reader = new FileReader();
        reader.onload = function () {
          try {
            const data = JSON.parse(String(reader.result || '{}'));
            YT.store.importData(data);
            YT.toast('Data imported');
            refreshSidebar();
            YT.store.applyTheme();
            setTimeout(function () { YT.views.refresh(); }, 500);
          } catch (err) {
            YT.toast('That file is not valid JSON');
          }
        };
        reader.readAsText(file);
      }
      if (target.matches && target.matches('select[data-region]')) {
        YT.store.setSetting('region', target.value);
        YT.toast('Trending region updated');
        YT.views.refresh(true);
      }
    });

    if (window.matchMedia) {
      try {
        window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', function () {
          if (YT.store.state.settings.theme === 'system') YT.store.applyTheme();
        });
      } catch (e) {}
    }
  }

  function init() {
    YT.store.load();
    YT.store.applyTheme();
    if (YT.storage.get('yt.guide.v1', false) && window.innerWidth > 1312) {
      document.body.classList.add('guide-collapsed');
    }
    renderSidebar();
    renderMiniNav();
    setActiveNav(getActiveNav());
    bindHeader();
    bindGlobal();
    updateNotifBadge(0);
    route();
    setTimeout(primeNotifications, 4000);
  }

  const api = {
    init: init,
    route: route,
    setLoading: setLoading,
    refreshSidebar: refreshSidebar,
    refreshCurrent: refreshCurrent,
    syncSubscribeButtons: syncSubscribeButtons,
    syncVideoButtons: syncVideoButtons,
    handleAction: handleAction,
    updateNotifBadge: updateNotifBadge,
    openNotifications: openNotifications,
    focusSearch: focusSearch
  };

  return api;
})();

YT.app.init();

})();
