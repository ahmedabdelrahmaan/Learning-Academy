/**
 * /src/api/users.js
 * --------------------------------------
 * Handles CRUD operations for users collection.
 * Supports soft delete / restore and audit tracking.
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js"; // ✅ CDN path fixed
import { db } from "../firebase.js";

// --------------------------------------
// 🔹 Utility: Common audit fields
// --------------------------------------
function auditFields(userId = "system") {
  return {
    updatedAt: serverTimestamp(),
    updatedBy: userId,
  };
}

// --------------------------------------
// 🔹 Get all active users (Renamed to listUsers)
// --------------------------------------
export async function listUsers(role = null) { // ✅ Function renamed to listUsers
  try {
    let q = query(collection(db, "users"), where("isDeleted", "==", false));
    if (role) {
      q = query(collection(db, "users"), where("isDeleted", "==", false), where("role", "==", role));
    }
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  } catch (err) {
    console.error("❌ Error fetching users:", err);
    return [];
  }
}

// --------------------------------------
// 🔹 Get a single user profile
// --------------------------------------
export async function getUser(userId) {
  try {
    const docRef = doc(db, "users", userId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists() && !docSnap.data().isDeleted) {
      return { id: docSnap.id, ...docSnap.data() };
    }
    return null;
  } catch (err) {
    console.error("❌ Error fetching user:", err);
    return null;
  }
}

// --------------------------------------
// 🔹 Create/Sign up new user
// --------------------------------------
export async function createUser(userId, data) {
  try {
    const docRef = doc(db, "users", userId);
    await setDoc(docRef, {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      isDeleted: false,
      role: data.role || "student", // Default to student
      status: data.role === "tutor" ? "underReview" : "active", // Tutors need approval
    });
    return true;
  } catch (err) {
    console.error("❌ Error creating user:", err);
    return false;
  }
}

// --------------------------------------
// 🔹 Update user profile
// --------------------------------------
export async function updateUser(userId, data) {
  try {
    const docRef = doc(db, "users", userId);
    await updateDoc(docRef, {
      ...data,
      ...auditFields(userId),
    });
    return true;
  } catch (err) {
    console.error("❌ Error updating user:", err);
    return false;
  }
}

// --------------------------------------
// 🔹 Soft delete user
// --------------------------------------
export async function softDeleteUser(userId, deleter = "system") {
  try {
    const ref = doc(db, "users", userId);
    await updateDoc(ref, {
      isDeleted: true,
      deletedAt: serverTimestamp(),
      deletedBy: deleter,
      ...auditFields(deleter),
    });
    console.log(`🗑️ User ${userId} soft-deleted.`);
    return true;
  } catch (err) {
    console.error("❌ Error soft-deleting user:", err);
    return false;
  }
}

// --------------------------------------
// 🔹 Restore soft-deleted user (admin only)
// --------------------------------------
export async function restoreUser(userId, restorer = "system") {
  try {
    const ref = doc(db, "users", userId);
    await updateDoc(ref, {
      isDeleted: false,
      deletedAt: null,
      deletedBy: null,
      restoredBy: restorer,
      ...auditFields(restorer),
    });
    console.log(`✅ User ${userId} restored.`);
    return true;
  } catch (err) {
    console.error("❌ Error restoring user:", err);
    return false;
  }
}

// --------------------------------------
// 🔹 Permanently delete user (admin only)
// --------------------------------------
export async function hardDeleteUser(userId) {
  try {
    await deleteDoc(doc(db, "users", userId));
    console.log(`⚠️ User ${userId} permanently deleted.`);
    return true;
  } catch (err) {
    console.error("❌ Error permanently deleting user:", err);
    return false;
  }
}

// --------------------------------------
// 🔹 Get tutors pending verification
// --------------------------------------
export async function getPendingTutors() {
  try {
    const q = query(
      collection(db, "users"),
      where("role", "==", "tutor"),
      where("status", "==", "underReview"),
      where("isDeleted", "==", false)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  } catch (err) {
    console.error("❌ Error fetching pending tutors:", err);
    return [];
  }
}
