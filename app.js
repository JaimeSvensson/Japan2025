function showPage(page) {
  document.querySelectorAll('.page').forEach(p => p.style.display = 'none');
  document.getElementById(page).style.display = 'block';
  if (page === 'plan') renderActivities();
}

function renderActivities() {
  const container = document.getElementById('activity-list');
  container.innerHTML = '';

  const activities = JSON.parse(localStorage.getItem('activities') || '[]');
  const grouped = {};

  activities.forEach(act => {
    if (!grouped[act.date]) grouped[act.date] = [];
    grouped[act.date].push(act);
  });

  Object.keys(grouped).sort().forEach(date => {
    const dayDiv = document.createElement('div');
    dayDiv.innerHTML = `<h3>${date}</h3><ul>` + grouped[date].map(act =>
      `<li><strong>${act.time}</strong> – ${act.place} (${act.note})</li>`
    ).join('') + '</ul>';
    container.appendChild(dayDiv);
  });
}

document.getElementById('activity-form').addEventListener('submit', e => {
  e.preventDefault();
  const activity = {
    date: document.getElementById('date').value,
    time: document.getElementById('time').value,
    place: document.getElementById('place').value,
    note: document.getElementById('note').value
  };

  const activities = JSON.parse(localStorage.getItem('activities') || '[]');
  activities.push(activity);
  localStorage.setItem('activities', JSON.stringify(activities));

  document.getElementById('activity-form').reset();
  renderActivities();
});

window.onload = () => showPage('plan');
