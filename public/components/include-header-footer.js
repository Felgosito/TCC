// components/include-header-footer.js
fetch('components/header.html')
  .then(res => res.text())
  .then(html => { document.getElementById('header').innerHTML = html; });

fetch('components/footer.html')
  .then(res => res.text())
  .then(html => { document.getElementById('footer').innerHTML = html; });

// Vercel Web Analytics — contabiliza visitantes e page views
(function() {
  var script = document.createElement('script');
  script.defer = true;
  script.src = '/_vercel/insights/script.js';
  document.head.appendChild(script);
})();
