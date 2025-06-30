// Import Firebase SDKs
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js";

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyD4ifyIMcPdPfxfji5qkttFtMNafeHyn_I",
  authDomain: "japan2025-pwa.firebaseapp.com",
  projectId: "japan2025-pwa",
  storageBucket: "japan2025-pwa.firebasestorage.app",
  messagingSenderId: "1086888213462",
  appId: "1:1086888213462:web:7085048c154f6cea258277"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Participants definition: id matches login prefix, name is display
const participants = [
  { id: "jaime",    name: "Jaime"    },
  { id: "jake",     name: "Jake"     },
  { id: "filip",    name: "Filip"    },
  { id: "lukas",    name: "Lukas"    },
  { id: "lucas",    name: "Lucas"    },
  { id: "johannes", name: "Johannes" },
  { id: "eek",      name: "Eek"      },
  { id: "simon",    name: "Simon"    }
];

let currentUser = null;
let editingCostId = null;

// UI Elements
const loginForm     = document.getElementById("login-form");
const usernameInput = document.getElementById("username");
const passwordInput = document.getElementById("password");
const userInfo      = document.getElementById("user-info");
const welcomeMsg    = document.getElementById("welcome-msg");
const logoutBtn     = document.getElementById("logout-btn");
const nav           = document.querySelector("nav");

// Authentication
loginForm.addEventListener("submit", async e => {
  e.preventDefault();
  try {
    const email    = `${usernameInput.value}@japan2025.com`;
    const password = passwordInput.value;
    const cred     = await signInWithEmailAndPassword(auth, email, password);
    currentUser    = cred.user;
    loginForm.style.display = "none";
    userInfo.style.display  = "block";
    nav.style.display       = "flex";
    const prefix = usernameInput.value;
    welcomeMsg.textContent = `Inloggad som ${participants.find(p => p.id === prefix).name}`;
    showPage("plan");
  } catch (err) {
    alert("Fel inloggning: " + err.message);
  }
});

logoutBtn.addEventListener("click", async () => {
  await signOut(auth);
  location.reload();
});

onAuthStateChanged(auth, user => {
  if (user) {
    currentUser = user;
    loginForm.style.display = "none";
    userInfo.style.display  = "block";
    nav.style.display       = "flex";
    const prefix = user.email.split("@")[0];
    welcomeMsg.textContent = `Inloggad som ${participants.find(p => p.id === prefix).name}`;
    showPage("plan");
  } else {
    currentUser = null;
    loginForm.style.display = "block";
    userInfo.style.display  = "none";
    nav.style.display       = "none";
  }
});

// Page navigation
function showPage(page) {
  document.querySelectorAll(".page").forEach(p => p.classList.add("hidden"));
  document.getElementById(page).classList.remove("hidden");
  if (page === "plan"  && lastActivitySnap) renderActivities(lastActivitySnap);
  if (page === "costs" && lastCostData) {
    renderCostHistory(lastCostData);
    renderBalanceOverview(lastCostData);
  }
}
document.querySelectorAll("nav button").forEach(btn =>
  btn.addEventListener("click", () => showPage(btn.getAttribute("data-page")))
);

// ------------------ Reseplan ------------------
const activitiesRef   = collection(db, "activities");
let lastActivitySnap  = null,
    editingActId      = null;

onSnapshot(activitiesRef, snap => {
  lastActivitySnap = snap;
  if (!document.getElementById("plan").classList.contains("hidden")) {
    renderActivities(snap);
  }
});

document.getElementById("activity-form").addEventListener("submit", async e => {
  e.preventDefault();
  const date  = document.getElementById("date").value;
  const time  = document.getElementById("time").value;
  const place = document.getElementById("place").value;
  const note  = document.getElementById("note").value;
  if (!date || !time || !place) return alert("Fyll i datum, tid och plats.");
  if (editingActId) {
    await updateDoc(doc(db, "activities", editingActId), { date, time, place, note });
    editingActId = null;
    e.target.querySelector("button").innerText = "Lägg till aktivitet";
  } else {
    await addDoc(activitiesRef, { date, time, place, note });
  }
  e.target.reset();
});

window.confirmEdit = (id, date, time, place, note) => {
  if (!confirm("Vill du redigera denna aktivitet?")) return;
  editingActId = id;
  document.getElementById("date").value  = date;
  document.getElementById("time").value  = time;
  document.getElementById("place").value = place;
  document.getElementById("note").value  = note;
  document.querySelector("#activity-form button").innerText = "Spara ändring";
};

