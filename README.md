# Nova Store: a fake online store sandbox

A small online store built with plain HTML, CSS, and vanilla JavaScript.
No frameworks, no build step, no dependencies. Everything is fake:
products, accounts, payments, and orders all live in your browser's
`localStorage`.

## Running it

**Option 1: open the file.** Double-click `index.html` (or drag it into a browser).

**Option 2: a local server** (closer to a real site):

```bash
python3 -m http.server 8000
```

Then open <http://localhost:8000>.

**Option 3: the bundled server**, which also serves the store's own 404 page for unknown URLs:

```bash
python3 serve.py        # http://localhost:8000
python3 serve.py 3000   # custom port
```

> Note: `localStorage` is per origin, so a cart created at `file://` won't
> appear at `http://localhost:8000`, and vice versa.

## Pages

| Page | File | Notes |
| --- | --- | --- |
| Home | `index.html` | Hero, category tiles, featured products, sale promo |
| Products | `products.html` | Search, category, "on sale" filter, sort. State is kept in the URL: `?q=&category=audio&sort=price-asc&sale=1` |
| Product detail | `product.html?id=aurora-headphones` | Quantity selector, add to cart, related products. Unknown ids redirect to `404.html` |
| Cart | `cart.html` | Change quantity, remove, clear, subtotal / tax / total |
| Checkout | `checkout.html` | Validated form → `confirmation.html?order=NV-…` |
| Login / Register | `login.html` | Fake auth; shows account and order history when logged in. Supports `?next=checkout.html` |
| 404 | `404.html` | |

### Test data

- **Demo account:** `demo@example.com` / `demo1234` (seeded automatically).
- **Test cards** (any future expiry such as `08/29`, any 3-digit CVC):
  - `4242 4242 4242 4242`: succeeds
  - `4000 0000 0000 0002`: declined
  - Any number that fails the Luhn check shows a validation error.
- **Out of stock:** Boom Portable Speaker. **Low stock:** Halo Smart Ring (2), Lumen Smart Glasses (5).
- **On sale:** Aurora Headphones, Orbit Smartwatch, Brew Kettle, Dock USB-C Hub.
- **Tax:** flat 8% (`TAX_RATE` in `js/cart.js`). Shipping is always free.

### Reset demo data

The footer has a faint **"Reset demo data"** link (bottom right; it brightens on
hover or focus, `data-testid="reset-demo-data"`). It clears every
`novaStore.*` key from `localStorage` (cart, session, users, orders) and
reloads. The demo account is re-created automatically.

## File structure

```
├── index.html, products.html, product.html, cart.html,
│   checkout.html, confirmation.html, login.html, 404.html
├── css/
│   └── styles.css          All styles. Theme tokens are at the top.
├── js/
│   ├── storage.js          Safe localStorage wrapper (namespaced "novaStore.*" keys)
│   ├── products.js         Product catalog + helpers  ← edit products here
│   ├── cart.js             Cart state, totals, "cart:change" event
│   ├── auth.js             Fake register/login/logout, "auth:change" event
│   ├── orders.js           Order creation and history
│   ├── ui.js               Shared header/footer injection, cart badge, toasts,
│   │                       product card markup, form helpers
│   └── pages/              One small script per page
│       ├── home.js, products.js, product.js, cart.js,
│       └── checkout.js, confirmation.js, login.js
└── serve.py                Optional dev server with a custom 404
```

Every page loads the same scripts in the same order:

```html
<script src="js/storage.js"></script>
<script src="js/products.js"></script>
<script src="js/cart.js"></script>
<script src="js/auth.js"></script>
<script src="js/orders.js"></script>
<script src="js/ui.js"></script>       <!-- renders header + footer -->
<script src="js/pages/<page>.js"></script>
```

They're classic scripts (not ES modules) so the site also works from
`file://`. Each file exposes one global: `AppStorage`, `Products`,
`Cart`, `Auth`, `Orders`, `UI`. That's handy in the devtools console too,
for example `Cart.add('glow-lamp', 3)`.

