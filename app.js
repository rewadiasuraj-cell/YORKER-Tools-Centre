// Yorker B2B catalogue interactions.
// Truthful WhatsApp enquiry handoff, normalized product discovery, accessible combobox,
// responsive variant selection, and video playback.
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  // Analytics hook: event names only, never personal data.
  const track = (name, params = {}) => {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ event: name, ...params });
  };
  document.addEventListener('click', (e) => {
    const t = e.target.closest('[data-track]');
    if (t) track(t.dataset.track, { link: t.getAttribute('href') || '' });
  });

  // Mega menu: close on outside click and Escape.
  const mega = $('.mega');
  document.addEventListener('click', (e) => { if (mega?.open && !mega.contains(e.target)) mega.open = false; });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && mega?.open) { mega.open = false; mega.querySelector('summary')?.focus(); }
  });

  // Dialogs: drawer, quote, zoom.
  $$('[data-open]').forEach((b) => b.addEventListener('click', () => {
    const target = $('#' + b.dataset.open);
    if (target?.showModal) target.showModal();
  }));
  $$('dialog').forEach((d) => {
    $$('[data-close]', d).forEach((b) => b.addEventListener('click', () => d.close()));
    d.addEventListener('click', (e) => { if (e.target === d) d.close(); });
  });

  // Shared normalizer for model codes and search strings
  const norm = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '');
  const esc = (s) => String(s || '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  // ---------- search suggestions (Accessible Combobox) ----------
  const input = $('#q');
  const box = $('#suggest');
  let index = null;
  let searchReqId = 0;
  const load = () => index || (index = fetch('/search-index.json').then((r) => r.json()));

  function rank(q, items) {
    const nq = norm(q);
    const words = q.toLowerCase().split(/\s+/).filter(Boolean);
    const out = [];
    for (const it of items) {
      let score = 0;
      if (it.m && it.m.some((m) => norm(m) === nq)) score = 100;
      else if (it.m && it.m.some((m) => norm(m).startsWith(nq) && nq.length > 2)) score = 80;
      else {
        const hay = (it.n + ' ' + (it.c || '') + ' ' + (it.b || '') + ' ' + (it.m || []).join(' ')).toLowerCase();
        const hayNorm = norm(hay);
        if (hayNorm.includes(nq)) score = 70;
        else if (words.every((w) => hay.includes(w))) score = it.n.toLowerCase().includes(q.toLowerCase()) ? 60 : 40;
      }
      if (score) out.push([score, it]);
    }
    return out.sort((a, b) => b[0] - a[0]).map((x) => x[1]);
  }

  const row = (it, q, idx) => {
    const m = (it.m || []).find((x) => norm(x).includes(norm(q))) || (it.m || [])[0] || '';
    return `<a href="${it.u}" role="option" id="suggest-opt-${idx}" aria-selected="false">${it.i ? `<img src="${it.i}" alt="" width="48" height="48" loading="lazy">` : '<span></span>'}<span><span class="s-name">${esc(it.n)}</span>${m ? `<span class="s-code">${esc(m)}</span>` : ''}</span></a>`;
  };

  const closeSuggest = () => {
    if (box) { box.hidden = true; }
    if (input) {
      input.setAttribute('aria-expanded', 'false');
      input.removeAttribute('aria-activedescendant');
    }
  };

  if (input && box) {
    input.setAttribute('role', 'combobox');
    input.setAttribute('aria-expanded', 'false');
    input.setAttribute('aria-autocomplete', 'list');
    input.setAttribute('aria-controls', 'suggest');

    let t;
    input.addEventListener('input', () => {
      clearTimeout(t);
      const q = input.value.trim();
      if (q.length < 2) { closeSuggest(); return; }
      const currentReq = ++searchReqId;
      t = setTimeout(async () => {
        try {
          const items = await load();
          if (currentReq !== searchReqId) return; // ignore stale async response
          const res = rank(q, items).slice(0, 6);
          box.innerHTML = res.map((it, i) => row(it, q, i)).join('') + `<a class="s-all" href="/search/?q=${encodeURIComponent(q)}" role="option" id="suggest-opt-all">${res.length ? 'See all matching tools' : 'No exact match. Search catalog anyway'}</a>`;
          box.hidden = false;
          input.setAttribute('aria-expanded', 'true');
        } catch (err) {
          box.innerHTML = `<span class="s-all">Search catalog: press Enter</span>`;
          box.hidden = false;
          input.setAttribute('aria-expanded', 'true');
        }
      }, 120);
    });

    input.addEventListener('keydown', (e) => {
      const opts = $$('a[role="option"]', box);
      if (box.hidden || !opts.length) return;
      const i = opts.findIndex((o) => o.getAttribute('aria-selected') === 'true');
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        const n = e.key === 'ArrowDown' ? (i + 1) % opts.length : (i - 1 + opts.length) % opts.length;
        opts.forEach((o, k) => o.setAttribute('aria-selected', k === n ? 'true' : 'false'));
        input.setAttribute('aria-activedescendant', opts[n].id);
        opts[n].scrollIntoView({ block: 'nearest' });
      } else if (e.key === 'Enter' && i >= 0) {
        e.preventDefault();
        location.href = opts[i].href;
      } else if (e.key === 'Escape') {
        closeSuggest();
      }
    });

    input.form?.addEventListener('submit', () => track('search', { search_term: input.value.trim() }));
    document.addEventListener('click', (e) => { if (!input.form?.contains(e.target)) closeSuggest(); });
  }

  // Search results page
  const results = $('[data-search-results]');
  if (results) {
    const q = new URLSearchParams(location.search).get('q') || '';
    if (input) input.value = q;
    if (q) {
      load().then((items) => {
        const res = rank(q, items);
        const sum = $('[data-search-summary]');
        const empty = $('[data-search-empty]');
        if (sum) sum.textContent = `${res.length} tool${res.length === 1 ? '' : 's'} matching "${q}"`;
        if (!res.length) { if (empty) empty.hidden = false; return; }
        results.innerHTML = res.map((p) => `<li class="card">
          <a href="${p.u}">
            <span class="card-img">${p.i ? `<img src="${p.i}" alt="${esc(p.n)}" loading="lazy" width="600" height="600">` : '<span class="no-img">Photo to come</span>'}</span>
            <span class="card-name">${esc(p.n)}</span>
            ${p.m && p.m[0] ? `<span class="code card-code">${esc(p.m[0])}</span>` : ''}
            <span class="card-spec"><span><span class="k">Brand</span> <span class="code">${esc(p.b || 'Yorker')}</span></span></span>
          </a>
        </li>`).join('');
      });
    }
  }

  // ---------- category and all-products filters ----------
  const listing = $('[data-listing]');
  if (listing) {
    const grid = $('.grid', listing);
    const cards = $$('.card', grid);
    const qIn = $('[data-filter-q]', listing);
    const sortSel = $('[data-sort]', listing);
    const params = new URLSearchParams(location.search);
    const subR = $$('input[name="sub"]', listing);
    if (params.get('sub')) subR.forEach((r) => (r.checked = r.value === params.get('sub')));
    if (params.get('q') && qIn) qIn.value = params.get('q');
    if (params.get('sort') && sortSel) sortSel.value = params.get('sort');

    const code = (c) => (c.querySelector('.card-code')?.textContent || '').toLowerCase();

    function apply() {
      const sub = subR.find((r) => r.checked)?.value || '';
      const rawQ = qIn ? qIn.value.trim() : '';
      const nq = norm(rawQ);
      let n = 0;

      for (const c of cards) {
        const cName = c.dataset.name || '';
        const cCode = code(c);
        const hayNorm = norm(cName + ' ' + cCode);
        const show = (!sub || c.dataset.sub === sub) && (!rawQ || hayNorm.includes(nq) || (cName + ' ' + cCode).toLowerCase().includes(rawQ.toLowerCase()));
        c.hidden = !show;
        if (show) n++;
      }

      if (sortSel) {
        const s = sortSel.value;
        const sorted = [...cards].sort((a, b) => {
          if (s === 'name') return (a.dataset.name || '').localeCompare(b.dataset.name || '');
          if (s === 'model') return code(a).localeCompare(code(b));
          return (Number(b.dataset.id) || 0) - (Number(a.dataset.id) || 0);
        });
        sorted.forEach((c) => grid.appendChild(c));
      }

      const countEl = $('[data-result-count]', listing);
      if (countEl) countEl.textContent = `Showing ${n} of ${cards.length} tools`;
      const emptyEl = $('[data-empty]', listing);
      if (emptyEl) emptyEl.hidden = n > 0;

      const p = new URLSearchParams();
      if (sub) p.set('sub', sub);
      if (rawQ) p.set('q', rawQ);
      if (sortSel && sortSel.value !== 'popular') p.set('sort', sortSel.value);
      const qs = p.toString();
      history.replaceState(null, '', qs ? '?' + qs : location.pathname);
    }

    subR.forEach((r) => r.addEventListener('change', apply));
    if (qIn) qIn.addEventListener('input', apply);
    if (sortSel) sortSel.addEventListener('change', apply);
    const clearBtn = $('[data-clear-filters]', listing);
    if (clearBtn) clearBtn.addEventListener('click', () => {
      subR.forEach((r) => (r.checked = false));
      if (subR[0]) subR[0].checked = true;
      if (qIn) qIn.value = '';
      if (sortSel) sortSel.value = 'popular';
      apply();
    });
    apply();
  }

  // ---------- product detail page: gallery and variants ----------
  const tpl = $('#pdp-data');
  const waFor = (name, model, url, waNum = '919999118454') =>
    `https://wa.me/${waNum}?text=${encodeURIComponent(
      `Hello YORKER Tools Centre,\nI am interested in the following product:\nProduct: ${name}\nModel/Size: ${model || 'Standard'}\nProduct Link: ${url}\nPlease share the best available wholesale quotation and delivery terms.\nThank you.`
    )}`;

  if (tpl) {
    const info = JSON.parse(tpl.textContent);
    track('view_item', { item_name: info.name });

    // Thumbnails
    $$('.thumb').forEach((b) => b.addEventListener('click', () => {
      $$('.thumb').forEach((t) => t.setAttribute('aria-pressed', 'false'));
      b.setAttribute('aria-pressed', 'true');
      const main = $('.gallery-main img');
      if (main) { main.src = b.dataset.src; main.alt = b.dataset.alt || info.name; }
    }));

    // Variant selection
    $$('input[name="variant"]').forEach((r) => r.addEventListener('change', () => {
      const m = r.dataset.model || r.value;
      const v = r.dataset.variant || r.value;
      const desc = r.dataset.desc || v;
      if (!m && !v) return;

      const displayTag = m || v;
      $$('[data-model]').forEach((el) => {
        if (el.tagName === 'SPAN') el.textContent = displayTag;
        else {
          el.dataset.model = displayTag;
          el.dataset.variant = v;
          el.dataset.desc = desc;
        }
      });
      $$('[data-wa]').forEach((a) => (a.href = waFor(info.name, `${displayTag}${desc && desc !== displayTag ? ' (' + desc + ')' : ''}`, info.url, info.wa)));
    }));
  }

  // ---------- quote drawer modal ----------
  const quote = $('#quote');
  if (quote) {
    $$('[data-quote]').forEach((b) => b.addEventListener('click', (e) => {
      e.preventDefault();
      const f = $('form', quote);
      if (!f) return;
      f.product.value = b.dataset.name || '';
      f.model.value = b.dataset.model || '';
      if (f.variant) f.variant.value = b.dataset.variant || '';
      if (f.product_url) f.product_url.value = b.dataset.url || location.href;

      const qName = $('[data-q="name"]', quote);
      const qModel = $('[data-q="model"]', quote);
      if (qName) qName.textContent = b.dataset.name || '';
      if (qModel) qModel.textContent = b.dataset.model ? `(${b.dataset.model})` : (b.dataset.variant ? `(${b.dataset.variant})` : '');

      const waBtn = $('[data-q="wa"]', quote);
      if (waBtn) waBtn.href = waFor(b.dataset.name || '', b.dataset.model || b.dataset.variant || '', b.dataset.url || location.href);

      // Reset any previous handoff box
      const existingHandoff = $('.handoff-box', f);
      if (existingHandoff) existingHandoff.remove();
      const status = $('.form-status', f);
      if (status) { status.textContent = ''; delete status.dataset.state; }

      quote.showModal();
    }));
  }

  // ---------- truthful enquiry & WhatsApp handoff ----------
  $$('form[data-kind]').forEach((f) => f.addEventListener('submit', (e) => {
    e.preventDefault();
    const status = $('.form-status', f);
    const existingHandoff = $('.handoff-box', f);
    if (existingHandoff) existingHandoff.remove();

    if (!f.checkValidity()) {
      if (status) {
        status.dataset.state = 'error';
        status.textContent = 'Please check and complete all required fields.';
      }
      f.reportValidity();
      return;
    }

    if (f.website && f.website.value) return; // honeypot

    const formData = new FormData(f);
    const data = Object.fromEntries(formData.entries());

    // Validate phone: must contain at least 10 digits
    const digits = (data.phone || '').replace(/\D/g, '');
    if (digits.length < 10) {
      if (status) {
        status.dataset.state = 'error';
        status.textContent = 'Please enter a valid telephone or mobile number with at least 10 digits.';
      }
      f.phone?.focus();
      return;
    }

    // Validate quantity if present
    if (data.quantity !== undefined && data.quantity !== '') {
      const qNum = parseInt(data.quantity, 10);
      if (isNaN(qNum) || qNum <= 0) {
        if (status) {
          status.dataset.state = 'error';
          status.textContent = 'Please enter a valid positive quantity (e.g. 10, 50, 100).';
        }
        f.quantity?.focus();
        return;
      }
    }

    // Harmonize company name
    const company = data.company || data.business || '';

    // Build pre-filled WhatsApp message
    const kindLabel = f.dataset.kind === 'dealer'
      ? 'New Dealer Application'
      : f.dataset.kind === 'distributor'
      ? 'Regional Distributor Enquiry'
      : f.dataset.kind === 'bulk'
      ? 'Bulk Order Quotation'
      : 'Product Quotation Request';

    let lines = [`*${kindLabel} - Yorker Tools Centre*`];
    if (data.name) lines.push(`Contact Person: ${data.name}`);
    if (company) lines.push(`Firm / Business: ${company}`);
    if (data.phone) lines.push(`Phone: ${data.phone}`);
    if (data.email) lines.push(`Email: ${data.email}`);
    if (data.business_type) lines.push(`Business Type: ${data.business_type}`);
    if (data.gst) lines.push(`GST No: ${data.gst}`);
    if (data.city) lines.push(`City: ${data.city}${data.state ? ', ' + data.state : ''}`);
    if (data.pin) lines.push(`PIN Code: ${data.pin}`);
    if (data.address) lines.push(`Address: ${data.address}`);
    if (data.categories) lines.push(`Categories of Interest: ${data.categories}`);
    if (data.product || data.model) {
      lines.push(`Product: ${data.product || ''}${data.model ? ' (' + data.model + ')' : ''}`);
    }
    if (data.variant && data.variant !== data.model) lines.push(`Variant / Size: ${data.variant}`);
    if (data.quantity) lines.push(`Requested Quantity: ${data.quantity}`);
    if (data.customer_type) lines.push(`Buyer Category: ${data.customer_type}`);
    if (data.current_business) lines.push(`Current Line of Business: ${data.current_business}`);
    if (data.message) lines.push(`Remarks: ${data.message}`);
    if (data.product_url) lines.push(`Reference URL: ${data.product_url}`);

    const fullMessage = lines.join('\n');
    const waUrl = `https://wa.me/919999118454?text=${encodeURIComponent(fullMessage)}`;

    // Track analytics (anonymized, no PII)
    track('enquiry_submit', { kind: f.dataset.kind });

    // Render truthful handoff interface
    const handoff = document.createElement('div');
    handoff.className = 'handoff-box';
    handoff.style.cssText = 'margin-top:16px;padding:14px;background:var(--color-paper-2);border:1px solid var(--color-ink);border-radius:var(--radius-card);display:grid;gap:10px;';
    handoff.innerHTML = `
      <p style="margin:0;font-weight:700;color:var(--color-ink);">Your enquiry is prepared.</p>
      <p style="margin:0;font-size:var(--text-sm);color:var(--color-ink-2);">Continue on WhatsApp to deliver this quotation request directly to the Yorker sales desk. Please remember to press <strong>Send</strong> in WhatsApp.</p>
      <div style="display:flex;flex-wrap:wrap;gap:8px;align-items:center;">
        <a class="btn btn--wa" href="${waUrl}" target="_blank" rel="noopener noreferrer" data-track="whatsapp_handoff" style="flex:1 1 auto;text-align:center;">Continue on WhatsApp &rarr;</a>
        <button class="btn btn--line" type="button" data-copy-msg style="flex:1 1 auto;">Copy Message</button>
      </div>
      <p class="muted small" style="margin:0;">Or call Yorker Tools Centre sales desk directly: <a class="link" href="tel:+911145143354">011 4514 3354</a></p>
    `;

    const copyBtn = handoff.querySelector('[data-copy-msg]');
    if (copyBtn) {
      copyBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(fullMessage).then(() => {
          copyBtn.textContent = 'Message Copied!';
          setTimeout(() => { copyBtn.textContent = 'Copy Message'; }, 2500);
        }).catch(() => {
          prompt('Copy enquiry text:', fullMessage);
        });
      });
    }

    if (status) {
      status.textContent = '';
      delete status.dataset.state;
    }
    f.appendChild(handoff);

    // Attempt direct synchronous handoff
    try {
      window.open(waUrl, '_blank');
    } catch (err) {}
  }));

  // ---------- videos: click to play ----------
  $$('.video-play').forEach((b) => b.addEventListener('click', () => {
    const f = document.createElement('iframe');
    f.src = `https://www.youtube-nocookie.com/embed/${b.dataset.yt}?autoplay=1`;
    f.title = b.dataset.title;
    f.allow = 'autoplay; encrypted-media; picture-in-picture';
    f.allowFullscreen = true;
    b.replaceWith(f);
    track('video_play', { video_title: b.dataset.title });
  }));

  // ---------- Hero Banner Carousel ----------
  const heroCarousel = $('.hero-carousel');
  if (heroCarousel) {
    const trackEl = $('#hero-slider-track', heroCarousel);
    const slides = $$('.carousel-slide', trackEl);
    const prevBtn = $('.carousel-nav--prev', heroCarousel);
    const nextBtn = $('.carousel-nav--next', heroCarousel);
    const dots = $$('.carousel-dot', heroCarousel);
    const pauseBtn = $('.carousel-pause', heroCarousel);
    const iconPause = $('.icon-pause', pauseBtn);
    const iconPlay = $('.icon-play', pauseBtn);

    let current = 0;
    const count = slides.length;
    let timer = null;
    let isPlaying = true;
    const intervalTime = 5000;

    const goTo = (index, smooth = true) => {
      if (index < 0) index = count - 1;
      if (index >= count) index = 0;
      current = index;

      slides.forEach((s, i) => {
        s.classList.toggle('is-active', i === current);
        s.setAttribute('aria-hidden', i === current ? 'false' : 'true');
      });
      dots.forEach((d, i) => {
        d.classList.toggle('is-active', i === current);
        d.setAttribute('aria-selected', i === current ? 'true' : 'false');
      });

      const targetSlide = slides[current];
      if (targetSlide) {
        trackEl.scrollTo({
          left: targetSlide.offsetLeft,
          behavior: smooth ? 'smooth' : 'auto'
        });
      }
    };

    const next = () => goTo(current + 1);
    const prev = () => goTo(current - 1);

    const startAuto = () => {
      if (timer) clearInterval(timer);
      if (isPlaying) {
        timer = setInterval(next, intervalTime);
      }
    };

    const stopAuto = () => {
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
    };

    const setPlaying = (play) => {
      isPlaying = play;
      if (pauseBtn) {
        pauseBtn.dataset.state = play ? 'playing' : 'paused';
        pauseBtn.setAttribute('aria-label', play ? 'Pause banner carousel' : 'Play banner carousel');
        if (iconPause) iconPause.style.display = play ? 'block' : 'none';
        if (iconPlay) iconPlay.style.display = play ? 'none' : 'block';
      }
      if (play) startAuto();
      else stopAuto();
    };

    prevBtn?.addEventListener('click', () => { prev(); startAuto(); });
    nextBtn?.addEventListener('click', () => { next(); startAuto(); });

    dots.forEach((d, i) => {
      d.addEventListener('click', () => { goTo(i); startAuto(); });
    });

    pauseBtn?.addEventListener('click', () => setPlaying(!isPlaying));

    heroCarousel.addEventListener('mouseenter', stopAuto);
    heroCarousel.addEventListener('mouseleave', () => { if (isPlaying) startAuto(); });
    heroCarousel.addEventListener('focusin', stopAuto);
    heroCarousel.addEventListener('focusout', () => { if (isPlaying) startAuto(); });

    heroCarousel.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') { prev(); startAuto(); }
      else if (e.key === 'ArrowRight') { next(); startAuto(); }
    });

    let scrollTimeout = null;
    trackEl.addEventListener('scroll', () => {
      if (scrollTimeout) clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        const scrollLeft = trackEl.scrollLeft;
        const width = trackEl.clientWidth;
        if (width > 0) {
          const newIndex = Math.round(scrollLeft / width);
          if (newIndex >= 0 && newIndex < count && newIndex !== current) {
            current = newIndex;
            slides.forEach((s, i) => {
              s.classList.toggle('is-active', i === current);
              s.setAttribute('aria-hidden', i === current ? 'false' : 'true');
            });
            dots.forEach((d, i) => {
              d.classList.toggle('is-active', i === current);
              d.setAttribute('aria-selected', i === current ? 'true' : 'false');
            });
          }
        }
      }, 80);
    }, { passive: true });

    let touchStartX = 0;
    let touchStartY = 0;
    trackEl.addEventListener('touchstart', (e) => {
      if (e.changedTouches && e.changedTouches[0]) {
        touchStartX = e.changedTouches[0].screenX;
        touchStartY = e.changedTouches[0].screenY;
      }
      stopAuto();
    }, { passive: true });

    trackEl.addEventListener('touchend', (e) => {
      if (e.changedTouches && e.changedTouches[0]) {
        const touchEndX = e.changedTouches[0].screenX;
        const touchEndY = e.changedTouches[0].screenY;
        const deltaX = touchEndX - touchStartX;
        const deltaY = touchEndY - touchStartY;
        if (Math.abs(deltaX) > 40 && Math.abs(deltaX) > Math.abs(deltaY)) {
          if (deltaX < 0) next();
          else prev();
        }
      }
      if (isPlaying) startAuto();
    }, { passive: true });

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setPlaying(false);
    } else {
      startAuto();
    }
  }

  // ---------- floating WhatsApp button on non-PDP pages ----------
  if (!$('.mobile-bar') && !$('.floating-wa')) {
    const wa = document.createElement('a');
    wa.className = 'floating-wa';
    wa.href = 'https://wa.me/919999118454?text=Hello%20YORKER%20Tools%20Centre%2C%20I%20have%20an%20enquiry.';
    wa.setAttribute('target', '_blank');
    wa.setAttribute('rel', 'noopener noreferrer');
    wa.setAttribute('aria-label', 'Chat with Yorker Tools Centre on WhatsApp');
    wa.setAttribute('data-track', 'whatsapp_click');
    wa.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12.031 2C6.495 2 2 6.495 2 12.031c0 1.947.558 3.766 1.523 5.309L2 22l4.814-1.488A9.972 9.972 0 0 0 12.031 22c5.536 0 10.031-4.495 10.031-10.031C22.062 6.495 17.567 2 12.031 2zm0 18.286c-1.637 0-3.155-.47-4.444-1.282l-.319-.202-3.298 1.02.997-3.21-.212-.335a8.212 8.212 0 0 1-1.266-4.246c0-4.57 3.717-8.286 8.542-8.286 4.825 0 8.542 3.716 8.542 8.286 0 4.57-3.717 8.286-8.542 8.286zm4.673-6.19c-.256-.128-1.516-.748-1.751-.833-.235-.086-.406-.128-.577.128-.17.256-.662.833-.812 1.004-.15.17-.3.192-.556.064-.256-.128-1.082-.399-2.061-1.272-.763-.68-1.278-1.52-1.428-1.777-.15-.256-.016-.395.112-.522.115-.115.256-.3.385-.449.128-.15.17-.256.256-.427.086-.17.043-.321-.021-.449-.064-.128-.577-1.39-.79-1.903-.208-.5-.419-.432-.577-.44-.15-.008-.321-.01-.492-.01-.17 0-.449.064-.684.321-.235.256-.898.877-.898 2.138s.919 2.48 1.047 2.651c.128.17 1.808 2.76 4.38 3.871.612.264 1.09.422 1.463.541.615.195 1.174.168 1.616.102.493-.074 1.516-.62 1.73-1.218.213-.598.213-1.111.15-1.218-.064-.107-.235-.17-.492-.298z"/></svg><span>WhatsApp</span>`;
    document.body.appendChild(wa);
  }
})();