window.confirmDelete = async id => {
  if (!confirm("Är du säker?")) return;
  await deleteDoc(doc(db, "activities", id));
};

function renderActivities(snap) {
  const container = document.getElementById("activity-list");
  container.innerHTML = "";
  const grouped = {};
  snap.forEach(d => {
    const a = d.data(); a.id = d.id;
    (grouped[a.date] = grouped[a.date] || []).push(a);
  });
  Object.keys(grouped).sort().forEach(date => {
    const dayBox = document.createElement("div");
    dayBox.className = "day-box";
    dayBox.innerHTML = `<h3>${new Date(date).toLocaleDateString("sv-SE",{
      weekday:"long",day:"numeric",month:"long",year:"numeric"
    })}</h3><ul></ul>`;
    const ul = dayBox.querySelector("ul");
    grouped[date]
      .sort((x, y) => x.time.localeCompare(y.time))
      .forEach(a => {
        const li = document.createElement("li");
        li.innerHTML = `
          <div class="activity-row">
            <span><strong>${a.time}</strong> – ${a.place} (${a.note||""})</span>
            <span>
              <span class="icon-btn" onclick="confirmEdit('${a.id}','${a.date}','${a.time}',\`${a.place}\`,\`${a.note}\`)">📝</span>
              <span class="icon-btn" onclick="confirmDelete('${a.id}')">🗑️</span>
            </span>
          </div>`;
        ul.appendChild(li);
      });
    container.appendChild(dayBox);
  });
}

// ------------------ Kostnader ------------------
const costsRef   = collection(db, "costs");
let lastCostData = null;

// Real-time listener, map snapshot to clean objects
onSnapshot(costsRef, snap => {
  lastCostData = snap.docs.map(ds => {
    const d = ds.data();
    return {
      id:           ds.id,
      date:         d.date,
      title:        d.title,
      amount:       d.amount,
      payer:        d.payer,
      participants: Array.isArray(d.participants) ? d.participants : []
    };
  });
  console.log("Kostnader hämtade:", lastCostData);
  if (!document.getElementById("costs").classList.contains("hidden")) {
    renderCostHistory(lastCostData);
    renderBalanceOverview(lastCostData);
  }
});

// Build cost checkboxes
const pc = document.getElementById("participant-checkboxes");
participants.forEach(p => {
  const lbl = document.createElement("label");
  lbl.innerHTML = `<input type="checkbox" value="${p.id}" checked> ${p.name}`;
  pc.appendChild(lbl);
});

// Submit or update cost
document.getElementById("cost-form").addEventListener("submit", async e => {
  e.preventDefault();
  const date   = document.getElementById("cost-date").value;
  const title  = document.getElementById("cost-title").value;
  const amount = parseFloat(document.getElementById("cost-amount").value);
  const payer  = currentUser.email.split("@")[0];
  const shared = Array.from(pc.querySelectorAll("input:checked")).map(cb => cb.value);
  if (!date || !title || isNaN(amount) || shared.length === 0) {
    return alert("Fyll i alla fält och välj deltagare.");
  }
  if (editingCostId) {
    await updateDoc(doc(db, "costs", editingCostId), { date, title, amount, payer, participants: shared });
    editingCostId = null;
    e.target.querySelector("button").innerText = "Lägg till kostnad";
  } else {
    await addDoc(costsRef, { date, title, amount, payer, participants: shared });
  }
  showToast("Kostnad sparad");
  e.target.reset();
});

// Render cost history with edit/delete controls
function renderCostHistory(costs) {
  const list = document.getElementById("cost-list");
  list.innerHTML = "<h3>Historik</h3>";
  costs.forEach(c => {
    const { id, date, title, amount, payer, participants: ids = [] } = c;
    const displayNames = ids.map(pid => (participants.find(p=>p.id===pid)||{name:pid}).name);
    const payerName    = (participants.find(p=>p.id===payer)||{name:payer}).name;
    const div = document.createElement("div");
    div.className = "day-box cost-entry";
    div.innerHTML = `
      <strong>${date}</strong>: ${title} – ${amount.toFixed(2)} kr<br>
      Betalat av: ${payerName}<br>
      Deltagare: ${displayNames.join(", ")}
      <span class="cost-controls">
        ${payer === currentUser.email.split("@")[0]
          ? `<span class="icon-btn" onclick="confirmEditCost('${id}','${date}','${title}',${amount},${JSON.stringify(ids)})">📝</span>
             <span class="icon-btn" onclick="confirmDeleteCost('${id}')">🗑️</span>`
          : ``}
      </span>
    `;
    list.appendChild(div);
  });
}

