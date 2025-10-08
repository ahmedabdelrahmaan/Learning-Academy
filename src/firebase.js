/**
 * firebase.js
 * --------------------------------------
 * Centralized Firebase initialization for TutorHub Web App.
 * Works natively with ES Modules (no bundler required).
 * Fully compatible with local or GitHub Pages hosting.
 */

// ✅ Import Firebase from official CDN (ESM modules)
// All imports updated to use v11.6.1 for consistency across the project.
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import {
  getFirestore,
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  enableIndexedDbPersistence,
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import {
  getAuth,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";

// --------------------------------------
// 🔧 Firebase Configuration
// --------------------------------------
// NOTE: Please replace with your actual Firebase config details!
const firebaseConfig = {
  apiKey: "AIzaSyAjPzI2w1ptxXjfF-nANHTg57zqfznOyVo",
  authDomain: "daring-runway-406008.firebaseapp.com",
  projectId: "daring-runway-406008",
  storageBucket: "daring-runway-406008.appspot.com",
  messagingSenderId: "305267440939",
  appId: "1:305267440939:web:531737e1a384f6998967b5",
};

// --------------------------------------
// 🚀 Firebase App Initialization
// --------------------------------------
export const app = initializeApp(firebaseConfig);

// --------------------------------------
// 🔥 Firestore Initialization (with offline cache)
// --------------------------------------
export const db = getFirestore(app);

// Enable offline cache — this allows Firestore to work offline
enableIndexedDbPersistence(db).catch((err) => {
  if (err.code === "failed-precondition") {
    console.warn("⚠️ Firestore persistence failed — multiple tabs open.");
  } else if (err.code === "unimplemented") {
    console.warn("⚠️ Firestore persistence not supported on this browser.");
  }
});

// --------------------------------------
// 👥 Authentication (Google Sign-In)
// --------------------------------------
export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();

/**
 * 🔹 Sign in with Google Popup
 */
export async function signInWithGoogle() {
  return signInWithPopup(auth, provider);
}

/**
 * 🔹 Sign out
 */
export async function signOutUser() {
  return signOut(auth);
}

/**
 * 🔹 Watch authentication state changes
 */
export function watchAuthState(callback) {
  return onAuthStateChanged(auth, callback);
}

// --------------------------------------
// 🧩 Export commonly used Firestore functions
// (so you can import them from '../firebase.js')
// --------------------------------------
export {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
};

// --------------------------------------
// 🧠 Helper for consistent audit fields
// --------------------------------------
export function auditFields(userId = "system") {
  return {
    updatedAt: serverTimestamp(),
    updatedBy: userId,
  };
}
