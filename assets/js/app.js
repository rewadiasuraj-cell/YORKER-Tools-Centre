/**
 * YORKER TOOLS CENTRE - MAIN CLIENT SCRIPT
 * Handles search suggestions, modal quick views, enquiry tab switching,
 * WhatsApp messaging, video modal, and mobile navigation.
 */

document.addEventListener('DOMContentLoaded', () => {
  initSearch();
  initFormTabs();
  initDealerForm();
  initModals();
  initMobileNav();
});

// Cache for products catalog
let productsCatalog = [];

async function loadProducts() {
  if (productsCatalog.length > 0) return productsCatalog;
  try {
    const res = await fetch('assets/data/products.json');
    if (res.ok) {
      productsCatalog = await res.json();
    }
  } catch (err) {
    console.error('Failed to load products.json:', err);
  }
  return productsCatalog;
}

/* ========================================================
   SEARCH AUTO-SUGGEST
   ======================================================== */
function initSearch() {
  const input = document.getElementById('searchInput');
  const suggestionsBox = document.getElementById('searchSuggestions');
  const searchForm = document.getElementById('searchForm');

  if (!input || !suggestionsBox) return;

  // Pre-load products catalog
  loadProducts();

  let debounceTimer;

  input.addEventListener('input', (e) => {
    clearTimeout(debounceTimer);
    const query = e.target.value.trim().toLowerCase();

    if (query.length < 2) {
      suggestionsBox.classList.remove('active');
      suggestionsBox.innerHTML = '';
      return;
    }

    debounceTimer = setTimeout(() => {
      renderSuggestions(query, suggestionsBox);
    }, 150);
  });

  // Handle Enter or submit
  if (searchForm) {
    searchForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const query = input.value.trim();
      if (query) {
        window.location.href = `products.html?q=${encodeURIComponent(query)}`;
      }
    });
  }

  // Close on outside click
  document.addEventListener('click', (e) => {
    if (!input.contains(e.target) && !suggestionsBox.contains(e.target)) {
      suggestionsBox.classList.remove('active');
    }
  });

  // Open on focus if query present
  input.addEventListener('focus', () => {
    if (input.value.trim().length >= 2) {
      renderSuggestions(input.value.trim().toLowerCase(), suggestionsBox);
    }
  });
}

function renderSuggestions(query, box) {
  if (!productsCatalog || productsCatalog.length === 0) return;

  const matches = productsCatalog.filter(p => {
    const nameMatch = p.name && p.name.toLowerCase().includes(query);
    const modelMatch = p.models && p.models.some(m => m.toLowerCase().includes(query));
    const slugMatch = p.slug && p.slug.toLowerCase().includes(query);
    return nameMatch || modelMatch || slugMatch;
  }).slice(0, 6);

  if (matches.length === 0) {
    box.innerHTML = `<div class="suggestion-item"><span class="suggestion-name" style="color:#64748B;">No tools found matching "${query}"</span></div>`;
    box.classList.add('active');
    return;
  }

  box.innerHTML = matches.map(p => `
    <div class="suggestion-item" onclick="openProductQuickView('${p.slug}')">
      <span class="suggestion-name">${escapeHtml(p.name)}</span>
      <span class="suggestion-cat">${p.brand || 'Yorker'} ${p.models && p.models[0] ? '#' + p.models[0] : ''}</span>
    </div>
  `).join('');

  box.classList.add('active');
}

/* ========================================================
   FORM TABS (Dealer Enquiry vs Bulk Order)
   ======================================================== */
let currentFormMode = 'dealer';

function initFormTabs() {
  const tabs = document.querySelectorAll('.form-tab-btn');
  const submitBtn = document.getElementById('formSubmitBtn');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      const mode = tab.getAttribute('data-tab');
      currentFormMode = mode;

      if (submitBtn) {
        if (mode === 'bulk') {
          submitBtn.textContent = 'Send bulk order enquiry';
        } else {
          submitBtn.textContent = 'Send dealer enquiry';
        }
      }
    });
  });
}

/* ========================================================
   DEALER / BULK ORDER FORM SUBMISSION
   ======================================================== */
