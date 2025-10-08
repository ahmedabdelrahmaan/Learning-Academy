// src/utils/helpers.js
import { db } from '../firebase.js';
import {
  doc,
  updateDoc,
  serverTimestamp,
  getDocs,
  collection,
  query,
  where
} from 'https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js';

/**
 * Soft delete a document
 * collectionPath can be top-level 'courses' or subcollection 'courses/{courseId}/lessons'
 */
export async function softDeleteDoc(collectionPath, id, deletedBy = 'system') {
  const ref = doc(db, collectionPath, id);
  await updateDoc(ref, {
    isDeleted: true,
    deletedAt: serverTimestamp(),
    deletedBy
  });
  return true;
}

/**
 * Restore a soft-deleted document
 */
export async function restoreDoc(collectionPath, id, restoredBy = 'system') {
  const ref = doc(db, collectionPath, id);
  await updateDoc(ref, {
    isDeleted: false,
    deletedAt: null,
    deletedBy: null,
    updatedAt: serverTimestamp(),
    updatedBy: restoredBy
  });
  return true;
}

/**
 * Bulk restore all documents in a collectionPath where isDeleted == true
 * collectionPath must be a top-level collection (like 'users' or 'courses')
 */
export async function restoreAll(collectionPath, restoredBy = 'super_admin') {
  const collRef = collection(db, collectionPath);
  const q = query(collRef, where('isDeleted', '==', true));
  const snap = await getDocs(q);
  let count = 0;
  for (const d of snap.docs) {
    await restoreDoc(collectionPath, d.id, restoredBy);
    count++;
  }
  return count;
}
