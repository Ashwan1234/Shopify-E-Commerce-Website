/* =============================================
   SHOPIFY – Payment.js
   3-step checkout: Delivery → Payment → Review
   ============================================= */

let currentStep = 1; // Tracks the active checkout step

/* ============================================= 
   STEP NAVIGATION
   ============================================= */
function goToStep(step) {
  if (step < 1 || step > 3) return; // Prevents invalid step navigation
  currentStep = step; // Keeps the current checkout state in sync

  /* --- Update indicators --- */
  for (let i = 1; i <= 3; i++) {
    const ind = document.getElementById('step' + i + '-indicator');
    if (!ind) continue; // Avoids errors if a step indicator is missing
    ind.classList.remove('active', 'done');
    if      (i < step)  ind.classList.add('done'); // Marks previous steps as completed
    else if (i === step) ind.classList.add('active'); // Marks the current step as active
  }

  /* --- Show/hide panels --- */
  const p1 = document.getElementById('panel-step1');
  const p2 = document.getElementById('panel-step2');
  const p3 = document.getElementById('panel-step3');

  if (p1) p1.style.cssText = step === 1 ? 'display:block !important' : 'display:none !important'; // Shows only step 1 panel when active
  if (p2) p2.style.cssText = step === 2 ? 'display:block !important' : 'display:none !important'; // Shows only step 2 panel when active
  if (p3) p3.style.cssText = step === 3 ? 'display:block !important' : 'display:none !important'; // Shows only step 3 panel when active
}

function nextStep() {
  if (!validateStep(currentStep)) return; // Blocks progress until the current step is valid
  if (currentStep === 2) populateReview(); // Fills the review screen before entering step 3
  goToStep(currentStep + 1);
  window.scrollTo({ top: 0, behavior: 'smooth' }); // Resets scroll position when moving forward
}

function prevStep() {
  goToStep(currentStep - 1);
  window.scrollTo({ top: 0, behavior: 'smooth' }); // Resets scroll position when moving backward
}

/* ============================================= 
   VALIDATION
   ============================================= */
function validateStep(step) {
  let ok = true;

  if (step === 1) {
    const required = ['firstName', 'lastName', 'checkoutEmail', 'phone', 'address', 'city']; // Defines required delivery fields
    required.forEach(id => {
      const el = document.getElementById(id);
      if (!el) return;
      if (!el.value.trim()) {
        el.style.borderColor = 'var(--red)'; // Highlights missing required input
        ok = false;
      } else {
        el.style.borderColor = '';
      }
    });
    if (!ok) Toast.show('Please fill in all required fields.', true); // Gives feedback when delivery form is incomplete
  }

  /* Step 2 — no required validation, always allow proceeding */

  return ok;
}

/* ============================================= 
   ORDER SUMMARY (right panel)
   ============================================= */
function renderOrderSummary() {
  const container = document.getElementById('orderItemsList');
  const subEl     = document.getElementById('summarySubtotal');
  const totalEl   = document.getElementById('summaryTotal');
  const discRow   = document.getElementById('summaryDiscountRow');
  const discLabel = document.getElementById('summaryDiscountLabel');
  const discEl    = document.getElementById('summaryDiscount');

  if (!container) return; // Prevents rendering on pages without the summary container

  const items    = Cart.getItems(); // Pulls live cart items from shared cart state
  const sub      = Cart.getSubtotal();
  const discount = Cart.getDiscount();
  const total    = Cart.getTotal();

  if (items.length === 0) {
    container.innerHTML = '<p style="color:var(--gray-dim);font-size:0.82rem;padding:12px 0">Cart empty. <a href="shop.html" style="color:var(--blue)">Go shopping</a></p>';
  } else {
    container.innerHTML = items.map(i => `
      <div class="order-item">
        <div class="order-item-img">${i.img ? `<img src="${i.img}" alt="${i.name}">` : i.name[0]}</div>
        <div class="order-item-details">
          <div class="order-item-name">${i.name}</div>
          <div class="order-item-qty">Qty: ${i.qty}</div>
        </div>
        <div class="order-item-price">RS${(i.price * i.qty).toFixed(2)}</div>
      </div>`).join(''); // Rebuilds the summary list from current cart state
  }

  if (subEl)   subEl.textContent   = 'RS' + sub.toFixed(2); // Updates subtotal display
  if (totalEl) totalEl.textContent = 'RS' + total.toFixed(2); // Updates final total display

  if (discRow) {
    if (discount.rate > 0) {
      discRow.style.display = 'flex'; // Shows discount row only when a discount applies
      if (discLabel) discLabel.textContent = discount.label;
      if (discEl)    discEl.textContent    = '-RS' + (sub * discount.rate).toFixed(2); // Shows exact discount value
    } else {
      discRow.style.display = 'none'; // Hides discount row when no loyalty discount applies
    }
  }
}

/* ============================================= 
   PAYMENT METHOD TOGGLE
   ============================================= */
function selectPayMethod(btn) {
  document.querySelectorAll('.pay-method').forEach(b => b.classList.remove('active')); // Clears previous payment selection
  btn.classList.add('active'); // Marks the clicked payment method as selected

  const card    = document.getElementById('cardFormFields');
  const alt     = document.getElementById('altPayMessage');
  const preview = document.getElementById('cardPreview');

  if (btn.dataset.method === 'card') {
    if (card)    card.style.display    = 'block'; // Shows card form when card payment is selected
    if (preview) preview.style.display = 'block'; // Shows card preview only for card payments
    if (alt)     alt.style.display     = 'none';
  } else {
    if (card)    card.style.display    = 'none'; // Hides card fields for non-card payments
    if (preview) preview.style.display = 'none';
    if (alt)     alt.style.display     = 'block'; // Shows alternate payment message for non-card methods
  }
}

