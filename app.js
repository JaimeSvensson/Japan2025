let editingId = null;

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
    dayDiv.innerHTML = `<h3>${date}</h3>`;
    
    // Sortera aktiviteter inom dagen efter tid
    const sortedActs = grouped[date].sort((a, b) => a.time.localeCompare(b.time));

    const ul = document.createElement('ul');
    sortedActs.forEach(act => {
      const li = document.createElement('li');
      li.innerHTML = `<strong>${act.time}</strong> – ${act.place} (${act.note}) 
        <button onclick="editActivity('${act.id}')">Redigera</button>`;
      ul.appendChild(li);
    });

    dayDiv.appendChild(ul);
    container.appendChild(dayDiv);
  });
}

document.getElementById('activity-form').addEventListener('submit', e => {
  e.preventDefault();

  const date = document.getElementById('date').value;
  const time = document.getElementById('time').value;
  const place = document.getElementById('place').value;
  const note = document.getElementById('note').value;

  let activities = JSON.parse(localStorage.getItem('activities') || '[]');

  if (editingId) {
    activities = activities.map(act =>
      act.id === editingId ? { id: act.id, date, time, place, note } : act
    );
    editingId = null;
    document.querySelector('#activity-form button').innerText = 'Lägg till aktivitet';
  } else {
    const newActivity = {
      id: Date.now().toString(),
      date,
      time,
      place,
      note
    };
    activities.push(newActivity);
  }

  localStorage.setItem('activities', JSON.stringify(activities));
  document.getElementById('activity-form').reset();
  renderActivities();
});

function editActivity(id) {
  const activities = JSON.parse(localStorage.getItem('activities') || '[]');
  const activity = activities.find(a => a.id === id);

  if (activity) {
    document.getElementById('date').value = activity.date;
    document.getElementById('time').value = activity.time;
    document.getElementById('place').value = activity.place;
    document.getElementById('note').value = activity.note;
    editingId = id;
    document.querySelector('#activity-form button').innerText = 'Spara ändring';
  }
}

window.onload = () => showPage('plan');
