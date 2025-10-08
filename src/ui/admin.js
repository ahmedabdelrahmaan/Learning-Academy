// src/ui/admin.js
import { auth } from '../firebase.js';
import { listCourses, createCourse, updateCourse, softDeleteCourse, restoreCourse, getCourse } from '../api/courses.js';
import { listLessons, addLesson, updateLesson, softDeleteLesson, restoreLesson } from '../api/lessons.js';
import { listSubscriptionsForTutor, reviewSubscription } from '../api/subscriptions.js';
import { confirmDialog,showModal,toast } from '../utils/ui.js';
/**
 * 🔹 Helper to extract YouTube videoId (in case tutor pasted full link)
 */
function extractVideoId(urlOrId) {
  try {
    const u = new URL(urlOrId);
    if (u.hostname.includes('youtube.com')) return u.searchParams.get('v');
    if (u.hostname.includes('youtu.be')) return u.pathname.slice(1);
  } catch (e) {}
  return urlOrId.trim();
}

/**
 * 🔹 Render admin panel
 */
export async function renderAdmin() {
  const container = document.getElementById('page');
  const user = auth.currentUser;

  container.innerHTML = `
    <h2 class="text-xl font-semibold mb-4">Instructor Dashboard</h2>
    <div class="flex flex-wrap gap-3 mb-4">
      <button id="addCourseBtn" class="bg-indigo-600 text-white px-3 py-2 rounded">+ New Course</button>
      <button id="subscriptionsBtn" class="bg-teal-600 text-white px-3 py-2 rounded">📋 Subscriptions</button>
    </div>
    <div id="admin-content"></div>
  `;

  const content = container.querySelector('#admin-content');
  const courses = await listCourses();

  if (courses.length === 0) {
    content.innerHTML = `<p class="text-gray-500">No courses found. Add your first course!</p>`;
  } else {
    content.innerHTML = `
      <div class="grid gap-3">
        ${courses.map(c => `
          <div class="border p-3 rounded shadow-sm">
            <div class="flex justify-between items-center">
              <div>
                <h3 class="font-semibold text-lg">${c.title}</h3>
                <p class="text-sm text-gray-600">${c.description || ''}</p>
              </div>
              <div class="flex gap-2">
                <button class="bg-blue-600 text-white px-2 py-1 rounded" data-action="view" data-id="${c.id}">📖 Lessons</button>
                <button class="bg-yellow-600 text-white px-2 py-1 rounded" data-action="edit" data-id="${c.id}">✏️ Edit</button>
                <button class="bg-red-600 text-white px-2 py-1 rounded" data-action="delete" data-id="${c.id}">🗑️ Delete</button>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  // Event bindings
  container.querySelector('#addCourseBtn').addEventListener('click', openAddCourseModal);
  container.querySelector('#subscriptionsBtn').addEventListener('click', openSubscriptionsModal);

  content.addEventListener('click', async (e) => {
    const btn = e.target.closest('button[data-action]');
    if (!btn) return;
    const id = btn.dataset.id;
    const action = btn.dataset.action;

    if (action === 'view') openLessonsPage(id);
    if (action === 'edit') openEditCourseModal(id);
    if (action === 'delete') await deleteCourse(id);
  });
}

/**
 * 🔹 Add new course modal
 */
async function openAddCourseModal() {
  const m = showModal(`
    <h3 class="font-semibold mb-2">Add New Course</h3>
    <input id="title" type="text" placeholder="Course Title" class="border p-2 w-full mb-2" />
    <textarea id="desc" placeholder="Description" class="border p-2 w-full mb-2"></textarea>
    <button id="save" class="bg-indigo-600 text-white px-3 py-2 rounded">Save</button>
  `);

  m.root.querySelector('#save').addEventListener('click', async () => {
    const title = m.root.querySelector('#title').value.trim();
    const desc = m.root.querySelector('#desc').value.trim();
    if (!title) return toast('Please enter a title', 'error');

    await createCourse({
      title,
      description: desc,
      tutorId: auth.currentUser.uid,
    });
    toast('Course added successfully', 'success');
    m.close();
    renderAdmin();
  });
}

/**
 * 🔹 Edit course
 */
async function openEditCourseModal(courseId) {
  const course = await getCourse(courseId);
  const m = showModal(`
    <h3 class="font-semibold mb-2">Edit Course</h3>
    <input id="title" type="text" value="${course.title}" class="border p-2 w-full mb-2" />
    <textarea id="desc" class="border p-2 w-full mb-2">${course.description || ''}</textarea>
    <button id="update" class="bg-indigo-600 text-white px-3 py-2 rounded">Update</button>
  `);

  m.root.querySelector('#update').addEventListener('click', async () => {
    const title = m.root.querySelector('#title').value.trim();
    const desc = m.root.querySelector('#desc').value.trim();
    await updateCourse(courseId, { title, description: desc }, auth.currentUser.uid);
    toast('Course updated', 'success');
    m.close();
    renderAdmin();
  });
}

/**
 * 🔹 Delete (soft delete)
 */
async function deleteCourse(id) {
  if (!(await confirmDialog('Are you sure you want to delete this course?'))) return;
  await softDeleteCourse(id, auth.currentUser.uid);
  toast('Course moved to trash', 'info');
  renderAdmin();
}

/**
 * 🔹 View lessons inside a course
 */
async function openLessonsPage(courseId) {
  const container = document.getElementById('page');
  const course = await getCourse(courseId);
  const lessons = await listLessons(courseId);

  container.innerHTML = `
    <button id="backBtn" class="text-indigo-600 mb-3">← Back to Courses</button>
    <h2 class="text-xl font-semibold mb-2">${course.title}</h2>
    <div class="flex gap-2 mb-3">
      <button id="addLessonBtn" class="bg-indigo-600 text-white px-3 py-2 rounded">+ Add Lesson</button>
    </div>
    <div id="lesson-list"></div>
  `;

  const list = container.querySelector('#lesson-list');
  if (lessons.length === 0) {
    list.innerHTML = `<p class="text-gray-500">No lessons yet.</p>`;
  } else {
    list.innerHTML = lessons.sort((a,b)=>a.order-b.order).map(l => `
      <div class="border p-3 rounded mb-2">
        <div class="flex justify-between items-center">
          <div>
            <h3 class="font-semibold">${l.order}. ${l.title}</h3>
            <p class="text-sm text-gray-500">Video ID: ${l.videoId}</p>
          </div>
          <div class="flex gap-2">
            <button class="bg-blue-600 text-white px-2 py-1 rounded" data-act="preview" data-id="${l.id}">▶ Preview</button>
            <button class="bg-yellow-600 text-white px-2 py-1 rounded" data-act="edit" data-id="${l.id}">✏ Edit</button>
            <button class="bg-red-600 text-white px-2 py-1 rounded" data-act="delete" data-id="${l.id}">🗑 Delete</button>
          </div>
        </div>
      </div>
    `).join('');
  }

  container.querySelector('#backBtn').addEventListener('click', renderAdmin);
  container.querySelector('#addLessonBtn').addEventListener('click', () => openAddLessonModal(courseId));

  list.addEventListener('click', async (e) => {
    const btn = e.target.closest('button[data-act]');
    if (!btn) return;
    const id = btn.dataset.id;
    const act = btn.dataset.act;
    if (act === 'preview') openLessonPreview(courseId, id);
    if (act === 'edit') openEditLessonModal(courseId, id);
    if (act === 'delete') {
      if (await confirmDialog('Delete this lesson?')) {
        await softDeleteLesson(courseId, id, auth.currentUser.uid);
        toast('Lesson deleted', 'info');
        openLessonsPage(courseId);
      }
    }
  });
}

/**
 * 🔹 Add new lesson modal
 */
function openAddLessonModal(courseId) {
  const m = showModal(`
    <h3 class="font-semibold mb-2">Add New Lesson</h3>
    <input id="title" type="text" placeholder="Lesson title" class="border p-2 w-full mb-2" />
    <input id="order" type="number" placeholder="Order" class="border p-2 w-full mb-2" />
    <input id="videoId" type="text" placeholder="YouTube Video ID (e.g. dQw4w9WgXcQ)" class="border p-2 w-full mb-2" />
    <input id="materials" type="url" placeholder="Materials URL" class="border p-2 w-full mb-2" />
    <input id="quiz" type="url" placeholder="Quiz URL" class="border p-2 w-full mb-2" />
    <textarea id="remarks" placeholder="Remarks" class="border p-2 w-full mb-2"></textarea>
    <button id="save" class="bg-indigo-600 text-white px-3 py-2 rounded">Save</button>
  `);

  m.root.querySelector('#save').addEventListener('click', async () => {
    const data = {
      order: parseInt(m.root.querySelector('#order').value),
      title: m.root.querySelector('#title').value,
      videoId: extractVideoId(m.root.querySelector('#videoId').value),
      materialsUrl: m.root.querySelector('#materials').value.trim(),
      quizUrl: m.root.querySelector('#quiz').value.trim(),
      remarks: m.root.querySelector('#remarks').value.trim(),
    };
    await addLesson(courseId, data);
    toast('Lesson added', 'success');
    m.close();
    openLessonsPage(courseId);
  });
}

/**
 * 🔹 Edit lesson modal
 */
async function openEditLessonModal(courseId, lessonId) {
  const lessons = await listLessons(courseId);
  const lesson = lessons.find(l => l.id === lessonId);
  const m = showModal(`
    <h3 class="font-semibold mb-2">Edit Lesson</h3>
    <input id="title" type="text" value="${lesson.title}" class="border p-2 w-full mb-2" />
    <input id="order" type="number" value="${lesson.order}" class="border p-2 w-full mb-2" />
    <input id="videoId" type="text" value="${lesson.videoId}" class="border p-2 w-full mb-2" />
    <input id="materials" type="url" value="${lesson.materialsUrl}" class="border p-2 w-full mb-2" />
    <input id="quiz" type="url" value="${lesson.quizUrl}" class="border p-2 w-full mb-2" />
    <textarea id="remarks" class="border p-2 w-full mb-2">${lesson.remarks || ''}</textarea>
    <button id="update" class="bg-indigo-600 text-white px-3 py-2 rounded">Update</button>
  `);

  m.root.querySelector('#update').addEventListener('click', async () => {
    const data = {
      order: parseInt(m.root.querySelector('#order').value),
      title: m.root.querySelector('#title').value.trim(),
      videoId: extractVideoId(m.root.querySelector('#videoId').value),
      materialsUrl: m.root.querySelector('#materials').value.trim(),
      quizUrl: m.root.querySelector('#quiz').value.trim(),
      remarks: m.root.querySelector('#remarks').value.trim(),
    };
    await updateLesson(courseId, lessonId, data, auth.currentUser.uid);
    toast('Lesson updated', 'success');
    m.close();
    openLessonsPage(courseId);
  });
}

/**
 * 🔹 Lesson Preview modal
 */
async function openLessonPreview(courseId, lessonId) {
  const lessons = await listLessons(courseId);
  const l = lessons.find(x => x.id === lessonId);
  const videoUrl = `https://www.youtube.com/embed/${extractVideoId(l.videoId)}?rel=0&modestbranding=1`;

  showModal(`
    <h3 class="font-semibold mb-2">${l.title}</h3>
    <iframe src="${videoUrl}" class="w-full aspect-video rounded mb-2" sandbox="allow-scripts allow-same-origin" allowfullscreen></iframe>
    <a href="${l.materialsUrl}" target="_blank" class="text-indigo-600 block mb-2">📚 Materials</a>
    <iframe src="${l.quizUrl}" class="w-full aspect-[4/3] rounded mb-2" allowfullscreen></iframe>
    <p class="text-sm text-gray-600">${l.remarks || ''}</p>
  `);
}

/**
 * 🔹 Manage subscriptions review
 */
async function openSubscriptionsModal() {
  const subs = await listSubscriptionsForTutor(auth.currentUser.uid);
  const m = showModal(`
    <h3 class="font-semibold mb-2">Pending Subscriptions</h3>
    <div class="max-h-[70vh] overflow-auto">
      ${subs.filter(s=>s.status==='underReview').length === 0
        ? '<p>No pending subscriptions.</p>'
        : subs.filter(s=>s.status==='underReview').map(s => `
          <div class="border p-3 rounded mb-2">
            <p><strong>Student:</strong> ${s.username || s.userId}</p>
            <p><strong>Course:</strong> ${s.courseId}</p>
            <p><strong>Payment ID:</strong> ${s.paymentId}</p>
            <img src="${s.paymentProofUrl}" class="w-40 mt-2 rounded" alt="proof" />
            <div class="flex gap-2 mt-2">
              <button class="bg-green-600 text-white px-2 py-1 rounded" data-act="approve" data-id="${s.id}">Approve</button>
              <button class="bg-red-600 text-white px-2 py-1 rounded" data-act="reject" data-id="${s.id}">Reject</button>
            </div>
          </div>
        `).join('')
      }
    </div>
  `);

  m.root.addEventListener('click', async (e) => {
    const btn = e.target.closest('button[data-act]');
    if (!btn) return;
    const act = btn.dataset.act;
    const id = btn.dataset.id;
    if (act === 'approve') {
      await reviewSubscription(id, 'subscribed', auth.currentUser.uid);
      toast('Approved', 'success');
    } else if (act === 'reject') {
      const reason = prompt('Reason for rejection?');
      await reviewSubscription(id, 'canceled', auth.currentUser.uid, reason || 'No reason given');
      toast('Rejected', 'error');
    }
    m.close();
  });
}
