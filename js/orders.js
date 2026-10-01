/**
 * orders.js — fake orders stored in localStorage.
 *
 * Orders snapshot item names and prices at purchase time, so later edits
 * to products.js don't change past orders. Only the card's last 4 digits
 * are kept.
 */
const Orders = (() => {
  const KEY = 'orders';

  function all() {
    return AppStorage.read(KEY, []);
  }

  function byId(id) {
    return all().find(order => order.id === id) || null;
  }

  function forUser(email) {
    return all()
      .filter(order => order.userEmail === email)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  /** e.g. "NV-20261001-7KQ3" */
  function generateId() {
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const suffix = Math.random().toString(36).slice(2, 6).toUpperCase().padEnd(4, '0');
    return `NV-${date}-${suffix}`;
  }

  /** Creates an order from the current cart. Does not clear the cart. */
  function create({ customer, cardLast4 }) {
    const user = Auth.current();
    const order = {
      id: generateId(),
      createdAt: new Date().toISOString(),
      userEmail: user ? user.email : null,
      customer,
      payment: { cardLast4 },
      items: Cart.detailed().map(line => ({
        id: line.id,
        name: line.product.name,
        unitPrice: line.unitPrice,
        qty: line.qty,
        lineTotal: line.lineTotal,
      })),
      totals: Cart.totals(),
    };
    AppStorage.write(KEY, [...all(), order]);
    return order;
  }

  return { all, byId, forUser, create };
})();