The header and footer are injected by `UI.renderHeader()` and
`UI.renderFooter()` in `js/ui.js` into `<header id="site-header">` and
`<footer id="site-footer">`. Nav links live in `NAV_LINKS` at the top of
that file.

## Third-party scripts

Every HTML page includes the **ProveSource** widget snippet at the end of
its `<head>` (between the `Start/End of Async ProveSource Code` comments).
It loads `https://cdn.provesrc.com/provesrc.js` asynchronously and is the
only external dependency. To remove or update it, edit that block in all
8 HTML files.

## Changing products

Edit the `PRODUCTS` array in **`js/products.js`**. Each product has:

```js
{
  id: 'glow-lamp',            // used in product.html?id=...
  name: 'Glow Smart Lamp',
  category: 'home',           // must match an id in CATEGORIES
  price: 69,
  salePrice: 49,              // optional → shows "Sale" badge + strikethrough
  description: '…',
  image: placeholderImage('💡', '#facc15', '#a16207'),  // or 'images/lamp.jpg'
  stock: 22,                  // 0 → "Out of stock"
  rating: 4.7,
  featured: true,             // optional → shown on the home page
}
```

Images are generated SVG gradients (`placeholderImage(emoji, fromColor, toColor)`),
so nothing depends on external assets. To use real photos, put them in an
`images/` folder and set `image: 'images/your-file.jpg'`.

Categories are in the `CATEGORIES` array in the same file.

## Changing the theme

All colors, spacing, radii, shadows, and fonts are CSS variables at the top of
**`css/styles.css`** (section 1, "Theme tokens"). To change the accent color,
edit:

```css
--color-accent: #2dd4bf;        /* buttons, links, focus rings */
--color-accent-hover: #5eead4;
--color-accent-strong: #0d9488;
--color-on-accent: #042f2a;     /* text on accent buttons */
```

A few `rgba(45, 212, 191, …)` values (focus ring, glows) use the same teal.
Search for `45, 212, 191` to update them as well.

## Testing hooks

Key elements have stable `data-testid` attributes. Some useful ones:

| Area | data-testid |
| --- | --- |
| Header | `cart-badge`, `cart-link`, `user-indicator`, `user-name`, `nav-toggle`, `nav-home`, `nav-products` |
| Product cards | `product-card` (with `data-product-id`), `product-link`, `product-price`, `card-add-to-cart`, `sale-badge`, `out-of-stock-badge` |
| Products page | `search-input`, `category-filter`, `sort-select`, `sale-filter`, `reset-filters`, `result-count`, `product-grid`, `no-results` |
| Product page | `product-name`, `product-price`, `stock-status`, `qty-input`, `qty-increase`, `qty-decrease`, `add-to-cart` |
| Cart | `cart-item`, `cart-qty-input`, `cart-qty-increase`, `cart-qty-decrease`, `remove-item`, `cart-line-total`, `cart-subtotal`, `cart-tax`, `cart-total`, `checkout-button`, `clear-cart`, `cart-empty` |
| Checkout | `checkout-form`, `checkout-<field>` (fields: `fullName`, `email`, `address`, `city`, `zip`, `country`, `cardName`, `cardNumber`, `cardExpiry`, `cardCvc`), `error-<field>`, `error-summary`, `place-order-button`, `checkout-total` |
| Confirmation | `order-confirmation`, `order-number`, `order-total` |
| Login | `login-email`, `login-password`, `login-submit`, `login-error`, `register-name`, `register-email`, `register-password`, `register-submit`, `logout-button`, `order-history` |
| Misc | `toast`, `reset-demo-data`, `not-found` |

Example (Playwright):

```js
await page.goto('http://localhost:8000/product.html?id=pulse-earbuds');
await page.getByTestId('qty-increase').click();
await page.getByTestId('add-to-cart').click();
await expect(page.getByTestId('cart-badge')).toHaveText('2');
```

Order placement waits about 700 ms to simulate a payment request
(`PROCESSING_DELAY_MS` in `js/pages/checkout.js`).
