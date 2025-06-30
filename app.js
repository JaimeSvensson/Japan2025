function showPage(page) {
  document.querySelectorAll('.page').forEach(p => p.style.display = 'none');
  document.getElementById(page).style.display = 'block';
  renderPage(page);
}

function renderPage(page) {
  const el = document.getElementById(page);
  el.innerHTML = '';

  if (page === 'plan') {
    el.innerHTML = '<h2>Reseplan</h2><ul><li>Dag 1 – Ankomst till Tokyo</li><li>Dag 2 – Sightseeing i Shibuya</li></ul>';
  } else if (page === 'costs') {
    el.innerHTML = '<h2>Kostnader</h2><p>Ej implementerat ännu</p>';
  } else if (page === 'packing') {
    el.innerHTML = '<h2>Packlista</h2><ul><li>Pass ✅</li><li>Kamera</li></ul>';
  } else if (page === 'notes') {
    el.innerHTML = '<h2>Viktig Information</h2><p>Boendeadress: Tokyo Inn, XYZ Street</p>';
  }
}

window.onload = () => showPage('plan');
