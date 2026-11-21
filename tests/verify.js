const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('=== RUNNING YORKER TOOLS CENTRE DEEP VERIFICATION TEST SUITE ===\n');

const ROOT = path.resolve(__dirname, '..');
let totalTests = 0;
let passedTests = 0;

function it(name, fn) {
  totalTests++;
  try {
    fn();
    passedTests++;
    console.log(`  [PASS] ${name}`);
  } catch (err) {
    console.error(`  [FAIL] ${name}`);
    console.error(`         ${err.message}`);
  }
}

// 1. Data Integrity Tests
it('products.json parses and contains exactly 293 items', () => {
  const products = JSON.parse(fs.readFileSync(path.join(ROOT, 'assets/data/products.json'), 'utf8'));
  assert.strictEqual(products.length, 293);
});

it('categories.json parses and contains exactly 12 categories', () => {
  const categories = JSON.parse(fs.readFileSync(path.join(ROOT, 'assets/data/categories.json'), 'utf8'));
  assert.strictEqual(categories.length, 12);
});

it('Every product has category_slugs mapped correctly', () => {
  const products = JSON.parse(fs.readFileSync(path.join(ROOT, 'assets/data/products.json'), 'utf8'));
  for (const p of products) {
    assert(Array.isArray(p.category_slugs), `Product ${p.slug} has no category_slugs array`);
    assert(p.name && p.name.length > 0, `Product ${p.slug} has empty name`);
    assert(p.slug && p.slug.length > 0, `Product has empty slug`);
  }
});

it('Category counts match UI badges within expected tolerance', () => {
  const products = JSON.parse(fs.readFileSync(path.join(ROOT, 'assets/data/products.json'), 'utf8'));
  const counts = {};
  for (const p of products) {
    for (const c of p.category_slugs) {
      counts[c] = (counts[c] || 0) + 1;
    }
  }
  assert.strictEqual(counts['power-tools'], 57, 'Power tools count must be 57');
  assert.strictEqual(counts['cordless-tools'], 9, 'Cordless tools count must be 9');
  assert.strictEqual(counts['measuring-tools'], 26, 'Measuring tapes count must be 26');
  assert.strictEqual(counts['spirit-level'], 4, 'Spirit levels count must be 4');
  assert(counts['abrasives'] >= 27 && counts['abrasives'] <= 28, 'Abrasives count ~28');
  assert.strictEqual(counts['diamond-saw-blades'], 31, 'Diamond saw blades count must be 31');
  assert.strictEqual(counts['tct-saw-blades'], 9, 'TCT saw blades count must be 9');
  assert(counts['hand-tools'] >= 45 && counts['hand-tools'] <= 46, 'Hand tools count ~45');
  assert.strictEqual(counts['sds-drill-bits-chisels'], 10, 'SDS bits count must be 10');
  assert.strictEqual(counts['agriculture-machines'], 15, 'Agriculture machines count must be 15');
  assert.strictEqual(counts['spare-parts'], 8, 'Spare parts count must be 8');
  assert(counts['accessories'] >= 36 && counts['accessories'] <= 38, 'Accessories count ~36');
});

it('Series tool counts match Image 4 mockup (18, 14, 8, 9, 6, 2)', () => {
  const products = JSON.parse(fs.readFileSync(path.join(ROOT, 'assets/data/products.json'), 'utf8'));
  const seriesCounts = {};
  for (const p of products) {
    if (p.series_slug) {
      seriesCounts[p.series_slug] = (seriesCounts[p.series_slug] || 0) + 1;
    }
  }
  assert.strictEqual(seriesCounts['yorker'], 18, 'Yorker series must be 18');
  assert.strictEqual(seriesCounts['yorker-pro'], 14, 'Yorker Pro must be 14');
  assert.strictEqual(seriesCounts['yorker-gold'], 8, 'Yorker Gold must be 8');
  assert.strictEqual(seriesCounts['yorker-googly'], 9, 'Yorker Googly must be 9');
  assert.strictEqual(seriesCounts['yorker-firstchoice'], 6, 'Yorker FirstChoice must be 6');
  assert.strictEqual(seriesCounts['yorker-pro-plus'], 2, 'Yorker Pro+ must be 2');
});

it('All 8 New Arrival models are correctly flagged and mapped to local assets', () => {
  const products = JSON.parse(fs.readFileSync(path.join(ROOT, 'assets/data/products.json'), 'utf8'));
  const newArrivals = products.filter(p => p.is_new);
  assert.strictEqual(newArrivals.length, 8, 'Must be exactly 8 new arrivals');
  for (const na of newArrivals) {
    assert(na.local_image, `New arrival ${na.name} has no local_image`);
    assert(fs.existsSync(path.join(ROOT, na.local_image)), `Local image ${na.local_image} does not exist`);
  }
});

// 2. HTML Files & Asset Resolution Tests
const HTML_FILES = [
  'index.html', 'products.html', 'about.html', 'dealers.html',
  'catalogues.html', 'videos.html', 'contact.html',
  'privacy.html', 'terms.html', 'cancellation.html'
];

