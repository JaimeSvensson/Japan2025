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
initializeApp(firebaseConfig);
const db = getFirestore();
const auth = getAuth();

// Participants definition: id matches login prefix, name is display
const participants = [
  { id: "jaime", name: "Jaime" },
  { id: "jake", name: "Jake" },
  { id: "filip", name: "Filip" },
  { id: "lukas", name: "Lukas" },
  { id: "lucas", name: "Lucas" },
  { id: "johannes", name: "Johannes" },
  { id: "eek", name: "Eek" },
  { id: "simon", name: "Simon" }
];

let currentUser = null;

// UI Elements
const loginForm = document.getElementById("login-form");
const usernameInput = document.getElementById("username");
const passwordInput = document.getElementById("password");
const userInfo = document.getElementById("user-info");
const welcomeMsg = document.getElementById("welcome-msg");
const logoutBtn = document.getElementById("logout-btn");
const nav = document.querySelector("nav");

// Authentication
loginForm.addEventListener("submit", async e => {
  e.preventDefault();
  try {
    const cred = await signInWithEmailAndPassword(
      auth,
      usernameInput.value + "@japan2025.com",
      passwordInput.value
    );
    currentUser = cred.user;
    loginForm.style.display = "none";
    userInfo.style.display = "block";
    nav.style.display = "flex";
    const prefix = usernameInput.value;
    welcomeMsg.textContent = `Inloggad som ${participants.find(p=>p.id===prefix).name}`;
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
    userInfo.style.display = "block";
    nav.style.display = "flex";
    const prefix = user.email.split("@")[0];
    welcomeMsg.textContent = `Inloggad som ${participants.find(p=>p.id===prefix).name}`;
    showPage("plan");
  } else {
    currentUser = null;
    loginForm.style.display = "block";
    userInfo.style.display = "none";
    nav.style.display = "none";
  }
});

// Page navigation
function showPage(page) {
  document.querySelectorAll(".page").forEach(p => p.classList.add("hidden"));
  document.getElementById(page).classList.remove("hidden");
  if (page === "plan" && lastActivitySnap) renderActivities(lastActivitySnap);
  if (page === "costs" && lastCostData) {
    renderCostHistory(lastCostData);
    renderBalanceOverview(lastCostData);
  }
}

document.querySelectorAll("nav button").forEach(btn =>
  btn.addEventListener("click", () => showPage(btn.getAttribute("data-page")))
);

// ------------------ Reseplan ------------------
const activitiesRef = collection(db, "activities");
let lastActivitySnap = null;

onSnapshot(activitiesRef, snap => {
  lastActivitySnap = snap;
  if (!document.getElementById("plan").classList.contains("hidden")) {
    renderActivities(snap);
  }
});

