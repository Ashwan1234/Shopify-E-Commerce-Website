/* =============================================
   SHOPIFY – index.js
   Homepage init: nav hydration, scroll rows,
   nav search redirect, watch video button.
   ============================================= */

document.addEventListener('DOMContentLoaded', () => { // Waits until the page is ready before binding UI logic
  Auth.hydrateNav(); // Updates navbar state based on the current session

  /* Render horizontal scroll rows */
  renderScrollRow('consolesRow',    'consoles'); // Loads homepage products for the consoles section
  renderScrollRow('controllersRow', 'controllers'); // Loads homepage products for the controllers section
  renderScrollRow('audioRow',       'audio'); // Loads homepage products for the audio section

  /* Nav search on homepage redirects to shop.html */
  document.getElementById('navSearchBtn').addEventListener('click', () => {
    const q = document.getElementById('navSearchInput').value.trim(); // Trims whitespace so empty searches do not redirect
    if (q) window.location.href = `Shop.html?q=${encodeURIComponent(q)}`; // Safely passes the search term in the URL
  });

  document.getElementById('navSearchInput').addEventListener('keydown', e => {
    if (e.key === 'Enter') document.getElementById('navSearchBtn').click(); // Reuses the same search flow on Enter
  });

  /* Watch video smooth scroll */
  document.getElementById('watchVideoBtn').addEventListener('click', () => {
    document.getElementById('video-section').scrollIntoView({ behavior: 'smooth' }); // Smoothly jumps to the video section
  });
});