// Confirm edit/delete for costs
window.confirmEditCost = (id, date, title, amount, participants) => {
  if (!confirm("Vill du redigera denna kostnad?")) return;
  document.getElementById("cost-date").value   = date;
  document.getElementById("cost-title").value  = title;
  document.getElementById("cost-amount").value = amount;
  // Set checkboxes
  document.querySelectorAll("#participant-checkboxes input").forEach(cb => {
    cb.checked = participants.includes(cb.value);
  });
  editingCostId = id;  
  document.querySelector("#cost-form button").innerText = "Spara ändring";
};

window.confirmDeleteCost = async id => {
  if (!confirm("Är du säker på att du vill ta bort denna kostnad?")) return;
  await deleteDoc(doc(db, "costs", id));
  showToast("Kostnaden har raderats");
};

// Calculate net balances
function calculateNetBalances(costs) {
  const bal = {};
  // init
  participants.forEach(a => {
    bal[a.id] = {};
    participants.forEach(b => {
      if (a.id !== b.id) bal[a.id][b.id] = 0;
    });
  });
  // accumulate only positive owes
  costs.forEach(c => {
    const payer = c.payer;
    const ids   = Array.isArray(c.participants) ? c.participants : [];
    if (!payer || !bal[payer] || ids.length < 2) return;
    const share = c.amount / ids.length;
    ids.forEach(pid => {
      if (pid !== payer && bal[pid]) {
        bal[pid][payer] += share;
      }
    });
  });
  // net out mutual debts correctly
  participants.forEach(a => {
    participants.forEach(b => {
      if (a.id === b.id) return;
      const ab = bal[a.id][b.id];
      const ba = bal[b.id][a.id];
      if (ab >= ba) {
        bal[a.id][b.id] = ab - ba;
        bal[b.id][a.id] = 0;
      } else {
        bal[b.id][a.id] = ba - ab;
        bal[a.id][b.id] = 0;
      }
    });
  });
  return bal;
}

// Render balance overview with grouping and color
function renderBalanceOverview(costs) {
  const ov = document.getElementById("balance-overview");
  ov.innerHTML = "";
  const bal = calculateNetBalances(costs);
  const threshold = 0.01;

  participants.forEach(person => {
    const pid = person.id;
    // Who owes them
    const owesThem = participants
      .filter(p => p.id!==pid && bal[p.id][pid]>threshold)
      .map(p => ({ name: p.name, amount: bal[p.id][pid] }));
    // Who they owe
    const theyOwe = participants
      .filter(p => p.id!==pid && bal[pid][p.id]>threshold)
      .map(p => ({ name: p.name, amount: bal[pid][p.id] }));

    if (!owesThem.length && !theyOwe.length) return;

    const heading = document.createElement("h3");
    heading.textContent = person.name;
    ov.appendChild(heading);

    if (owesThem.length) {
      const sub1 = document.createElement("h4");
      sub1.textContent = `Personer som ska betala ${person.name}:`;
      ov.appendChild(sub1);
      const ul1 = document.createElement("ul");
      owesThem.forEach(e => {
        const li = document.createElement("li");
        li.textContent = `${e.name} – ${e.amount.toFixed(2)} kr`;
        li.style.color = "green";
        ul1.appendChild(li);
      });
      ov.appendChild(ul1);
    }

    if (theyOwe.length) {
      const sub2 = document.createElement("h4");
      sub2.textContent = `Personer ${person.name} ska betala:`;
      ov.appendChild(sub2);
      const ul2 = document.createElement("ul");
      theyOwe.forEach(e => {
        const li = document.createElement("li");
        li.textContent = `${e.name} – ${e.amount.toFixed(2)} kr`;
        li.style.color = "red";
        ul2.appendChild(li);
      });
      ov.appendChild(ul2);
    }
  });
}

// Toast helper
function showToast(msg) {
  const t = document.createElement("div");
  t.innerText = msg;
  Object.assign(t.style, {
    position: "fixed", bottom: "20px", left: "50%",
    transform: "translateX(-50%)", background: "#333",
    color: "#fff", padding: "10px 20px", borderRadius: "8px", zIndex: 9999
  });
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 2500);
}

// On load
window.onload = () => showPage("plan");
