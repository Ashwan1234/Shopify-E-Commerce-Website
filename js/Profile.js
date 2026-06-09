/* =============================================
   SHOPIFY – profile.js
   User profile page: hydrate data from session,
   edit mode toggle, save changes, order history,
   loyalty card, account deletion.
   ============================================= */

let editMode = false; // Tracks whether profile fields are currently editable

/* ---- Populate all profile elements from session ---- */
function hydrateProfile() {
  Auth.requireLogin('login.html'); // Protects the profile page from guests
  const user = Auth.getSession(); // Loads the current logged-in user from session
  if (!user) return;

  /* Header */
  document.getElementById('profileAvatar').textContent = user.name[0].toUpperCase(); // Uses the user's first initial as avatar
  document.getElementById('profileName').textContent   = user.name;
  document.getElementById('profileEmail').textContent  = user.email;
  document.getElementById('profileSince').textContent  = `Member since ${user.joined || 'N/A'}`;

  /* Stats */
  const pc = user.purchaseCount || 0; // Uses purchase count to drive loyalty and stats UI
  document.getElementById('statOrders').textContent   = pc;
  document.getElementById('statDiscount').textContent = pc >= 3 ? '10%' : pc >= 1 ? '5%' : '—'; // Derives discount tier from purchase count

  /* Loyalty card */
  const pct = Math.min(100, Math.round((pc / 3) * 100)); // Converts loyalty progress into a capped progress-bar width
  document.getElementById('loyaltyProgressFill').style.width = pct + '%';
  document.getElementById('loyaltyBarLabel').textContent     = `${pc} purchase${pc !== 1 ? 's' : ''}`;

  if (pc >= 3) {
    document.getElementById('loyaltyTier').textContent     = 'GOLD MEMBER'; // Applies the highest loyalty tier
    document.getElementById('loyaltyName').textContent     = 'Gold Loyalty';
    document.getElementById('loyaltyDiscount').textContent = '10% off every order — automatically applied';
    document.getElementById('loyaltyBarMax').textContent   = 'Max discount unlocked!';
  } else if (pc >= 1) {
    document.getElementById('loyaltyTier').textContent     = 'SILVER MEMBER'; // Applies the mid loyalty tier after first purchase
    document.getElementById('loyaltyName').textContent     = 'Silver Loyalty';
    document.getElementById('loyaltyDiscount').textContent = '5% off your next order!';
    document.getElementById('loyaltyBarMax').textContent   = `${3 - pc} more for 10% off`; // Shows progress remaining to reach gold
  } else {
    document.getElementById('loyaltyBarMax').textContent = '1 purchase for 5% off';
  }

  /* Form pre-fill */
  document.getElementById('editName').value    = user.name;
  document.getElementById('editEmail').value   = user.email;
  document.getElementById('editPhone').value   = user.phone   || '';
  document.getElementById('editAddress').value = user.address || '';

  /* Order history */
  const orders = user.orders || []; // Uses the session order history for profile display
  const body   = document.getElementById('orderHistoryBody');

  if (orders.length === 0) {
    body.innerHTML = `<p class="profile-empty-text">
      No orders yet.
      <a href="shop.html" class="profile-link">Start shopping →</a>
    </p>`;
  } else {
    body.innerHTML = orders.map(o => `
      <div class="order-history-item">
        <div>
          <div class="order-id">${o.id}</div>
          <div class="order-date">${o.date}</div>
        </div>
        <div class="order-items-count">${o.items} item${o.items !== 1 ? 's' : ''}</div>
        <div>
          <div class="order-total">$${typeof o.total === 'number' ? o.total.toFixed(2) : o.total}</div> // Safely formats totals whether stored as number or string
          <div class="order-status">${o.status}</div>
        </div>
      </div>`).join('');
  }
}

/* ---- Toggle edit mode on/off ---- */
function toggleEditMode() {
  editMode = !editMode; // Flips edit state between read-only and editable
  ['editName', 'editPhone', 'editAddress'].forEach(id => {
    document.getElementById(id).disabled = !editMode; // Locks or unlocks editable profile fields together
  });
  document.getElementById('saveProfileBtn').classList.toggle('js-hidden', !editMode); // Shows save button only in edit mode
  document.getElementById('editToggleBtn').textContent = editMode ? 'Cancel' : 'Edit'; // Reuses one button for both actions
}

/* ---- Save profile changes ---- */
function saveProfile(e) {
  e.preventDefault(); // Prevents normal form submission/reload
  const name    = document.getElementById('editName').value.trim(); // Trims input before validation and save
  const phone   = document.getElementById('editPhone').value.trim();
  const address = document.getElementById('editAddress').value.trim();

  if (!name) { Validate.showError('editName', 'Name is required'); return; } // Blocks saving without a name

  Auth.updateProfile({ name, phone, address }); // Persists profile changes into session and overrides
  toggleEditMode();
  hydrateProfile(); // Refreshes the profile UI from the updated session data
  Toast.show('Profile updated ✓');
}

/* ---- Delete account ---- */
function confirmDeleteAccount() {
  if (!confirm('Are you sure? This will sign you out and clear your data.')) return; // Requires confirmation before destructive action
  localStorage.removeItem('shopify_session'); // Signs the user out locally
  localStorage.removeItem('shopify_cart'); // Clears any leftover cart data
  Toast.show('Account removed. Goodbye!');
  setTimeout(() => { window.location.href = 'index.html'; }, 1200); // Redirects away after deletion feedback
}

/* ---- Init ---- */
document.addEventListener('DOMContentLoaded', () => {
  Auth.hydrateNav(); // Syncs navbar with current login state
  initNavSearch();
  hydrateProfile(); // Populates the full profile page on load
});