// src/api/lessons.js
import { db } from '../firebase.js';
import {
  collection, doc, addDoc, getDocs, getDoc,
  updateDoc, query, where, serverTimestamp
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { softDeleteDoc, restoreDoc } from '../utils/helpers.js';

/**
 * 🔹 List lessons for a course (isDeleted == false)
 */
export async function listLessons(courseId) {
  const q = query(
    collection(db, `courses/${courseId}/lessons`),
    where('isDeleted', '==', false)
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

/**
 * 🔹 Add lesson
 */
export async function addLesson(courseId, data) {
  await addDoc(collection(db, `courses/${courseId}/lessons`), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    isDeleted: false,
  });
}

/**
 * 🔹 Update lesson
 */
export async function updateLesson(courseId, lessonId, data, updatedBy) {
  const ref = doc(db, `courses/${courseId}/lessons`, lessonId);
  await updateDoc(ref, {
    ...data,
    updatedAt: serverTimestamp(),
    updatedBy,
  });
}

/**
 * 🔹 Soft delete / restore
 */
export async function softDeleteLesson(courseId, lessonId, deletedBy) {
  return softDeleteDoc(`courses/${courseId}/lessons`, lessonId, deletedBy);
}
export async function restoreLesson(courseId, lessonId, restoredBy) {
  return restoreDoc(`courses/${courseId}/lessons`, lessonId, restoredBy);
}
