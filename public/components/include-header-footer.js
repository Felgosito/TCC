// components/include-header-footer.js
fetch('components/header.html')
  .then(res => res.text())
  .then(html => { document.getElementById('header').innerHTML = html; });

fetch('components/footer.html')
  .then(res => res.text())
  .then(html => { document.getElementById('footer').innerHTML = html; });

// Vercel Web Analytics — HTML estático (sem framework)
(function() {
  window.va = window.va || function() { (window.vaq = window.vaq || []).push(arguments); };
  var script = document.createElement('script');
  script.defer = true;
  script.src = 'https://cdn.vercel-insights.com/v1/script.debug.js';
  script.setAttribute('data-endpoint', 'https://vitals.vercel-insights.com/v2/vitals');
  document.head.appendChild(script);
})();
