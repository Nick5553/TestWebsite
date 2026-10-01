/** Home page: category tiles and featured products. */
(function () {
  const categoryGrid = document.getElementById('category-grid');
  const featuredGrid = document.getElementById('featured-grid');

  categoryGrid.innerHTML = Products.categories.map(category => {
    const count = Products.inCategory(category.id).length;
    const [from, to] = category.colors;
    return `
      <a class="card category-card" href="products.html?category=${category.id}"
         data-testid="category-link-${category.id}" style="--cat-from: ${from}; --cat-to: ${to}">
        <span class="category-card-icon" aria-hidden="true">${category.glyph}</span>
        <span class="category-card-name">${category.name}</span>
        <span class="category-card-meta">${count} products</span>
      </a>`;
  }).join('');

  featuredGrid.innerHTML = Products.featured().map(product => UI.productCard(product)).join('');
})();
