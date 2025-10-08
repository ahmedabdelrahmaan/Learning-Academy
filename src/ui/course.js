// src/ui/course.js
import { auth } from '../firebase.js';
import { getCourse } from '../api/courses.js';
import { listLessons } from '../api/lessons.js';
import { listSubscriptionsForStudent } from '../api/subscriptions.js';
import { markLessonFinished, getLessonProgress } from '../api/progress.js';
import { toast } from '../utils/ui.js';

function extractVideoId(urlOrId) {
  try {
    const u = new URL(urlOrId);
    if (u.hostname.includes('youtube.com')) return u.searchParams.get('v');
    if (u.hostname.includes('youtu.be')) return u.pathname.slice(1);
  } catch (e) {}
  return urlOrId;
}
function makeEmbedUrl(videoId) {
  return `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1&disablekb=1`;
}

export async function renderCourse() {
  const page = document.getElementById('page');
  const params = new URLSearchParams(location.hash.split('?')[1]);
  const courseId = params.get('id');
  const user = auth.currentUser;
  const course = await getCourse(courseId);
  const lessons = await listLessons(courseId);

  // Check subscription
  const subs = await listSubscriptionsForStudent(user.uid);
  const sub = subs.find(s => s.courseId === courseId);
  const hasAccess = sub?.status === 'subscribed';
  const underReview = sub?.status === 'underReview';

  page.innerHTML = `
    <button id="backBtn" class="text-indigo-600 mb-3">← Back</button>
    <h2 class="text-xl font-semibold mb-2">${course.title}</h2>
    <p class="text-gray-600 mb-3">${course.description || ''}</p>
    ${
      !hasAccess && !underReview
        ? `<div class="bg-yellow-50 p-3 rounded">You must subscribe to access this course.</div>`
        : underReview
        ? `<div class="bg-blue-50 p-3 rounded">Your subscription is under review.</div>`
        : ''
    }
    <div id="lessonsList" class="mt-4 space-y-3"></div>
  `;

  const list = document.getElementById('lessonsList');
  for (const lesson of lessons.sort((a,b)=>a.order-b.order)) {
    const progress = await getLessonProgress(user.uid, lesson.id);
    const done = progress?.finished;
    const div = document.createElement('div');
    div.className = 'card p-3 text-left';
    div.innerHTML = `
      <div class="flex justify-between items-center mb-2">
        <h3 class="font-semibold">${lesson.order}. ${lesson.title}</h3>
        ${hasAccess ? `<button class="mark text-sm ${done ? 'text-green-600' : 'text-indigo-600'}" data-id="${lesson.id}">
          ${done ? '✓ Completed' : 'Mark Done'}
        </button>` : ''}
      </div>
      ${
        hasAccess || underReview
          ? `<details class="border rounded p-2 bg-gray-50">
              <summary>🎥 Video</summary>
              <iframe class="w-full aspect-video mt-2 rounded" src="${makeEmbedUrl(extractVideoId(lesson.videoId))}"
                allowfullscreen sandbox="allow-scripts allow-same-origin" oncontextmenu="return false"></iframe>
            </details>
            <details class="border rounded p-2 bg-gray-50">
              <summary>📚 Materials</summary>
              <a href="${lesson.materialsUrl}" target="_blank" class="text-indigo-600">Open Material</a>
            </details>
            <details class="border rounded p-2 bg-gray-50">
              <summary>🧮 Quiz</summary>
              <iframe src="${lesson.quizUrl}" class="w-full aspect-[4/3] mt-2 rounded"></iframe>
            </details>
            <details class="border rounded p-2 bg-gray-50">
              <summary>💬 Remarks</summary>
              <p>${lesson.remarks || 'No remarks.'}</p>
            </details>`
          : ''
      }
    `;
    list.appendChild(div);
  }

  list.addEventListener('click', async (e) => {
    const btn = e.target.closest('.mark');
    if (!btn) return;
    const lessonId = btn.dataset.id;
    await markLessonFinished(user.uid, lessonId, courseId);
    toast('Lesson marked complete');
    renderCourse();
  });

  document.getElementById('backBtn').addEventListener('click', () => history.back());
}
