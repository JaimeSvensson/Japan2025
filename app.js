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

// Init
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
let currentUser = null;

// Participants list
const participants = ["Jaime","Jake","Filip","Lukas","Lucas","Johannes","Eek","Simon"];

// Auth UI
const loginForm = document.getElementById("login-form");
const usernameInput = document.getElementById("username");
const passwordInput = document.getElementById("password");
const userInfo = document.getElementById("user-info");
const welcomeMsg = document.getElementById("welcome-msg");
const logoutBtn = document.getElementById("logout-btn");
const nav = document.querySelector("nav");

loginForm.addEventListener("submit", async e => {
  e.preventDefault();
  try {
    const { user } = await signInWithEmailAndPassword(auth, usernameInput.value, passwordInput.value);
    currentUser = user;
    loginForm.style.display = "none";
    userInfo.style.display = "block";
    nav.style.display = "flex";
    welcomeMsg.textContent = `Inloggad som ${user.email.split('@')[0]}`;
    showPage("plan");
  } catch (err) {
    alert("Fel inloggning: " + err.message);
  }
});
logoutBtn.addEventListener("click", async () => { await signOut(auth); location.reload(); });
onAuthStateChanged(auth, user => {
  if (user) {
    currentUser = user;
    loginForm.style.display = "none";
    userInfo.style.display = "block";
    nav.style.display = "flex";
    welcomeMsg.textContent = `Inloggad som ${user.email.split('@')[0]}`;
    showPage("plan");
  } else {
    currentUser = null;
    loginForm.style.display = "block";
    userInfo.style.display = "none";
    nav.style.display = "none";
  }
});

// Navigation
function showPage(page) {
  document.querySelectorAll(".page").forEach(p => p.classList.add("hidden"));
  document.getElementById(page).classList.remove("hidden");
}
document.querySelectorAll("nav button").forEach(btn => btn.addEventListener("click", () => showPage(btn.getAttribute("data-page"))));

// ---------------- Activities ----------------
const activitiesRef = collection(db,"activities");
let lastActSnapshot = null;
onSnapshot(activitiesRef, snap=>{ lastActSnapshot = snap; if(!document.getElementById("plan").classList.contains("hidden")) renderActivities(snap); });

document.getElementById("activity-form").addEventListener("submit", async e=>{
  e.preventDefault();
  const date = document.getElementById("date").value;
  const time = document.getElementById("time").value;
  const place = document.getElementById("place").value;
  const note = document.getElementById("note").value;
  if(!date||!time||!place) return alert("Fyll i datum, tid och plats.");
  await addDoc(activitiesRef,{date,time,place,note});
  showToast("Aktivitet tillagd");
  document.getElementById("activity-form").reset();
});

function renderActivities(snap) {
  const container = document.getElementById("activity-list");
  container.innerHTML="";
  const grouped = {};
  snap.forEach(doc=>{
    const a=doc.data(); a.id=doc.id;
    if(!grouped[a.date]) grouped[a.date]=[];
    grouped[a.date].push(a);
  });
  Object.keys(grouped).sort().forEach(date=>{
    const dayBox=document.createElement("div"); dayBox.className="day-box";
    dayBox.innerHTML=`<h3>${new Date(date).toLocaleDateString('sv-SE',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}</h3><ul></ul>`;
    const ul=dayBox.querySelector('ul');
    grouped[date].sort((x,y)=>x.time.localeCompare(y.time)).forEach(a=>{
      const li=document.createElement('li');
      li.innerHTML=`<div class='activity-row'><span><strong>${a.time}</strong> – ${a.place} (${a.note})</span></div>`;
      ul.appendChild(li);
    });
    container.appendChild(dayBox);
  });
}
// ---------------------------------------------

// ---------------- Expenses ----------------
const costsRef = collection(db,"costs");
let lastCostSnapshot=null;
onSnapshot(costsRef,snap=>{
  lastCostSnapshot=snap;
  if(!document.getElementById("costs").classList.contains("hidden")){
    renderCostHistory(snap);
    const net=calculateNet(snap);
    renderOverview(net);
  }
});

// Build checkboxes
const cbContainer=document.getElementById("participant-checkboxes");
participants.forEach(n=>{
  const lbl=document.createElement('label');
  lbl.innerHTML=`<input type='checkbox' value='${n}' checked> ${n}`;
  cbContainer.appendChild(lbl);
});

document.getElementById('cost-form').addEventListener('submit',async e=>{
  e.preventDefault();
  const date=document.getElementById('cost-date').value;
  const title=document.getElementById('cost-title').value;
  const amount=parseFloat(document.getElementById('cost-amount').value);
  const payer=currentUser.email.split('@')[0];
  const parts=[...cbContainer.querySelectorAll('input:checked')].map(x=>x.value);
  if(!date||!title||isNaN(amount)||!parts.length) return alert('Fyll i alla fält.');
  await addDoc(costsRef,{date,title,amount,payer,participants:parts});
  showToast('Kostnad tillagd');
  document.getElementById('cost-form').reset();
});

// Render cost history list
function renderCostHistory(snap){
  const list=document.getElementById('cost-list'); list.innerHTML='';
  snap.forEach(doc=>{
    const c=doc.data();
    const div=document.createElement('div'); div.className='day-box';
    div.innerHTML=`<strong>${new Date(c.date).toLocaleDateString('sv-SE')}</strong> ${c.title}: ${c.amount.toFixed(2)} kr<br>
      Betalat av: ${c.payer}<br>
      Delat på: ${c.participants.join(', ')}`;
    list.appendChild(div);
  });
}

// Calculate net balances
function calculateNet(snap){
  const bal={}; participants.forEach(a=>{bal[a]={}; participants.forEach(b=>{if(a!==b) bal[a][b]=0;});});
  snap.forEach(doc=>{
    const c=doc.data(); const share=c.amount/c.participants.length;
    c.participants.forEach(p=>{ if(p!==c.payer){ bal[p][c.payer]+=share; bal[c.payer][p]-=share; }});
  });
  // Net out
  const net={}; participants.forEach(a=>{net[a]={}; participants.forEach(b=>{if(a!==b){const v=bal[a][b]-bal[b][a]; net[a][b]=v>0? v:0;}});});
  return net;
}

// Render overview
function renderOverview(net){
  const over=document.getElementById('balance-overview'); over.innerHTML='';
  participants.forEach(a=>{
    let owedToA=0, oweByA=0;
    Object.entries(net[a]).forEach(([b,v])=>{ oweByA+=v; });
    participants.forEach(b=>{ if(net[b][a]) owedToA+= net[b][a]; });
    const div=document.createElement('div');
    div.className='day-box';
    div.innerHTML=`<h4>${a}</h4>
      <p>Skyldig andra: ${oweByA.toFixed(2)} kr</p>
      <p>Andra skyldiga dig: ${owedToA.toFixed(2)} kr</p>
      <p><strong>Nettosaldo: ${(owedToA-oweByA).toFixed(2)} kr</strong></p>`;
    over.appendChild(div);
  });
}

// Toast helper
function showToast(msg){const t=document.createElement('div');t.innerText=msg;Object.assign(t.style,{position:'fixed',bottom:'20px',left:'50%',transform:'translateX(-50%)',background:'#333',color:'#fff',padding:'10px 20px',borderRadius:'8px',zIndex:9999});document.body.appendChild(t);setTimeout(()=>t.remove(),2500);}
