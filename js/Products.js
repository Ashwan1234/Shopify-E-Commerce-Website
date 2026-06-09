/* =============================================
   SHOPIFY – products.js
   Loads catalogue from /data/products.json.
   Auto-detects path depth so it works from
   both root (index.html) and /pages/*.html.
   Falls back to embedded data if fetch fails
   (e.g. opened via file:// without a server).
   ============================================= */

let PRODUCTS = []; // Holds the active product catalogue in memory

/* ---- Detect correct path to /data/ ---- */
function _dataPath(filename) {
  /* If current page is inside /pages/ we need ../data/
     If it's at root we need data/                      */
  const inSubfolder = window.location.pathname.includes('/pages/'); // Detects whether the current page is inside /pages/
  return (inSubfolder ? '../data/' : 'data/') + filename; // Resolves the correct relative path to the data folder
}

/* ---- Embedded fallback data (used if fetch fails) ---- */
const PRODUCTS_FALLBACK = [ // Ensures the shop still works when products.json cannot be fetched
  { id:'ps5',           name:'PS5 Console',            category:'consoles',    price:499, stock:8,  badge:'New',      img:null, alt:'PlayStation 5 Console',        desc:'Next-gen gaming with fast loading, stunning graphics, and smooth performance.' },
  { id:'xbox-x',        name:'Xbox Series X',          category:'consoles',    price:499, stock:5,  badge:null,       img:null, alt:'Xbox Series X Console',         desc:'Powerful high-performance gaming with fast load times and impressive visuals.' },
  { id:'ps-portal',     name:'PS Portal Console',      category:'consoles',    price:199, stock:12, badge:null,       img:null, alt:'PlayStation Portal Console',     desc:'Enjoy flexibility — stay connected to your favourite games on a portable device.' },
  { id:'nintendo-switch',name:'Nintendo Switch',       category:'consoles',    price:299, stock:10, badge:null,       img:null, alt:'Nintendo Switch Console',        desc:'Versatile gaming on TV or anywhere. Perfect for solo or multiplayer.' },
  { id:'ps4',           name:'PS4 Console',            category:'consoles',    price:249, stock:3,  badge:'Sale',     img:null, alt:'PlayStation 4 Console',         desc:'Reliable performance, wide game library — still a great choice.' },
  { id:'dualsense5',    name:'DualSense 5',            category:'controllers', price:79,  stock:20, badge:'Popular',  img:null, alt:'DualSense 5 Controller',        desc:'Sleek design with responsive haptic controls for immersive PS5 gaming.' },
  { id:'dualshock4',    name:'DualShock 4',            category:'controllers', price:59,  stock:15, badge:null,       img:null, alt:'DualShock 4 Controller',        desc:'Comfort, style, and precision for every PS4 gaming session.' },
  { id:'joy-con',       name:'Nintendo Joy-Con',       category:'controllers', price:69,  stock:18, badge:null,       img:null, alt:'Nintendo Joy-Con Controllers',  desc:'Compact, colorful, and versatile. Essential for the Nintendo Switch.' },
  { id:'xbox-ctrl',     name:'Xbox X Controller',      category:'controllers', price:64,  stock:14, badge:null,       img:null, alt:'Xbox X Controller',             desc:'Ergonomic design and responsive buttons for smooth cross-title gameplay.' },
  { id:'dualsense-deck',name:'DualSense Station Deck', category:'controllers', price:39,  stock:25, badge:null,       img:null, alt:'DualSense Station Deck',        desc:'Store and charge your controllers. Practical, stylish, keeps setup organized.' },
  { id:'airpods4',      name:'Apple AirPods 4',        category:'audio',       price:179, stock:9,  badge:null,       img:null, alt:'Apple AirPods 4',               desc:'Clear sound and everyday wireless convenience for music, calls, and entertainment.' },
  { id:'awei-hp',       name:'Awei Wireless Headphone',category:'audio',       price:49,  stock:22, badge:null,       img:null, alt:'Awei Wireless Headphone',       desc:'Comfortable wireless listening for music, videos, and calls.' },
  { id:'jbl-t450',      name:'JBL T450 Headphone',     category:'audio',       price:39,  stock:30, badge:null,       img:null, alt:'JBL T450 Headphone',            desc:'Quality sound, lightweight. Ideal for music lovers on the go.' },
  { id:'samsung-pro-hp',name:'Samsung Headphone Pro',  category:'audio',       price:89,  stock:11, badge:null,       img:null, alt:'Samsung Headphone Pro',         desc:'Style, comfort, and quality sound. Music, calls, and entertainment.' },
  { id:'sony-ult',      name:'SONY ULT Wireless',      category:'audio',       price:129, stock:7,  badge:'Top Pick', img:null, alt:'SONY ULT Wireless Headphone',   desc:'Strong sound and wireless freedom. Immersive for gaming, music, or daily use.' },
];

/* ---- Load products.json ---- */
async function loadProducts() {
  if (PRODUCTS.length > 0) return PRODUCTS; // Reuses cached products to avoid repeated fetches
  try {
    const res  = await fetch(_dataPath('products.json')); // Loads the main product catalogue file
    if (!res.ok) throw new Error('fetch failed'); // Forces fallback data on bad HTTP responses
    const data = await res.json();
    const overrides = JSON.parse(localStorage.getItem('shopify_stock_override') || '{}'); // Loads locally saved stock and price edits
    PRODUCTS = data.products.map(p => ({
      ...p,
      stock: overrides[p.id]?.stock ?? p.stock, // Applies local stock overrides on top of base products
      price: overrides[p.id]?.price ?? p.price, // Applies local price overrides on top of base products
    }));
  } catch {
    /* Fallback: use embedded data so page always renders */
    const overrides = JSON.parse(localStorage.getItem('shopify_stock_override') || '{}'); // Preserves local edits even in fallback mode
    PRODUCTS = PRODUCTS_FALLBACK.map(p => ({
      ...p,
      stock: overrides[p.id]?.stock ?? p.stock, // Applies local stock overrides to fallback products
      price: overrides[p.id]?.price ?? p.price, // Applies local price overrides to fallback products
    }));
  }
  return PRODUCTS;
}

