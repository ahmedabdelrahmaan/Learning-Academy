// src/main.js
import { watchAuthState, auth } from './firebase.js';
import { renderLogin, logout } from './auth.js'; // Import logout from auth.js
import { renderDashboard } from './ui/dashboard.js';
import { renderAdmin } from './ui/admin.js';
import { renderSuperAdmin } from './ui/superadmin.js';
import { renderCourse } from './ui/course.js'; // Assuming you have a renderCourse file
import { getUser } from './api/users.js';
import { cacheSet, cacheGet } from './store/cache.js';

const page = document.getElementById('page');

/**
 * 🔹 Simple Router
 */
export function navigate(hash) {
  location.hash = hash;
  renderPage();
}

/**
 * 🔹 Main Page Renderer
 */
async function renderPage() {
  const user = auth.currentUser;
  const hash = location.hash.split('?')[0];

  if (!user) {
    renderLogin();
    return;
  }

  // load user profile from cache or DB
  let userData = cacheGet('profile');
  if (!userData) {
    userData = await getUser(user.uid);
    if (userData) {
      await cacheSet('profile', userData);
    }
  }

  if (!userData) {
    // User signed in but profile is missing (e.g., deleted by admin)
    logout(); 
    return;
  }

  // --- Protected Routes ---
  if (hash.startsWith('#course')) {
      renderCourse();
      return;
  }
  
  if (userData.role === 'super_admin') {
    renderSuperAdmin(userData);
  } else if (['tutor', 'assistant'].includes(userData.role)) {
    renderAdmin(userData);
  } else {
    // Default to student dashboard for all other roles or 'student'
    renderDashboard(userData);
  }
}

/**
 * 🔹 Auth Watcher
 */
watchAuthState((user) => {
  if (user) {
    // User signed in
    renderPage();
  } else {
    // User signed out
    navigate('#login');
  }
});

// Initial load
if (!location.hash) {
    navigate('#dashboard');
} else {
    renderPage();
}