/* ============================================= 
   POPULATE REVIEW (step 3)
   ============================================= */
function populateReview() {
  const firstName = document.getElementById('firstName')?.value  || '';
  const lastName  = document.getElementById('lastName')?.value   || '';
  const email     = document.getElementById('checkoutEmail')?.value || '';
  const address   = document.getElementById('address')?.value    || '';
  const city      = document.getElementById('city')?.value       || '';
  const method    = document.querySelector('.pay-method.active')?.textContent.trim() || 'Card'; // Uses the currently selected payment method

  const rName    = document.getElementById('reviewName');
  const rEmail   = document.getElementById('reviewEmail');
  const rAddress = document.getElementById('reviewAddress');
  const rMethod  = document.getElementById('reviewMethod');
  const rItems   = document.getElementById('reviewItemsList');
  const rTotal   = document.getElementById('reviewTotal');

  if (rName)    rName.textContent    = firstName + ' ' + lastName; // Mirrors delivery name into review step
  if (rEmail)   rEmail.textContent   = email;
  if (rAddress) rAddress.textContent = address + ', ' + city; // Builds a readable delivery address line
  if (rMethod)  rMethod.textContent  = method;

  const items = Cart.getItems(); // Reuses cart state so review matches the order summary
  if (rItems) {
    rItems.innerHTML = items.map(i => `
      <div class="review-item-row">
        <span>${i.name} × ${i.qty}</span>
        <span class="review-item-price">RS${(i.price * i.qty).toFixed(2)}</span>
      </div>`).join(''); // Renders all reviewed line items from the cart
  }

  if (rTotal) rTotal.textContent = 'RS' + Cart.getTotal().toFixed(2); // Mirrors final payable total into review
}

/* ============================================= 
   PLACE ORDER
   ============================================= */
function placeOrder() {
  if (Cart.getItems().length === 0) {
    Toast.show('Your cart is empty!', true); // Prevents placing an order without cart items
    return;
  }

  const btn = document.getElementById('placeOrderBtn');
  if (btn) { btn.disabled = true; btn.textContent = 'Processing…'; } // Prevents duplicate order submissions

  setTimeout(() => {
    const orderId = 'ORD-' + Date.now(); // Generates a client-side order id
    const items   = Cart.getItems();
    const total   = Cart.getTotal();

    /* Save order to localStorage */
    const newOrder = {
      id:            orderId,
      userId:        Auth.getSession()?.id   || 'guest', // Links the order to the current session when available
      userName:      Auth.getSession()?.name || 'Guest', // Stores display name for order history/admin views
      date:          new Date().toISOString().split('T')[0], // Saves the order date in YYYY-MM-DD format
      items:         items.map(i => ({ productId: i.id, name: i.name, qty: i.qty, price: i.price })), // Stores a snapshot of purchased items
      subtotal:      Cart.getSubtotal(),
      discount:      Cart.getSubtotal() - total, // Stores the discount amount separately for reporting
      total:         total,
      status:        'Processing', // Sets initial order lifecycle state
      paymentMethod: document.querySelector('.pay-method.active')?.textContent.trim() || 'Card', // Saves chosen payment method with the order
    };

    const existing = JSON.parse(localStorage.getItem('shopify_new_orders') || '[]'); // Loads locally created orders
    existing.push(newOrder); // Appends the newly placed order
    localStorage.setItem('shopify_new_orders', JSON.stringify(existing)); // Persists the new order for later pages/admin views

    Auth.recordPurchase(orderId, items, total); // Updates user purchase history and loyalty count
    Cart.clear(); // Empties the cart after successful order creation

    /* Show success */
    const content = document.getElementById('checkoutContent');
    const success = document.getElementById('orderSuccess');
    if (content) content.style.display = 'none'; // Hides the checkout UI after success
    if (success) success.style.display = 'block'; // Reveals the success state

  }, 1500);
}

/* ============================================= 
   INIT
   ============================================= */
document.addEventListener('DOMContentLoaded', () => { // Waits until the page is ready before wiring checkout logic

  Auth.hydrateNav(); // Syncs navbar with the current login session
  initNavSearch();

  /* Redirect if not logged in */
  if (!Auth.isLoggedIn()) {
    Toast.show('Please log in to checkout.', true); // Blocks guest checkout in this flow
    setTimeout(() => { window.location.href = 'login.html'; }, 1200); // Redirects guests to login before checkout
    return;
  }

  /* Pre-fill delivery form from user profile */
  const user = Auth.getSession(); // Reads current session to prefill checkout fields
  if (user) {
    const names = (user.name || '').split(' '); // Splits full name into first and last name fields
    const set   = (id, val) => { const el = document.getElementById(id); if (el) el.value = val; }; // Reuses a safe setter for form prefilling
    set('firstName',     names[0] || '');
    set('lastName',      names.slice(1).join(' ') || '');
    set('checkoutEmail', user.email   || '');
    set('phone',         user.phone   || '');
    set('address',       user.address || '');
  }

  renderOrderSummary(); // Renders the right-side order summary from current cart data

  /* Wire pay method buttons */
  document.querySelectorAll('.pay-method').forEach(btn => {
    btn.addEventListener('click', () => selectPayMethod(btn)); // Binds each payment option to the shared toggle logic
  });

  /* Start at step 1 */
  goToStep(1); // Initializes checkout on the first step
});