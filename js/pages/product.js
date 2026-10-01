/**
 * Product detail page: product.html?id=<product id>.
 * Unknown ids redirect to 404.html.
 */
(function () {
  const product = Products.byId(UI.getParam('id'));
  if (!product) {
    window.location.replace('404.html');
    return;
  }

  const root = document.getElementById('product-root');
  const category = Products.category(product.category);
  const inStock = Products.isInStock(product);
  const name = UI.escapeHtml(product.name);

  document.title = `${product.name} · Nova Store`;

  function stockHtml() {
    if (!inStock) return '<p class="stock stock-out" data-testid="stock-status">Out of stock</p>';
    if (product.stock <= 5) return `<p class="stock stock-low" data-testid="stock-status">Only ${product.stock} left</p>`;
    return '<p class="stock stock-in" data-testid="stock-status">In stock</p>';
  }

  root.innerHTML = `
    <nav class="breadcrumb" aria-label="Breadcrumb">
      <ol>
        <li><a href="index.html">Home</a></li>
        <li><a href="products.html">Products</a></li>
        <li><a href="products.html?category=${category.id}">${category.name}</a></li>
        <li aria-current="page">${name}</li>
      </ol>
    </nav>

    <article class="product-detail" data-testid="product-detail" data-product-id="${product.id}">
      <div class="card product-detail-media">
        <img src="${product.image}" alt="${name}" width="800" height="600" data-testid="product-image">
        ${UI.badgesHtml(product)}
      </div>

      <div class="product-detail-info">
        <p class="eyebrow">${category.name}</p>
        <h1 data-testid="product-name">${name}</h1>
        <div class="product-detail-meta">
          ${UI.ratingHtml(product.rating)}
          ${stockHtml()}
        </div>
        ${UI.priceHtml(product, { large: true })}
        <p class="product-description" data-testid="product-description">${UI.escapeHtml(product.description)}</p>

        <form id="add-form" class="add-to-cart-form" data-testid="add-to-cart-form">
          <div class="field">
            <label for="qty">Quantity</label>
            <div class="qty">
              <button type="button" data-step="-1" aria-label="Decrease quantity" data-testid="qty-decrease" ${inStock ? '' : 'disabled'}>−</button>
              <input id="qty" name="qty" type="number" inputmode="numeric" min="1" max="${Math.max(product.stock, 1)}"
                value="1" data-testid="qty-input" ${inStock ? '' : 'disabled'}>
              <button type="button" data-step="1" aria-label="Increase quantity" data-testid="qty-increase" ${inStock ? '' : 'disabled'}>+</button>
            </div>
          </div>
          <button type="submit" class="btn btn-primary btn-lg" data-testid="add-to-cart" ${inStock ? '' : 'disabled'}>
            ${inStock ? 'Add to cart' : 'Out of stock'}
          </button>
        </form>

        <ul class="perks">
          <li>Free shipping on every (fake) order</li>
          <li>30-day returns, no questions asked</li>
          <li>2-year warranty</li>
        </ul>
      </div>
    </article>`;

  if (inStock) {
    const form = document.getElementById('add-form');
    const qtyInput = document.getElementById('qty');

    const clampQty = value => {
      const parsed = Math.floor(Number(value));
      return Math.min(Math.max(Number.isFinite(parsed) ? parsed : 1, 1), product.stock);
    };

    form.addEventListener('click', event => {
      const stepButton = event.target.closest('[data-step]');
      if (stepButton) qtyInput.value = clampQty(Number(qtyInput.value) + Number(stepButton.dataset.step));
    });

    qtyInput.addEventListener('change', () => {
      qtyInput.value = clampQty(qtyInput.value);
    });

    form.addEventListener('submit', event => {
      event.preventDefault();
      const qty = clampQty(qtyInput.value);
      qtyInput.value = qty;
      const result = Cart.add(product.id, qty);

      if (!result.ok) {
        UI.toast(result.message, { type: 'error' });
      } else if (result.capped) {
        UI.toast(`Only ${product.stock} available. Your cart now has ${result.qty}.`, {
          type: 'info',
          action: { href: 'cart.html', label: 'View cart' },
        });
      } else {
        UI.toast(`Added ${qty} × ${product.name} to your cart.`, {
          type: 'success',
          action: { href: 'cart.html', label: 'View cart' },
        });
      }
    });
  }

  // Related products from the same category.
  const related = Products.inCategory(product.category).filter(item => item.id !== product.id).slice(0, 4);
  if (related.length) {
    document.getElementById('related-grid').innerHTML = related.map(item => UI.productCard(item)).join('');
    document.getElementById('related').hidden = false;
  }
})();
