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

initializeApp(firebaseConfig);
const db = getFirestore();
const auth = getAuth();

let currentUser = null;
const participants = ["Jaime","Jake","Filip","Lukas","Lucas","Johannes","Eek","Simon"];

// —–––––––––––––––––––––––––––––––––––––––––
// Authentication
// —–––––––––––––––––––––––––––––––––––––––––
const loginForm = document.getElementById("login-form"),
      usernameInput = document.getElementById("username"),
      passwordInput = document.getElementById("password"),
      userInfo     = document.getElementById("user-info"),
      welcomeMsg   = document.getElementById("welcome-msg"),
      logoutBtn    = document.getElementById("logout-btn"),
      nav          = document.querySelector("nav");

loginForm.addEventListener("submit", async e => {
  e.preventDefault();
  try {
    const cred = await signInWithEmailAndPassword(auth, usernameInput.value, passwordInput.value);
    currentUser = cred.user;
    loginForm.style.display = "none";
    userInfo.style.display  = "block";
    nav.style.display       = "flex";
    welcomeMsg.textContent   = `Inloggad som ${currentUser.email.split("@")[0]}`;
    showPage("plan");
  } catch(err) {
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
    welcomeMsg.textContent   = `Inloggad som ${user.email.split("@")[0]}`;
    showPage("plan");
  } else {
    currentUser = null;
    loginForm.style.display = "block";
    userInfo.style.display  = "none";
    nav.style.display       = "none";
  }
});

// —–––––––––––––––––––––––––––––––––––––––––
// Page navigation
// —–––––––––––––––––––––––––––––––––––––––––
function showPage(page) {
  document.querySelectorAll(".page").forEach(p => p.classList.add("hidden"));
  document.getElementById(page).classList.remove("hidden");
  if (page === "plan" && lastActivitySnapshot)  renderActivities(lastActivitySnapshot);
  if (page === "costs" && lastCostData) {
    renderCostHistory(lastCostData);
    renderBalanceOverview(lastCostData);
  }
}
document.querySelectorAll("nav button").forEach(btn =>
  btn.addEventListener("click", () => showPage(btn.getAttribute("data-page")))
);

// —–––––––––––––––––––––––––––––––––––––––––
// Reseplan (oförändrad – din befintliga kod)
// —–––––––––––––––––––––––––––––––––––––––––
const activitiesRef = collection(db,"activities");
let lastActivitySnapshot = null, editingId = null;
// ... din renderActivities, onSnapshot, formhantering här ...

// —–––––––––––––––––––––––––––––––––––––––––
// Kostnader
// —–––––––––––––––––––––––––––––––––––––––––
const costsRef = collection(db,"costs");
let lastCostData = null;

// Lyssna realtid, mappa till rena objekt med default participants=[]
onSnapshot(costsRef, snap => {
  lastCostData = snap.docs.map(d => {
    const data = d.data();
    return {
      date: data.date,
      title: data.title,
      amount: data.amount,
      payer: data.payer,
      participants: Array.isArray(data.participants) ? data.participants : []
    };
  });
  console.log("Kostnader hämtade:", lastCostData.length);
  if (!document.getElementById("costs").classList.contains("hidden")) {
    renderCostHistory(lastCostData);
    renderBalanceOverview(lastCostData);
  }
});

// Bygg deltagar-checkboxar
const pc = document.getElementById("participant-checkboxes");
participants.forEach(n => {
  const lbl = document.createElement("label");
  lbl.innerHTML = `<input type="checkbox" value="${n}" checked> ${n}`;
  pc.appendChild(lbl);
});

// Skicka in ny kostnad
document.getElementById("cost-form").addEventListener("submit", async e => {
  e.preventDefault();
  const date = document.getElementById("cost-date").value,
        title = document.getElementById("cost-title").value,
        amount = parseFloat(document.getElementById("cost-amount").value),
        payer = currentUser.email.split("@")[0],
        shared = Array.from(pc.querySelectorAll("input:checked")).map(cb=>cb.value);

  if (!date||!title||isNaN(amount)||shared.length===0) {
    return alert("Fyll i alla fält och välj deltagare.");
  }
  await addDoc(costsRef,{ date, title, amount, payer, participants: shared });
  showToast("Kostnad tillagd");
  e.target.reset();
});

// Visa historik
function renderCostHistory(costs) {
  const list = document.getElementById("cost-list");
  list.innerHTML = "<h3>Historik</h3>";
  costs.forEach(c => {
    const {date,title,amount,payer,participants} = c;
    const div = document.createElement("div");
    div.className = "day-box";
    div.innerHTML = `
      <strong>${date}</strong>: ${title} – ${amount.toFixed(2)} kr<br>
      Betalat av: ${payer}<br>
      Deltagare: ${participants.join(", ")}
    `;
    list.appendChild(div);
  });
}

// Beräkna nettoskulder
function calculateNetBalances(costs) {
  const bal = {};
  participants.forEach(a=>{
    bal[a] = {};
    participants.forEach(b=>{ if(a!==b) bal[a][b]=0; });
  });
  costs.forEach(c => {
    const share = c.amount / c.participants.length;
    c.participants.forEach(p => {
      if(p!==c.payer) {
        bal[p][c.payer] += share;
        bal[c.payer][p] -= share;
      }
    });
  });
  // Netta ut motstridiga skulder
  participants.forEach(a=>{
    participants.forEach(b=>{
      if(a!==b) {
        const net = bal[a][b] - bal[b][a];
        bal[a][b] = net>0?net:0;
        bal[b][a] = net>0?0:-net;
      }
    });
  });
  return bal;
}

// Visa balansöversikt
function renderBalanceOverview(costs) {
  const ov = document.getElementById("balance-overview");
  ov.innerHTML = "<h3>Saldo mellan deltagare</h3>";
  const bal = calculateNetBalances(costs);
  participants.forEach(a=>{
    participants.forEach(b=>{
      if(a!==b && bal[a][b]>0.01) {
        const p = document.createElement("p");
        p.textContent = `${a} är skyldig ${b}: ${bal[a][b].toFixed(2)} kr`;
        ov.appendChild(p);
      }
    });
  });
}

// Toast
function showToast(msg) {
  const t = document.createElement("div");
  t.innerText = msg;
  Object.assign(t.style,{
    position:"fixed",bottom:"20px",left:"50%",
    transform:"translateX(-50%)",background:"#333",
    color:"#fff",padding:"10px 20px",borderRadius:"8px",zIndex:9999
  });
  document.body.appendChild(t);
  setTimeout(()=>t.remove(),2500);
}

// Startvy
window.onload = ()=>showPage("plan");
