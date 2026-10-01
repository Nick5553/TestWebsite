/**
 * cart.js — shopping cart state.
 *
 * The cart is stored in localStorage as [{ id, qty }]. Prices are always
 * looked up from Products, so editing a price in products.js updates
 * existing carts too.
 *
 * Every change fires a "cart:change" event on document, which the header
 * badge and the cart page listen for.
 */
const Cart = (() => {
  const KEY = 'cart';
  const TAX_RATE = 0.08;

  const roundMoney = amount => Math.round(amount * 100) / 100;

  function read() {
    const lines = AppStorage.read(KEY, []);
    return Array.isArray(lines) ? lines : [];
  }

  function save(lines) {
    AppStorage.write(KEY, lines);
    document.dispatchEvent(new CustomEvent('cart:change', { detail: { count: count() } }));
  }

  /**
   * Adds qty units of a product, capped at available stock.
   * Returns { ok, qty, capped, product, message }.
   */
  function add(id, qty = 1) {
    const product = Products.byId(id);
    if (!product) return { ok: false, message: 'That product no longer exists.' };
    if (!Products.isInStock(product)) return { ok: false, product, message: `${product.name} is out of stock.` };

    const lines = read();
    const line = lines.find(item => item.id === id);
    const current = line ? line.qty : 0;
    const wanted = current + Math.max(1, Math.floor(qty) || 1);
    const next = Math.min(wanted, product.stock);

    if (next === current) {
      return { ok: false, product, message: `You already have all ${product.stock} available in your cart.` };
    }

    if (line) line.qty = next;
    else lines.push({ id, qty: next });
    save(lines);

    return { ok: true, product, qty: next, capped: next < wanted };
  }

  /** Sets an exact quantity (clamped to 1..stock). */
  function setQty(id, qty) {
    const product = Products.byId(id);
    const lines = read();
    const line = lines.find(item => item.id === id);
    if (!product || !line) return;

    const parsed = Math.floor(Number(qty));
    line.qty = Math.min(Math.max(Number.isFinite(parsed) ? parsed : 1, 1), product.stock);
    save(lines);
  }

  function remove(id) {
    save(read().filter(item => item.id !== id));
  }

  function clear() {
    save([]);
  }

  /** Cart lines joined with product data; skips products that no longer exist. */
  function detailed() {
    return read()
      .map(line => {
        const product = Products.byId(line.id);
        if (!product) return null;
        const unitPrice = Products.priceOf(product);
        return { id: line.id, qty: line.qty, product, unitPrice, lineTotal: roundMoney(unitPrice * line.qty) };
      })
      .filter(Boolean);
  }

  function count() {
    return detailed().reduce((sum, line) => sum + line.qty, 0);
  }

  function totals() {
    const subtotal = roundMoney(detailed().reduce((sum, line) => sum + line.lineTotal, 0));
    const tax = roundMoney(subtotal * TAX_RATE);
    return { subtotal, tax, taxRate: TAX_RATE, total: roundMoney(subtotal + tax) };
  }

  return { add, setQty, remove, clear, detailed, count, totals, TAX_RATE };
})();
