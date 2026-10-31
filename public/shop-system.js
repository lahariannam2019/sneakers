/**
 * SNEAKS E-COMMERCE ENGINE - V5.0
 * 1. Guarantees 100% white page background & preserves original layout
 * 2. Surgical shoe size selection (UK 04 - UK 10) without modifying page containers
 * 3. Add-to-cart (+) buttons: crisp 2-black-lines with zero black background fill
 * 4. Card (+) button permanently visible on hover (attached directly to image container, above all figures)
 * 5. Card (+) click immediately adds to cart and shows toast notification (never opens Buy Now / never navigates)
 * 6. Card navigation bypasses Framer SPA router via window.location.assign (no 404s, no manual refresh needed)
 * 7. "Buy now" opens full Checkout Modal: Name, Mobile Number, Delivery Address, Billing Option, Place Order
 * 8. Order Placed screen with Order ID and summary
 */

(function () {
  'use strict';

  // Instant redirect away from removed contact page
  if (window.location.pathname === '/contact' || window.location.pathname.startsWith('/contact')) {
    window.location.replace('/');
    return;
  }

  let currentSelectedSize = 'UK 07';
  let currentCheckoutItems = [];

  // Minimalist 2-black-lines (+) SVG (strictly NO black filled background)
  const PLUS_SVG_CARD = `
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#000000" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <line x1="12" y1="4" x2="12" y2="20"></line>
      <line x1="4" y1="12" x2="20" y2="12"></line>
    </svg>
  `;

  const PLUS_SVG_DETAIL = `
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#000000" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <line x1="12" y1="4" x2="12" y2="20"></line>
      <line x1="4" y1="12" x2="20" y2="12"></line>
    </svg>
  `;

  // 1. LOCALSTORAGE CART SYSTEM
  const Cart = {
    get() {
      try {
        return JSON.parse(localStorage.getItem('sneaks_cart') || '[]');
      } catch {
        return [];
      }
    },
    save(items) {
      localStorage.setItem('sneaks_cart', JSON.stringify(items));
      updateCartBadge();
      renderCartDrawer();
    },
    add(item) {
      const items = this.get();
      const existing = items.find(i => i.id === item.id && i.size === item.size);
      if (existing) {
        existing.quantity = (existing.quantity || 1) + (item.quantity || 1);
      } else {
        items.push({
          ...item,
          quantity: item.quantity || 1
        });
      }
      this.save(items);
      showToast(item);
    },
    remove(index) {
      const items = this.get();
      items.splice(index, 1);
      this.save(items);
    },
    updateQty(index, delta) {
      const items = this.get();
      if (items[index]) {
        items[index].quantity = Math.max(1, (items[index].quantity || 1) + delta);
        this.save(items);
      }
    },
    clear() {
      this.save([]);
    },
    total() {
      return this.get().reduce((sum, item) => {
        const p = parseFloat(String(item.price).replace(/[^0-9.]/g, '')) || 0;
        return sum + p * (item.quantity || 1);
      }, 0);
    },
    count() {
      return this.get().reduce((cnt, item) => cnt + (item.quantity || 1), 0);
    }
  };

  // 2. SURGICAL SHOE SIZE SELECTION
  const SIZES = ['UK 04', 'UK 05', 'UK 06', 'UK 07', 'UK 08', 'UK 09', 'UK 10'];

  function getSizePills() {
    const pills = [];
    const pTags = document.querySelectorAll('p');
    pTags.forEach(p => {
      const text = (p.textContent || '').trim();
      if (SIZES.includes(text)) {
        const pill = p.closest('.framer-7yVgN') || (p.parentElement ? p.parentElement.parentElement : null);
        if (pill && !pills.some(item => item.pill === pill)) {
          pills.push({ pill, pTag: p, size: text });
        }
      }
    });
    return pills;
  }

  function renderSelectedSize() {
    const pills = getSizePills();
    if (pills.length === 0) return;

    pills.forEach(({ pill, pTag, size }) => {
      pill.style.setProperty('cursor', 'pointer', 'important');
      pill.style.setProperty('pointer-events', 'auto', 'important');

      if (size === currentSelectedSize) {
        pill.style.setProperty('background-color', '#000000', 'important');
        pill.style.setProperty('background', '#000000', 'important');
        pTag.style.setProperty('color', '#ffffff', 'important');
        pTag.style.setProperty('--framer-text-color', '#ffffff', 'important');
        pTag.style.setProperty('--extracted-r6o4lv', '#ffffff', 'important');
      } else {
        pill.style.setProperty('background-color', 'rgb(240, 240, 240)', 'important');
        pill.style.setProperty('background', 'rgb(240, 240, 240)', 'important');
        pTag.style.setProperty('color', '#000000', 'important');
        pTag.style.setProperty('--framer-text-color', '#000000', 'important');
        pTag.style.setProperty('--extracted-r6o4lv', '#000000', 'important');
      }
    });
  }

  // 3. CAPTURE-PHASE GLOBAL CLICK INTERCEPTOR
  window.addEventListener('click', function (e) {
    // A. PRODUCT CARD (+) ADD-TO-CART BUTTON CLICK (HIGHEST PRIORITY)
    const cardPlus = e.target.closest('.sneaks-card-clean-plus');
    if (cardPlus) {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();

      const card = cardPlus.closest('a[href*="/shoes/"]') ||
                   cardPlus.closest('[data-framer-name="Primary"]') ||
                   cardPlus.parentElement.closest('a') ||
                   cardPlus.parentElement;

      let title = 'Sneaker';
      let price = '$115.00';
      let image = '';
      let href = '/shoes';

      if (card) {
        href = card.getAttribute('href') || '/shoes';
        const text = card.innerText || '';
        const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
        const foundTitle = lines.find(l => (l.includes('Nike') || l.includes('Adidas')) && !l.includes('$')) ||
                           lines.find(l => l.length > 5 && !l.includes('$') && !l.includes('since'));
        if (foundTitle) title = foundTitle;

        const priceMatch = text.match(/\$\d+(\.\d{2})?/);
        if (priceMatch) price = priceMatch[0];

        const img = card.querySelector('img');
        if (img) image = img.src;
      }

      Cart.add({
        id: href + '-UK 07',
        title,
        price,
        size: 'UK 07',
        image: image || '/images/tLkFVh9iw2i4EHESvqYIcb2Ng.png',
        quantity: 1
      });

      return false;
    }

    // B. PRODUCT DETAIL PAGE (+) ADD-TO-CART BUTTON CLICK
    const detailPlus = e.target.closest('.sneaks-clean-plus-btn');
    if (detailPlus) {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();

      const info = extractPageProductInfo();
      Cart.add(info);
      return false;
    }

    // C. SIZE PILL CLICK
    let curr = e.target;
    let clickedSize = null;
    while (curr && curr !== document.body) {
      const text = (curr.textContent || '').trim();
      if (SIZES.includes(text)) {
        clickedSize = text;
        break;
      }
      curr = curr.parentElement;
    }

    if (clickedSize) {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      currentSelectedSize = clickedSize;
      renderSelectedSize();
      return false;
    }

    // D. BUY NOW BUTTON CLICK (Bypasses Framer login / framer.link)
    curr = e.target;
    let isBuyNow = false;
    while (curr && curr !== document.body) {
      const text = (curr.textContent || '').trim().toLowerCase();
      const href = curr.getAttribute ? (curr.getAttribute('href') || '') : '';
      const framerName = curr.getAttribute ? curr.getAttribute('data-framer-name') : '';
      if (text === 'buy now' || href.includes('framer.link') || framerName === 'Buy now') {
        if (!curr.classList.contains('sneaks-place-order-btn') && !curr.classList.contains('sneaks-buy-now-btn')) {
          isBuyNow = true;
          break;
        }
      }
      curr = curr.parentElement;
    }

    if (isBuyNow) {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      const item = extractPageProductInfo();
      openCheckout(item);
      return false;
    }

    // E. SHOE CARD DIRECT BROWSER NAVIGATION (Completely bypasses Framer React SPA 404 router)
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
  }, true); // TRUE = CAPTURE PHASE!

  // 4. INJECT CLEAN 2-LINES (+) BUTTONS
  function injectCleanPlusButtons() {
    // A. Product Page: beside Buy Now
    const buyNowLinks = Array.from(document.querySelectorAll('a, button')).filter(el => {
      const text = (el.textContent || '').trim().toLowerCase();
      return text.includes('buy now') &&
        !el.classList.contains('sneaks-buy-now-btn') &&
        !el.classList.contains('sneaks-mini-buy-btn') &&
        !el.classList.contains('sneaks-place-order-btn');
    });

    buyNowLinks.forEach(link => {
      link.setAttribute('href', 'javascript:void(0)');

      const parent = link.parentElement;
      if (parent && !parent.querySelector('.sneaks-clean-plus-btn')) {
        const plusBtn = document.createElement('button');
        plusBtn.type = 'button';
        plusBtn.className = 'sneaks-clean-plus-btn';
        plusBtn.setAttribute('title', 'Add to Cart');
        plusBtn.setAttribute('aria-label', 'Add to Cart');
        plusBtn.innerHTML = PLUS_SVG_DETAIL;

        parent.style.display = 'flex';
        parent.style.alignItems = 'center';
        parent.style.gap = '14px';
        parent.appendChild(plusBtn);
      }
    });

    // B. Product Cards: bottom-right of every product image
    const cards = document.querySelectorAll('a[href*="/shoes/"], [data-framer-name="Primary"]');
    cards.forEach(card => {
      if (card.closest('.sneaks-checkout-modal') || card.closest('.sneaks-cart-drawer')) {
        return;
      }

      // Target the permanent image container (framer-1m6qkbg / Product Image)
      const imgContainer = card.querySelector('[data-framer-name="Product Image"]') ||
                           card.querySelector('.framer-1m6qkbg') ||
                           card.querySelector('figure')?.parentElement;

      if (!imgContainer) return;

      imgContainer.style.setProperty('position', 'relative', 'important');

      // Check if button already injected inside this container
      if (!imgContainer.querySelector('.sneaks-card-clean-plus')) {
        const plusBtn = document.createElement('button');
        plusBtn.type = 'button';
        plusBtn.className = 'sneaks-card-clean-plus';
        plusBtn.setAttribute('title', 'Add to Cart');
        plusBtn.setAttribute('aria-label', 'Add to Cart');
        plusBtn.innerHTML = PLUS_SVG_CARD;

        imgContainer.appendChild(plusBtn);
      }
    });
  }

  function extractPageProductInfo() {
    const h1 = document.querySelector('h1, h2, [data-framer-name="Product Title"]');
    let title = h1 ? h1.textContent.trim() : document.title.split('|')[0].trim();
    if (title.toLowerCase().startsWith('sneaks')) title = 'Adidas Kadhi OG';

    let price = '$115.00';
    const allP = Array.from(document.querySelectorAll('p, span, div'));
    const priceEl = allP.find(el => /^\$\d+(\.\d{2})?$/.test(el.textContent.trim()));
    if (priceEl) price = priceEl.textContent.trim();

    let image = '/images/tLkFVh9iw2i4EHESvqYIcb2Ng.png';
    const mainImg = document.querySelector('img[src*="/images/"]');
    if (mainImg) image = mainImg.src;

    return {
      id: location.pathname + '-' + currentSelectedSize,
      title,
      price,
      size: currentSelectedSize,
      image,
      quantity: 1
    };
  }

  // 5. SHOPPING UI: FLOATING CART, DRAWER & CHECKOUT MODAL
  function injectShopUI() {
    if (document.getElementById('sneaks-shop-root')) return;

    const root = document.createElement('div');
    root.id = 'sneaks-shop-root';
    root.innerHTML = `
      <!-- Floating Cart Button -->
      <div id="sneaks-floating-cart-btn" class="sneaks-floating-cart" title="View Cart">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
          <line x1="3" y1="6" x2="21" y2="6"></line>
          <path d="M16 10a4 4 0 0 1-8 0"></path>
        </svg>
        <span id="sneaks-cart-count" class="sneaks-cart-badge" style="display:none">0</span>
      </div>

      <!-- Backdrop Overlay -->
      <div id="sneaks-modal-overlay" class="sneaks-modal-overlay"></div>

      <!-- Cart Drawer -->
      <div id="sneaks-cart-drawer" class="sneaks-cart-drawer">
        <div class="sneaks-drawer-header">
          <h3 class="sneaks-drawer-title">Shopping Cart</h3>
          <button id="sneaks-cart-close" class="sneaks-close-btn">&times;</button>
        </div>
        <div id="sneaks-cart-items-body" class="sneaks-drawer-body"></div>
        <div id="sneaks-cart-footer" class="sneaks-drawer-footer">
          <div class="sneaks-total-row">
            <span class="sneaks-total-label">Subtotal</span>
            <span id="sneaks-cart-total-price" class="sneaks-total-amount">$0.00</span>
          </div>
          <button id="sneaks-cart-buy-now-btn" class="sneaks-buy-now-btn">
            Buy Now
          </button>
        </div>
      </div>

      <!-- Checkout Modal -->
      <div id="sneaks-checkout-modal" class="sneaks-checkout-modal">
        <div class="sneaks-checkout-header">
          <h3 class="sneaks-checkout-title">Complete Your Order</h3>
          <button id="sneaks-checkout-close" class="sneaks-close-btn">&times;</button>
        </div>
        
        <div id="sneaks-checkout-content">
          <div class="sneaks-order-summary-box">
            <div id="sneaks-checkout-items-list"></div>
            <div class="sneaks-detail-row" style="border-top:1px solid #e0e0e0; margin-top:8px; padding-top:8px;">
              <span class="sneaks-detail-label">Total to Pay</span>
              <span id="sneaks-checkout-total" class="sneaks-detail-value" style="font-size:16px; color:#0051ff;">$0.00</span>
            </div>
          </div>

          <form id="sneaks-order-form" onsubmit="return false;">
            <div class="sneaks-form-group">
              <label class="sneaks-form-label" for="sneaks-cust-name">Full Name *</label>
              <input type="text" id="sneaks-cust-name" class="sneaks-form-input" placeholder="e.g. John Doe" required>
            </div>
            
            <div class="sneaks-form-group">
              <label class="sneaks-form-label" for="sneaks-cust-phone">Mobile Number *</label>
              <input type="tel" id="sneaks-cust-phone" class="sneaks-form-input" placeholder="e.g. 9876543210" required>
            </div>

            <div class="sneaks-form-group">
              <label class="sneaks-form-label" for="sneaks-cust-address">Delivery Address *</label>
              <input type="text" id="sneaks-cust-address" class="sneaks-form-input" placeholder="Street, City, Pincode" required>
            </div>

            <div class="sneaks-form-group">
              <label class="sneaks-form-label">Billing / Payment Option *</label>
              <div class="sneaks-billing-options">
                <label class="sneaks-billing-card selected">
                  <input type="radio" name="sneaks_billing_option" value="Cash on Delivery (COD)" checked>
                  <div class="sneaks-billing-text">
                    <p class="sneaks-billing-title">Cash on Delivery (COD)</p>
                    <p class="sneaks-billing-desc">Pay cash when your sneakers arrive at your doorstep</p>
                  </div>
                </label>

                <label class="sneaks-billing-card">
                  <input type="radio" name="sneaks_billing_option" value="UPI / Online Payment">
                  <div class="sneaks-billing-text">
                    <p class="sneaks-billing-title">UPI / QR Code / Online</p>
                    <p class="sneaks-billing-desc">Instant online payment via Google Pay, Apple Pay, or UPI</p>
                  </div>
                </label>

                <label class="sneaks-billing-card">
                  <input type="radio" name="sneaks_billing_option" value="Credit / Debit Card">
                  <div class="sneaks-billing-text">
                    <p class="sneaks-billing-title">Credit / Debit Card</p>
                    <p class="sneaks-billing-desc">Visa, Mastercard, Amex accepted securely</p>
                  </div>
                </label>
              </div>
            </div>

            <div id="sneaks-form-error" style="color:#ef4444; font-size:13px; font-weight:600; display:none; margin-bottom:12px;"></div>

            <button type="submit" id="sneaks-submit-order-btn" class="sneaks-place-order-btn">
              Place Order
            </button>
          </form>
        </div>

        <div id="sneaks-order-success-screen" class="sneaks-order-success" style="display:none;">
          <div class="sneaks-success-icon">✓</div>
          <h2 class="sneaks-success-title">Order Placed Successfully! 🎉</h2>
          <p class="sneaks-success-sub">Thank you, <strong id="sneaks-success-cust-name"></strong>! Your sneakers are confirmed and will be delivered shortly.</p>
          
          <div class="sneaks-order-details-card">
            <div class="sneaks-detail-row">
              <span class="sneaks-detail-label">Order ID</span>
              <span id="sneaks-success-order-id" class="sneaks-detail-value"></span>
            </div>
            <div class="sneaks-detail-row">
              <span class="sneaks-detail-label">Contact Number</span>
              <span id="sneaks-success-phone" class="sneaks-detail-value"></span>
            </div>
            <div class="sneaks-detail-row">
              <span class="sneaks-detail-label">Payment Method</span>
              <span id="sneaks-success-payment" class="sneaks-detail-value"></span>
            </div>
            <div class="sneaks-detail-row">
              <span class="sneaks-detail-label">Delivery Address</span>
              <span id="sneaks-success-address" class="sneaks-detail-value"></span>
            </div>
            <div class="sneaks-detail-row" style="border-top:1px solid #e0e0e0; margin-top:8px; padding-top:8px;">
              <span class="sneaks-detail-label">Total Amount</span>
              <span id="sneaks-success-total" class="sneaks-detail-value" style="color:#0051ff; font-size:15px;"></span>
            </div>
          </div>

          <button id="sneaks-continue-shopping-btn" class="sneaks-place-order-btn" style="background-color:#0051ff;">
            Continue Shopping
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(root);

    // Event listeners for Cart and Modal controls
    const overlay = document.getElementById('sneaks-modal-overlay');

    document.getElementById('sneaks-floating-cart-btn').addEventListener('click', openCartDrawer);
    document.getElementById('sneaks-cart-close').addEventListener('click', closeAllModals);
    document.getElementById('sneaks-checkout-close').addEventListener('click', closeAllModals);
    overlay.addEventListener('click', closeAllModals);

    document.getElementById('sneaks-cart-buy-now-btn').addEventListener('click', () => {
      const items = Cart.get();
      if (items.length === 0) {
        alert('Your cart is empty! Add some shoes first.');
        return;
      }
      openCheckout(items);
    });

    document.querySelectorAll('.sneaks-billing-card').forEach(card => {
      card.addEventListener('click', () => {
        document.querySelectorAll('.sneaks-billing-card').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        const radio = card.querySelector('input[type="radio"]');
        if (radio) radio.checked = true;
      });
    });

    document.getElementById('sneaks-order-form').addEventListener('submit', (e) => {
      e.preventDefault();
      handlePlaceOrder();
    });
    document.getElementById('sneaks-submit-order-btn').addEventListener('click', (e) => {
      e.preventDefault();
      handlePlaceOrder();
    });

    document.getElementById('sneaks-continue-shopping-btn').addEventListener('click', closeAllModals);

    updateCartBadge();
    renderCartDrawer();
  }

  function updateCartBadge() {
    const badge = document.getElementById('sneaks-cart-count');
    if (!badge) return;
    const count = Cart.count();
    if (count > 0) {
      badge.textContent = count;
      badge.style.display = 'flex';
    } else {
      badge.style.display = 'none';
    }
  }

  function renderCartDrawer() {
    const body = document.getElementById('sneaks-cart-items-body');
    const totalEl = document.getElementById('sneaks-cart-total-price');
    if (!body || !totalEl) return;

    const items = Cart.get();
    totalEl.textContent = `$${Cart.total().toFixed(2)}`;

    if (items.length === 0) {
      body.innerHTML = `
        <div style="text-align:center; padding:60px 20px; color:#888;">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ccc" stroke-width="1.5" style="margin-bottom:12px;">
            <circle cx="9" cy="21" r="1"></circle>
            <circle cx="20" cy="21" r="1"></circle>
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
          </svg>
          <p style="font-size:16px; font-weight:600; color:#333; margin:0 0 6px 0;">Your cart is empty</p>
          <p style="font-size:13px; margin:0;">Explore our Nike & Adidas collections and add your favorite pairs!</p>
        </div>
      `;
      return;
    }

    body.innerHTML = items.map((item, idx) => `
      <div class="sneaks-cart-item">
        <img class="sneaks-cart-item-img" src="${item.image || '/images/tLkFVh9iw2i4EHESvqYIcb2Ng.png'}" alt="${item.title}">
        <div class="sneaks-cart-item-info">
          <p class="sneaks-cart-item-name">${item.title}</p>
          <p class="sneaks-cart-item-size">Size: <strong>${item.size || 'UK 07'}</strong></p>
          <p class="sneaks-cart-item-price">${item.price}</p>
          <div class="sneaks-qty-ctrl">
            <button class="sneaks-qty-btn" onclick="window.sneaksUpdateQty(${idx}, -1)">-</button>
            <span class="sneaks-qty-num">${item.quantity || 1}</span>
            <button class="sneaks-qty-btn" onclick="window.sneaksUpdateQty(${idx}, 1)">+</button>
            <button class="sneaks-remove-btn" onclick="window.sneaksRemoveCartItem(${idx})">Remove</button>
          </div>
        </div>
      </div>
    `).join('');
  }

  window.sneaksUpdateQty = function (idx, delta) {
    Cart.updateQty(idx, delta);
  };
  window.sneaksRemoveCartItem = function (idx) {
    Cart.remove(idx);
  };

  function openCartDrawer() {
    closeAllModals();
    renderCartDrawer();
    document.getElementById('sneaks-modal-overlay').classList.add('active');
    document.getElementById('sneaks-cart-drawer').classList.add('active');
  }

  function openCheckout(items) {
    currentCheckoutItems = Array.isArray(items) ? items : [items];
    closeAllModals();

    const overlay = document.getElementById('sneaks-modal-overlay');
    const modal = document.getElementById('sneaks-checkout-modal');
    const itemsList = document.getElementById('sneaks-checkout-items-list');
    const totalEl = document.getElementById('sneaks-checkout-total');
    const formContent = document.getElementById('sneaks-checkout-content');
    const successScreen = document.getElementById('sneaks-order-success-screen');
    const errBox = document.getElementById('sneaks-form-error');

    formContent.style.display = 'block';
    successScreen.style.display = 'none';
    if (errBox) errBox.style.display = 'none';

    let total = 0;
    itemsList.innerHTML = currentCheckoutItems.map(item => {
      const p = parseFloat(String(item.price).replace(/[^0-9.]/g, '')) || 0;
      total += p * (item.quantity || 1);
      return `
        <div class="sneaks-summary-item">
          <img class="sneaks-summary-img" src="${item.image || '/images/tLkFVh9iw2i4EHESvqYIcb2Ng.png'}" alt="${item.title}">
          <div style="flex:1;">
            <div style="font-weight:700; font-size:14px; color:#111;">${item.title}</div>
            <div style="font-size:12px; color:#666;">Size: <strong>${item.size || 'UK 07'}</strong> • Qty: ${item.quantity || 1}</div>
          </div>
          <div style="font-weight:700; font-size:14px; color:#111;">${item.price}</div>
        </div>
      `;
    }).join('');

    totalEl.textContent = `$${total.toFixed(2)}`;
    document.getElementById('sneaks-submit-order-btn').textContent = `Place Order • $${total.toFixed(2)}`;

    overlay.classList.add('active');
    modal.classList.add('active');
    setTimeout(() => {
      document.getElementById('sneaks-cust-name')?.focus();
    }, 120);
  }

  // Keyboard accessibility: ESC key closes modals & drawer
  window.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      closeAllModals();
    }
  });

  function handlePlaceOrder() {
    const nameInput = document.getElementById('sneaks-cust-name');
    const phoneInput = document.getElementById('sneaks-cust-phone');
    const addrInput = document.getElementById('sneaks-cust-address');
    const errBox = document.getElementById('sneaks-form-error');

    const name = nameInput.value.trim();
    const phone = phoneInput.value.trim();
    const address = addrInput.value.trim();

    if (!name) {
      errBox.textContent = 'Please enter your full name.';
      errBox.style.display = 'block';
      nameInput.focus();
      return;
    }
    if (!phone || phone.length < 6) {
      errBox.textContent = 'Please enter a valid mobile number.';
      errBox.style.display = 'block';
      phoneInput.focus();
      return;
    }
    if (!address) {
      errBox.textContent = 'Please enter your delivery address.';
      errBox.style.display = 'block';
      addrInput.focus();
      return;
    }

    errBox.style.display = 'none';

    const checkedRadio = document.querySelector('input[name="sneaks_billing_option"]:checked');
    const billingMethod = checkedRadio ? checkedRadio.value : 'Cash on Delivery (COD)';

    const orderId = '#SNK-' + Math.floor(100000 + Math.random() * 900000);
    let total = 0;
    currentCheckoutItems.forEach(i => {
      const p = parseFloat(String(i.price).replace(/[^0-9.]/g, '')) || 0;
      total += p * (i.quantity || 1);
    });

    const orderRecord = {
      orderId,
      customerName: name,
      phone,
      address,
      billingMethod,
      items: currentCheckoutItems,
      total: `$${total.toFixed(2)}`,
      timestamp: new Date().toISOString()
    };

    try {
      const pastOrders = JSON.parse(localStorage.getItem('sneaks_orders') || '[]');
      pastOrders.unshift(orderRecord);
      localStorage.setItem('sneaks_orders', JSON.stringify(pastOrders));
    } catch {}

    Cart.clear();

    document.getElementById('sneaks-checkout-content').style.display = 'none';
    const successScreen = document.getElementById('sneaks-order-success-screen');
    document.getElementById('sneaks-success-cust-name').textContent = name;
    document.getElementById('sneaks-success-order-id').textContent = orderId;
    document.getElementById('sneaks-success-phone').textContent = phone;
    document.getElementById('sneaks-success-payment').textContent = billingMethod;
    document.getElementById('sneaks-success-address').textContent = address;
    document.getElementById('sneaks-success-total').textContent = `$${total.toFixed(2)}`;

    successScreen.style.display = 'block';
  }

  function closeAllModals() {
    const overlay = document.getElementById('sneaks-modal-overlay');
    const drawer = document.getElementById('sneaks-cart-drawer');
    const checkoutModal = document.getElementById('sneaks-checkout-modal');
    if (overlay) overlay.classList.remove('active');
    if (drawer) drawer.classList.remove('active');
    if (checkoutModal) checkoutModal.classList.remove('active');
  }

  function showToast(item) {
    const existing = document.querySelector('.sneaks-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = 'sneaks-toast';
    toast.innerHTML = `
      <img class="sneaks-toast-img" src="${item.image || '/images/tLkFVh9iw2i4EHESvqYIcb2Ng.png'}" alt="${item.title}">
      <div class="sneaks-toast-content">
        <p class="sneaks-toast-title">Added to Cart! 👟</p>
        <p class="sneaks-toast-sub">${item.title} (${item.size || 'UK 07'}) • ${item.price}</p>
      </div>
      <button class="sneaks-toast-view-btn">View Cart</button>
    `;

    toast.querySelector('.sneaks-toast-view-btn').addEventListener('click', () => {
      toast.remove();
      openCartDrawer();
    });

    document.body.appendChild(toast);

    setTimeout(() => {
      if (toast && toast.parentNode) {
        toast.style.transition = 'opacity 0.3s, transform 0.3s';
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(-20px)';
        setTimeout(() => toast.remove(), 300);
      }
    }, 3500);
  }

  // 7. PRODUCT DETAIL SHOE IMAGE ZOOM LENS
  function initProductImageZoom() {
    const container = document.querySelector('.framer-smgyi7-container') ||
                      document.querySelector('[data-framer-name="Image"] .framer-smgyi7-container') ||
                      document.querySelector('[data-framer-name="Image"]');

    if (!container) return;

    const img = container.querySelector('img');
    if (!img) return;

    container.classList.add('sneaks-zoom-wrapper');
    container.style.position = 'relative';
    container.style.cursor = 'crosshair';

    let lens = container.querySelector('#sneaks-zoom-lens');
    if (!lens) {
      lens = document.createElement('div');
      lens.id = 'sneaks-zoom-lens';
      lens.className = 'sneaks-zoom-lens';
      container.appendChild(lens);
    }

    const LENS_SIZE = 280;
    const ZOOM_FACTOR = 2.2;

    function updateLensImage() {
      const src = img.currentSrc || img.src;
      if (src) {
        lens.style.backgroundImage = `url("${src}")`;
      }
    }

    updateLensImage();

    let isHovering = false;
    let raf = null;

    if (!container.dataset.sneaksZoomBound) {
      container.dataset.sneaksZoomBound = 'true';

      container.addEventListener('mouseenter', () => {
        isHovering = true;
        updateLensImage();
        lens.classList.add('active');
      });

      container.addEventListener('mouseleave', () => {
        isHovering = false;
        lens.classList.remove('active');
      });

      container.addEventListener('mousemove', (e) => {
        if (!isHovering) return;
        if (raf) cancelAnimationFrame(raf);

        raf = requestAnimationFrame(() => {
          const rect = container.getBoundingClientRect();
          const mouseX = e.clientX - rect.left;
          const mouseY = e.clientY - rect.top;

          const lensLeft = mouseX - LENS_SIZE / 2;
          const lensTop = mouseY - LENS_SIZE / 2;

          lens.style.left = `${lensLeft}px`;
          lens.style.top = `${lensTop}px`;

          const percentX = Math.max(0, Math.min(100, (mouseX / rect.width) * 100));
          const percentY = Math.max(0, Math.min(100, (mouseY / rect.height) * 100));

          lens.style.backgroundSize = `${rect.width * ZOOM_FACTOR}px ${rect.height * ZOOM_FACTOR}px`;
          lens.style.backgroundPosition = `${percentX}% ${percentY}%`;
        });
      });
    }

    // Connect angle thumbnails on the left
    const thumbnails = document.querySelectorAll(
      '.framer-utmusv-container, .framer-10icu31-container, .framer-1n3l2cd-container, .framer-1wg8gcd-container'
    );

    thumbnails.forEach(thumb => {
      const thumbImg = thumb.querySelector('img');
      if (!thumbImg) return;

      thumb.style.cursor = 'pointer';

      if (!thumb.dataset.sneaksBound) {
        thumb.dataset.sneaksBound = 'true';
        thumb.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();

          img.src = thumbImg.src;
          if (img.srcset) img.srcset = thumbImg.src;
          updateLensImage();

          thumbnails.forEach(t => {
            const card = t.querySelector('.framer-Y8FLm') || t;
            card.style.outline = 'none';
            card.style.opacity = '0.65';
          });
          const activeCard = thumb.querySelector('.framer-Y8FLm') || thumb;
          activeCard.style.outline = '2px solid #000000';
          activeCard.style.opacity = '1';
          activeCard.style.borderRadius = '16px';
        });
      }
    });
  }

  // 8. BRAND SPELLING CORRECTION ("Sneaks" -> "Sneakers" & "SNEAKERS")
  function correctBrandSpelling() {
    // Correct visible text nodes
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);
    let node;
    while ((node = walker.nextNode())) {
      if (node.nodeValue && node.nodeValue.includes('Sneaks')) {
        node.nodeValue = node.nodeValue
          .replace(/Sneaks Framer/g, 'Sneakers')
          .replace(/Sneaks-Framer/g, 'Sneakers')
          .replace(/The Sneaks/g, 'The Sneakers')
          .replace(/Sneaks/g, 'Sneakers');
      }
    }

    // Ensure footer Large Heading spells S-N-E-A-K-E-R-S
    const heading = document.querySelector('[data-framer-name="Large Heading"]');
    if (heading) {
      const svgs = heading.querySelectorAll('svg');
      if (svgs.length === 6) {
        const svgE = svgs[2].cloneNode(true);
        svgE.style.transform = 'translateY(50px)';

        const svgR = svgs[3].cloneNode(true);
        svgR.style.transform = 'translateY(-50px)';
        const pR = svgR.querySelector('p');
        if (pR) pR.textContent = 'r';

        heading.insertBefore(svgE, svgs[5]);
        heading.insertBefore(svgR, svgs[5]);
      }
    }
  }

  // 9. INITIALIZATION & REPAIR OBSERVER
  function init() {
    injectShopUI();
    renderSelectedSize();
    injectCleanPlusButtons();
    initProductImageZoom();
    correctBrandSpelling();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  const observer = new MutationObserver(() => {
    renderSelectedSize();
    injectCleanPlusButtons();
    initProductImageZoom();
    correctBrandSpelling();
  });

  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
    attributes: false
  });

  setTimeout(init, 300);
  setTimeout(init, 800);
  setTimeout(init, 1800);

})();
