/* =============================================
   SHOPIFY – cart.js
   Cart state management, localStorage sync,
   sidebar rendering. Shared across all pages.
   ============================================= */

const Cart = (() => {

  /* ---------- STATE ---------- */
  let items   = [];   // [{ id, name, price, qty, img }]
  let isOpen  = false; // Tracks cart sidebar open/closed state

  /* ---------- PERSISTENCE ---------- */
  /* Save cart to localStorage so it persists across pages */
  function save() {
    localStorage.setItem('shopify_cart', JSON.stringify(items)); // Persists cart state across page reloads/navigation
  }

  function load() {
    try {
      const raw = localStorage.getItem('shopify_cart'); // Reads saved cart data from browser storage
      items = raw ? JSON.parse(raw) : []; // Restores cart safely or falls back to empty
    } catch {
      items = [];
    }
  }

  /* ---------- MUTATIONS ---------- */
  function add(product) {
    /* product: { id, name, price, img? } */
    const existing = items.find(i => i.id === product.id); // Prevents duplicate cart rows for the same product
    if (existing) {
      existing.qty += 1; // Increments quantity when product already exists in cart
    } else {
      items.push({ ...product, qty: 1 }); // Adds a new cart item with default quantity 1
    }
    save();
    render();
    open(); // Opens the cart immediately after adding an item
    Toast.show(`${product.name} added to cart ✓`);
  }

  function remove(id) {
    items = items.filter(i => i.id !== id); // Removes the matching item from cart state
    save();
    render();
  }

  function changeQty(id, delta) {
    const item = items.find(i => i.id === id); // Finds the cart item to update
    if (!item) return;
    item.qty += delta; // Applies quantity increment/decrement
    if (item.qty <= 0) {
      remove(id); // Removes item entirely when quantity drops to zero or below
    } else {
      save();
      render();
    }
  }

  function clear() {
    items = []; // Resets the full cart state
    save();
    render();
  }

  /* ---------- TOTALS ---------- */
  function getSubtotal() {
    return items.reduce((s, i) => s + i.price * i.qty, 0); // Calculates raw cart total before discounts
  }

  function getTotalQty() {
    return items.reduce((s, i) => s + i.qty, 0); // Calculates total number of items in the cart
  }

  function getDiscount() {
    /* 5% after 1st purchase, 10% after 3rd purchase */
    const purchaseCount = parseInt(localStorage.getItem('shopify_purchases') || '0', 10); // Reads loyalty progress from browser storage
    if (purchaseCount >= 3) return { rate: 0.10, label: '10% Loyalty Discount' }; // Applies highest loyalty tier first
    if (purchaseCount >= 1) return { rate: 0.05, label: '5% Loyalty Discount' };
    return { rate: 0, label: '' };
  }

  function getTotal() {
    const sub      = getSubtotal();
    const discount = getDiscount(); // Reuses loyalty discount logic for final total
    return sub * (1 - discount.rate); // Returns discounted total
  }

  /* ---------- SIDEBAR RENDER ---------- */
  function render() {
    const overlay   = document.getElementById('cartOverlay');
    const sidebar   = document.getElementById('cartSidebar');
    const itemsEl   = document.getElementById('cartItems');
    const countEl   = document.getElementById('cartCount');
    const subEl     = document.getElementById('cartSubtotal');
    const discEl    = document.getElementById('cartDiscountRow');
    const totalEl   = document.getElementById('cartTotal');

    /* Guard: elements may not exist on every page */
    if (!countEl) return; // Prevents errors on pages without cart UI

    const qty      = getTotalQty();
    const sub      = getSubtotal();
    const discount = getDiscount();
    const total    = sub * (1 - discount.rate); // Keeps render total aligned with discount logic

    /* Update counter badge */
    countEl.textContent = qty; // Updates the cart item count badge

    if (!itemsEl) return; // Prevents sidebar rendering on pages without the sidebar container

    if (items.length === 0) {
      itemsEl.innerHTML = `
        <p class="cart-empty">
          Your cart is empty.<br>
          <a href="../pages/shop.html" style="color:var(--blue);font-weight:600;margin-top:8px;display:inline-block;">
            Browse Products →
          </a>
        </p>`;
    } else {
      itemsEl.innerHTML = items.map(item => `
        <div class="cart-item">
          <div class="cart-item-img">
            ${item.img
              ? `<img src="${item.img}" alt="${item.name}">`
              : `<span style="font-size:0.55rem;color:#555;text-align:center;padding:4px">${item.name}</span>`}
          </div>
          <div class="cart-item-info">
            <div class="cart-item-name">${item.name}</div>
            <div class="cart-item-price">$${(item.price * item.qty).toFixed(2)}</div>
            <div class="cart-qty-row">
              <button class="cart-qty-btn" onclick="Cart.changeQty('${item.id}', -1)">−</button>
              <span class="cart-qty-num">${item.qty}</span>
              <button class="cart-qty-btn" onclick="Cart.changeQty('${item.id}', 1)">+</button>
              <button class="cart-item-remove" onclick="Cart.remove('${item.id}')">Remove</button>
            </div>
          </div>
        </div>
      `).join(''); // Rebuilds the visible cart list from current state
    }

    /* Totals */
    if (subEl)   subEl.textContent   = `$${sub.toFixed(2)}`; // Updates subtotal display
    if (totalEl) totalEl.textContent = `$${total.toFixed(2)}`; // Updates final total display

    if (discEl) {
      if (discount.rate > 0) {
        discEl.classList.add('visible'); // Shows discount row only when a discount applies
        discEl.innerHTML = `
          <span>${discount.label}</span>
          <span>−$${(sub * discount.rate).toFixed(2)}</span>`; // Displays exact discount amount
      } else {
        discEl.classList.remove('visible'); // Hides discount row when there is no discount
      }
    }
  }

  /* ---------- OPEN / CLOSE ---------- */
  function open() {
    isOpen = true; // Keeps internal sidebar state in sync with UI
    document.getElementById('cartSidebar')?.classList.add('open'); // Opens the cart sidebar panel
    document.getElementById('cartOverlay')?.classList.add('open'); // Shows the backdrop overlay
  }

  function close() {
    isOpen = false; // Keeps internal sidebar state in sync with UI
    document.getElementById('cartSidebar')?.classList.remove('open'); // Closes the cart sidebar panel
    document.getElementById('cartOverlay')?.classList.remove('open'); // Hides the backdrop overlay
  }

  function toggle() { isOpen ? close() : open(); } // Switches cart sidebar state from one function

  /* ---------- CHECKOUT REDIRECT ---------- */
  function checkout() {
    if (items.length === 0) {
      Toast.show('Your cart is empty!', true); // Blocks checkout when there are no items
      return;
    }
    close();
    window.location.href = 'payment.html'; // Sends user to the payment page with current cart preserved in storage
  }

  /* ---------- INIT ---------- */
  function init() {
    load(); // Restores persisted cart before first render
    render();

    /* Wire up overlay click to close */
    document.getElementById('cartOverlay')?.addEventListener('click', close); // Lets users close cart by clicking backdrop
  }

  /* ---------- PUBLIC API ---------- */
  return { init, add, remove, changeQty, clear, open, close, toggle, checkout,
           getItems: () => items, // Exposes current cart items without direct external mutation helpers
           getTotal, getSubtotal, getDiscount, getTotalQty };

})();

/* Auto-init when DOM is ready */
document.addEventListener('DOMContentLoaded', Cart.init); // Initializes cart only after the DOM is ready