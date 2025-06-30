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

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
let currentUser = null;

// Inloggningselement
const loginForm = document.getElementById("login-form");
const usernameInput = document.getElementById("username");
const passwordInput = document.getElementById("password");
const userInfo = document.getElementById("user-info");
const welcomeMsg = document.getElementById("welcome-msg");
const logoutBtn = document.getElementById("logout-btn");
const nav = document.querySelector("nav");

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = usernameInput.value;
  const password = passwordInput.value;
  try {
    const userCred = await signInWithEmailAndPassword(auth, email, password);
    currentUser = userCred.user;
    loginForm.style.display = "none";
    userInfo.style.display = "block";
    nav.style.display = "flex";
    welcomeMsg.textContent = `Inloggad som ${email}`;
    showPage("plan");
  } catch (err) {
    alert("Fel inloggning: " + err.message);
  }
});

logoutBtn.addEventListener("click", async () => {
  await signOut(auth);
  location.reload();
});

onAuthStateChanged(auth, (user) => {
  if (user) {
    currentUser = user;
    loginForm.style.display = "none";
    userInfo.style.display = "block";
    nav.style.display = "flex";
    welcomeMsg.textContent = `Inloggad som ${user.email}`;
    showPage("plan");
  } else {
    loginForm.style.display = "block";
    userInfo.style.display = "none";
    nav.style.display = "none";
    currentUser = null;
  }
});

// Visa sidor
function showPage(page) {
  document.querySelectorAll(".page").forEach(p => p.classList.add("hidden"));
  const current = document.getElementById(page);
  current.classList.remove("hidden");
  if (page === "plan" && lastActivitySnapshot) {
    setTimeout(() => renderActivities(lastActivitySnapshot), 50);
  }
  if (page === "costs" && lastCostSnapshot) {
    setTimeout(() => renderCosts(lastCostSnapshot), 50);
  }
}

document.querySelectorAll("nav button").forEach(btn => {
  btn.addEventListener("click", () => {
    showPage(btn.getAttribute("data-page"));
  });
});

// Aktiviteter
const activitiesRef = collection(db, "activities");
let editingId = null;
let lastActivitySnapshot = null;

onSnapshot(activitiesRef, snapshot => {
  lastActivitySnapshot = snapshot;
  if (!document.getElementById("plan").classList.contains("hidden")) {
    renderActivities(snapshot);
  }
});

document.getElementById("activity-form").addEventListener("submit", async e => {
  e.preventDefault();
  const date = document.getElementById("date").value;
  const time = document.getElementById("time").value;
  const place = document.getElementById("place").value;
  const note = document.getElementById("note").value;

  if (!date || !time || !place) return alert("Fyll i datum, tid och plats.");

  try {
    if (editingId) {
      await updateDoc(doc(db, "activities", editingId), { date, time, place, note });
      editingId = null;
      document.querySelector("#activity-form button").innerText = "Lägg till aktivitet";
    } else {
      await addDoc(activitiesRef, { date, time, place, note });
    }
    document.getElementById("activity-form").reset();
  } catch (err) {
    alert("Fel vid sparande: " + err.message);
  }
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
  try {
    await deleteDoc(doc(db, "activities", id));
  } catch (err) {
    alert("Fel vid radering: " + err.message);
  }
};

function renderActivities(snapshot) {
  const container = document.getElementById("activity-list");
  if (!container) return;
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
    const formattedDate = new Date(date).toLocaleDateString("sv-SE", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
    dayBox.innerHTML = `<h3>${formattedDate}</h3><ul></ul>`;
    const ul = dayBox.querySelector("ul");
    grouped[date].sort((a, b) => a.time.localeCompare(b.time)).forEach(act => {
      const li = document.createElement("li");
      li.innerHTML = `<div class="activity-row">
        <span><strong>${act.time}</strong> – ${act.place} (${act.note})</span>
        <span>
          <span class="icon-btn" onclick="confirmEdit('${act.id}', '${act.date}', '${act.time}', \`${act.place}\`, \`${act.note}\`)">📝</span>
          <span class="icon-btn" onclick="confirmDelete('${act.id}')">🗑️</span>
        </span>
      </div>`;
      ul.appendChild(li);
    });
    container.appendChild(dayBox);
  });
}

// Kostnader
const participants = ["Jaime", "Jake", "Filip", "Lukas", "Lucas", "Johannes", "Eek", "Simon"];
const costsRef = collection(db, "costs");
let lastCostSnapshot = null;

onSnapshot(costsRef, snapshot => {
  lastCostSnapshot = snapshot;
  if (!document.getElementById("costs").classList.contains("hidden")) {
    renderCosts(snapshot);
  }
});

const costForm = document.getElementById("cost-form");
const checkboxesContainer = document.getElementById("participant-checkboxes");
const costList = document.getElementById("cost-list");
const balanceOverview = document.getElementById("balance-overview");

participants.forEach(name => {
  const label = document.createElement("label");
  label.innerHTML = `<input type="checkbox" value="${name}" checked> ${name}`;
  checkboxesContainer.appendChild(label);
});

costForm.addEventListener("submit", async e => {
  e.preventDefault();
  const date = document.getElementById("cost-date").value;
  const title = document.getElementById("cost-title").value;
  const amount = parseFloat(document.getElementById("cost-amount").value);
  const sharedWith = [...checkboxesContainer.querySelectorAll("input:checked")].map(c => c.value);
  const paidBy = currentUser?.email || "Okänd";

  if (!date || !title || !amount || sharedWith.length === 0) return alert("Fyll i alla fält");
  await addDoc(costsRef, { date, title, amount, sharedWith, paidBy });
  costForm.reset();
});

function renderCosts(snapshot) {
  costList.innerHTML = "";
  const balances = {};
  participants.forEach(p1 => {
    balances[p1] = {};
    participants.forEach(p2 => {
      if (p1 !== p2) balances[p1][p2] = 0;
    });
  });

  snapshot.forEach(doc => {
    const cost = doc.data();
    const { date, title, amount, sharedWith, paidBy } = cost;
    const perPerson = amount / sharedWith.length;

    sharedWith.forEach(p => {
      if (p !== paidBy) {
        balances[p][paidBy] += perPerson;
        balances[paidBy][p] -= perPerson;
      }
    });

    const div = document.createElement("div");
    div.innerHTML = `<strong>${date}</strong>: ${title} – ${amount.toFixed(2)} kr <br> Betalat av: ${paidBy}, delat på: ${sharedWith.join(", ")}`;
    costList.appendChild(div);
  });

  renderBalance(balances);
}

function renderBalance(balances) {
  balanceOverview.innerHTML = "";
  for (const person in balances) {
    for (const other in balances[person]) {
      const net = balances[person][other] - balances[other][person];
      if (net > 0.01) {
        const p = document.createElement("p");
        p.textContent = `${person} är skyldig ${other} ${net.toFixed(2)} kr`;
        balanceOverview.appendChild(p);
      }
    }
  }
}
