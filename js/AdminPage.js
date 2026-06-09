/* =============================================
   SHOPIFY – admin-dashboard.js
   Admin dashboard: stats, users table, stock
   table, orders table, modals, panel switching.
   Loads data from /data/*.json + localStorage.
   ============================================= */

let ALL_USERS  = []; // Stores all loaded users for dashboard state
let ALL_ORDERS = []; // Stores all loaded orders for dashboard state

/* ---- Bootstrap ---- */
document.addEventListener('DOMContentLoaded', async () => { // Waits for the DOM before accessing page elements
  if (!Auth.requireAdmin()) return; // Blocks access if the current session is not admin

  /* Hydrate sidebar user info */
  const admin = Auth.getSession(); // Gets the logged-in admin session data
  document.getElementById('sidebarAvatar').textContent = admin.name[0];
  document.getElementById('sidebarName').textContent   = admin.name;

  /* Load all data */
  await loadProducts(); // Loads PRODUCTS before stock/stats rendering
  ALL_USERS  = await Auth.getAllUsers(); // Loads all users, including any persisted overrides
  ALL_ORDERS = await loadOrders(); // Loads base orders and merges locally saved new orders

  /* Update sidebar badges */
  document.getElementById('usersBadge').textContent  = ALL_USERS.filter(u => u.role !== 'admin').length; // Counts only non-admin users
  document.getElementById('ordersBadge').textContent = ALL_ORDERS.length;

  /* Render all panels */
  renderStats();
  renderRecentOrders();
  renderLowStock();
  renderUsersTable(ALL_USERS.filter(u => u.role !== 'admin'));
  renderStockTable(PRODUCTS);
  renderOrdersTable(ALL_ORDERS);

  /* Mobile sidebar toggle */
  document.getElementById('navHamburger')?.addEventListener('click', () => {
    document.getElementById('adminSidebar').classList.toggle('open'); // Toggles sidebar visibility on small screens
  });
});

/* ---- Load orders from JSON + localStorage new orders ---- */
async function loadOrders() {
  try {
    const data  = await fetch('../data/orders.json').then(r => r.json()); // Loads the seed orders file
    const local = JSON.parse(localStorage.getItem('shopify_new_orders') || '[]'); // Loads locally created orders from browser storage
    return [...data.orders, ...local]; // Merges static and local orders into one list
  } catch { return []; }
}

/* ---- Panel navigation ---- */
function showPanel(name, link) {
  document.querySelectorAll('.admin-panel').forEach(p => {
    p.classList.add('js-hidden');
    p.classList.remove('js-visible');
  });
  document.querySelectorAll('.sidebar-link').forEach(l => l.classList.remove('active'));

  const panel = document.getElementById('panel-' + name); // Resolves the target panel by its dynamic id
  panel.classList.remove('js-hidden');
  panel.classList.add('js-visible');
  if (link) link.classList.add('active');

  /* Close mobile sidebar after navigation */
  document.getElementById('adminSidebar').classList.remove('open');
}

/* ---- Stats cards ---- */
function renderStats() {
  const users   = ALL_USERS.filter(u => u.role !== 'admin'); // Excludes admin from customer stats
  const revenue = ALL_ORDERS.reduce((s, o) => s + (o.total || 0), 0); // Sums all order totals safely
  const low     = PRODUCTS.filter(p => p.stock <= 5).length; // Uses stock threshold for low-stock alerting
  document.getElementById('statRevenue').textContent  = '$' + revenue.toFixed(2);
  document.getElementById('statUsers').textContent    = users.length;
  document.getElementById('statOrders').textContent   = ALL_ORDERS.length;
  document.getElementById('statLowStock').textContent = low;
}

/* ---- Recent orders (dashboard panel) ---- */
function renderRecentOrders() {
  const sc = {
    'Delivered': 'badge-green', 'Shipped': 'badge-blue',
    'Processing': 'badge-blue', 'Pending': 'badge-gray', 'Cancelled': 'badge-red',
  };
  document.getElementById('recentOrdersBody').innerHTML =
    [...ALL_ORDERS]
      .sort((a, b) => b.date.localeCompare(a.date)) // Sorts newest first using ISO-style date strings
      .slice(0, 5) // Limits dashboard preview to the latest 5 orders
      .map(o => `
        <tr>
          <td class="td-id">${o.id}</td>
          <td>${o.userName || o.userId}</td>
          <td class="td-date">${o.date}</td>
          <td class="td-green">$${(o.total || 0).toFixed(2)}</td>
          <td><span class="badge ${sc[o.status] || 'badge-gray'}">${o.status}</span></td>
        </tr>`).join('');
}

/* ---- Low stock (dashboard panel) ---- */
function renderLowStock() {
  const low = PRODUCTS.filter(p => p.stock <= 5); // Reuses the low-stock threshold used in stats
  document.getElementById('lowStockBody').innerHTML = low.length
    ? low.map(p => `
        <tr>
          <td class="td-bold">${p.name}</td>
          <td class="td-gray td-cat">${p.category}</td>
          <td>$${p.price}</td>
          <td><span class="badge ${p.stock === 0 ? 'badge-red' : 'badge-gray'}">${p.stock} left</span></td>
        </tr>`).join('')
    : '<tr><td colspan="4" class="td-empty">All products are well stocked ✓</td></tr>';
}

