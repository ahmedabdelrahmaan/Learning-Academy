// src/api/courses.js
import { db } from '../firebase.js';
import {
  collection, doc, getDoc, getDocs, addDoc, updateDoc,
  query, where, serverTimestamp
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { softDeleteDoc, restoreDoc } from '../utils/helpers.js';
import { cacheGet, cacheSet } from '../store/cache.js';

/**
 * 🔹 List all active courses
 */
export async function listCourses() {
  const cached = await cacheGet('courses');
  if (cached) return cached;

  const q = query(collection(db, 'courses'), where('isDeleted', '==', false));
  const snap = await getDocs(q);
  const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));

  await cacheSet('courses', data, 30);
  return data;
}

/**
 * 🔹 Get single course
 */
export async function getCourse(id) {
  const cached = await cacheGet(`course_${id}`);
  if (cached) return cached;

  const ref = doc(db, 'courses', id);
  const snap = await getDoc(ref);
  if (!snap.exists() || snap.data().isDeleted) return null;

  const data = { id: snap.id, ...snap.data() };
  await cacheSet(`course_${id}`, data, 60);
  return data;
}

/**
 * 🔹 Create new course
 */
export async function createCourse(data) {
  await addDoc(collection(db, 'courses'), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    isDeleted: false,
  });
}

/**
 * 🔹 Update existing course
 */
export async function updateCourse(id, data, updatedBy) {
  const ref = doc(db, 'courses', id);
  await updateDoc(ref, {
    ...data,
    updatedAt: serverTimestamp(),
    updatedBy,
  });
}

/**
 * 🔹 Soft delete / restore
 */
export async function softDeleteCourse(id, deletedBy) {
  return softDeleteDoc('courses', id, deletedBy);
}
export async function restoreCourse(id, restoredBy) {
  return restoreDoc('courses', id, restoredBy);
}
