# Changelog

All notable changes to the **Sneakers Local Sneaker E-Commerce Store** are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.0] - 2026-10-31

### Added
- **Local HTTP Server (`server.js`)**: Zero-dependency Node.js web server with clean extensionless URL routing, directory traversal protection, and HTTP 302 redirects.
- **E-Commerce Shopping Engine (`public/shop-system.js`)**:
  - `localStorage`-powered shopping cart with quantity adjustment, item removal, and subtotal calculation.
  - Surgical shoe size selector supporting sizes `UK 04` through `UK 10` with isolated pill styling.
  - Minimalist 2-black-line `(+)` Add-to-Cart buttons permanently visible on hover and isolated from card navigation links.
  - Animated slide-in toast notifications with product thumbnail, selected size, price, and cart drawer shortcut.
  - Slide-over cart drawer with live badge count and subtotal calculation.
  - Interactive 2.2x magnifying zoom lens on shoe detail pages that follows cursor position at 60/120 FPS.
  - Multi-angle thumbnail switcher syncing main image and zoom lens.
  - On-page checkout modal with customer details (Full Name, Mobile Number, Delivery Address).
  - Billing option selection: Cash on Delivery (COD), UPI / Online QR, and Credit / Debit Card.
  - Instant order placement screen with unique Order ID (`#SNK-XXXXXX`), order summary, and order history persistence.
- **Design System (`public/shop-system.css`)**:
  - Global pure white background styling across all pages.
  - Complete removal of third-party Framer badges, editor bars, and floating pencil edit icons.
  - Modal overlay with backdrop blur.
  - Responsive layout styling for desktop, tablet, and mobile displays.
- **Technical Documentation (`docs/`)**:
  - `architecture.md`: High-level technical architecture and data flow diagrams.
  - `e-commerce-engine.md`: Comprehensive explanation of cart lifecycle, size selector, zoom lens, and checkout modal.
  - `routing-and-navigation.md`: Route table, dual-layer SPA 404 prevention, and redirect handling.
- **Project Governance & Repository Standards**:
  - Comprehensive `README.md` with features, setup instructions, architecture diagrams, and genuine screenshots.
  - `LICENSE` file under the MIT License.
  - `.gitignore` tailored for Node.js projects.
  - `CONTRIBUTING.md` with guidelines for pull requests and development workflow.
  - `screenshots/` directory showcasing application features.

### Changed
- **Brand Uniformity**: Replaced all historical placeholder brands ("Nyke" ➔ "Nike", "Addies" ➔ "Adidas") across all HTML pages, search indices, and script bundles.
- **Footer Updates**: Updated brand founding year from "since 2012" to "since 2026".
- **Typographic Spelling**: Updated footer brand from "Sneaks Framer" to "Sneakers" and the large typographic centerpiece from 6 letters ("SNEAKS") to 8 letters ("SNEAKERS").
- **Navigation Safety**: Replaced external framer checkout redirects with on-page checkout modals.

### Removed
- **Contact Page**: Removed `/contact` HTML files, eliminated footer links across all 93 pages, and added automatic 302 redirects to home.
- **"The Team" Section**: Removed the team member cards from `public/about.html` and `public/about/index.html`.
