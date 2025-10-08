// src/auth.js
import { signInWithGoogle, signOutUser, auth, db } from './firebase.js';
import {
  doc, getDoc, setDoc, serverTimestamp
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

export async function renderLogin() {
  const page = document.getElementById('page');
  page.innerHTML = `
    <div class="card p-6 max-w-sm mx-auto text-center">
      <h2 class="text-xl font-semibold mb-2">Welcome to TutorHub</h2>
      <p class="text-gray-600 mb-4">Sign in to continue</p>
      <button id="googleLogin" class="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700">
        Sign in with Google
      </button>
    </div>
  `;

  document.getElementById('googleLogin').addEventListener('click', async () => {
    try {
      const result = await signInWithGoogle();
      const user = result.user;
      const userRef = doc(db, 'users', user.uid);
      const snap = await getDoc(userRef);

      if (!snap.exists()) {
        // Ask for role
        const role = prompt('Choose your role (tutor / student)').toLowerCase().trim();
        await setDoc(userRef, {
          email: user.email,
          name: user.displayName,
          role: role === 'tutor' ? 'tutor' : 'student',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          isDeleted: false,
        });
      }

      location.reload(); // reload to trigger role-based dashboard
    } catch (err) {
      console.error(err);
      alert('Login failed: ' + err.message);
    }
  });
}

export async function logout() {
  await signOutUser();
  location.reload();
}
