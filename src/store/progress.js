// src/store/progress.js
import { markLessonFinished as apiMark, getLessonProgress as apiGet } from '../api/progress.js';

/**
 * Mark lesson finished (wrapper)
 */
export async function markLessonFinished(userId, lessonId, courseId) {
  return apiMark(userId, lessonId, courseId);
}

/**
 * Get progress
 */
export async function getLessonProgress(userId, lessonId) {
  return apiGet(userId, lessonId);
}
