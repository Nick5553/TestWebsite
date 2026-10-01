/**
 * products.js — the product catalog and lookup helpers.
 *
 * This is the one place to add, remove, or edit products.
 *
 * Product fields:
 *   id           unique slug, used in URLs: product.html?id=aurora-headphones
 *   name         display name
 *   category     must match an id in CATEGORIES below
 *   price        regular price in USD
 *   salePrice    (optional) discounted price; shows a "Sale" badge when set
 *   description  a sentence or two
 *   image        any image URL. The placeholders are generated SVGs, so you can
 *                swap in 'images/my-photo.jpg' without changing anything else.
 *   stock        units available; 0 shows "Out of stock"
 *   rating       0 to 5
 *   featured     (optional) true to show the product on the home page
 */

/** Builds a gradient SVG placeholder image as a data URI (no external assets). */
function placeholderImage(glyph, fromColor, toColor) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="${fromColor}"/>
        <stop offset="1" stop-color="${toColor}"/>
      </linearGradient>
    </defs>
    <rect width="400" height="300" fill="url(#g)"/>
    <circle cx="330" cy="50" r="110" fill="#ffffff" fill-opacity="0.08"/>
    <circle cx="40" cy="280" r="90" fill="#000000" fill-opacity="0.15"/>
    <text x="200" y="158" font-size="120" text-anchor="middle" dominant-baseline="middle"
      font-family="Apple Color Emoji, Segoe UI Emoji, Noto Color Emoji, sans-serif">${glyph}</text>
  </svg>`;
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
}

const CATEGORIES = [
  { id: 'audio', name: 'Audio', glyph: '🎧', colors: ['#0ea5e9', '#6366f1'] },
  { id: 'wearables', name: 'Wearables', glyph: '⌚', colors: ['#14b8a6', '#22c55e'] },
  { id: 'home', name: 'Home', glyph: '🏠', colors: ['#f59e0b', '#ef4444'] },
  { id: 'accessories', name: 'Accessories', glyph: '🎒', colors: ['#ec4899', '#8b5cf6'] },
];

const PRODUCTS = [
  // ---- Audio ----
  {
    id: 'aurora-headphones',
    name: 'Aurora Wireless Headphones',
    category: 'audio',
    price: 199,
    salePrice: 149,
    description: 'Over-ear headphones with adaptive noise cancelling, 40-hour battery life, and plush memory-foam cushions for all-day listening.',
    image: placeholderImage('🎧', '#0ea5e9', '#1e3a8a'),
    stock: 12,
    rating: 4.6,
    featured: true,
  },
  {
    id: 'pulse-earbuds',
    name: 'Pulse Earbuds',
    category: 'audio',
    price: 89,
    description: 'Compact true-wireless earbuds with punchy bass, sweat resistance, and a pocket-sized charging case.',
    image: placeholderImage('🎶', '#a855f7', '#312e81'),
    stock: 30,
    rating: 4.3,
  },
  {
    id: 'boom-speaker',
    name: 'Boom Portable Speaker',
    category: 'audio',
    price: 129,
    description: 'A rugged, waterproof Bluetooth speaker with 360° sound. Pair two for stereo at your next picnic.',
    image: placeholderImage('🔊', '#f97316', '#7c2d12'),
    stock: 0,
    rating: 4.5,
  },
  {
    id: 'studio-mic',
    name: 'Studio Desk Microphone',
    category: 'audio',
    price: 109,
    description: 'USB condenser mic with a cardioid pattern, built-in pop filter, and a zero-latency headphone jack.',
    image: placeholderImage('🎙️', '#64748b', '#0f172a'),
    stock: 8,
    rating: 4.2,
  },

  // ---- Wearables ----
  {
    id: 'orbit-smartwatch',
    name: 'Orbit Smartwatch',
    category: 'wearables',
    price: 249,
    salePrice: 199,
    description: 'Always-on AMOLED display, heart-rate and sleep tracking, GPS, and a week of battery on a single charge.',
    image: placeholderImage('⌚', '#14b8a6', '#134e4a'),
    stock: 15,
    rating: 4.4,
    featured: true,
  },
  {
    id: 'stride-band',
    name: 'Stride Fitness Band',
    category: 'wearables',
    price: 59,
    description: 'A slim activity tracker that counts steps, logs workouts, and nudges you to stand up every hour.',
    image: placeholderImage('🏃', '#22c55e', '#14532d'),
    stock: 40,
    rating: 4.0,
  },
  {
    id: 'lumen-glasses',
    name: 'Lumen Smart Glasses',
    category: 'wearables',
    price: 329,
    description: 'Polarized sunglasses with open-ear speakers and a discreet touch panel for calls and music.',
    image: placeholderImage('🕶️', '#6366f1', '#1e1b4b'),
    stock: 5,
    rating: 3.9,
  },
  {
    id: 'halo-ring',
    name: 'Halo Smart Ring',
    category: 'wearables',
    price: 179,
    description: 'A titanium ring that tracks sleep, readiness, and temperature, with no screen to distract you.',
    image: placeholderImage('💍', '#eab308', '#713f12'),
    stock: 2,
    rating: 4.1,
  },

  // ---- Home ----
  {
    id: 'glow-lamp',
    name: 'Glow Smart Lamp',
    category: 'home',
    price: 69,
    description: 'A dimmable desk lamp with 16 million colours, sunrise alarms, and voice-assistant support.',
    image: placeholderImage('💡', '#facc15', '#a16207'),
    stock: 22,
    rating: 4.7,
  },
  {
    id: 'brew-kettle',
    name: 'Brew Pour-Over Kettle',
    category: 'home',
    price: 79,
    salePrice: 59,
    description: 'A gooseneck kettle with precise temperature control and a hold mode for the perfect pour-over.',
    image: placeholderImage('☕', '#b45309', '#451a03'),
    stock: 18,
    rating: 4.5,
    featured: true,
  },
  {
    id: 'leaf-planter',
    name: 'Leaf Self-Watering Planter',
    category: 'home',
    price: 45,
    description: 'A ceramic planter with a hidden reservoir that keeps your herbs happy for up to two weeks.',
    image: placeholderImage('🪴', '#4ade80', '#166534'),
    stock: 25,
    rating: 4.3,
  },
  {
    id: 'nimbus-purifier',
    name: 'Nimbus Air Purifier',
    category: 'home',
    price: 219,
    description: 'A whisper-quiet HEPA purifier for rooms up to 40 m², with a live air-quality ring.',
    image: placeholderImage('🌬️', '#38bdf8', '#0c4a6e'),
    stock: 7,
    rating: 4.6,
  },

  // ---- Accessories ----
  {
    id: 'carry-backpack',
    name: 'Carry Everyday Backpack',
    category: 'accessories',
    price: 119,
    description: 'A water-resistant 20 L backpack with a padded laptop sleeve and a clamshell opening for easy packing.',
    image: placeholderImage('🎒', '#ef4444', '#7f1d1d'),
    stock: 14,
    rating: 4.8,
    featured: true,
  },
  {
    id: 'volt-powerbank',
    name: 'Volt Power Bank',
    category: 'accessories',
    price: 49,
    description: 'A 10,000 mAh power bank with 30 W USB-C fast charging, small enough for a jeans pocket.',
    image: placeholderImage('🔋', '#84cc16', '#365314'),
    stock: 50,
    rating: 4.2,
  },
  {
    id: 'dock-hub',
    name: 'Dock USB-C Hub',
    category: 'accessories',
    price: 69,
    salePrice: 49,
    description: 'A 7-in-1 aluminium hub with 4K HDMI, SD card reader, and 100 W pass-through charging.',
    image: placeholderImage('🔌', '#94a3b8', '#1e293b'),
    stock: 20,
    rating: 4.0,
  },
  {
    id: 'snap-stand',
    name: 'Snap Phone Stand',
    category: 'accessories',
    price: 25,
    description: 'A foldable magnetic stand that holds your phone at the right angle for video calls.',
    image: placeholderImage('📱', '#ec4899', '#831843'),
    stock: 60,
    rating: 4.4,
  },
];

/** Read-only helpers for the catalog. */
const Products = {
  categories: CATEGORIES,

  all() {
    return PRODUCTS.slice();
  },

  byId(id) {
    return PRODUCTS.find(product => product.id === id) || null;
  },

  featured() {
    return PRODUCTS.filter(product => product.featured);
  },

  inCategory(categoryId) {
    return PRODUCTS.filter(product => product.category === categoryId);
  },

  category(categoryId) {
    return CATEGORIES.find(category => category.id === categoryId) || null;
  },

  /** The price a customer actually pays (sale price if there is one). */
  priceOf(product) {
    return Products.isOnSale(product) ? product.salePrice : product.price;
  },

  isOnSale(product) {
    return typeof product.salePrice === 'number' && product.salePrice < product.price;
  },

  isInStock(product) {
    return product.stock > 0;
  },
};
