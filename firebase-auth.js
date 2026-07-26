// ════════════════════════════════════════════════════════════════
//  firebase-auth.js  –  Firebase Auth & Firestore Integration
// ════════════════════════════════════════════════════════════════

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-analytics.js";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  getFirestore,
  collection,
  addDoc,
  setDoc,
  doc,
  getDocs,
  query,
  orderBy,
  limit
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// ── Firebase Configuration ─────────────────────────────────────────
const firebaseConfig = {
  apiKey: "AIzaSyBxI3xzHYe3WMKwfG-tpYACZNQhh6_2oww",
  authDomain: "thefoodhill.firebaseapp.com",
  projectId: "thefoodhill",
  storageBucket: "thefoodhill.firebasestorage.app",
  messagingSenderId: "804614879409",
  appId: "1:804614879409:web:6fdae026597b2c77664a90",
  measurementId: "G-T6LZP5E63J"
};

// Initialize Firebase Services
const app       = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth      = getAuth(app);
const db        = getFirestore(app);
const provider  = new GoogleAuthProvider();
provider.setCustomParameters({ prompt: "select_account" });

// ── Toast Helper ─────────────────────────────────────────────────
function showToast(message, type = "success") {
  const toastEl = document.getElementById("auth-toast") || document.getElementById("modalLoginToast") || document.getElementById("modalSignupToast");
  if (!toastEl) return;
  toastEl.textContent = message;
  toastEl.className   = `toast show ${type}`;
  setTimeout(() => toastEl.classList.remove("show"), 3500);
}

// ── Save User to Firestore ───────────────────────────────────────
async function saveUserToFirestore(user) {
  try {
    await setDoc(doc(db, "users", user.uid), {
      name: user.displayName || user.email?.split("@")[0] || "Member",
      email: user.email,
      photoURL: user.photoURL || null,
      lastLogin: new Date().toISOString()
    }, { merge: true });
  } catch (err) {
    console.warn("Firestore user sync note:", err.message);
  }
}

// ── UI Updater ───────────────────────────────────────────────────
function updateUI(user) {
  if (user) {
    const sessionObj = {
      uid: user.uid,
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
      const userNameEl = document.getElementById("navUsername");
      if (navGuest) navGuest.style.display = "none";
      if (navUser)  navUser.style.display  = "flex";
      if (userNameEl) userNameEl.textContent = sessionObj.name.split(" ")[0];
    }
  }
}

// ── Google Sign-In ───────────────────────────────────────────────
export async function handleGoogleSignIn() {
  try {
    const result = await signInWithPopup(auth, provider);
    const user   = result.user;
    await saveUserToFirestore(user);
    showToast(`Welcome, ${user.displayName?.split(" ")[0] || "friend"}! 🥟`, "success");
    updateUI(user);
    if (window.closeModal) window.closeModal();
  } catch (err) {
    console.error("Firebase Google Sign-in error:", err);
    if (err.code !== "auth/popup-closed-by-user") {
      showToast("Google Sign-in failed. Check Firebase console.", "error");
    }
  }
}

// ── Email/Password Signup ────────────────────────────────────────
export async function handleEmailSignUp(name, email, password) {
  try {
    const userCred = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCred.user;
    await updateProfile(user, { displayName: name });
    await saveUserToFirestore(user);
    showToast(`🎉 Account created! Welcome, ${name}!`, "success");
    updateUI(user);
    return true;
  } catch (err) {
    console.error("Firebase Signup error:", err);
    let msg = "Signup failed. Please try again.";
    if (err.code === "auth/email-already-in-use") msg = "⚠ Email is already registered in Firebase.";
    if (err.code === "auth/weak-password") msg = "⚠ Password should be at least 6 characters.";
    showToast(msg, "error");
    return false;
  }
}

// ── Email/Password Login ─────────────────────────────────────────
export async function handleEmailLogin(email, password) {
  try {
    const userCred = await signInWithEmailAndPassword(auth, email, password);
    const user = userCred.user;
    await saveUserToFirestore(user);
    showToast(`✅ Welcome back, ${user.displayName || name}!`, "success");
    updateUI(user);
    return true;
  } catch (err) {
    console.error("Firebase Login error:", err);
    let msg = "Login failed. Check your credentials.";
    if (err.code === "auth/invalid-credential" || err.code === "auth/user-not-found" || err.code === "auth/wrong-password") {
      msg = "⚠ Incorrect email or password.";
    }
    showToast(msg, "error");
    return false;
  }
}

// ── Sign-Out ─────────────────────────────────────────────────────
export async function handleSignOut() {
  try {
    const name = auth.currentUser?.displayName?.split(" ")[0] || "friend";
    await signOut(auth);
    localStorage.removeItem("fh_session");
    if (window.updateNavbar) window.updateNavbar();
    showToast(`Goodbye, ${name}! See you soon 👋`, "success");
  } catch (err) {
    console.error("Firebase Sign-out error:", err);
  }
}

// ── Save Order to Firestore Database ──────────────────────────────
export async function saveOrderToFirestore(orderData) {
  try {
    const docRef = await addDoc(collection(db, "orders"), {
      ...orderData,
      createdAt: new Date().toISOString()
    });
    console.log("Order saved to Firestore ID:", docRef.id);
    return docRef.id;
  } catch (err) {
    console.warn("Firestore order sync note:", err.message);
    return null;
  }
}

// ── Save Table Reservation to Firestore ──────────────────────────
export async function saveReservationToFirestore(reservationData) {
  try {
    const docRef = await addDoc(collection(db, "reservations"), {
      ...reservationData,
      createdAt: new Date().toISOString()
    });
    console.log("Reservation saved to Firestore ID:", docRef.id);
    return docRef.id;
  } catch (err) {
    console.warn("Firestore reservation sync note:", err.message);
    return null;
  }
}

// ── Auth State Listener ──────────────────────────────────────────
onAuthStateChanged(auth, updateUI);

// Event listener delegation for Google Sign-in buttons
document.addEventListener("click", e => {
  if (e.target.closest(".google-signin-btn") || e.target.id === "modal-google-signin") {
    handleGoogleSignIn();
  }
});

// Expose functions globally
window.foodHillSignIn       = handleGoogleSignIn;
window.foodHillSignOut      = handleSignOut;
window.foodHillSignUp       = handleEmailSignUp;
window.foodHillEmailLogin   = handleEmailLogin;
window.foodHillSaveOrder    = saveOrderToFirestore;
window.foodHillSaveBooking  = saveReservationToFirestore;
window.firebaseAuth         = auth;
window.firebaseDB           = db;
window.firebaseAnalytics    = analytics;
