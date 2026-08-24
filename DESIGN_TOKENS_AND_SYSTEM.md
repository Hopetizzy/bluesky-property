# 🎨 Blue Sky Property Management — Design Tokens & UI System

> **Fidelity Mapping:** Extracted directly from `Logo.png`, `Board 1 Design.png`, `Board 2 Design.png`, `Board 3 Design.png`, `Board 4 Design.png`, and `Board 5 Design.png`.  
> **Approach:** Mobile-First, Modern Clean Real Estate Aesthetics, High-Trust Corporate Polish.

---

## 1. Brand & Theme Color Tokens

### 1.1 Brand Primaries (Extracted from Logo & Action Buttons)
| Token Name | Hex Code | HSL | RGB | Visual Role / Usage |
| :--- | :--- | :--- | :--- | :--- |
| `--color-primary-blue` | `#0066FF` | `216°, 100%, 50%` | `rgb(0, 102, 255)` | Main CTA buttons, active state indicators, primary icons, price tags |
| `--color-primary-hover` | `#0052CC` | `216°, 100%, 40%` | `rgb(0, 82, 204)` | Button hover state, interactive links hover |
| `--color-primary-active`| `#003D99` | `216°, 100%, 30%` | `rgb(0, 61, 153)` | Pressed / active button state |
| `--color-primary-tint`  | `#EBF3FF` | `216°, 100%, 96%` | `rgb(235, 243, 255)`| Selected tab fill, active radio fill, subtle highlight surface |

### 1.2 Brand Accents & Sky Blue (Extracted from Circular Logo & Light Banners)
| Token Name | Hex Code | HSL | Visual Role / Usage |
| :--- | :--- | :--- | :--- |
| `--color-sky-blue` | `#38BDF8` | `199°, 95%, 60%` | Sky accents, featured borders, chat accent rings |
| `--color-sky-light` | `#E0F2FE` | `204°, 94%, 94%` | Information callouts, notification unread badges, sky background tint |
| `--color-sky-badge` | `#BAE6FD` | `201°, 94%, 86%` | Pill badges, micro tags |

### 1.3 Deep Navy & Typography (Extracted from Logo Roofline & Text)
| Token Name | Hex Code | Visual Role / Usage |
| :--- | :--- | :--- |
| `--color-navy-dark` | `#0F172A` | Primary headings (`H1`, `H2`), high-contrast text, dark drawer nav |
| `--color-navy-secondary` | `#1E293B` | Subheadings, card titles, table headers |
| `--color-navy-muted` | `#475569` | Secondary labels, descriptions, meta items (beds, baths, address) |

### 1.4 Status & Feedback Palette (Extracted from Boards 1–5 Status Legend)
| State | Text Color | Fill / Background | Border / Accent | Applied To |
| :--- | :--- | :--- | :--- | :--- |
| **Verified / Approved / Published** | `#15803D` | `#DCFCE7` | `#16A34A` | `VERIFIED` listing badge, approved applications, verified payments |
| **Pending / Under Review** | `#B45309` | `#FEF3C7` | `#F59E0B` | `UNDER REVIEW`, `PENDING` payment receipts, pending property review |
| **Rejected / Expired / Suspended** | `#B91C1C` | `#FEE2E2` | `#EF4444` | `REJECTED` applications, `EXPIRED` listing access, missing documents |
| **Informational / In Progress** | `#0369A1` | `#E0F2FE` | `#0284C7` | Application in-flight steps, verification checklists |

### 1.5 Surfaces & Neutral Scale
```css
:root {
  --color-white: #FFFFFF;
  --color-gray-50: #F8FAFC;  /* App Background Canvas */
  --color-gray-100: #F1F5F9; /* Card Subtle Fill / Input BG */
  --color-gray-200: #E2E8F0; /* Border Outlines & Dividers */
  --color-gray-300: #CBD5E1; /* Inactive borders */
  --color-gray-400: #94A3B8; /* Disabled text / Form placeholders */
  --color-gray-500: #64748B; /* Secondary helper text */
  --color-gray-900: #0F172A; /* Primary Body Text */
}
```

---

## 2. Typography System

**Primary Font Family:** `'Plus Jakarta Sans', 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`

