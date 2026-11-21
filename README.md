# Yorker Tools Centre - Official Website & Hardware Catalogue

> **"Bharat ka vishwas, mazboot tools ke saath"**  
> Complete responsive website and industrial tool directory built to faithfully implement the Yorker Tools Centre brand UI theme.

---

## 🛠️ About Yorker Engineering Pvt Ltd
Founded in 2014 in Delhi, **Yorker Engineering Pvt Ltd** began with precision manufacturing of heavy-duty measuring tapes. Today, Yorker supplies **293 industrial products** across **13 core categories**—including high-torque demolition hammers, angle grinders, cordless tools, diamond and TCT saw blades, spirit levels, abrasives, and hand tools—to over 1,000 hardware distributors and fabrication workshops across India.

- **Central Showroom:** 5093, Gali Phatak Bans Wali, Sirkiwalan, Lal Kuan, Chawri Bazar, Delhi 110006
- **Phone:** 011 4514 3354 / 011 4356 1778
- **Email:** sales@yorkertoolscentre.com
- **WhatsApp Desk:** +91 99991 18454

---

## ✨ Features & UI Theme Highlights

1. **Exact UI Design Fidelity**:
   - Distinctive warm ivory / linen page backdrop (`#FAF7F2`) with crisp white surface cards and subtle warm-tinted card media containers (`#EFE8E2`).
   - Signature vibrant Yorker Orange (`#F16401`) primary interactive elements and active state indicators.
   - Deep industrial Navy (`#022758` / `#0B2447`) top utility bar, primary display headlines, and corporate footer masthead.
   - Clean, rounded, modern typography using Google Font **Plus Jakarta Sans**.

2. **Complete Section Structure**:
   - **Utility Top Bar**: Multilingual brand tagline, direct phone, and sales desk email.
   - **Main Header & Navigation**: Yorker registered brandmark, real-time tool search input with autocomplete, primary "Become a dealer" action, and interactive multi-column products mega menu.
   - **Hero Ledge**: Display headline ("Built for the job. Since 2014."), product cut-out of the flagship **PRO-0835K Demolition Hammer**, and 3-parameter technical spec strip with quick modal specification drawer.
   - **"Find your tool" Quick Hub**: 4 primary category cards (Power tools, Blades, Abrasives, Tapes).
   - **"Shop by Category" Grid**: 12 categorized families with authentic item counts and product imagery (Power tools 57, Cordless 9, Measuring tapes 26, Spirit levels 4, Abrasives 28, Diamond blades 31, TCT blades 9, Hand tools 45, SDS bits 10, Agri machines 15, Spare parts 8, Accessories 36).
   - **"New Arrivals" Product Showcase**: 8 recent additions with real Yorker model numbers (Diamond Files Half Round #9358, Hand File Set #9357, Professional Hand Files #9356, Glass Cutter #9346, Wooden Chisel #9345, PVC Pipe Cutter #9344, Masonry Saw #9342, Hand Saw #9341).
   - **"Power Tools. Six Series." Hub**: 6 engineering power tool series (Yorker, Yorker Pro, Yorker Gold, Yorker Googly, Yorker FirstChoice, Yorker Pro+).
   - **"Tools in Action" Video Showcase**: 3 video demonstration cards with interactive video player modal.
   - **"Made by Yorker in Delhi"**: Brand origin story, Delhi Chawri Bazar central showroom details, and national exhibition booth showcase.
   - **Interactive Dealer & Bulk Order Terminal**: Dual-mode interactive tabbed application form (Dealer enquiry / Bulk order) with automatic WhatsApp quotation generator and GST capture.
   - **Catalogues & Guides Hub**: Master PDF catalogue request desk and 3 technical cutting guides.
   - **Corporate Masthead Footer**: Complete Delhi contact information, product links, dealer portal, social channels, and legal policies.

3. **Complete Multi-Page Experience**:
   - `index.html`: Main landing page reproducing the exact theme.
   - `products.html`: Interactive catalog of all 293 products with live search filter, category sidebar, series selector, pagination, and modal specification view.
   - `about.html`: Heritage, Delhi manufacturing facilities, and company background.
   - `dealers.html`: Dedicated dealer inquiry and transporter dispatch terms.
   - `catalogues.html`: Technical application guides and master PDF downloads.
   - `videos.html`: Video showcase and tools-in-action gallery.
   - `contact.html`: Chawri Bazar showroom coordinates and direct sales lines.
   - `privacy.html`, `terms.html`, `cancellation.html`: Official trade and cancellation terms.

---

## 📁 Repository Structure

```
.
├── index.html                  # Main homepage with exact UI theme
├── products.html               # All 293 products directory with live filters & modal
├── about.html                  # Company story, heritage, and Delhi showroom
├── dealers.html                # Dealer registration & bulk order form
├── catalogues.html             # PDF catalogues and workshop application guides
├── videos.html                 # Video demonstrations & resources
├── contact.html                # Showroom location & contact information
├── privacy.html                # Privacy policy
├── terms.html                  # Terms & conditions
├── cancellation.html           # Cancellation & warranty policy
├── assets/
│   ├── css/
│   │   └── style.css           # Exact brand design system & responsive layout
│   ├── js/
│   │   └── app.js              # Autocomplete, modals, WhatsApp generator, tabs
│   ├── data/
│   │   ├── categories.json     # 12 categories metadata
│   │   └── products.json       # All 293 products with specifications
│   └── images/
│       ├── logo.png
│       ├── hero-demolition-hammer.png
│       ├── exhibition-booth.png
│       ├── find-*.png          # 4 find-tool category images
│       ├── categories/         # 12 category card photos
│       ├── new-arrivals/       # 8 new arrivals product photos
│       ├── series/             # 6 series tool photos
│       └── videos/             # 3 video action thumbnails
└── README.md
```

---

## 🚀 Running Locally

The site is built with modern vanilla HTML5, CSS3, and ES6 JavaScript with zero build dependencies:

```bash
# Clone the repository
git clone https://github.com/rewadiasuraj-cell/YORKER-Tools-Centre.git

# Navigate into directory
cd YORKER-Tools-Centre

# Open index.html in your browser or run a simple local web server:
python -m http.server 8000
```
Then visit `http://localhost:8000` in your web browser.

---

© 2026 Yorker Engineering Pvt Ltd. All rights reserved.
