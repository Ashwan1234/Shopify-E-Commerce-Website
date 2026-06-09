/* =============================================
   SHOPIFY – register.js
   Registration page: form validation,
   Auth.register() call, redirect on success.
   ============================================= */

/* ---- Form submit ---- */
async function handleRegister(e) {
  e.preventDefault(); // Prevents normal form submission/reload
  Validate.clearAll('registerForm'); // Clears old validation errors before re-validating

  const firstName = document.getElementById('regFirstName').value.trim(); // Trims whitespace before validation
  const lastName  = document.getElementById('regLastName').value.trim(); // Trims whitespace before validation
  const email     = document.getElementById('regEmail').value.trim(); // Trims whitespace before validation
  const phone     = document.getElementById('regPhone').value.trim();
  const password  = document.getElementById('regPassword').value;
  const confirm   = document.getElementById('regConfirm').value;
  const agreed    = document.getElementById('agreeTerms').checked; // Ensures terms acceptance is explicitly checked
  const btn       = document.getElementById('registerBtn');

  let ok = true;
  if (!Validate.required(firstName)) { Validate.showError('regFirstName', 'First name is required'); ok = false; } // Blocks empty first name
  if (!Validate.required(lastName))  { Validate.showError('regLastName',  'Last name is required');  ok = false; } // Blocks empty last name
  if (!Validate.email(email))        { Validate.showError('regEmail',     'Enter a valid email');    ok = false; } // Blocks invalid email format
  if (!Validate.password(password))  { Validate.showError('regPassword',  'Minimum 8 characters');  ok = false; } // Enforces minimum password rules
  if (password !== confirm)          { Validate.showError('regConfirm',   'Passwords do not match'); ok = false; } // Ensures password confirmation matches
  if (!agreed) { Toast.show('Please accept the Terms of Service.', true); ok = false; } // Blocks registration until terms are accepted
  if (!ok) return; // Stops registration when validation fails

  btn.disabled    = true; // Prevents duplicate submissions while registration is in progress
  btn.textContent = 'Creating account…'; // Gives visible loading feedback

  try {
    await Auth.register(`${firstName} ${lastName}`, email, password, phone); // Creates the user and starts a session
    Toast.show(`Account created! Welcome, ${firstName}! ✓`);
    setTimeout(() => { window.location.href = 'index.html'; }, 900); // Redirects after successful registration
  } catch (err) {
    Toast.show(err.message, true); // Shows registration failure feedback from Auth.register()
    btn.disabled    = false; // Re-enables the form after failed registration
    btn.textContent = 'Create Account →';
  }
}

/* ---- Init ---- */
document.addEventListener('DOMContentLoaded', () => {
  /* Redirect away if already logged in */
  if (Auth.isLoggedIn()) window.location.href = 'index.html'; // Prevents logged-in users from reopening the register page
});