| Level | Size | Weight | Line Height | Tracking | Usage |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Display / Hero H1** | `26px` (Mobile) / `36px` (Tablet+) | 700 (Bold) | 1.25 | `-0.02em` | "Find your next home with confidence" |
| **Section H2** | `20px` | 700 (Bold) | 1.3 | `-0.01em` | "Featured Properties", "Application Status" |
| **Card Title H3** | `16px` | 600 (Semi-Bold) | 1.4 | `0` | "2 Bedroom Apartment", "Listing Plans" |
| **Body Large** | `15px` | 400 (Regular) / 500 (Medium) | 1.5 | `0` | Property descriptions, review notes |
| **Body Regular** | `14px` | 400 (Regular) | 1.5 | `0` | Form labels, input values, body text |
| **Body Small / Meta** | `12px` | 500 (Medium) | 1.4 | `0` | Address labels, beds/baths metadata, timestamps |
| **Caption / Badge** | `11px` | 700 (Bold) | 1.0 | `+0.04em` | Status chips (`APPROVED`, `UNDER REVIEW`) |
| **Price Hero** | `18px`–`22px` | 700 (Bold) | 1.2 | `0` | `$1,500 / month`, `CA$2,400 / month` |

---

## 3. Spatial System, Radii & Elevations

### 3.1 Border Radii
- **Badges & Pills:** `9999px` (`rounded-full`)
- **Buttons & Form Inputs:** `10px` (`rounded-lg`)
- **Cards & Modal Sheets:** `14px`–`16px` (`rounded-xl` / `rounded-2xl`)
- **Image Containers:** `12px` (`rounded-lg`)

### 3.2 Shadows & Elevation
```css
/* Card Elevation */
--shadow-card: 0 1px 3px 0 rgba(15, 23, 42, 0.04), 0 1px 2px -1px rgba(15, 23, 42, 0.04);
--shadow-card-hover: 0 10px 15px -3px rgba(15, 23, 42, 0.08), 0 4px 6px -4px rgba(15, 23, 42, 0.04);

/* Floating CTA / Bottom Navigation */
--shadow-bottom-nav: 0 -4px 12px 0 rgba(15, 23, 42, 0.05);

/* Modal Sheets & Drawers */
--shadow-modal: 0 20px 25px -5px rgba(15, 23, 42, 0.15), 0 8px 10px -6px rgba(15, 23, 42, 0.1);
```

---

## 4. Master UI Component Specifications

### 4.1 Property Card (Mobile Marketplace)
```html
<div class="property-card">
  <div class="property-image-container">
    <img src="..." alt="Property" class="property-image" />
    <span class="badge badge-verified">✓ VERIFIED</span>
    <button class="btn-favorite" aria-label="Favorite"><HeartIcon /></button>
  </div>
  <div class="property-card-body">
    <div class="property-price">$1,850 <span class="property-period">/ month</span></div>
    <h3 class="property-title">2 Bedroom Luxury Apartment</h3>
    <p class="property-location"><LocationPinIcon /> Downtown, Los Angeles, CA</p>
    <div class="property-specs">
      <span><BedIcon /> 2 Beds</span>
      <span><BathIcon /> 2 Baths</span>
      <span><BuildingIcon /> Apartment</span>
    </div>
  </div>
</div>
```

### 4.2 Status Badge Tokens
```css
.badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border-radius: 9999px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}
.badge-verified, .badge-approved, .badge-published {
  background-color: #DCFCE7;
  color: #15803D;
  border: 1px solid #BBF7D0;
}
.badge-pending, .badge-under-review, .badge-expiring {
  background-color: #FEF3C7;
  color: #B45309;
  border: 1px solid #FDE68A;
}
.badge-rejected, .badge-expired, .badge-suspended {
  background-color: #FEE2E2;
  color: #B91C1C;
  border: 1px solid #FECACA;
}
```

### 4.3 Form Inputs & Touch Targets
- Touch target minimum: `48px` height
- Border: `1px solid #E2E8F0`
- Focus: `border-color: #0066FF; outline: 2px solid rgba(0, 102, 255, 0.15);`
- Background: `#FFFFFF`
- Radius: `10px`
