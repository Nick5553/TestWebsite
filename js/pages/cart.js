/**
 * Cart page: change quantities, remove items, see totals.
 * The whole view re-renders on "cart:change"; focus is restored to the
 * control the user was on so keyboard use isn't interrupted.
 */
(function () {
  const root = document.getElementById('cart-root');

  function lineHtml(line) {
    const { product, qty } = line;
    const name = UI.escapeHtml(product.name);
    const url = UI.productUrl(product);
    return `
      <li class="cart-item" data-testid="cart-item" data-product-id="${product.id}">
        <a class="cart-item-media" href="${url}" tabindex="-1" aria-hidden="true">
          <img src="${product.image}" alt="${name}" width="96" height="72">
        </a>
        <div class="cart-item-info">
          <a class="cart-item-name" href="${url}" data-testid="cart-item-name">${name}</a>
          <p class="muted small">
            ${UI.formatPrice(line.unitPrice)} each
            ${Products.isOnSale(product) ? '<span class="badge badge-sale">Sale</span>' : ''}
          </p>
        </div>
        <div class="qty" role="group" aria-label="Quantity for ${name}">
          <button type="button" data-action="decrease" data-id="${product.id}" data-testid="cart-qty-decrease"
            aria-label="Decrease quantity of ${name}" ${qty <= 1 ? 'disabled' : ''}>−</button>
          <input type="number" inputmode="numeric" min="1" max="${product.stock}" value="${qty}"
            data-action="set-qty" data-id="${product.id}" data-testid="cart-qty-input" aria-label="Quantity of ${name}">
          <button type="button" data-action="increase" data-id="${product.id}" data-testid="cart-qty-increase"
            aria-label="Increase quantity of ${name}" ${qty >= product.stock ? 'disabled' : ''}>+</button>
        </div>
        <p class="cart-item-total" data-testid="cart-line-total">${UI.formatPrice(line.lineTotal)}</p>
        <button type="button" class="icon-btn" data-action="remove" data-id="${product.id}" data-testid="remove-item"
          aria-label="Remove ${name} from cart">${UI.ICONS.trash}</button>
      </li>`;
  }

  function render() {
    const lines = Cart.detailed();

    if (lines.length === 0) {
      root.innerHTML = `
        <div class="empty-state" data-testid="cart-empty">
          <div class="empty-state-icon" aria-hidden="true">🛒</div>
          <h2>Your cart is empty</h2>
          <p>Find something you like and it will show up here.</p>
          <a class="btn btn-primary" href="products.html">Browse products</a>
        </div>`;
      return;
    }

    root.innerHTML = `
      <div class="cart-layout">
        <section aria-label="Cart items">
          <ul class="cart-list" data-testid="cart-items">${lines.map(lineHtml).join('')}</ul>
          <button type="button" class="btn btn-ghost btn-sm" data-action="clear" data-testid="clear-cart">Clear cart</button>
        </section>
        <aside class="card order-summary" aria-labelledby="summary-title" data-testid="cart-summary">
          <h2 id="summary-title">Order summary</h2>
          ${UI.totalsHtml(Cart.totals(), 'cart')}
          <a class="btn btn-primary btn-lg btn-block" href="checkout.html" data-testid="checkout-button">Checkout</a>
          <a class="btn btn-ghost btn-block" href="products.html">Continue shopping</a>
        </aside>
      </div>`;
  }

  /** Re-render, then put focus back on the same control (or a sensible fallback). */
  function renderKeepingFocus() {
    const active = document.activeElement;
    const testId = active?.dataset?.testid;
    const productId = active?.dataset?.id;

    render();

    if (!testId || !productId) return;
    const same = root.querySelector(`[data-testid="${testId}"][data-id="${productId}"]`);
    const fallback = root.querySelector(`[data-testid="cart-qty-input"][data-id="${productId}"]`);
    const target = same && !same.disabled ? same : fallback;
    (target || document.getElementById('main')).focus();
  }

  root.addEventListener('click', event => {
    const button = event.target.closest('button[data-action]');
    if (!button) return;
    const { action, id } = button.dataset;
    const line = Cart.detailed().find(item => item.id === id);

    if (action === 'increase' && line) Cart.setQty(id, line.qty + 1);
    if (action === 'decrease' && line) Cart.setQty(id, line.qty - 1);
    if (action === 'remove' && line) {
      Cart.remove(id);
      UI.toast(`Removed ${line.product.name} from your cart.`);
    }
    if (action === 'clear') Cart.clear();
  });

  root.addEventListener('change', event => {
    const input = event.target.closest('input[data-action="set-qty"]');
    if (input) Cart.setQty(input.dataset.id, input.value);
  });

  document.addEventListener('cart:change', renderKeepingFocus);

  render();
})();
