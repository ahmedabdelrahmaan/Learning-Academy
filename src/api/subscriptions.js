// src/api/subscriptions.js
import { db } from '../firebase.js';
import {
  doc, addDoc, updateDoc, getDocs,
  collection, query, where, serverTimestamp
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { softDeleteDoc, restoreDoc } from '../utils/helpers.js';

/**
 * 🔹 Create new subscription
 */
export async function createSubscription(data) {
  await addDoc(collection(db, 'subscriptions'), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    isDeleted: false,
  });
}

/**
 * 🔹 List subscriptions by student
 */
export async function listSubscriptionsForStudent(userId) {
  const q = query(
    collection(db, 'subscriptions'),
    where('userId', '==', userId),
    where('isDeleted', '==', false)
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

/**
 * 🔹 List subscriptions by tutor
 */
export async function listSubscriptionsForTutor(tutorId) {
  const q = query(
    collection(db, 'subscriptions'),
    where('tutorId', '==', tutorId),
    where('isDeleted', '==', false)
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

/**
 * 🔹 Review subscription (approve / reject)
 */
export async function reviewSubscription(id, status, reviewerId, remark = '') {
  const ref = doc(db, 'subscriptions', id);
  await updateDoc(ref, {
    status,
    reviewerId,
    reviewerRemark: remark,
    reviewedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    updatedBy: reviewerId,
  });
}

/**
 * 🔹 Soft delete / restore
 */
export async function softDeleteSubscription(id, deletedBy) {
  return softDeleteDoc('subscriptions', id, deletedBy);
}
export async function restoreSubscription(id, restoredBy) {
  return restoreDoc('subscriptions', id, restoredBy);
}
