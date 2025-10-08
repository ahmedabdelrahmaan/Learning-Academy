// src/ui/superadmin.js
import { listUsers, updateUser, restoreUser } from '../api/users.js'; // ✅ listUsers is now correctly exported
import { restoreCourse } from '../api/courses.js';
import { toast, confirmDialog } from '../utils/ui.js';
import { logout } from '../auth.js';

/**
 * 🔹 Render super admin panel
 */
export async function renderSuperAdmin() {
  const page = document.getElementById('page');
  
  // listUsers now correctly fetches users
  const tutors = await listUsers('tutor');
  const deletedUsers = (await listUsers('all', true)).filter(u => u.isDeleted); // Added a basic way to fetch all users including deleted ones (assuming listUsers supports this later or needs to be refined)
  const deletedCourses = []; // يمكن لاحقًا جلبها من query مخصص

  page.innerHTML = `
    <div class="flex justify-between items-center mb-3">
      <h2 class="text-xl font-semibold">Super Admin Panel</h2>
      <button id="logoutBtn" class="text-sm text-indigo-600">Logout</button>
    </div>

    <h3 class="font-semibold mb-2">Tutors Review</h3>
    ${tutors.map(t => `
      <div class="border p-3 rounded mb-2">
        <p><strong>${t.name}</strong> (${t.email})</p>
        <p>Status: ${t.status || 'underReview'}</p>
        <button class="approve bg-green-600 text-white px-2 py-1 rounded text-sm" data-id="${t.id}">Approve</button>
        <button class="reject bg-red-600 text-white px-2 py-1 rounded text-sm" data-id="${t.id}">Reject</button>
      </div>
    `).join('')}

    <h3 class="font-semibold mt-6 mb-2">Deleted Users</h3>
    ${deletedUsers.length === 0
      ? '<p>No deleted users</p>'
      : deletedUsers.map(u => `
        <div class="border p-3 rounded mb-2">
          <p>${u.name} (${u.email})</p>
          <button class="restoreUser bg-indigo-600 text-white px-2 py-1 rounded text-sm" data-id="${u.id}">Restore</button>
        </div>
      `).join('')
    }

    <h3 class="font-semibold mt-6 mb-2">Deleted Courses</h3>
    ${deletedCourses.length === 0 ? '<p>No deleted courses</p>' : ''}
  `;

  page.addEventListener('click', async (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;
    const id = btn.dataset.id;
    
    if (btn.classList.contains('approve')) {
      await updateUser(id, { status: 'verified' }); // Assuming status update
      toast('Tutor approved', 'success');
      renderSuperAdmin();
    } else if (btn.classList.contains('reject')) {
      if (await confirmDialog('Reject this tutor?')) {
        await updateUser(id, { status: 'rejected' });
        toast('Tutor rejected', 'warn');
        renderSuperAdmin();
      }
    } else if (btn.classList.contains('restoreUser')) {
      if (await confirmDialog('Restore this user?')) {
        await restoreUser(id, auth.currentUser.uid);
        toast('User restored', 'success');
        renderSuperAdmin();
      }
    } else if (btn.id === 'logoutBtn') {
        logout();
    }
  });
}