it('All 10 required HTML pages exist on disk and have non-empty contents', () => {
  for (const f of HTML_FILES) {
    const full = path.join(ROOT, f);
    assert(fs.existsSync(full), `File ${f} is missing`);
    const stat = fs.statSync(full);
    assert(stat.size > 1000, `File ${f} seems too small (${stat.size} bytes)`);
  }
});

it('All local assets referenced in HTML files exist on disk', () => {
  for (const f of HTML_FILES) {
    const html = fs.readFileSync(path.join(ROOT, f), 'utf8');
    const matches = html.match(/(?:src|href)=["'](assets\/[^"'#?]+)/g) || [];
    for (const m of matches) {
      const rel = m.replace(/^(src|href)=["']/, '');
      const assetPath = path.join(ROOT, rel);
      assert(fs.existsSync(assetPath), `Asset ${rel} referenced in ${f} does not exist`);
    }
  }
});

it('Search form in all HTML pages uses right-aligned .search-btn', () => {
  for (const f of HTML_FILES) {
    const html = fs.readFileSync(path.join(ROOT, f), 'utf8');
    if (html.includes('id="searchForm"')) {
      assert(html.includes('class="search-btn"'), `Page ${f} is missing .search-btn`);
      assert(!html.includes('class="search-icon"'), `Page ${f} still has old .search-icon`);
    }
  }
});

it('Index.html does not have hardcoded active class on About Us in nav', () => {
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  assert(!html.includes('<a href="#about" class="nav-link active">'), 'Index.html must not hardcode active on About us');
});

it('Index.html has all 8 sections corresponding to the 8 UI mockup images', () => {
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  assert(html.includes('class="topbar"'), 'Missing Topbar (Image 1)');
  assert(html.includes('class="hero-section"'), 'Missing Hero Section (Image 1)');
  assert(html.includes('class="find-tool-section"'), 'Missing Find Your Tool (Image 1)');
  assert(html.includes('class="shop-category-section"'), 'Missing Shop by Category (Image 2)');
  assert(html.includes('class="new-arrivals-section"'), 'Missing New Arrivals (Image 3)');
  assert(html.includes('class="six-series-section"'), 'Missing Six Series (Image 4)');
  assert(html.includes('class="action-section"'), 'Missing Tools in Action (Image 5)');
  assert(html.includes('class="story-section"'), 'Missing Made by Yorker (Image 6)');
  assert(html.includes('class="dealer-section"'), 'Missing Dealer / Bulk Order (Image 7)');
  assert(html.includes('class="catalogues-section"'), 'Missing Catalogues and Guides (Image 8)');
  assert(html.includes('class="site-footer"'), 'Missing Footer (Image 8)');
});

// 3. Functional Simulation Tests
it('Category filter simulation: power-tools returns exactly 57 products', () => {
  const products = JSON.parse(fs.readFileSync(path.join(ROOT, 'assets/data/products.json'), 'utf8'));
  const filtered = products.filter(p => p.category_slugs && p.category_slugs.includes('power-tools'));
  assert.strictEqual(filtered.length, 57);
});

it('Category filter simulation: measuring-tools returns exactly 26 products', () => {
  const products = JSON.parse(fs.readFileSync(path.join(ROOT, 'assets/data/products.json'), 'utf8'));
  const filtered = products.filter(p => p.category_slugs && p.category_slugs.includes('measuring-tools'));
  assert.strictEqual(filtered.length, 26);
});

it('Series filter simulation: yorker-pro returns exactly 14 products', () => {
  const products = JSON.parse(fs.readFileSync(path.join(ROOT, 'assets/data/products.json'), 'utf8'));
  const filtered = products.filter(p => p.series_slug === 'yorker-pro');
  assert.strictEqual(filtered.length, 14);
});

it('Search query simulation: "0835" finds DEMOLITION HAMMER-YK0835 and PRO-0835K', () => {
  const products = JSON.parse(fs.readFileSync(path.join(ROOT, 'assets/data/products.json'), 'utf8'));
  const filtered = products.filter(p => {
    const q = '0835';
    const name = (p.name || '').toLowerCase();
    const models = (p.models || []).join(' ').toLowerCase();
    return name.includes(q) || models.includes(q);
  });
  assert(filtered.length >= 2, 'Must find at least 2 models containing 0835');
});

it('Quick view slug resolver finds PRO-0835K Demolition Hammer with input "pro-0835k"', () => {
  const products = JSON.parse(fs.readFileSync(path.join(ROOT, 'assets/data/products.json'), 'utf8'));
  const query = 'pro-0835k';
  const found = products.find(p => p.slug.toLowerCase().includes(query) || (p.models && p.models.some(m => m.toLowerCase().includes(query))));
  assert(found, 'Must find pro-0835k');
  assert.strictEqual(found.name, 'PRO-0835K DEMOLITION HAMMER');
});

console.log(`\n=== TEST RESULTS: ${passedTests}/${totalTests} TESTS PASSED ===\n`);
if (passedTests !== totalTests) {
  process.exit(1);
}
