# Design Specification: Landing Page Redesign with React 18 + GSAP + ScrollTrigger

This document outlines the architecture, layout, typography, animations, and integration plan for the editorial redesign of the CekBiayaJualan main landing page.

---

## 1. Goal

Redesign the main landing page (before login/authentication gate) with a premium, high-fidelity editorial design. The key requirements are:
- Use React 18 (loaded via CDN as UMD, parsed by Babel Standalone in the browser).
- Use GSAP & GSAP ScrollTrigger for advanced scroll interactions.
- Implement an Editorial Design (high-contrast, warm colors, large serif typography, micro-labels).
- Implement scroll-driven typography (headers scaling/changing letter-spacing on scroll).
- Implement an asymmetric grid layout for displaying features.
- Implement one signature animation ("The Unpacking Invoice") showing a decomposed product calculation invoice merging together on scroll.
- Use no Tailwind for this section: style using hand-written CSS with custom CSS variables.
- Maintain seamless integration with the existing Cloudflare Pages Auth logic (`CloudSync`).

---

## 2. Target Architecture

```text
index.html (HTML5)
  ├── <head> 
  │     ├── Google Fonts (Cormorant Garamond & Inter)
  │     ├── React 18 & ReactDOM 18 UMD (CDN)
  │     ├── Babel Standalone (CDN)
  │     ├── GSAP & ScrollTrigger (CDN)
  │     └── css/landing.css (Hand-written CSS with CSS Variables)
  ├── <body>
  │     ├── <section id="landingPage" class="landing-react-root"></section> (React mount point)
  │     └── <main id="main-content">...</main> (Existing calculator DOM)
  └── js/landing.js (React code compiled by Babel Standalone)
```

---

## 3. Visual & Style Guidelines (CSS Variables)

We will define custom variables in `css/landing.css` for both light and dark modes:

```css
:root {
    /* Color Palette */
    --color-bg-paper: #FAF8F5;
    --color-text-ink: #111111;
    --color-accent: #EE4D2D;
    --color-accent-hover: #D83B1C;
    --color-border-soft: rgba(17, 17, 17, 0.1);
    
    /* Pastel Accents */
    --color-pastel-yellow: #FFF9E6;
    --color-pastel-green: #EAF6F0;
    --color-pastel-coral: #FFF0ED;
    --color-pastel-purple: #F0ECFA;
    
    /* Typography */
    --font-serif: 'Cormorant Garamond', Georgia, serif;
    --font-sans: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    
    /* Spacing & Borders */
    --radius-full: 9999px;
    --radius-editorial: 24px;
    --spacing-layout: 4rem;
}

@media (prefers-color-scheme: dark) {
    :root {
        --color-bg-paper: #0B0E14;
        --color-text-ink: #F5F5F5;
        --color-border-soft: rgba(245, 245, 245, 0.15);
        
        --color-pastel-yellow: #292414;
        --color-pastel-green: #142921;
        --color-pastel-coral: #2B1414;
        --color-pastel-purple: #1A142B;
    }
}
```

---

## 4. Components Breakdown

Inside `js/landing.js`, we will declare a React 18 application with the following components:

### `EditorialHeader`
Renders a high-end header bar:
- Left: SVG calculator icon + "CekBiayaJualan" text (using a serif + sans-serif split font weight).
- Center: Running status info (e.g. `[ STATUS: ACTIVE ]`).
- Right: A premium outline button "Log In" that calls `window.CloudSync.login()`.

### `HeroSection`
- Left: An asymmetric block containing a large serif header:
  > *"Hitung profit marketplace di satu papan kerja."*
- Right: A floating, tilted badge `[ CEKBIAYAJUALAN WORKSPACE ]` and a summary subtext with an arrow indicator pointing down.
- Interaction: Hero text letters have high tracking (`letter-spacing`) initially, which narrows smoothly as the user scrolls.

### `SignatureAnimation` ("The Unpacking Invoice")
The centerpiece scroll animation.
- A full-screen pinned section (`gsap.pin`).
- Renders an empty canvas with guide lines.
- Four distinct floating invoice elements represent costs:
  1. **HPP Layer**: Displays HPP cost (e.g., `Rp 150.000`).
  2. **Admin Fee Layer**: Displays Shopee/Tokopedia fee deductions (e.g., `Rp 9.000`).
  3. **Ads Expense Layer**: Displays advertising cost deduction (e.g., `Rp 20.000`).
  4. **Profit Layer**: The core profit indicator.
- **Scroll Trigger Flow**:
  - Scroll 0% - 60%: Elements fly in from diagonal directions, rotating, and aligning to stack into a clean invoice mockup.
  - Scroll 60% - 100%: An numbers counter animates the final profit value from `Rp 0` to `Rp 71.000` inside the net profit layer.

### `AsymmetricGridFeatures`
Renders a masonry-like grid:
- **01 / Profit Calculator**: Large offset tile explaining SKU margins.
- **02 / Price Finder**: Offset downwards tile explaining target pricing.
- **03 / ROAS & Ads**: Floating tile explaining advertising thresholds.
- **04 / Cloud Sync**: Bottom offset tile highlighting remote database sync.

### `EditorialCTA`
A footer section with minimal design. Large display text:
> *"Mulai Kelola Toko Anda Sekarang."*
- Render a bold primary Google login button that initiates OAuth callback redirection.

---

## 5. Integration with CloudSync

`CloudSync.js` uses `setAppAccess(authenticated)` to switch between the landing page and the dashboard. We will ensure the mount point handles visibility:

1. When the user is **authenticated**:
   - The React root container `#landingPage` gets the class `hidden` (or `auth-hidden`) applied.
   - The calculator dashboard `#main-content`, `#desktopTabsNav`, and `#mainNav` become visible.
2. When the user is **not authenticated**:
   - The React root container `#landingPage` is shown.
   - All other application elements remain hidden.

---

## 6. Verification & Accessibility

- **Automated Verification**: Use Google Lighthouse to check performance, and manually review GSAP ScrollTrigger responsiveness on desktop and mobile layout profiles.
- **Accessibility**: Include standard ARIA labels on all custom button elements. Add skip-to-content links. Maintain strict semantic HTML markup (using `header`, `section`, `h1`, `h2`, `footer`).
