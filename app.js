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
    loginForm.style.display = "none";
    userInfo.style.display = "block";
    nav.style.display = "flex";
    currentUser = userCred.user;
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

// Aktiviteter
const activitiesRef = collection(db, "activities");
let editingId = null;
let lastSnapshot = null;

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("sv-SE", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric"
  });
}

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
              <span class="icon-btn" onclick="confirmEdit('${act.id}', '${act.date}', '${act.time}', \`${act.place}\`, \`${act.note}\`)">📝</span>
              <span class="icon-btn" onclick="confirmDelete('${act.id}')">🗑️</span>
            </span>
          </div>
        `;
        ul.appendChild(li);
      });
    container.appendChild(dayBox);
  });
}

onSnapshot(activitiesRef, snapshot => {
  lastSnapshot = snapshot;
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
  if (!date || !time || !place) {
    alert("Fyll i datum, tid och plats.");
    return;
  }
  try {
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
  } catch (err) {
    console.error("Fel vid sparande:", err);
    alert("Kunde inte spara aktiviteten.");
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
    showToast("Aktiviteten har raderats");
  } catch (err) {
    console.error("Fel vid radering:", err);
    alert("Kunde inte radera aktiviteten.");
  }
};

// Kostnader
const costsRef = collection(db, "costs");

function calculateBalances(costDocs) {
  const balances = {};
  costDocs.forEach(doc => {
    const { payer, participants, amount } = doc.data();
    const share = amount / participants.length;
    participants.forEach(person => {
      if (person === payer) return;
      if (!balances[person]) balances[person] = {};
      if (!balances[person][payer]) balances[person][payer] = 0;
      balances[person][payer] += share;
    });
  });
  return balances;
}

function renderBalances(costDocs) {
  const container = document.getElementById("cost-list");
  container.innerHTML = "";
  const balances = calculateBalances(costDocs);
  Object.entries(balances).forEach(([debtor, creditors]) => {
    Object.entries(creditors).forEach(([creditor, amount]) => {
      const p = document.createElement("p");
      p.textContent = `${debtor} är skyldig ${creditor}: ${amount.toFixed(2)} kr`;
      container.appendChild(p);
    });
  });
}

onSnapshot(costsRef, (snapshot) => {
  const docs = snapshot.docs;
  renderBalances(docs);
});

document.getElementById("cost-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const date = document.getElementById("cost-date").value;
  const title = document.getElementById("cost-title").value;
  const amount = parseFloat(document.getElementById("cost-amount").value);
  const payer = currentUser?.email?.split("@")[0] || "Okänd";
  const checkboxes = document.querySelectorAll("#participant-checkboxes input[type=checkbox]:checked");
  const participants = Array.from(checkboxes).map(cb => cb.value);
  if (!date || !title || isNaN(amount) || participants.length === 0) {
    alert("Fyll i alla fält och välj deltagare.");
    return;
  }
  await addDoc(costsRef, { date, title, amount, payer, participants });
  showToast("Kostnad tillagd");
  document.getElementById("cost-form").reset();
});

function showPage(page) {
  document.querySelectorAll(".page").forEach(p => {
    p.classList.add("hidden");
  });
  const current = document.getElementById(page);
  current.classList.remove("hidden");
  if (page === "plan" && lastSnapshot) {
    setTimeout(() => renderActivities(lastSnapshot), 50);
  }
}

document.querySelectorAll("nav button").forEach(btn => {
  btn.addEventListener("click", () => {
    showPage(btn.getAttribute("data-page"));
  });
});

// Skapa deltagare-checkboxar
const names = ["Jaime", "Jake", "Filip", "Lukas", "Lucas", "Johannes", "Eek", "Simon"];
const container = document.getElementById("participant-checkboxes");
names.forEach(name => {
  const label = document.createElement("label");
  label.innerHTML = `<input type="checkbox" value="${name}" /> ${name}`;
  container.appendChild(label);
});
