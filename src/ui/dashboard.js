// src/ui/dashboard.js
import { auth } from '../firebase.js';
import { listCourses } from '../api/courses.js';
import { createSubscription, listSubscriptionsForStudent } from '../api/subscriptions.js'; // Added createSubscription
import { getLessonProgress } from '../store/progress.js';
import { navigate } from '../main.js';
import { logout } from '../auth.js';
import { toast } from '../utils/ui.js'; // Import toast for feedback
import { loader } from './components.js'; // Import loader for loading state

export async function renderDashboard() {
  const page = document.getElementById('page');
  const user = auth.currentUser;
  
  if (!user) return; // Should not happen if coming from main.js router, but good practice

  // Use a loading state until data is ready
  page.innerHTML = `
    <div class="flex justify-between items-center mb-6 border-b pb-3">
      <h2 class="text-3xl font-extrabold text-gray-800">Hello, ${user.displayName || 'Student'}!</h2>
      <button id="logoutBtn" class="text-sm text-red-600 hover:text-red-700 font-medium transition-colors">Logout</button>
    </div>

    <h3 class="font-semibold text-2xl mb-4 text-gray-700">Available Courses</h3>
    <div id="coursesList" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      <div class="col-span-full text-center p-10">${loader('Loading courses...')}</div>
    </div>
  `;
  
  // Attach logout listener
  document.getElementById('logoutBtn').addEventListener('click', logout);

  const courses = await listCourses();
  const subs = await listSubscriptionsForStudent(user.uid);

  const container = document.getElementById('coursesList');
  container.innerHTML = ''; // Clear loading state

  if (courses.length === 0) {
    container.innerHTML = `<p class="col-span-full text-center text-gray-500 p-8">No courses are available right now. Check back later!</p>`;
    return;
  }

  for (const course of courses) {
    const sub = subs.find(s => s.courseId === course.id);
    const status = sub ? sub.status : 'none';
    const subscribed = status === 'subscribed';
    const underReview = status === 'underReview';

    const card = document.createElement('div');
    // Enhanced card style for hover and interaction
    card.className = 'card p-6 flex flex-col justify-between h-full transition-all duration-200 hover:shadow-xl hover:border-indigo-400';
    card.innerHTML = `
      <div>
        <h4 class="font-bold text-xl mb-2 text-indigo-800">${course.title}</h4>
        <p class="text-gray-600 text-sm mb-4 line-clamp-3">${course.description || 'No description provided.'}</p>
        <p class="text-xs text-gray-400 mb-4">Tutor: ${course.tutorName || 'N/A'}</p>
      </div>

      <div class="mt-auto flex justify-between items-center pt-4 border-t border-gray-100">
        ${
          subscribed
            ? `<span class="text-green-600 font-semibold text-sm">✓ Enrolled</span>
               <button class="openCourse btn-primary text-sm bg-indigo-600 hover:bg-indigo-700" data-id="${course.id}">Start Learning →</button>`
            : underReview
            ? `<span class="text-blue-600 font-semibold text-sm">Pending Review...</span>
               <button class="openCourse text-indigo-600 hover:text-indigo-800 text-sm font-medium" data-id="${course.id}">View Details</button>`
            : `<span class="text-gray-500 font-semibold text-sm">Enroll Now</span>
               <button class="subscribe btn-primary text-sm" data-id="${course.id}">Subscribe</button>`
        }
      </div>
    `;
    container.appendChild(card);
  }

  container.addEventListener('click', async (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;
    const courseId = btn.dataset.id;
    
    if (btn.classList.contains('openCourse')) {
      navigate(`#course?id=${courseId}`);
    } else if (btn.classList.contains('subscribe')) {
      // In a real application, this should open a payment modal.
      // For now, we use a simple prompt for the payment ID.
      
      const paymentId = prompt("Please enter your payment ID (e.g., transaction number) for manual review:");
      if (!paymentId) {
        toast('Subscription cancelled.', 'warn');
        return;
      }
      
      // Assume a dummy payment proof URL since we don't handle file uploads here
      const dummyProofUrl = `https://placehold.co/150x100/4f46e5/white?text=Payment+ID%3A${paymentId.slice(0, 5)}`;

      const course = courses.find(c => c.id === courseId);

      try {
        await createSubscription({
          userId: user.uid,
          courseId: courseId,
          tutorId: course.tutorId, // Important for tutor visibility
          username: user.displayName || user.email,
          courseTitle: course.title,
          paymentId: paymentId,
          paymentProofUrl: dummyProofUrl,
          status: 'underReview'
        });
        toast('Subscription request submitted successfully! Pending approval.', 'success');
        // Re-render to update the status of the card
        renderDashboard();
      } catch (err) {
        console.error("Error creating subscription:", err);
        toast('Failed to subscribe. Check permissions.', 'error');
      }
    }
  });
}
