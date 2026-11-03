# URL Routing & Navigation Architecture

This document describes how URL routing, clean navigation, and redirect handling operate across the application.

---

## 1. Clean URL Resolution Table

| URL Requested | Disk File Served | Description |
| :--- | :--- | :--- |
| `/` or `""` | `public/index.html` | Storefront home page |
| `/shoes` | `public/shoes.html` | All Sneakers catalog |
| `/shoes/legends` | `public/shoes/legends.html` | Legends collection |
| `/shoes/:slug` | `public/shoes/:slug.html` | Pre-rendered individual product page |
| `/about` | `public/about.html` | About page |
| `/shipping` | `public/shipping.html` | Shipping policy |
| `/privacy` | `public/privacy.html` | Privacy policy |
| `/returns` | `public/returns.html` | Returns & Exchanges policy |
| `/terms-conditions` | `public/terms-conditions.html` | Terms and conditions |
| `/stores` | `public/stores.html` | Store locations catalog |
| `/stores/:store-slug`| `public/stores/:store-slug.html`| Individual store detail page |
| `/magazine` | `public/magazine.html` | Sneaker culture magazine |
| `/magazine/:slug` | `public/magazine/:slug.html` | Individual article page |
| `/contact` | `HTTP 302 -> /` | Redirects to home page |

---

## 2. Dual-Layer SPA 404 Prevention

In compiled single-page applications, client-side routers intercept internal `<a>` clicks and perform dynamic route matching. Because brand slugs were updated from historical names (`nyke-...`, `addies-...`) to authentic brands (`nike-...`, `adidas-...`), client-side dynamic querying could fail if chunk metadata was unavailable.

Sneakers solves this using a resilient **two-tier defense**:

### Layer 1: Capture-Phase Native Browser Navigation
All clicks on shoe links (`a[href*="/shoes/"]`) are intercepted at the window level during the **capture phase** (before any framework click handler executes):

```javascript
window.addEventListener('click', function (e) {
  const shoeLink = e.target.closest('a[href*="/shoes/"], a[href*="./shoes/"]');
  if (shoeLink && !shoeLink.closest('.sneaks-checkout-modal') && !shoeLink.closest('.sneaks-cart-drawer')) {
    const rawHref = shoeLink.getAttribute('href');
    if (rawHref && rawHref !== '#' && !rawHref.startsWith('javascript:')) {
      let cleanHref = rawHref.replace(/^\.\//, '/');
      if (!cleanHref.startsWith('/')) cleanHref = '/' + cleanHref;

      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      window.location.assign(cleanHref);
      return false;
    }
  }
}, true);
```
`window.location.assign(cleanHref)` forces standard browser navigation, cleanly requesting `public/shoes/:slug.html` directly from the local server with **HTTP 200 OK**.

### Layer 2: Bundle-Level CMS Slug Normalization
In the underlying JavaScript modules (`wWC8EGMFo.BVuonSMM.mjs`, `fIwdA4CC3.BHHpusmG.mjs`, and `DB0XDMvFiZusnGFh5IAMDaqc4K-TDCm7EjJERGxYVC8.DsmKun5E.mjs`), slug lookup queries are normalized:
```javascript
let normalizedSlug = typeof e === 'string'
  ? e.replace(/^adidas-/, 'addies-').replace(/^nike-/, 'nyke-')
  : e;
```
Even if client-side hydration executes, queries resolve accurately to CMS records with zero route exceptions.

---

## 3. Redirect Handling

Requests to deprecated pages (such as `/contact`) are automatically handled at both the network and client layers:
- **Server-Side**: `server.js` detects `/contact` and responds with `302 Found` with `Location: /`.
- **Client-Side**: `shop-system.js` detects `/contact` in `window.location.pathname` and calls `window.location.replace('/')`, providing instant correction if an existing tab is refreshed.