function initDealerForm() {
  const form = document.getElementById('dealerForm');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const person = document.getElementById('contactPerson')?.value.trim();
    const business = document.getElementById('businessName')?.value.trim();
    const mobile = document.getElementById('mobileNumber')?.value.trim();
    const email = document.getElementById('emailAddress')?.value.trim();
    const bType = document.getElementById('businessType')?.value;
    const city = document.getElementById('cityState')?.value.trim();
    const gst = document.getElementById('gstNumber')?.value.trim();
    const categories = document.getElementById('categoryInterest')?.value.trim();
    const consent = document.getElementById('contactConsent')?.checked;

    if (!person || !business || !mobile) {
      showToast('Please fill in your Contact Person, Business Name, and Mobile.');
      return;
    }

    if (!consent) {
      showToast('Please check the authorization box to submit your enquiry.');
      return;
    }

    // Compose formatted WhatsApp enquiry
    const enquiryType = currentFormMode === 'bulk' ? 'BULK ORDER ENQUIRY' : 'DEALER ENQUIRY';
    const message = `*NEW YORKER ${enquiryType}*
------------------------------
👤 *Contact Person:* ${person}
🏢 *Business Name:* ${business}
📱 *Mobile:* ${mobile}
✉️ *Email:* ${email || 'N/A'}
🏬 *Business Type:* ${bType || 'General Hardware'}
📍 *City & State:* ${city || 'India'}
📋 *GST No:* ${gst || 'Not provided'}
🔧 *Categories of Interest:* ${categories || 'General Catalog'}
------------------------------
_Sent via Yorker Tools Centre Website_`;

    const waUrl = `https://wa.me/919999118454?text=${encodeURIComponent(message)}`;

    showToast('Enquiry received! Opening WhatsApp to connect with sales desk...');
    form.reset();

    setTimeout(() => {
      window.open(waUrl, '_blank');
    }, 1200);
  });
}

/* ========================================================
   MODAL DIALOGS (Product Quick View & Specs)
   ======================================================== */
function initModals() {
  const modal = document.getElementById('productModal');
  const closeBtn = document.getElementById('modalCloseBtn');

  if (closeBtn && modal) {
    closeBtn.addEventListener('click', () => {
      modal.classList.remove('active');
    });
  }

  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.remove('active');
      }
    });
  }

  // Escape key closes modal
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal && modal.classList.contains('active')) {
      modal.classList.remove('active');
    }
  });
}

// Global modal opener
window.openProductQuickView = async function(slugOrCode) {
  const catalog = await loadProducts();
  const modal = document.getElementById('productModal');
  const body = document.getElementById('modalBody');

  if (!modal || !body) return;

  const product = catalog.find(p => p.slug === slugOrCode || (p.models && p.models.includes(slugOrCode)));

  if (!product) {
    // Fallback for standard featured hero
    if (slugOrCode === 'pro-0835k' || slugOrCode === 'YK-PRO-0835K') {
      renderModalContent({
        name: 'PRO-0835K Demolition Hammer',
        brand: 'Yorker Pro',
        models: ['YK-PRO-0835K'],
        image: 'assets/images/hero-demolition-hammer.png',
        specsTable: [
          ['Input Power', '1800 W'],
          ['Voltage', '220/230 V'],
          ['Frequency', '50/60 Hz'],
          ['Chuck Size', '35 mm Hex'],
          ['Application', 'Heavy concrete demolition & chiseling'],
          ['Warranty', 'Yorker Industrial Service Guarantee']
        ]
      });
      modal.classList.add('active');
      return;
    }
    showToast('Product specifications loading...');
    return;
  }

  // Extract specs table
  let specsRows = [];
  if (product.specs && product.specs.length > 0) {
    const spec = product.specs[0];
    if (spec.headers && spec.rows && spec.rows.length > 0) {
      specsRows = spec.headers.map((h, idx) => [h, spec.rows[0][idx] || '']);
    }
  }

  renderModalContent({
    name: product.name,
    brand: product.brand || 'Yorker',
    models: product.models,
    image: product.images && product.images[0] ? product.images[0].src : 'assets/images/hero-demolition-hammer.png',
    specsTable: specsRows
  });

  modal.classList.add('active');
};

