// ════════════════════════════════════════════════════════════════
//  firebase-auth.js  –  Firebase + Google Authentication for Food Hill
// ════════════════════════════════════════════════════════════════

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-analytics.js";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

// ── Firebase Config ──────────────────────────────────────────────
const firebaseConfig = {
  apiKey: "AIzaSyBxI3xzHYe3WMKwfG-tpYACZNQhh6_2oww",
  authDomain: "thefoodhill.firebaseapp.com",
  projectId: "thefoodhill",
  storageBucket: "thefoodhill.firebasestorage.app",
  messagingSenderId: "804614879409",
  appId: "1:804614879409:web:6fdae026597b2c77664a90",
  measurementId: "G-T6LZP5E63J"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();
provider.setCustomParameters({ prompt: "select_account" });

// ── DOM References ───────────────────────────────────────────────
const signInBtn      = document.getElementById("auth-signin-btn") || document.getElementById("navLoginBtn");
const signOutBtn     = document.getElementById("auth-signout-btn") || document.getElementById("navLogoutBtn");
const userAvatar     = document.getElementById("auth-user-avatar") || document.getElementById("navAvatar");
const userNameEl     = document.getElementById("auth-user-name") || document.getElementById("navUsername");
const authModal      = document.getElementById("auth-modal") || document.getElementById("authModalBackdrop");
const modalSignInBtn = document.getElementById("modal-google-signin");
const toastEl        = document.getElementById("auth-toast") || document.getElementById("modalLoginToast");

// ── Toast Helper ─────────────────────────────────────────────────
function showToast(message, type = "success") {
  if (!toastEl) return;
  toastEl.textContent = message;
  toastEl.className   = `toast show ${type}`;
  setTimeout(() => toastEl.classList.remove("show"), 3500);
}

// ── UI Updater ───────────────────────────────────────────────────
function updateUI(user) {
  if (user) {
    // Save session in localStorage for app sync
    const sessionObj = {
      name: user.displayName || user.email?.split("@")[0] || "User",
      email: user.email,
      photo: user.photoURL
    };
    localStorage.setItem("fh_session", JSON.stringify(sessionObj));

    if (window.updateNavbar) {
      window.updateNavbar();
    } else {
      const navGuest = document.getElementById("navGuest");
      const navUser  = document.getElementById("navUser");
      if (navGuest) navGuest.style.display = "none";
      if (navUser)  navUser.style.display  = "flex";
      if (userNameEl) userNameEl.textContent = sessionObj.name.split(" ")[0];
    }
  }
}

// ── Google Sign-In ───────────────────────────────────────────────
async function handleSignIn() {
  try {
    const result = await signInWithPopup(auth, provider);
    const user   = result.user;
    showToast(`Welcome, ${user.displayName?.split(" ")[0] || "friend"}! 🥟`, "success");
    updateUI(user);
  } catch (err) {
    console.error("Firebase Sign-in error:", err);
    if (err.code !== "auth/popup-closed-by-user") {
      showToast("Firebase Sign-in failed. Please try again.", "error");
    }
  }
}

// ── Sign-Out ─────────────────────────────────────────────────────
async function handleSignOut() {
  try {
    const name = auth.currentUser?.displayName?.split(" ")[0] || "friend";
    await signOut(auth);
    localStorage.removeItem("fh_session");
    if (window.updateNavbar) window.updateNavbar();
    showToast(`Goodbye, ${name}! See you soon 👋`, "success");
  } catch (err) {
    console.error("Firebase Sign-out error:", err);
    showToast("Sign-out failed. Please try again.", "error");
  }
}

// ── Auth State Listener ──────────────────────────────────────────
onAuthStateChanged(auth, updateUI);

// Expose to global scope for any modal or button usage
window.foodHillSignIn  = handleSignIn;
window.foodHillSignOut = handleSignOut;
window.firebaseAuth = auth;
window.firebaseAnalytics = analytics;
