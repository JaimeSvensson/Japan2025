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
    loginForm.style.display = "none";
    userInfo.style.display = "block";
    nav.style.display = "flex";
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
    userInfo.style.display = "block";
    nav.style.display = "flex";
    const prefix = user.email.split("@")[0];
    welcomeMsg.textContent = `Inloggad som ${participants.find(p => p.id === prefix).name}`;
    showPage("plan");
  } else {
    currentUser = null;
    loginForm.style.display = "block";
    userInfo.style.display = "none";
    nav.style.display = "none";
  }
});

// Restore page navigation listeners
function setupNavigation() {
  document.querySelectorAll("nav button").forEach(btn => {
    btn.addEventListener("click", () => showPage(btn.getAttribute("data-page")));
  });
}

// Page navigation logic
function showPage(page) {
  if (!currentUser) {
    console.warn("Användare ej inloggad, kan inte visa sida:", page);
    return;
  }
  document.querySelectorAll(".page").forEach(p => p.classList.add("hidden"));
  document.getElementById(page).classList.remove("hidden");
  if (page === "plan" && typeof renderActivities === "function") renderActivities(lastActivitySnap);
  if (page === "costs" && typeof renderCostHistory === "function" && typeof renderBalanceOverview === "function") {
    renderCostHistory(lastCostData);
    renderBalanceOverview(lastCostData);
    const userId = currentUser.email.split("@")[0];
    document.querySelectorAll("#participant-checkboxes input").forEach(cb => {
      if (cb.value === userId) cb.checked = true;
    });
  }
}

// Call setup on load
window.onload = () => {
  setupNavigation();
  if (auth.currentUser) showPage("plan");
};
