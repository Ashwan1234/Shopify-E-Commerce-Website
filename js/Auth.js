/* =============================================
   SHOPIFY – auth.js
   Loads users from /data/users.json.
   Auto-detects path depth so it works from
   both root (index.html) and /pages/*.html.
   Falls back to embedded users if fetch fails.
   ============================================= */

const Auth = (() => {

  let _users = null; // Caches merged users in memory

  /* ---- Detect correct path to /data/ ---- */
  function _dataPath(filename) {
    const inSubfolder = window.location.pathname.includes('/pages/'); // Detects whether current page is inside /pages/
    return (inSubfolder ? '../data/' : 'data/') + filename; // Resolves the correct relative path to /data/
  }

  /* ---- Embedded fallback users ---- */
  const USERS_FALLBACK = [ // Ensures auth still works if users.json cannot be fetched
    { id:'u1', name:'Alex Martin',   email:'alex@shopify.mu',   password:'user1234',  role:'user',  phone:'+230 5000 0001', address:'12 Royal Road, Curepipe',          purchaseCount:2, joined:'2024-11-03', status:'active',   orders:[{ id:'ORD-001', date:'2025-01-10', items:2, total:578,  status:'Delivered' },{ id:'ORD-004', date:'2025-03-22', items:1, total:249, status:'Delivered' }] },
    { id:'u2', name:'Sarah Dupont',  email:'sarah@shopify.mu',  password:'user1234',  role:'user',  phone:'+230 5000 0002', address:'45 Bourbon Street, Port Louis',     purchaseCount:0, joined:'2025-01-15', status:'active',   orders:[] },
    { id:'u3', name:'Ryan Ng',       email:'ryan@shopify.mu',   password:'user1234',  role:'user',  phone:'+230 5000 0003', address:'8 La Paix Street, Rose Hill',       purchaseCount:5, joined:'2024-09-20', status:'active',   orders:[{ id:'ORD-002', date:'2024-10-05', items:1, total:499, status:'Delivered' }] },
    { id:'u4', name:'Marie Leclaire',email:'marie@shopify.mu',  password:'user1234',  role:'user',  phone:'+230 5000 0004', address:'22 Avenue des Fleurs, Vacoas',      purchaseCount:1, joined:'2025-02-08', status:'inactive', orders:[{ id:'ORD-006', date:'2025-02-20', items:1, total:79,  status:'Delivered' }] },
    { id:'u5', name:'Javed Patel',   email:'javed@shopify.mu',  password:'user1234',  role:'user',  phone:'+230 5000 0005', address:'3 Nehru Street, Quatre Bornes',     purchaseCount:3, joined:'2024-12-01', status:'active',   orders:[{ id:'ORD-008', date:'2024-12-25', items:2, total:368, status:'Delivered' }] },
    { id:'a1', name:'Admin',         email:'admin@shopify.mu',  password:'admin1234', role:'admin', phone:'+230 5000 0000', address:'XYZ Master HQ, Port Louis',         purchaseCount:0, joined:'2024-01-01', status:'active',   orders:[] },
  ];

  /* ---- Load users.json ---- */
  async function loadUsers() {
    if (_users) return _users; // Reuses cache to avoid repeated fetch/merge work
    try {
      const res  = await fetch(_dataPath('users.json')); // Loads the main users source file
      if (!res.ok) throw new Error('fetch failed'); // Forces fallback path on bad HTTP response
      const base  = await res.json();
      const local = JSON.parse(localStorage.getItem('shopify_users_override') || '[]'); // Loads local user overrides
      const map   = {};
      base.users.forEach(u => map[u.id] = u); // Seeds map with base users keyed by id
      local.forEach(u => { map[u.id] = { ...(map[u.id] || {}), ...u }; }); // Applies local overrides on top of base users
      _users = Object.values(map); // Stores merged users as the active in-memory source
    } catch {
      /* Fallback: use embedded users so login always works */
      const local = JSON.parse(localStorage.getItem('shopify_users_override') || '[]'); // Preserves local overrides even in fallback mode
      const map   = {};
      USERS_FALLBACK.forEach(u => map[u.id] = u); // Seeds map with embedded fallback users
      local.forEach(u => { map[u.id] = { ...(map[u.id] || {}), ...u }; }); // Applies local overrides on top of fallback users
      _users = Object.values(map); // Keeps auth working without external data
    }
    return _users;
  }

  /* ---- Session ---- */
  function setSession(user) {
    const { password: _, ...safe } = user; // Excludes password before storing session data
    localStorage.setItem('shopify_session', JSON.stringify(safe)); // Persists the logged-in session in browser storage
  }
  function getSession() {
    try { return JSON.parse(localStorage.getItem('shopify_session')); } catch { return null; } // Safely reads session from browser storage
  }
  function clearSession() { localStorage.removeItem('shopify_session'); } // Clears the current login session
  function isLoggedIn()   { return !!getSession(); } // Checks whether any session exists
  function isAdmin()      { return getSession()?.role === 'admin'; } // Restricts admin-only pages/actions by role

  /* ---- Guards ---- */
  function requireLogin(r = 'login.html') { if (!isLoggedIn()) { window.location.href = r; return false; } return true; } // Redirects guests away from protected pages
  function requireAdmin(r = 'login.html') { if (!isAdmin())    { window.location.href = r; return false; } return true; } // Redirects non-admin users away from admin pages
  function requireGuest(r = 'index.html')       { if (isLoggedIn())  { window.location.href = r; return false; } return true; } // Prevents logged-in users from revisiting guest-only pages

  /* ---- Login ---- */
  async function login(email, password) {
    const users = await loadUsers(); // Ensures the latest merged user list is available
    const user  = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password); // Matches login by case-insensitive email and exact password
    if (!user) throw new Error('Invalid email or password.');
    setSession(user); // Starts the authenticated browser session
    return getSession();
  }

  /* ---- Register ---- */
  async function register(name, email, password, phone = '') {
    const users = await loadUsers();
    if (users.find(u => u.email.toLowerCase() === email.toLowerCase()))
      throw new Error('An account with this email already exists.'); // Prevents duplicate accounts by email
    const newUser = {
      id: 'u' + Date.now(), name, email, password, role: 'user', phone, // Generates a client-side user id
      address: '', purchaseCount: 0,
      joined: new Date().toISOString().split('T')[0], // Stores joined date in YYYY-MM-DD format
      status: 'active', orders: [],
    };
    const local = JSON.parse(localStorage.getItem('shopify_users_override') || '[]'); // Uses overrides storage as the writable user store
    local.push(newUser); // Adds the new user locally
    localStorage.setItem('shopify_users_override', JSON.stringify(local)); // Persists the registered user
    _users = null; // Invalidates cache so future reads include the new user
    setSession(newUser); // Auto-logs in immediately after registration
    return getSession();
  }

  /* ---- Logout ---- */
  function logout() {
    clearSession();
    window.location.href = 'login.html'; // Sends the user back to the login page after logout
  }

  /* ---- Record purchase ---- */
  function recordPurchase(orderId, items, total) {
    const session = getSession();
    if (!session) return; // Prevents purchase writes when no user is logged in
    session.purchaseCount = (session.purchaseCount || 0) + 1; // Keeps loyalty/order count in sync
    if (!session.orders) session.orders = [];
    session.orders.unshift({
      id:     orderId || 'ORD-' + Date.now(), // Generates a fallback order id when needed
      date:   new Date().toISOString().split('T')[0], // Stores the purchase date in YYYY-MM-DD format
      items:  items?.length || 0,
      total:  total || 0,
      status: 'Processing',
    });
    localStorage.setItem('shopify_session', JSON.stringify(session)); // Updates the current session immediately
    localStorage.setItem('shopify_purchases', String(session.purchaseCount)); // Stores purchase count separately for quick access elsewhere
    _persistUserOverride(session.id, { purchaseCount: session.purchaseCount, orders: session.orders }); // Persists purchase history to the user override store
  }

  /* ---- Update profile ---- */
  function updateProfile(fields) {
    const session = getSession();
    if (!session) return; // Prevents profile updates without an active session
    const updated = { ...session, ...fields }; // Merges only the changed profile fields
    localStorage.setItem('shopify_session', JSON.stringify(updated)); // Keeps session profile data current
    _persistUserOverride(session.id, fields); // Persists profile changes to the override store
    return getSession();
  }

  function _persistUserOverride(id, fields) {
    try {
      const overrides = JSON.parse(localStorage.getItem('shopify_users_override') || '[]'); // Loads the writable override store
      const idx = overrides.findIndex(u => u.id === id); // Checks whether an override already exists for this user
      if (idx >= 0) Object.assign(overrides[idx], fields);
      else overrides.push({ id, ...fields });
      localStorage.setItem('shopify_users_override', JSON.stringify(overrides)); // Saves merged override changes back to storage
    } catch {}
  }

  /* ---- Hydrate nav bar ---- */
  function hydrateNav() {
    const user     = getSession();
    const btnUser  = document.getElementById('navUserBtn');
    const btnLogin = document.getElementById('navLoginBtn');
    if (!btnUser && !btnLogin) return; // Avoids errors on pages without nav auth buttons

    if (user) {
      if (btnUser) {
        btnUser.classList.remove('nav-hidden');
        btnUser.classList.add('js-flex');
        btnUser.textContent = user.name.split(' ')[0]; // Shows only the user's first name in the navbar
        btnUser.onclick = () => {
          window.location.href = user.role === 'admin'
            ? 'AdminPage.html'
            : 'UserPage.html'; // Routes users to the correct dashboard by role
        };
      }
      if (btnLogin) btnLogin.classList.add('nav-hidden'); // Hides login button when authenticated
    } else {
      if (btnUser)  btnUser.classList.add('nav-hidden'); // Hides user button when logged out
      if (btnLogin) btnLogin.classList.remove('nav-hidden'); // Shows login button for guests
    }
  }

  async function getAllUsers() { return loadUsers(); } // Exposes the merged user list to other modules

  return {
    login, register, logout, recordPurchase, updateProfile,
    getSession, isLoggedIn, isAdmin,
    requireLogin, requireAdmin, requireGuest,
    hydrateNav, getAllUsers,
  };

})();