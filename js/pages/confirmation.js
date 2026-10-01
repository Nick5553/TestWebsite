/** Order confirmation page: confirmation.html?order=<order id>. */
(function () {
  const root = document.getElementById('confirmation-root');
  const order = Orders.byId(UI.getParam('order'));
  const esc = UI.escapeHtml;

  if (!order) {
    root.innerHTML = `
      <div class="empty-state" data-testid="order-not-found">
        <div class="empty-state-icon" aria-hidden="true">📦</div>
        <h1>We couldn't find that order</h1>
        <p>The link may be wrong, or the demo data was reset.</p>
        <a class="btn btn-primary" href="products.html">Continue shopping</a>
      </div>`;
    return;
  }

  const firstName = order.customer.name.split(' ')[0];
  const placedAt = new Date(order.createdAt).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });

  const items = order.items.map(item => `
    <li class="summary-item summary-item-text">
      <span>${esc(item.name)}<span class="summary-item-qty">Qty ${item.qty} × ${UI.formatPrice(item.unitPrice)}</span></span>
      <span>${UI.formatPrice(item.lineTotal)}</span>
    </li>`).join('');

  root.innerHTML = `
    <section class="card confirmation" data-testid="order-confirmation" aria-labelledby="confirmation-title">
      <div class="confirmation-icon">${UI.ICONS.check}</div>
      <h1 id="confirmation-title">Thank you, ${esc(firstName)}!</h1>
      <p class="muted">Your order has been placed. Your order number is:</p>
      <p class="order-number" data-testid="order-number">${esc(order.id)}</p>
      <p class="muted small">Placed ${placedAt}. A (fake) confirmation email is on its way to ${esc(order.customer.email)}.</p>

      <div class="confirmation-details">
        <div>
          <h2 class="detail-heading">Items</h2>
          <ul class="summary-items">${items}</ul>
          ${UI.totalsHtml(order.totals, 'order')}
        </div>
        <div>
          <h2 class="detail-heading">Shipping to</h2>
          <address data-testid="order-address">
            ${esc(order.customer.name)}<br>
            ${esc(order.customer.address)}<br>
            ${esc(order.customer.city)} ${esc(order.customer.zip)}<br>
            ${esc(order.customer.country)}
          </address>
          <h2 class="detail-heading detail-heading-spaced">Payment</h2>
          <p class="muted" data-testid="order-payment">Card ending in ${esc(order.payment.cardLast4)}</p>
        </div>
      </div>

      <div class="confirmation-actions">
        <a class="btn btn-primary" href="products.html" data-testid="continue-shopping">Continue shopping</a>
        ${order.userEmail ? '<a class="btn btn-secondary" href="login.html">View order history</a>' : ''}
      </div>
    </section>`;
})();