/* ---- Users table ---- */
function renderUsersTable(users) {
  const discBadge = c =>
    c >= 3 ? '<span class="badge badge-green">10%</span>' :
    c >= 1 ? '<span class="badge badge-blue">5%</span>'   :
             '<span class="badge badge-gray">None</span>'; // Applies discount badge rules from purchase count

  document.getElementById('usersTableBody').innerHTML = users.length
    ? users.map(u => `
        <tr>
          <td><span class="table-avatar">${u.name[0]}</span>${u.name}</td>
          <td class="td-gray">${u.email}</td>
          <td>${u.purchaseCount || 0} orders ${discBadge(u.purchaseCount || 0)}</td>
          <td class="td-date">${u.joined || '—'}</td>
          <td><span class="badge ${u.status === 'active' ? 'badge-green' : 'badge-gray'}">${u.status}</span></td>
          <td>
            <div class="table-actions-cell">
              <button class="btn-table edit"   onclick="openEditUserModal('${u.id}')">Edit</button>
              <button class="btn-table delete" onclick="confirmDeleteUser('${u.id}')">Delete</button>
            </div>
          </td>
        </tr>`).join('')
    : '<tr><td colspan="6" class="td-empty">No users found.</td></tr>';
}

function filterUsersTable(q) {
  renderUsersTable(
    ALL_USERS
      .filter(u => u.role !== 'admin') // Prevents admin accounts from appearing in customer search
      .filter(u => (u.name + u.email).toLowerCase().includes(q.toLowerCase())) // Performs case-insensitive search across name and email
  );
}

/* ---- Stock table ---- */
function renderStockTable(products) {
  const stockClass = n => n <= 3 ? 'low' : n <= 10 ? 'medium' : 'high'; // Maps stock count to UI severity classes
  const stockPct   = n => Math.min(100, Math.round((n / 30) * 100)); // Caps the stock bar width at 100%

  document.getElementById('stockTableBody').innerHTML = products.length
    ? products.map(p => `
        <tr>
          <td class="td-bold">${p.name}</td>
          <td class="td-gray td-cat">${p.category}</td>
          <td>$${p.price}</td>
          <td>
            <div class="stock-bar-wrap">
              <div class="stock-bar">
                <div class="stock-bar-fill ${stockClass(p.stock)}" style="width:${stockPct(p.stock)}%"></div>
              </div>
              <span class="stock-num">${p.stock}</span>
            </div>
          </td>
          <td><button class="btn-table edit" onclick="openEditStockModal('${p.id}')">Edit</button></td>
        </tr>`).join('')
    : '<tr><td colspan="5" class="td-empty">No products.</td></tr>';
}

function filterStockTable(q) {
  renderStockTable(
    PRODUCTS.filter(p => (p.name + p.category).toLowerCase().includes(q.toLowerCase())) // Performs case-insensitive search across product name and category
  );
}

/* ---- Orders table ---- */
function renderOrdersTable(orders) {
  const sc = {
    'Delivered': 'badge-green', 'Shipped': 'badge-blue',
    'Processing': 'badge-blue', 'Pending': 'badge-gray', 'Cancelled': 'badge-red',
  };
  document.getElementById('ordersTableBody').innerHTML = orders.length
    ? orders.map(o => {
        const itemCount = Array.isArray(o.items) ? o.items.length : (o.items || 0); // Supports both detailed item arrays and numeric item counts
        return `
          <tr>
            <td class="td-id">${o.id}</td>
            <td>${o.userName || o.userId}</td>
            <td class="td-date">${o.date}</td>
            <td>${itemCount} item${itemCount !== 1 ? 's' : ''}</td>
            <td class="td-green">$${(o.total || 0).toFixed(2)}</td>
            <td><span class="badge ${sc[o.status] || 'badge-gray'}">${o.status}</span></td>
            <td><button class="btn-table edit" onclick="openOrderDetail('${o.id}')">View</button></td>
          </tr>`;
      }).join('')
    : '<tr><td colspan="7" class="td-empty">No orders.</td></tr>';
}

function filterOrdersTable(q) {
  renderOrdersTable(
    ALL_ORDERS.filter(o =>
      (o.id + (o.userName || '') + o.status).toLowerCase().includes(q.toLowerCase()) // Searches by order id, user name, and status
    )
  );
}

/* ---- Modal: Edit Stock ---- */
function openEditStockModal(id) {
  const p = PRODUCTS.find(x => x.id === id); // Finds the selected product by id
  if (!p) return;
  document.getElementById('editStockName').textContent = p.name;
  document.getElementById('editStockProductId').value  = p.id;
  document.getElementById('editStockQty').value        = p.stock;
  document.getElementById('editStockPrice').value      = p.price;
  openModal('editStockModal');
}

