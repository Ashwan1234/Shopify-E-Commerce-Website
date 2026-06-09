/* =============================================
   SHOPIFY – shop.js
   Shop page: search, category filter, scroll
   row rendering, URL ?q= param handling.
   ============================================= */

let currentSearchResults = []; // Keeps the latest search results for re-filtering
let activeCategory = 'all'; // Tracks the currently selected category filter

/* ---- Search ---- */
async function runPageSearch(query) {
  const q = query || document.getElementById('searchBarInput').value.trim(); // Reuses explicit query or falls back to the page search input
  if (!q) { hideSearchResults(); return; } // Hides results when the search is empty

  /* Wait for products to load before searching */
  await loadProducts(); // Ensures PRODUCTS is ready before searching

  const results = searchProducts(q); // Searches across the loaded product catalogue
  currentSearchResults = results; // Stores results so category chips can filter them without re-searching
  document.getElementById('searchBarInput').value = q;

  const section = document.getElementById('searchSection');
  document.getElementById('searchResultsTitle').textContent =
    `${results.length} result${results.length !== 1 ? 's' : ''} for "${q}"`; // Updates the results heading dynamically
  section.classList.remove('js-hidden');
  section.classList.add('js-visible'); // Reveals the search results section

  renderResultsGrid(results);
  section.scrollIntoView({ behavior: 'smooth', block: 'start' }); // Smoothly jumps to the results section
}

function hideSearchResults() {
  const s = document.getElementById('searchSection');
  s.classList.add('js-hidden');
  s.classList.remove('js-visible'); // Hides the results section cleanly
}

function renderResultsGrid(results) {
  const filtered = activeCategory === 'all'
    ? results
    : results.filter(p => p.category === activeCategory); // Applies the active category chip to the current results

  document.getElementById('searchResultsGrid').innerHTML = filtered.length
    ? filtered.map(p => buildProductCard(p)).join('') // Rebuilds the results grid from matching products
    : '<div class="no-results">No products found. Try a different search.</div>';
}

/* ---- Category filter chips ---- */
function filterCategory(btn) {
  document.querySelectorAll('.filter-chip').forEach(b => b.classList.remove('active')); // Clears previous active chip state
  btn.classList.add('active');
  activeCategory = btn.dataset.cat; // Reads the selected category directly from the clicked chip
  renderResultsGrid(currentSearchResults); // Re-renders only from the current search results
}

/* ---- Init ---- */
document.addEventListener('DOMContentLoaded', async () => { // Waits for the page before wiring shop interactions
  Auth.hydrateNav(); // Syncs navbar with the current session state

  /* Load products first, then render rows AND handle search param together */
  await loadProducts(); // Loads products once before rendering rows or running URL search

  renderScrollRow('consolesRow',    'consoles'); // Renders the consoles product row
  renderScrollRow('controllersRow', 'controllers'); // Renders the controllers product row
  renderScrollRow('audioRow',       'audio'); // Renders the audio product row

  /* Nav search stays on this page */
  document.getElementById('navSearchBtn').addEventListener('click', () =>
    runPageSearch(document.getElementById('navSearchInput').value)); // Runs shop search from the nav input

  document.getElementById('navSearchInput').addEventListener('keydown', e => {
    if (e.key === 'Enter') runPageSearch(document.getElementById('navSearchInput').value); // Reuses nav search flow on Enter
  });

  /* Large search bar enter key */
  document.getElementById('searchBarInput').addEventListener('keydown', e => {
    if (e.key === 'Enter') runPageSearch(); // Runs page search directly from the main search bar
  });

  /* Handle ?q= URL parameter — products are already loaded above */
  const q = new URLSearchParams(window.location.search).get('q'); // Reads incoming search query from the URL
  if (q) {
    document.getElementById('searchBarInput').value = q;
    runPageSearch(q); // Auto-runs search when arriving with a ?q= parameter
  }
});