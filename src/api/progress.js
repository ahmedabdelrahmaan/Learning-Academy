// src/api/progress.js
import { db } from '../firebase.js';
import {
  doc, setDoc, getDoc, serverTimestamp
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

/**
 * 🔹 Mark lesson as finished
 */
export async function markLessonFinished(userId, lessonId, courseId) {
  const ref = doc(db, `users/${userId}/progress`, lessonId);
  await setDoc(ref, {
    courseId,
    finished: true,
    finishedAt: serverTimestamp(),
  });
}

/**
 * 🔹 Get progress for a specific lesson
 */
export async function getLessonProgress(userId, lessonId) {
  const ref = doc(db, `users/${userId}/progress`, lessonId);
  const snap = await getDoc(ref);
  return snap.exists() ? snap.data() : null;
}
