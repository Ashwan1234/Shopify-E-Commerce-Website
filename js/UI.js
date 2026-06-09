/* =============================================
   SHOPIFY – ui.js
   Toast notifications, mobile nav toggle,
   active nav link highlight, misc UI helpers.
   ============================================= */

/* ---------- TOAST ---------- */
const Toast = (() => {
  let timer = null; // Keeps only one active toast timeout

  function show(message, isError = false) {
    let el = document.getElementById('toast');

    /* Create if not in DOM */
    if (!el) {
      el = document.createElement('div');
      el.id = 'toast';
      document.body.appendChild(el); // Creates the toast once and reuses it
    }

    el.textContent = message;
    el.className   = isError ? 'error' : ''; // Switches toast styling for error state

    /* Force reflow so transition fires */
    void el.offsetWidth; // Forces the browser to restart the CSS transition
    el.classList.add('show');

    clearTimeout(timer); // Prevents overlapping hide timers
    timer = setTimeout(() => el.classList.remove('show'), 3000); // Auto-hides the toast after 3 seconds
  }

  return { show };
})();

/* ---------- MOBILE NAV ---------- */
function initMobileNav() {
  const hamburger  = document.getElementById('navHamburger');
  const mobileMenu = document.getElementById('mobileMenu');
  if (!hamburger || !mobileMenu) return; // Avoids errors on pages without mobile nav

  hamburger.addEventListener('click', () => {
    mobileMenu.classList.toggle('open'); // Opens/closes the mobile menu
    hamburger.textContent = mobileMenu.classList.contains('open') ? '✕' : '☰'; // Keeps the icon in sync with menu state
  });

  /* Close on outside click */
  document.addEventListener('click', e => {
    if (!hamburger.contains(e.target) && !mobileMenu.contains(e.target)) { // Closes only when clicking outside both elements
      mobileMenu.classList.remove('open');
      hamburger.textContent = '☰';
    }
  });
}

/* ---------- ACTIVE NAV LINK ---------- */
function setActiveNavLink() {
  const page = window.location.pathname.split('/').pop() || 'index.html'; // Gets the current page filename for nav matching
  document.querySelectorAll('.nav-links a, .mobile-menu a').forEach(link => {
    const href = link.getAttribute('href')?.split('/').pop();
    if (href === page) link.classList.add('active'); // Highlights the link that matches the current page
  });
}

/* ---------- SMOOTH SCROLL ANCHORS ---------- */
function initAnchorScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', e => {
      const target = document.querySelector(anchor.getAttribute('href'));
      if (!target) return; // Prevents errors for missing anchor targets
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' }); // Replaces jump navigation with smooth scrolling
    });
  });
}

/* ---------- PASSWORD TOGGLE ---------- */
function togglePassword(inputId, btnId) {
  const input = document.getElementById(inputId);
  const btn   = document.getElementById(btnId);
  if (!input || !btn) return; // Avoids errors if the field or button is missing
  if (input.type === 'password') {
    input.type  = 'text'; // Reveals the password text
    btn.textContent = 'Hide';
  } else {
    input.type  = 'password'; // Hides the password text again
    btn.textContent = 'Show';
  }
}

/* ---------- FORM VALIDATION HELPERS ---------- */
const Validate = {
  email(val) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val); // Checks basic email format
  },
  password(val) {
    return val.length >= 8; // Enforces minimum password length
  },
  required(val) {
    return val.trim().length > 0; // Rejects empty or whitespace-only input
  },
  showError(fieldId, msg) {
    const field = document.getElementById(fieldId);
    if (!field) return; // Prevents errors for missing fields
    /* Remove existing error */
    field.parentElement.querySelector('.form-error')?.remove(); // Prevents duplicate error messages
    field.style.borderColor = 'var(--red)'; // Highlights the invalid field
    const err = document.createElement('span');
    err.className = 'form-error';
    err.textContent = msg;
    field.parentElement.appendChild(err); // Inserts the error message next to the field
  },
  clearError(fieldId) {
    const field = document.getElementById(fieldId);
    if (!field) return;
    field.style.borderColor = '';
    field.parentElement.querySelector('.form-error')?.remove(); // Removes the field-specific error message
  },
  clearAll(formId) {
    const form = document.getElementById(formId);
    if (!form) return; // Prevents errors if the form is missing
    form.querySelectorAll('input, select').forEach(f => f.style.borderColor = ''); // Resets all field error styling
    form.querySelectorAll('.form-error').forEach(e => e.remove()); // Removes all validation messages in the form
  },
};

/* ---------- CARD NUMBER FORMATTING ---------- */
function formatCardNumber(input) {
  let val = input.value.replace(/\D/g, '').substring(0, 16); // Keeps only digits and limits card number length
  input.value = val.replace(/(.{4})/g, '$1 ').trim(); // Formats the card number in groups of 4

  /* Update preview */
  const preview = document.getElementById('cardNumberDisplay');
  if (preview) {
    const padded = (val + '0000000000000000').substring(0, 16); // Pads preview so the card UI always looks complete
    preview.textContent = padded.replace(/(.{4})/g, '$1 ').trim();
  }
}

function formatExpiry(input) {
  let val = input.value.replace(/\D/g, '').substring(0, 4); // Keeps only digits and limits expiry length
  if (val.length >= 3) val = val.substring(0, 2) + '/' + val.substring(2); // Inserts slash after MM
  input.value = val;

  const preview = document.getElementById('cardExpiryDisplay');
  if (preview) preview.textContent = val || 'MM/YY'; // Keeps the card preview synced with input
}

function formatCVV(input) {
  input.value = input.value.replace(/\D/g, '').substring(0, 4); // Restricts CVV to digits only
}

/* ---------- INIT ---------- */
document.addEventListener('DOMContentLoaded', () => { // Waits until the DOM is ready before wiring shared UI helpers
  initMobileNav();
  setActiveNavLink();
  initAnchorScroll();
});