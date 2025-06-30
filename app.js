
// Firebase-import via CDN (eftersom vi inte använder bundler)
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, updateDoc, deleteDoc, doc, onSnapshot, setDoc } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";

// Din firebaseConfig
const firebaseConfig = {
  apiKey: "AIzaSyD4ifyIMcPdPfxfji5qkttFtMNafeHyn_I",
  authDomain: "japan2025-pwa.firebaseapp.com",
  projectId: "japan2025-pwa",
  storageBucket: "japan2025-pwa.firebasestorage.app",
  messagingSenderId: "1086888213462",
  appId: "1:1086888213462:web:7085048c154f6cea258277"
};

// Initiera Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const activitiesRef = collection(db, "activities");

let editingId = null;

// 🧠 Konvertera datum till svensk datumtext
function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("sv-SE", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric"
  });
}

// 🔔 Toast-funktion
function showToast(msg) {
  const toast = document.createElement("div");
  toast.innerText = msg;
  toast.style.position = "fixed";
  toast.style.bottom = "20px";
  toast.style.left = "50%";
  toast.style.transform = "translateX(-50%)";
  toast.style.background = "#333";
  toast.style.color = "#fff";
  toast.style.padding = "10px 20px";
  toast.style.borderRadius = "8px";
  toast.style.zIndex = 9999;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 2500);
}

// 🎨 Rendera reseplan
function renderActivities(snapshot) {
  const container = document.getElementById("activity-list");
  container.innerHTML = "";
  const grouped = {};

  snapshot.forEach(doc => {
    const act = doc.data();
    act.id = doc.id;
    if (!grouped[act.date]) grouped[act.date] = [];
    grouped[act.date].push(act);
  });

  Object.keys(grouped).sort().forEach(date => {
    const dayBox = document.createElement("div");
    dayBox.className = "day-box";
    const formattedDate = formatDate(date);
    dayBox.innerHTML = `<h3>${formattedDate}</h3><ul></ul>`;
    const ul = dayBox.querySelector("ul");

    grouped[date]
      .sort((a, b) => a.time.localeCompare(b.time))
      .forEach(act => {
        const li = document.createElement("li");
        li.innerHTML = `
          <div class="activity-row">
            <span><strong>${act.time}</strong> – ${act.place} (${act.note})</span>
            <span>
              <span class="icon-btn" onclick="confirmEdit('${act.id}', '${act.date}', '${act.time}', '${act.place}', '${act.note}')">📝</span>
              <span class="icon-btn" onclick="confirmDelete('${act.id}')">🗑️</span>
            </span>
          </div>
        `;
        ul.appendChild(li);
      });

    container.appendChild(dayBox);
  });
}

// 🔃 Realtidslyssnare
onSnapshot(activitiesRef, renderActivities);

// Formulärhantering
document.getElementById("activity-form").addEventListener("submit", async e => {
  e.preventDefault();
  const date = document.getElementById("date").value;
  const time = document.getElementById("time").value;
  const place = document.getElementById("place").value;
  const note = document.getElementById("note").value;

  if (editingId) {
    const activityRef = doc(db, "activities", editingId);
    await updateDoc(activityRef, { date, time, place, note });
    showToast("Aktiviteten har uppdaterats");
    editingId = null;
    document.querySelector("#activity-form button").innerText = "Lägg till aktivitet";
  } else {
    await addDoc(activitiesRef, { date, time, place, note });
    showToast("Aktivitet tillagd");
  }

  document.getElementById("activity-form").reset();
});

window.confirmEdit = (id, date, time, place, note) => {
  if (!confirm("Vill du redigera denna aktivitet?")) return;
  editingId = id;
  document.getElementById("date").value = date;
  document.getElementById("time").value = time;
  document.getElementById("place").value = place;
  document.getElementById("note").value = note;
  document.querySelector("#activity-form button").innerText = "Spara ändring";
};

window.confirmDelete = async (id) => {
  if (!confirm("Är du säker på att du vill ta bort aktiviteten?")) return;
  await deleteDoc(doc(db, "activities", id));
  showToast("Aktiviteten har raderats");
};

window.onload = () => showPage("plan");

function showPage(page) {
  document.querySelectorAll(".page").forEach(p => p.style.display = "none");
  document.getElementById(page).style.display = "block";
}
