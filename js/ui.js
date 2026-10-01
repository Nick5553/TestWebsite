/**
 * ui.js — shared UI used by every page:
 *   - injects the header and footer (so they aren't duplicated in each HTML file)
 *   - keeps the cart badge and "Logged in as ..." indicator in sync
 *   - toasts, product card markup, price/rating formatting, form helpers
 *
 * Loaded after storage.js, products.js, cart.js, auth.js and orders.js,
 * and before the page's own script in js/pages/.
 */
const UI = (() => {
  const STORE_NAME = 'Nova Store';
  const FLASH_KEY = 'novaStore.flash';
  const currency = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

  const NAV_LINKS = [
    { page: 'home', href: 'index.html', label: 'Home' },
    { page: 'products', href: 'products.html', label: 'Products' },
  ];

  const ICONS = {
    cart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="9" cy="20" r="1.5"/><circle cx="18" cy="20" r="1.5"/><path d="M2 3h3l2.7 12.4a2 2 0 0 0 2 1.6h8.6a2 2 0 0 0 2-1.5L22 7H6"/></svg>',
    trash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 11v6M14 11v6"/></svg>',
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>',
  };

  /* ------------------------------------------------------------------ */
  /* Formatting helpers                                                  */
  /* ------------------------------------------------------------------ */

  function formatPrice(amount) {
    return currency.format(amount);
  }

  function escapeHtml(value) {
    const entities = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
    return String(value).replace(/[&<>"']/g, char => entities[char]);
  }

  function getParam(name) {
    return new URLSearchParams(window.location.search).get(name);
  }

  function productUrl(product) {
    return `product.html?id=${encodeURIComponent(product.id)}`;
  }

  /* ------------------------------------------------------------------ */
  /* Reusable markup                                                     */
  /* ------------------------------------------------------------------ */

  function priceHtml(product, { large = false } = {}) {
    const onSale = Products.isOnSale(product);
    const classes = ['price', onSale ? 'is-sale' : '', large ? 'price-lg' : ''].filter(Boolean).join(' ');
    return `
      <span class="${classes}" data-testid="product-price">
        ${onSale ? '<span class="sr-only">Sale price:</span>' : ''}
        <span class="price-current">${formatPrice(Products.priceOf(product))}</span>
        ${onSale ? `<span class="sr-only">Regular price:</span><s class="price-original">${formatPrice(product.price)}</s>` : ''}
      </span>`;
  }

  function ratingHtml(rating) {
    return `
      <span class="rating" role="img" aria-label="Rated ${rating} out of 5">
        <span class="rating-stars" style="--rating: ${rating}" aria-hidden="true">★★★★★</span>
        <span class="rating-value" aria-hidden="true">${rating.toFixed(1)}</span>
      </span>`;
  }

  function badgesHtml(product) {
    const badges = [];
    if (Products.isOnSale(product)) {
      const percentOff = Math.round((1 - product.salePrice / product.price) * 100);
      badges.push(`<span class="badge badge-sale" data-testid="sale-badge">Sale −${percentOff}%</span>`);
    }
    if (!Products.isInStock(product)) {
      badges.push('<span class="badge badge-out" data-testid="out-of-stock-badge">Out of stock</span>');
    }
    return badges.length ? `<span class="badge-stack">${badges.join('')}</span>` : '';
  }

  function productCard(product) {
    const url = productUrl(product);
    const inStock = Products.isInStock(product);
    const category = Products.category(product.category);
    const name = escapeHtml(product.name);

    return `
      <article class="card product-card${inStock ? '' : ' is-out-of-stock'}" data-testid="product-card" data-product-id="${product.id}">
        <a class="product-card-media" href="${url}" tabindex="-1" aria-hidden="true">
          <img src="${product.image}" alt="${name}" width="400" height="300" loading="lazy">
          ${badgesHtml(product)}
        </a>
        <div class="product-card-body">
          <p class="product-card-category">${category ? category.name : ''}</p>
          <h3 class="product-card-title"><a href="${url}" data-testid="product-link">${name}</a></h3>
          ${ratingHtml(product.rating)}
          <div class="product-card-footer">
            ${priceHtml(product)}
            <button type="button" class="btn btn-secondary btn-sm"
              data-action="quick-add" data-product-id="${product.id}" data-testid="card-add-to-cart"
              aria-label="Add ${name} to cart" ${inStock ? '' : 'disabled'}>
              ${inStock ? 'Add' : 'Sold out'}
            </button>
          </div>
        </div>
      </article>`;
  }

  /** Subtotal / tax / total list. prefix sets the data-testids, e.g. "cart-total". */
  function totalsHtml(totals, prefix) {
    return `
      <dl class="totals">
        <div class="totals-row"><dt>Subtotal</dt><dd data-testid="${prefix}-subtotal">${formatPrice(totals.subtotal)}</dd></div>
        <div class="totals-row"><dt>Tax (${Math.round(totals.taxRate * 100)}%)</dt><dd data-testid="${prefix}-tax">${formatPrice(totals.tax)}</dd></div>
        <div class="totals-row"><dt>Shipping</dt><dd>Free</dd></div>
        <div class="totals-row totals-row-total"><dt>Total</dt><dd data-testid="${prefix}-total">${formatPrice(totals.total)}</dd></div>
      </dl>`;
  }

  /* ------------------------------------------------------------------ */
  /* Header & footer                                                     */
  /* ------------------------------------------------------------------ */

  function renderHeader() {
    const header = document.getElementById('site-header');
    if (!header) return;

    const currentPage = document.body.dataset.page;
    const ariaCurrent = page => (page === currentPage ? ' aria-current="page"' : '');
    const count = Cart.count();

    const navItems = NAV_LINKS.map(link =>
      `<li><a href="${link.href}" data-testid="nav-${link.page}"${ariaCurrent(link.page)}>${link.label}</a></li>`
    ).join('');

    header.innerHTML = `
      <a class="skip-link" href="#main">Skip to content</a>
      <div class="container header-inner">
        <a class="logo" href="index.html" data-testid="logo">
          <span class="logo-mark" aria-hidden="true"></span>${STORE_NAME}
        </a>
        <nav class="site-nav" id="site-nav" aria-label="Main" data-testid="site-nav">
          <ul class="nav-list">
            ${navItems}
            <li><a href="login.html" class="user-indicator" data-testid="user-indicator"${ariaCurrent('login')}></a></li>
          </ul>
        </nav>
        <div class="header-actions">
          <a class="cart-link" href="cart.html" data-testid="cart-link"${ariaCurrent('cart')}>
            ${ICONS.cart}
            <span class="cart-link-label">Cart</span><span class="sr-only cart-count-label"></span>
            <span class="cart-badge${count === 0 ? ' is-empty' : ''}" data-testid="cart-badge" aria-hidden="true">${count}</span>
          </a>
          <button type="button" class="nav-toggle" aria-expanded="false" aria-controls="site-nav" data-testid="nav-toggle">
            <span class="sr-only">Menu</span>
            <span class="nav-toggle-icon" aria-hidden="true"></span>
          </button>
        </div>
      </div>`;

    const toggle = header.querySelector('.nav-toggle');
    const nav = header.querySelector('.site-nav');
    const setOpen = open => {
      toggle.setAttribute('aria-expanded', String(open));
      nav.classList.toggle('is-open', open);
    };
    toggle.addEventListener('click', () => setOpen(!nav.classList.contains('is-open')));
    header.addEventListener('keydown', event => {
      if (event.key === 'Escape' && nav.classList.contains('is-open')) {
        setOpen(false);
        toggle.focus();
      }
    });
  }

  function renderFooter() {
    const footer = document.getElementById('site-footer');
    if (!footer) return;

    const categoryLinks = Products.categories
      .map(category => `<li><a href="products.html?category=${category.id}">${category.name}</a></li>`)
      .join('');

    footer.innerHTML = `
      <div class="container footer-inner">
        <div class="footer-brand">
          <a class="logo" href="index.html"><span class="logo-mark" aria-hidden="true"></span>${STORE_NAME}</a>
          <p>A fake online store for testing and experiments. Nothing here is real, and no payments are ever processed.</p>
        </div>
        <nav class="footer-nav" aria-label="Shop categories">
          <h2 class="footer-heading">Shop</h2>
          <ul>${categoryLinks}</ul>
        </nav>
        <nav class="footer-nav" aria-label="Account and help">
          <h2 class="footer-heading">Account</h2>
          <ul>
            <li><a href="login.html">Log in / Register</a></li>
            <li><a href="cart.html">Cart</a></li>
            <li><a href="404.html">404 page</a></li>
          </ul>
        </nav>
      </div>
      <div class="container footer-bottom">
        <p>© ${new Date().getFullYear()} ${STORE_NAME} · Demo project, no real orders.</p>
        <a href="#" class="reset-link" data-testid="reset-demo-data">Reset demo data</a>
      </div>`;
  }

  /* ------------------------------------------------------------------ */
  /* Live indicators                                                     */
  /* ------------------------------------------------------------------ */

  function updateCartBadge() {
    const count = Cart.count();
    document.querySelectorAll('[data-testid="cart-badge"]').forEach(badge => {
      if (badge.textContent === String(count)) return;
      badge.textContent = String(count);
      badge.classList.toggle('is-empty', count === 0);
      // Restart the "bump" animation.
      badge.classList.remove('is-bumped');
      void badge.offsetWidth;
      badge.classList.add('is-bumped');
    });
    const label = document.querySelector('.cart-count-label');
    if (label) label.textContent = `, ${count} ${count === 1 ? 'item' : 'items'}`;
  }

  function updateUserIndicator() {
    const user = Auth.current();
    document.querySelectorAll('[data-testid="user-indicator"]').forEach(link => {
      link.dataset.state = user ? 'logged-in' : 'logged-out';
      link.innerHTML = user
        ? `<span class="user-indicator-prefix">Logged in as</span> <strong data-testid="user-name">${escapeHtml(user.name)}</strong>`
        : 'Log in';
    });
  }

  /* ------------------------------------------------------------------ */
  /* Toasts & flash messages                                             */
  /* ------------------------------------------------------------------ */

  function toastRegion() {
    let region = document.getElementById('toast-region');
    if (!region) {
      region = document.createElement('div');
      region.id = 'toast-region';
      region.className = 'toast-region';
      region.setAttribute('role', 'status');
      region.setAttribute('aria-live', 'polite');
      region.dataset.testid = 'toast-region';
      document.body.appendChild(region);
    }
    return region;
  }

  /** Shows a short message. type: "info" | "success" | "error". action: { href, label } */
  function toast(message, { type = 'info', action = null, duration = 3500 } = {}) {
    const el = document.createElement('div');
    el.className = `toast toast-${type}`;
    el.dataset.testid = 'toast';
    el.innerHTML = `<span>${escapeHtml(message)}</span>${
      action ? `<a href="${action.href}">${escapeHtml(action.label)}</a>` : ''
    }`;
    toastRegion().appendChild(el);
    requestAnimationFrame(() => el.classList.add('is-visible'));
    setTimeout(() => {
      el.classList.remove('is-visible');
      setTimeout(() => el.remove(), 300);
    }, duration);
  }

  /** Queues a toast to show on the next page load (e.g. after a redirect). */
  function flash(message, type = 'success') {
    try {
      sessionStorage.setItem(FLASH_KEY, JSON.stringify({ message, type }));
    } catch (error) { /* storage unavailable: skip the message */ }
  }

  function showFlash() {
    try {
      const raw = sessionStorage.getItem(FLASH_KEY);
      if (!raw) return;
      sessionStorage.removeItem(FLASH_KEY);
      const { message, type } = JSON.parse(raw);
      toast(message, { type });
    } catch (error) { /* ignore */ }
  }

  /* ------------------------------------------------------------------ */
  /* Form helpers                                                        */
  /* ------------------------------------------------------------------ */

  const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  function isValidEmail(value) {
    return EMAIL_PATTERN.test(String(value).trim());
  }

  /**
   * Shows (or clears, with an empty message) the error for an input.
   * Expects an element with id "<input id>-error" inside the same .field.
   */
  function setFieldError(input, message) {
    const errorEl = document.getElementById(`${input.id}-error`);
    const field = input.closest('.field');
    input.setAttribute('aria-invalid', message ? 'true' : 'false');
    if (field) field.classList.toggle('has-error', Boolean(message));
    if (errorEl) {
      errorEl.textContent = message || '';
      errorEl.hidden = !message;
    }
  }

  /* ------------------------------------------------------------------ */
  /* Global events                                                       */
  /* ------------------------------------------------------------------ */

  function handleQuickAdd(button) {
    const result = Cart.add(button.dataset.productId, 1);
    if (result.ok) {
      toast(`Added ${result.product.name} to your cart.`, { type: 'success', action: { href: 'cart.html', label: 'View cart' } });
    } else {
      toast(result.message, { type: 'error' });
    }
  }

  function bindGlobalEvents() {
    document.addEventListener('click', event => {
      const quickAdd = event.target.closest('[data-action="quick-add"]');
      if (quickAdd) {
        handleQuickAdd(quickAdd);
        return;
      }
      if (event.target.closest('[data-testid="reset-demo-data"]')) {
        event.preventDefault();
        AppStorage.clearAll();
        flash('Demo data reset. Cart, orders, and accounts were cleared.', 'info');
        window.location.reload();
      }
    });

    document.addEventListener('cart:change', updateCartBadge);
    document.addEventListener('auth:change', updateUserIndicator);

    // Keep other open tabs in sync.
    window.addEventListener('storage', event => {
      if (event.key && !event.key.startsWith(AppStorage.PREFIX)) return;
      document.dispatchEvent(new CustomEvent('cart:change'));
      document.dispatchEvent(new CustomEvent('auth:change'));
    });
  }

  function init() {
    renderHeader();
    renderFooter();
    toastRegion();
    updateCartBadge();
    updateUserIndicator();
    bindGlobalEvents();
    showFlash();
  }

  init();

  return {
    ICONS,
    formatPrice,
    escapeHtml,
    getParam,
    productUrl,
    priceHtml,
    ratingHtml,
    badgesHtml,
    productCard,
    totalsHtml,
    toast,
    flash,
    isValidEmail,
    setFieldError,
  };
})();