document.getElementById("activity-form").addEventListener("submit", async e => {
  e.preventDefault();
  const date = document.getElementById("date").value;
  const time = document.getElementById("time").value;
  const place = document.getElementById("place").value;
  const note = document.getElementById("note").value;
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

let editingActId = null;
window.confirmEdit = (id, date, time, place, note) => {
  if (!confirm("Vill du redigera denna aktivitet?")) return;
  editingActId = id;
  document.getElementById("date").value = date;
  document.getElementById("time").value = time;
  document.getElementById("place").value = place;
  document.getElementById("note").value = note;
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
    (grouped[a.date] = grouped[a.date]||[]).push(a);
  });
  Object.keys(grouped).sort().forEach(date => {
    const dayBox = document.createElement("div"); dayBox.className="day-box";
    dayBox.innerHTML = `<h3>${new Date(date).toLocaleDateString('sv-SE',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}</h3><ul></ul>`;
    const ul = dayBox.querySelector('ul');
    grouped[date].sort((x,y)=>x.time.localeCompare(y.time)).forEach(a => {
      const li = document.createElement('li');
      li.innerHTML = `<div class="activity-row">
        <span><strong>${a.time}</strong> – ${a.place} (${a.note||''})</span>
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
const costsRef = collection(db, "costs");
let lastCostData = null;

// Real-time listener, map snapshot to data with safe participants
onSnapshot(costsRef, snap => {
  lastCostData = snap.docs.map(ds => {
    const d = ds.data();
    return {
      date: d.date,
      title: d.title,
      amount: d.amount,
      payer: d.payer,
      participants: Array.isArray(d.participants) ? d.participants : []
    };
  });
  console.log("Kostnader hämtade:", lastCostData);
  if (!document.getElementById("costs").classList.contains("hidden")) {
    renderCostHistory(lastCostData);
    renderBalanceOverview(lastCostData);
  }
});

// Build checkboxes
const pc = document.getElementById("participant-checkboxes");
participants.forEach(p => {
  const lbl = document.createElement('label');
  lbl.innerHTML = `<input type="checkbox" value="${p.id}" checked> ${p.name}`;
  pc.appendChild(lbl);
});

// Submit cost
document.getElementById('cost-form').addEventListener('submit', async e => {
  e.preventDefault();
  const date = document.getElementById('cost-date').value;
  const title = document.getElementById('cost-title').value;
  const amount = parseFloat(document.getElementById('cost-amount').value);
  const payer = currentUser.email.split('@')[0];
  const shared = Array.from(pc.querySelectorAll('input:checked')).map(cb => cb.value);
  if (!date||!title||isNaN(amount)||shared.length===0) return alert('Fyll i alla fält.');
  await addDoc(costsRef,{ date,title,amount,payer,participants:shared });
  showToast('Kostnad tillagd');
  e.target.reset();
});

// Render cost history
function renderCostHistory(costs) {
  const list = document.getElementById('cost-list');
  list.innerHTML = '<h3>Historik</h3>';
  costs.forEach(c => {
    const {date,title,amount,payer,participants=[]} = c;
    const names = participants.map(id => (participants.find(p=>p.id===id)||{name:id}).name);
    const div = document.createElement('div'); div.className='day-box';
    div.innerHTML = `
      <strong>${date}</strong>: ${title} – ${amount.toFixed(2)} kr<br>
      Betalat av: ${(participants.find(p=>p.id===payer)||{name:payer}).name}<br>
      Deltagare: ${names.join(', ')}
    `;
    list.appendChild(div);
  });
}

// Calculate net balances
tfunction calculateNetBalances(costs) {
  const bal = {};
  participants.forEach(a=>{ bal[a.id]={}; participants.forEach(b=>{ if(a.id!==b.id) bal[a.id][b.id]=0; }); });
  costs.forEach(c=>{
    const share = c.amount/(c.participants||[]).length;
    (c.participants||[]).forEach(p=>{
      if(p!==c.payer) { bal[p][c.payer]+=share; bal[c.payer][p]-=share; }
    });
  });
  participants.forEach(a=>{
    participants.forEach(b=>{
      if(a.id!==b.id) {
        const net = bal[a.id][b.id] - bal[b.id][a.id];
        bal[a.id][b.id] = net>0?net:0;
        bal[b.id][a.id] = net>0?0:-net;
      }
    });
  });
  return bal;
}

// Render balance overview
function renderBalanceOverview(costs) {
  const ov = document.getElementById('balance-overview');
  ov.innerHTML = '<h3>Saldo mellan deltagare</h3>';
  const bal = calculateNetBalances(costs);
  participants.forEach(a=>{
    participants.forEach(b=>{
      if(a.id!==b.id && bal[a.id][b.id]>0.01) {
        const p = document.createElement('p');
        p.textContent = `${(participants.find(x=>x.id===a.id)||{name:a.id}).name} är skyldig ${(participants.find(x=>x.id===b.id)||{name:b.id}).name}: ${bal[a.id][b.id].toFixed(2)} kr`;
        ov.appendChild(p);
      }
    });
  });
}

// Toast
function showToast(msg) {
  const t = document.createElement('div');
  t.innerText = msg;
  Object.assign(t.style,{position:'fixed',bottom:'20px',left:'50%',transform:'translateX(-50%)',background:'#333',color:'#fff',padding:'10px 20px',borderRadius:'8px',zIndex:9999});
  document.body.appendChild(t);
  setTimeout(()=>t.remove(),2500);
}

// Start page
window.onload = ()=>showPage('plan');