function saveEditStock() {
  const id    = document.getElementById('editStockProductId').value;
  const stock = parseInt(document.getElementById('editStockQty').value, 10); // Forces stock input into an integer
  const price = parseFloat(document.getElementById('editStockPrice').value); // Forces price input into a number
  if (isNaN(stock) || isNaN(price)) { Toast.show('Invalid values', true); return; } // Prevents invalid stock or price from being saved

  saveStockOverride(id, stock, price); // Persists stock changes through the shared override mechanism
  closeModal('editStockModal');
  renderStockTable(PRODUCTS);
  renderLowStock();
  renderStats();
  Toast.show('Stock updated ✓');
}

/* ---- Modal: Edit User ---- */
function openEditUserModal(id) {
  const u = ALL_USERS.find(x => x.id === id); // Finds the selected user by id
  if (!u) return;
  document.getElementById('editUserId').value     = u.id;
  document.getElementById('editUserName').value   = u.name;
  document.getElementById('editUserEmail').value  = u.email;
  document.getElementById('editUserStatus').value = u.status || 'active';
  openModal('editUserModal');
}

function saveEditUser() {
  const id     = document.getElementById('editUserId').value;
  const name   = document.getElementById('editUserName').value.trim(); // Trims user input before saving
  const email  = document.getElementById('editUserEmail').value.trim(); // Trims user input before saving
  const status = document.getElementById('editUserStatus').value;
  const user   = ALL_USERS.find(u => u.id === id); // Updates the matching in-memory user record
  if (!user) return;

  Object.assign(user, { name, email, status }); // Keeps the current UI state in sync immediately

  /* Persist to localStorage override */
  const ov  = JSON.parse(localStorage.getItem('shopify_users_override') || '[]'); // Loads persisted user overrides
  const idx = ov.findIndex(u => u.id === id); // Checks whether this user already has an override entry
  if (idx >= 0) Object.assign(ov[idx], { name, email, status });
  else ov.push({ id, name, email, status });
  localStorage.setItem('shopify_users_override', JSON.stringify(ov)); // Saves user edits so they survive refresh

  closeModal('editUserModal');
  renderUsersTable(ALL_USERS.filter(u => u.role !== 'admin'));
  Toast.show('User updated ✓');
}

function confirmDeleteUser(id) {
  if (!confirm('Delete this user? This cannot be undone.')) return; // Requires confirmation before destructive action

  const idx = ALL_USERS.findIndex(u => u.id === id); // Finds the user in current dashboard state
  if (idx >= 0) ALL_USERS.splice(idx, 1); // Removes the user from the in-memory list immediately

  const ov = JSON.parse(localStorage.getItem('shopify_users_override') || '[]')
    .filter(u => u.id !== id); // Removes any persisted override for the deleted user
  localStorage.setItem('shopify_users_override', JSON.stringify(ov)); // Persists deletion-related override cleanup

  document.getElementById('usersBadge').textContent = ALL_USERS.filter(u => u.role !== 'admin').length; // Refreshes the sidebar user count
  renderUsersTable(ALL_USERS.filter(u => u.role !== 'admin'));
  renderStats();
  Toast.show('User deleted.');
}

/* ---- Modal: Order Detail ---- */
function openOrderDetail(id) {
  const o = ALL_ORDERS.find(x => x.id === id); // Finds the selected order by id
  if (!o) return;

  document.getElementById('orderDetailId').textContent = o.id;

  const items = Array.isArray(o.items)
    ? o.items.map(i => `
        <div class="order-detail-item">
          <span>${i.name} × ${i.qty}</span>
          <span class="order-detail-item-price">$${(i.price * i.qty).toFixed(2)}</span>
        </div>`).join('') // Renders detailed line items when full item data exists
    : `<p class="td-gray">${o.items} item(s)</p>`; // Falls back for orders that store only an item count

  document.getElementById('orderDetailBody').innerHTML = `
    <div class="order-detail-meta">
      <div><div class="order-detail-meta-label">Customer</div><div class="order-detail-meta-value">${o.userName || o.userId}</div></div>
      <div><div class="order-detail-meta-label">Date</div><div>${o.date}</div></div>
      <div><div class="order-detail-meta-label">Status</div><div>${o.status}</div></div>
      <div><div class="order-detail-meta-label">Payment</div><div>${o.paymentMethod || '—'}</div></div>
    </div>
    <div class="order-detail-items-label">Items</div>
    ${items}
    <div class="order-detail-total">
      <span>Total</span>
      <span class="order-detail-total-amount">$${(o.total || 0).toFixed(2)}</span>
    </div>`;

  openModal('orderDetailModal');
}

/* ---- Modal helpers ---- */
function openModal(id)  { document.getElementById(id)?.classList.add('open');    } // Reuses one helper to open any modal by id
function closeModal(id) { document.getElementById(id)?.classList.remove('open'); } // Reuses one helper to close any modal by id

/* Close modals by clicking the overlay backdrop */
document.addEventListener('click', e => {
  if (e.target.classList.contains('modal-overlay')) { // Closes only when the backdrop itself is clicked
    e.target.classList.remove('open');
  }
});