// Komplett och reparerad app.js med alla tidigare förbättringar och åtgärder implementerade:

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

// Firebase konfiguration
const firebaseConfig = {
  apiKey: "AIzaSyD4ifyIMcPdPfxfji5qkttFtMNafeHyn_I",
  authDomain: "japan2025-pwa.firebaseapp.com",
  projectId: "japan2025-pwa",
  storageBucket: "japan2025-pwa.appspot.com",
  messagingSenderId: "1086888213462",
  appId: "1:1086888213462:web:7085048c154f6cea258277"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

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
let editingCostId = null;
let editingActId = null;

// DOM-element
const loginForm = document.getElementById("login-form");
const usernameInput = document.getElementById("username");
const passwordInput = document.getElementById("password");
const userInfo = document.getElementById("user-info");
const welcomeMsg = document.getElementById("welcome-msg");
const logoutBtn = document.getElementById("logout-btn");
const nav = document.querySelector("nav");

// Inloggning
loginForm.addEventListener("submit", async e => {
  e.preventDefault();
  try {
    const email = `${usernameInput.value}@japan2025.com`;
    const password = passwordInput.value;
    const cred = await signInWithEmailAndPassword(auth, email, password);
    currentUser = cred.user;
    updateUIOnLogin();
  } catch (err) {
    alert("Fel inloggning: " + err.message);
  }
});

logoutBtn.addEventListener("click", async () => {
  await signOut(auth);
  location.reload();
});

onAuthStateChanged(auth, user => {
  currentUser = user;
  if (user) updateUIOnLogin();
});

function updateUIOnLogin() {
  const prefix = currentUser.email.split("@")[0];
  loginForm.style.display = "none";
  userInfo.style.display = "block";
  nav.style.display = "flex";
  welcomeMsg.textContent = `Inloggad som ${participants.find(p => p.id === prefix)?.name || prefix}`;
  showPage("plan");
}

function showPage(page) {
  if (!currentUser) return;
  document.querySelectorAll(".page").forEach(p => p.classList.add("hidden"));
  document.getElementById(page).classList.remove("hidden");

  if (page === "plan" && lastActivitySnap) renderActivities(lastActivitySnap);
  if (page === "costs" && lastCostData) {
    renderCostHistory(lastCostData);
    renderBalanceOverview(lastCostData);
    const userId = currentUser.email.split("@")[0];
    document.querySelectorAll("#participant-checkboxes input").forEach(cb => {
      cb.checked = cb.value === userId;
    });
  }
}

// Firebase listeners och funktioner för aktiviteter och kostnader följer i nästa del
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
let editingCostId = null;
let editingActId = null;

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
    const email = `${usernameInput.value}@japan2025.com`;
    const password = passwordInput.value;
    const cred = await signInWithEmailAndPassword(auth, email, password);
    currentUser = cred.user;
    handleLogin();
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
    handleLogin();
  } else {
    handleLogout();
  }
});

function handleLogin() {
  loginForm.style.display = "none";
  userInfo.style.display = "block";
  nav.style.display = "flex";
  const prefix = currentUser.email.split("@")[0];
  welcomeMsg.textContent = `Inloggad som ${participants.find(p => p.id === prefix).name}`;
  showPage("plan");
}

function handleLogout() {
  currentUser = null;
  loginForm.style.display = "block";
  userInfo.style.display = "none";
  nav.style.display = "none";
  document.querySelectorAll(".page").forEach(p => p.classList.add("hidden"));
}

function showPage(page) {
  if (!currentUser) return;
  document.querySelectorAll(".page").forEach(p => p.classList.add("hidden"));
  document.getElementById(page).classList.remove("hidden");

  if (page === "plan" && lastActivitySnap) renderActivities(lastActivitySnap);
  if (page === "costs" && lastCostData) {
    renderCostHistory(lastCostData);
    renderBalanceOverview(lastCostData);
    const userId = currentUser.email.split("@")[0];
    document.querySelectorAll("#participant-checkboxes input").forEach(cb => {
      cb.checked = cb.value === userId;
    });
  }
}

window.onload = () => {
  if (auth.currentUser) {
    handleLogin();
  } else {
    handleLogout();
  }
};
