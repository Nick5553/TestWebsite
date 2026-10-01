/**
 * Products page: search, category filter, sale filter, and sort.
 * Filter state is mirrored in the URL (?q=&category=&sort=&sale=1) so
 * links like products.html?category=audio work and results are shareable.
 */
(function () {
  const form = document.getElementById('filters');
  const searchInput = document.getElementById('search');
  const categorySelect = document.getElementById('category');
  const sortSelect = document.getElementById('sort');
  const saleCheckbox = document.getElementById('on-sale');
  const grid = document.getElementById('product-grid');
  const emptyState = document.getElementById('empty-state');
  const resultCount = document.getElementById('result-count');
  const title = document.getElementById('page-title');

  const SORTERS = {
    featured: () => 0, // keep catalog order
    'price-asc': (a, b) => Products.priceOf(a) - Products.priceOf(b),
    'price-desc': (a, b) => Products.priceOf(b) - Products.priceOf(a),
    'name-asc': (a, b) => a.name.localeCompare(b.name),
    'name-desc': (a, b) => b.name.localeCompare(a.name),
  };

  categorySelect.insertAdjacentHTML(
    'beforeend',
    Products.categories.map(category => `<option value="${category.id}">${category.name}</option>`).join('')
  );

  // Restore filters from the URL.
  const params = new URLSearchParams(window.location.search);
  searchInput.value = params.get('q') || '';
  categorySelect.value = Products.category(params.get('category')) ? params.get('category') : '';
  sortSelect.value = SORTERS[params.get('sort')] ? params.get('sort') : 'featured';
  saleCheckbox.checked = params.get('sale') === '1';

  function readFilters() {
    return {
      query: searchInput.value.trim(),
      category: categorySelect.value,
      sort: sortSelect.value,
      onSale: saleCheckbox.checked,
    };
  }

  function matches(product, { query, category, onSale }) {
    if (category && product.category !== category) return false;
    if (onSale && !Products.isOnSale(product)) return false;
    if (!query) return true;
    const categoryName = Products.category(product.category)?.name ?? '';
    const haystack = `${product.name} ${product.description} ${categoryName}`.toLowerCase();
    return haystack.includes(query.toLowerCase());
  }

  function syncUrl({ query, category, sort, onSale }) {
    const next = new URLSearchParams();
    if (query) next.set('q', query);
    if (category) next.set('category', category);
    if (sort !== 'featured') next.set('sort', sort);
    if (onSale) next.set('sale', '1');
    const search = next.toString();
    try {
      history.replaceState(null, '', search ? `?${search}` : window.location.pathname);
    } catch (error) {
      // Some browsers block history updates on file:// URLs. Filtering still works.
    }
  }

  function render() {
    const filters = readFilters();
    const results = Products.all().filter(product => matches(product, filters)).sort(SORTERS[filters.sort]);

    grid.innerHTML = results.map(product => UI.productCard(product)).join('');
    grid.hidden = results.length === 0;
    emptyState.hidden = results.length > 0;
    resultCount.textContent = `${results.length} ${results.length === 1 ? 'product' : 'products'}`;

    const category = Products.category(filters.category);
    title.textContent = category ? category.name : filters.onSale ? 'On sale' : 'All products';
    document.title = `${title.textContent} · Nova Store`;

    syncUrl(filters);
  }

  form.addEventListener('input', render);
  form.addEventListener('change', render);
  form.addEventListener('submit', event => event.preventDefault());
  // The "reset" event fires before the fields are cleared, so render on the next tick.
  form.addEventListener('reset', () => setTimeout(render, 0));
  document.getElementById('empty-reset').addEventListener('click', () => {
    form.reset();
    searchInput.focus();
  });

  render();
})();
