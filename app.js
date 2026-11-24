// Yorker preview interactions. Everything works without this file except search
// suggestions, filters, the quote drawer and video playback.
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  // Analytics hook: event names only, never personal data. Wired to GA4 in Phase 5.
  const track = (name, params = {}) => { window.dataLayer = window.dataLayer || []; window.dataLayer.push({ event: name, ...params }); };
  document.addEventListener('click', (e) => {
    const t = e.target.closest('[data-track]');
    if (t) track(t.dataset.track, { link: t.getAttribute('href') || '' });
  });

  // Mega menu: close on outside click and Escape.
  const mega = $('.mega');
  document.addEventListener('click', (e) => { if (mega?.open && !mega.contains(e.target)) mega.open = false; });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && mega?.open) { mega.open = false; mega.querySelector('summary').focus(); }
  });

  // Dialogs: drawer, quote, zoom.
  $$('[data-open]').forEach((b) => b.addEventListener('click', () => $('#' + b.dataset.open).showModal()));
  $$('dialog').forEach((d) => {
    $$('[data-close]', d).forEach((b) => b.addEventListener('click', () => d.close()));
    d.addEventListener('click', (e) => { if (e.target === d) d.close(); });
  });

  // ---------- search suggestions ----------
  const input = $('#q');
  const box = $('#suggest');
  let index = null;
  const load = () => index || (index = fetch('/search-index.json').then((r) => r.json()));
  const norm = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '');
  function rank(q, items) {
    const nq = norm(q);
    const words = q.toLowerCase().split(/\s+/).filter(Boolean);
    const out = [];
    for (const it of items) {
      let score = 0;
      if (it.m.some((m) => norm(m) === nq)) score = 100;
      else if (it.m.some((m) => norm(m).startsWith(nq) && nq.length > 2)) score = 80;
      else {
        const hay = (it.n + ' ' + it.c + ' ' + it.b + ' ' + it.m.join(' ')).toLowerCase();
        if (words.every((w) => hay.includes(w))) score = it.n.toLowerCase().includes(q.toLowerCase()) ? 60 : 40;
      }
      if (score) out.push([score, it]);
    }
    return out.sort((a, b) => b[0] - a[0]).map((x) => x[1]);
  }
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const row = (it, q) => {
    const m = it.m.find((x) => norm(x).includes(norm(q))) || it.m[0] || '';
    return `<a href="${it.u}" role="option">${it.i ? `<img src="${it.i}" alt="" width="48" height="48">` : '<span></span>'}<span><span class="s-name">${esc(it.n)}</span>${m ? `<span class="s-code">${esc(m)}</span>` : ''}</span></a>`;
  };
  if (input) {
    let t;
    input.addEventListener('input', () => {
      clearTimeout(t);
      const q = input.value.trim();
      if (q.length < 2) { box.hidden = true; input.setAttribute('aria-expanded', 'false'); return; }
      t = setTimeout(async () => {
        const res = rank(q, await load()).slice(0, 6);
        box.innerHTML = res.map((it) => row(it, q)).join('') + `<a class="s-all" href="/search/?q=${encodeURIComponent(q)}">${res.length ? 'See all results' : 'No match. Search anyway'}</a>`;
        box.hidden = false; input.setAttribute('aria-expanded', 'true');
      }, 120);
    });
    input.addEventListener('keydown', (e) => {
      const opts = $$('a', box);
      if (box.hidden || !opts.length) return;
      const i = opts.findIndex((o) => o.getAttribute('aria-selected') === 'true');
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        const n = e.key === 'ArrowDown' ? (i + 1) % opts.length : (i - 1 + opts.length) % opts.length;
        opts.forEach((o, k) => o.setAttribute('aria-selected', k === n ? 'true' : 'false'));
        opts[n].scrollIntoView({ block: 'nearest' });
      } else if (e.key === 'Enter' && i >= 0) { e.preventDefault(); location.href = opts[i].href; }
      else if (e.key === 'Escape') { box.hidden = true; input.setAttribute('aria-expanded', 'false'); }
    });
    input.form.addEventListener('submit', () => track('search', { search_term: input.value.trim() }));
    document.addEventListener('click', (e) => { if (!input.form.contains(e.target)) box.hidden = true; });
  }

  // Search results page.
  const results = $('[data-search-results]');
  if (results) {
    const q = new URLSearchParams(location.search).get('q') || '';
    if (input) input.value = q;
    if (q) load().then((items) => {
      const res = rank(q, items);
      $('[data-search-summary]').textContent = `${res.length} ${res.length === 1 ? 'result' : 'results'} for "${q}"`;
      results.innerHTML = res.map((it) => `<li class="card"><a href="${it.u}"><span class="card-img">${it.i ? `<img src="${it.i}" alt="${esc(it.n)}" loading="lazy" width="600" height="600">` : '<span class="no-img">Photo to come</span>'}</span><span class="card-name">${esc(it.n)}</span>${it.m[0] ? `<span class="code card-code">${esc(it.m[0])}</span>` : ''}</a></li>`).join('');
      $('[data-search-empty]').hidden = res.length > 0;
    });
  }

  // ---------- category filters, state kept in the URL ----------
  const listing = $('[data-listing]');
  if (listing) {
    const grid = $('.grid', listing);
    const cards = $$('.card', grid);
    const qIn = $('[data-filter-q]', listing);
    const sortSel = $('[data-sort]', listing);
    const params = new URLSearchParams(location.search);
    const subR = $$('input[name="sub"]', listing);
    if (params.get('sub')) subR.forEach((r) => (r.checked = r.value === params.get('sub')));
    if (params.get('q')) qIn.value = params.get('q');
    if (params.get('sort')) sortSel.value = params.get('sort');
    const code = (c) => (c.querySelector('.card-code')?.textContent || '~').toLowerCase();
    function apply() {
      const sub = subR.find((r) => r.checked)?.value || '';
      const q = qIn.value.trim().toLowerCase();
      let n = 0;
      for (const c of cards) {
        const show = (!sub || c.dataset.sub === sub) && (!q || (c.dataset.name + ' ' + code(c)).includes(q));
        c.hidden = !show; if (show) n++;
      }
      const s = sortSel.value;
      const sorted = [...cards].sort((a, b) => s === 'name' ? a.dataset.name.localeCompare(b.dataset.name) : s === 'model' ? code(a).localeCompare(code(b)) : b.dataset.id - a.dataset.id);
      sorted.forEach((c) => grid.append(c));
      $('[data-count]', listing).textContent = n;
      $('.empty', listing).hidden = n > 0;
      const p = new URLSearchParams();
      if (sub) p.set('sub', sub); if (q) p.set('q', q); if (s) p.set('sort', s);
      history.replaceState(null, '', p.toString() ? '?' + p : location.pathname);
    }
    listing.addEventListener('input', apply);
    listing.addEventListener('change', apply);
    if (matchMedia('(max-width: 60rem)').matches) $('.filters-box', listing).open = false;
    apply();
  }

  // ---------- product page ----------
  const gimg = $('#gallery-img');
  $$('.thumb').forEach((b) => b.addEventListener('click', () => {
    gimg.src = b.dataset.src;
    $$('.thumb').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
  }));
  const zoomBtn = $('[data-zoom]');
  if (zoomBtn && gimg) zoomBtn.addEventListener('click', () => { const z = $('#zoom'); const im = new Image(); im.src = gimg.src; im.alt = gimg.alt + ', enlarged'; $('[data-zoom-img]', z).replaceChildren(im); z.showModal(); });

  const tpl = $('#wa-template');
  const waFor = (name, model, url, wa) => `https://wa.me/${wa}?text=${encodeURIComponent(`Hello YORKER Tools Centre,\nI am interested in the following product:\nProduct: ${name}\nModel: ${model || 'not listed'}\nProduct Link: ${url}\nPlease share the best available quotation and product details.\nThank you.`)}`;
  if (tpl) {
    const info = JSON.parse(tpl.textContent);
    track('view_item', { item_name: info.name });
    $$('input[name="variant"]').forEach((r) => r.addEventListener('change', () => {
      const m = r.value;
      if (!m) return;
      $$('[data-model]').forEach((el) => { if (el.tagName === 'SPAN') el.textContent = m; else el.dataset.model = m; });
      $$('[data-wa]').forEach((a) => (a.href = waFor(info.name, m, info.url, info.wa)));
    }));
  }

  // ---------- quote drawer ----------
  const quote = $('#quote');
  $$('[data-quote]').forEach((b) => b.addEventListener('click', (e) => {
    e.preventDefault();
    const f = $('form', quote);
    f.product.value = b.dataset.name; f.model.value = b.dataset.model || ''; f.product_url.value = b.dataset.url || location.href;
    $('[data-q="name"]', quote).textContent = b.dataset.name;
    $('[data-q="model"]', quote).textContent = b.dataset.model || '';
    const wa = (tpl && JSON.parse(tpl.textContent).wa) || '919999118454';
    $('[data-q="wa"]', quote).href = waFor(b.dataset.name, b.dataset.model, b.dataset.url || location.href, wa);
    $('.form-status', quote).textContent = '';
    quote.showModal();
    track('quote_form_open', { item_name: b.dataset.name });
  }));

  // ---------- enquiry tabs ----------
  const tabs = $$('[role="tab"]');
  tabs.forEach((t) => t.addEventListener('click', () => {
    tabs.forEach((x) => { const on = x === t; x.setAttribute('aria-selected', on); x.tabIndex = on ? 0 : -1; $('#' + x.getAttribute('aria-controls')).hidden = !on; });
  }));
  tabs.forEach((t, i) => t.addEventListener('keydown', (e) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    const n = tabs[(i + (e.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length]; n.click(); n.focus();
  }));

  // ---------- forms: validated and directly connected to WhatsApp Bilti dispatch & LocalStorage ----------
  $$('form[data-kind]').forEach((f) => f.addEventListener('submit', (e) => {
    e.preventDefault();
    const status = $('.form-status', f);
    if (!f.checkValidity()) { status.dataset.state = 'error'; status.textContent = 'Please fill the highlighted fields.'; f.reportValidity(); return; }
    if (f.website && f.website.value) return; // honeypot
    const btn = $('button[type="submit"]', f);
    btn.setAttribute('aria-busy', 'true');
    status.dataset.state = 'success';
    status.textContent = 'Enquiry received! Connecting you to the Yorker WhatsApp sales desk...';

    const formData = new FormData(f);
    const dataObj = Object.fromEntries(formData.entries());
    
    // Save to LocalStorage ledger
    try {
      const leads = JSON.parse(localStorage.getItem('yorker_leads') || '[]');
      leads.push({ ...dataObj, kind: f.dataset.kind, date: new Date().toISOString() });
      localStorage.setItem('yorker_leads', JSON.stringify(leads));
    } catch (err) {}

    // Track analytics
    track(f.dataset.kind === 'dealer' ? 'dealer_enquiry_submit' : f.dataset.kind === 'bulk' ? 'bulk_enquiry_submit' : 'generate_lead');

    // Build pre-filled WhatsApp message
    const kindLabel = f.dataset.kind === 'dealer' ? 'New Dealer Application' : f.dataset.kind === 'bulk' ? 'Bulk Order Enquiry' : 'Product Quotation';
    let text = `*${kindLabel} - Yorker Tools Centre*\n`;
    if (dataObj.name) text += `Contact Name: ${dataObj.name}\n`;
    if (dataObj.company) text += `Firm: ${dataObj.company}\n`;
    if (dataObj.phone) text += `Phone: ${dataObj.phone}\n`;
    if (dataObj.city) text += `City: ${dataObj.city}\n`;
    if (dataObj.product || dataObj.model) text += `Tool: ${dataObj.product || ''} (${dataObj.model || ''})\n`;
    if (dataObj.quantity) text += `Quantity: ${dataObj.quantity}\n`;
    if (dataObj.customer_type) text += `Customer Type: ${dataObj.customer_type}\n`;
    if (dataObj.message) text += `Remarks: ${dataObj.message}\n`;

    setTimeout(() => {
      window.open(`https://wa.me/919999118454?text=${encodeURIComponent(text)}`, '_blank');
      btn.removeAttribute('aria-busy');
      status.textContent = 'Thank you! Your inquiry was sent to Yorker Sales Desk via WhatsApp and saved in trade ledger.';
      f.reset();
    }, 400);
  }));

  // ---------- video library filter and gallery lightbox ----------
  const vq = $('[data-video-q]');
  if (vq) vq.addEventListener('input', () => {
    const q = vq.value.trim().toLowerCase(); let n = 0;
    $$('[data-video-list] .video').forEach((v) => { v.hidden = !!q && !v.textContent.toLowerCase().includes(q); if (!v.hidden) n++; });
    const e = $('[data-video-empty]'); if (e) e.hidden = n > 0;
  });
  $$('[data-lightbox]').forEach((b) => b.addEventListener('click', () => {
    const z = $('#zoom'); const im = new Image(); im.src = b.dataset.lightbox; im.alt = b.querySelector('img')?.alt || '';
    $('[data-zoom-img]', z).replaceChildren(im); z.showModal();
  }));

  // ---------- videos: click to play, nothing loads until then ----------
  $$('.video-play').forEach((b) => b.addEventListener('click', () => {
    const f = document.createElement('iframe');
    f.src = `https://www.youtube-nocookie.com/embed/${b.dataset.yt}?autoplay=1`;
    f.title = b.dataset.title; f.allow = 'autoplay; encrypted-media; picture-in-picture'; f.allowFullscreen = true;
    b.replaceWith(f);
    track('video_play', { video_title: b.dataset.title });
  }));
})();