/* ---- Persist stock change ---- */
function saveStockOverride(id, stock, price) {
  const ov = JSON.parse(localStorage.getItem('shopify_stock_override') || '{}'); // Loads the writable stock override store
  ov[id] = { stock, price }; // Stores stock and price by product id
  localStorage.setItem('shopify_stock_override', JSON.stringify(ov)); // Persists admin stock/price edits across reloads
  const p = PRODUCTS.find(x => x.id === id); // Keeps the in-memory product list synced immediately
  if (p) { p.stock = stock; p.price = price; }
}

/* ---- Build product card HTML ---- */
/* ---- Sends the essential product snapshot into the cart module  ---- */
 /* ---- Prevents adding unavailable items to cart  ---- */
function buildProductCard(product) {
  const oos   = product.stock === 0; // Determines whether the product is out of stock
  const img   = product.img
    ? `<img src="${product.img}" alt="${product.alt}" loading="lazy">`
    : `<div class="product-img-text">📷 ${product.alt}<br><span class="product-img-hint">${product.id}.jpg</span></div>`; // Falls back to placeholder content when no image exists
  const badge = product.badge
    ? `<div class="product-badge-wrap"><span class="badge badge-blue">${product.badge}</span></div>` : '';
  return `
    <div class="product-card" data-id="${product.id}" data-category="${product.category}">
      <div class="product-img">${badge}${img}</div>
      <div class="product-info">
        <div class="product-name">${product.name}</div>
        <div class="product-desc">${product.desc}</div>
        <div class="product-footer">
          <div>
            <div class="product-price">RS${product.price}</div>
            <div class="product-stock">${oos ? 'Out of stock' : `${product.stock} in stock`}</div>
          </div>
          <button class="btn-add"
            onclick="Cart.add({id:'${product.id}',name:'${product.name}',price:${product.price},img:'${product.img || ''}'})"
            ${oos ? 'disabled' : ''}>
            ${oos ? 'Sold Out' : 'Add to Cart'}
          </button>
        </div>
      </div>
    </div>`;
}

/* ---- Render horizontal scroll row ---- */
async function renderScrollRow(rowId, category) {
  const el = document.getElementById(rowId);
  if (!el) return; // Prevents errors if the target row is missing on the page
  await loadProducts(); // Ensures products are loaded before rendering
  el.innerHTML = PRODUCTS.filter(p => p.category === category).map(buildProductCard).join(''); // Renders only products for the requested category
  initDragScroll(el); // Enables drag-to-scroll behavior on the row
}

/* ---- Drag to scroll ---- */
function initDragScroll(el) {
  let down = false, startX, scrollLeft; // Tracks drag state and starting scroll position
  el.addEventListener('mousedown',  e => { down = true; startX = e.pageX - el.offsetLeft; scrollLeft = el.scrollLeft; }); // Starts drag tracking on mouse press
  el.addEventListener('mouseleave', ()  => down = false);
  el.addEventListener('mouseup',    ()  => down = false); // Ends drag tracking when mouse is released
  el.addEventListener('mousemove',  e  => {
    if (!down) return; // Scrolls only while dragging is active
    e.preventDefault(); // Prevents text/image selection while dragging
    el.scrollLeft = scrollLeft - (e.pageX - el.offsetLeft - startX) * 1.4; // Converts mouse movement into horizontal scrolling
  });
}

/* ---- Arrow scroll ---- */
function scrollRow(rowId, dir) {
  document.getElementById(rowId)?.scrollBy({ left: dir * 290, behavior: 'smooth' }); // Scrolls the row left or right by a fixed card distance
}

/* ---- Search ---- */
function searchProducts(query) {
  if (!query?.trim()) return []; // Returns no results for empty search input
  const q = query.trim().toLowerCase(); // Normalizes search input for case-insensitive matching
  return PRODUCTS.filter(p =>
    p.name.toLowerCase().includes(q) ||
    p.category.toLowerCase().includes(q) ||
    p.desc.toLowerCase().includes(q) ||
    p.id.toLowerCase().includes(q) // Searches across product name, category, description, and id
  );
}

/* ---- Nav search wiring ---- */
function initNavSearch(basePath = '../pages/') {
  const input = document.getElementById('navSearchInput');
  const btn   = document.getElementById('navSearchBtn');
  if (!input) return; // Avoids binding search logic on pages without the nav search input
  const go = () => {
    const q = input.value.trim(); // Trims whitespace so empty searches do not redirect
    if (q) window.location.href = `${basePath}shop.html?q=${encodeURIComponent(q)}`; // Safely passes the search query into the shop URL
  };
  btn?.addEventListener('click', go);
  input.addEventListener('keydown', e => { if (e.key === 'Enter') go(); }); // Reuses the same search flow on Enter
}

/* ---- Scroll fade observer ---- */
function initScrollFade() {
  const obs = new IntersectionObserver(
    entries => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); }), // Reveals elements when they enter the viewport
    { threshold: 0.07 } // Triggers the reveal slightly before the whole element is visible
  );
  document.querySelectorAll('.fade-in').forEach(el => obs.observe(el)); // Applies the fade observer to all matching elements
}

document.addEventListener('DOMContentLoaded', () => { initScrollFade(); }); // Starts scroll reveal behavior after the DOM is ready