function renderModalContent(item) {
  const body = document.getElementById('modalBody');
  if (!body) return;

  const modelBadge = item.models && item.models[0] ? `<span class="modal-badge">Model #${item.models[0]}</span>` : '';
  const rowsHtml = item.specsTable && item.specsTable.length > 0
    ? item.specsTable.map(([k, v]) => `<tr><th>${escapeHtml(k)}</th><td>${escapeHtml(v)}</td></tr>`).join('')
    : '<tr><th>Brand</th><td>Yorker Precision Engineering</td></tr><tr><th>Availability</th><td>In Stock - Factory Dispatch</td></tr>';

  body.innerHTML = `
    <div class="modal-grid">
      <div class="modal-img-wrap">
        <img src="${item.image}" alt="${escapeHtml(item.name)}" onerror="this.src='assets/images/hero-demolition-hammer.png'">
      </div>
      <div class="modal-details">
        <div>
          <span style="font-size:0.8125rem; font-weight:700; color:var(--color-primary); text-transform:uppercase;">${escapeHtml(item.brand || 'Yorker')}</span>
          <h2 class="modal-title">${escapeHtml(item.name)}</h2>
          ${modelBadge}
        </div>
        <table class="modal-table">
          ${rowsHtml}
        </table>
        <div style="display:flex; gap:12px; margin-top:8px;">
          <a href="https://wa.me/919999118454?text=${encodeURIComponent('Hi Yorker team, I am interested in trade pricing for ' + item.name)}" target="_blank" class="btn-primary" style="padding:10px 18px; font-size:0.875rem;">
            WhatsApp Sales Desk
          </a>
          <button type="button" class="btn-secondary" style="padding:10px 18px; font-size:0.875rem;" onclick="document.getElementById('productModal').classList.remove('active'); document.getElementById('dealers').scrollIntoView({behavior:'smooth'});">
            Request Trade Quote
          </button>
        </div>
      </div>
    </div>
  `;
}

/* ========================================================
   VIDEO PLAYER MODAL
   ======================================================== */
window.openVideoDemo = function(title, tag) {
  const modal = document.getElementById('productModal');
  const body = document.getElementById('modalBody');
  if (!modal || !body) return;

  body.innerHTML = `
    <div style="display:flex; flex-direction:column; gap:16px;">
      <div style="position:relative; padding-bottom:56.25%; height:0; overflow:hidden; border-radius:8px; background:#000;">
        <iframe style="position:absolute; top:0; left:0; width:100%; height:100%;" 
                src="https://www.youtube-nocookie.com/embed?listType=search&list=Yorker+Tools+${encodeURIComponent(title)}" 
                title="${escapeHtml(title)}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen>
        </iframe>
      </div>
      <div>
        <span style="font-size:0.8125rem; font-weight:700; color:var(--color-primary);">${escapeHtml(tag)}</span>
        <h2 style="font-size:1.4rem; font-weight:800; color:var(--color-text-title);">${escapeHtml(title)}</h2>
        <p style="color:var(--color-text-body); font-size:0.9375rem; margin-top:4px;">Watch real workshop cutting and performance demonstration by the Yorker Technical Team.</p>
      </div>
      <div style="display:flex; gap:12px; align-self:flex-start;">
        <a href="https://www.youtube.com/channel/UCeBzUmk27hZVg0gaiVjolTA" target="_blank" class="btn-primary" style="padding:10px 20px; font-size:0.875rem;">
          Subscribe on YouTube
        </a>
      </div>
    </div>
  `;

  modal.classList.add('active');
};

/* ========================================================
   MOBILE NAVIGATION
   ======================================================== */
function initMobileNav() {
  const toggle = document.getElementById('mobileNavToggle');
  const navList = document.querySelector('.nav-list');

  if (toggle && navList) {
    toggle.addEventListener('click', () => {
      const isVisible = navList.style.display === 'flex';
      navList.style.display = isVisible ? 'none' : 'flex';
      if (!isVisible) {
        navList.style.flexDirection = 'column';
        navList.style.position = 'absolute';
        navList.style.top = '100%';
        navList.style.left = '0';
        navList.style.right = '0';
        navList.style.background = '#FFFFFF';
        navList.style.padding = '20px';
        navList.style.boxShadow = '0 10px 25px rgba(0,0,0,0.1)';
        navList.style.zIndex = '99';
      }
    });
  }
}

/* ========================================================
   TOAST HELPER
   ======================================================== */
function showToast(message) {
  let toast = document.getElementById('toastNotice');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toastNotice';
    toast.className = 'toast-notice';
    document.body.appendChild(toast);
  }

  toast.textContent = message;
  toast.classList.add('show');

  setTimeout(() => {
    toast.classList.remove('show');
  }, 4000);
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
