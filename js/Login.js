/* =============================================
   SHOPIFY – login.js
   Login page: role toggle (user / admin),
   form validation, Auth.login() call,
   redirect on success.
   ============================================= */

let currentRole = 'user';

/* ---- Role toggle ---- */
function setRole(role) {
  currentRole = role;
  const userBtn   = document.getElementById('roleUser');
  const adminBtn  = document.getElementById('roleAdmin');
  const indicator = document.getElementById('adminIndicator');
  const card      = document.getElementById('authCard');
  const loginBtn  = document.getElementById('loginBtn');

  if (role === 'admin') {
    userBtn.classList.remove('active');
    adminBtn.classList.add('active');
    indicator.classList.remove('js-hidden');
    card.classList.add('admin-card');
    loginBtn.classList.add('admin');
    document.getElementById('authTitle').textContent    = 'Admin Portal';
    document.getElementById('authSubtitle').textContent = 'Restricted to authorised personnel only.';
    /* Pre-fill admin demo credentials */
    document.getElementById('loginEmail').value    = 'admin@shopify.mu';
    document.getElementById('loginPassword').value = 'admin1234';
  } else {
    adminBtn.classList.remove('active');
    userBtn.classList.add('active');
    indicator.classList.add('js-hidden');
    card.classList.remove('admin-card');
    loginBtn.classList.remove('admin');
    document.getElementById('authTitle').textContent    = 'Welcome back';
    document.getElementById('authSubtitle').textContent = 'Sign in to your account to continue.';
    document.getElementById('loginEmail').value    = '';
    document.getElementById('loginPassword').value = '';
  }
}

/* ---- Form submit ---- */
async function handleLogin(e) {
  e.preventDefault();
  Validate.clearAll('loginForm');

  const email    = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;
  const btn      = document.getElementById('loginBtn');

  let ok = true;
  if (!Validate.email(email))       { Validate.showError('loginEmail',    'Enter a valid email address'); ok = false; }
  if (!Validate.required(password)) { Validate.showError('loginPassword', 'Password is required');        ok = false; }
  if (!ok) return;

  btn.disabled    = true;
  btn.textContent = 'Signing in…';

  try {
    const user = await Auth.login(email, password);

    /* Block admin-tab login with a non-admin account */
    if (currentRole === 'admin' && user.role !== 'admin') {
      Toast.show('Access denied — not an admin account.', true);
      btn.disabled = false;
      btn.textContent = 'Sign In →';
      return;
    }

    Toast.show(`Welcome back, ${user.name.split(' ')[0]}! ✓`);
    setTimeout(() => {
      window.location.href = user.role === 'admin' ? 'adminpagem.html' : 'index.html';
    }, 800);

  } catch (err) {
    Toast.show(err.message, true);
    btn.disabled    = false;
    btn.textContent = 'Sign In →';
  }
}

/* ---- Init ---- */
document.addEventListener('DOMContentLoaded', () => {
  /* Redirect away if already logged in */
  const user = Auth.getSession();
  if (user) {
    window.location.href = user.role === 'admin' ? 'adminpagem.html' : 'index.html';
  }
});