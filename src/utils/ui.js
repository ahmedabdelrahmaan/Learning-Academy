// src/utils/ui.js

/**
 * showModal(html) -> returns { root, close() }
 */
export function showModal(html, { closeOnBackdrop = true } = {}) {
  const root = document.createElement('div');
  root.className = 'fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4';
  root.innerHTML = `
    <div class="card p-4 max-w-2xl w-full relative">
      <button id="__close" class="absolute top-2 right-2 text-gray-500">&times;</button>
      <div id="__content">${html}</div>
    </div>
  `;
  document.body.appendChild(root);

  root.querySelector('#__close').addEventListener('click', () => root.remove());
  if (closeOnBackdrop) {
    root.addEventListener('click', (e) => { if (e.target === root) root.remove(); });
  }

  return {
    root,
    close: () => root.remove(),
    content: root.querySelector('#__content')
  };
}

/**
 * Role selection modal (used on first signup)
 * onSelect receives role ('student'|'tutor')
 */
export function showRoleSelectModal(onSelect) {
  const m = showModal(`
    <h3 class="text-lg font-semibold mb-4">اختر دورك</h3>
    <div class="flex gap-3">
      <button id="roleStudent" class="bg-indigo-600 text-white px-4 py-2 rounded">طالب</button>
      <button id="roleTutor" class="bg-green-600 text-white px-4 py-2 rounded">مدرس</button>
    </div>
  `);
  m.root.querySelector('#roleStudent').addEventListener('click', () => { onSelect('student'); m.close(); });
  m.root.querySelector('#roleTutor').addEventListener('click', () => { onSelect('tutor'); m.close(); });
}

/**
 * toast(message, type) -> short notification
 */
export function toast(message, type = 'info') {
  const colors = {
    info: 'bg-blue-600',
    success: 'bg-green-600',
    error: 'bg-red-600',
    warn: 'bg-yellow-600 text-black'
  };
  const el = document.createElement('div');
  el.className = `fixed bottom-6 right-6 text-white px-4 py-2 rounded shadow ${colors[type] || colors.info} z-50`;
  el.textContent = message;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 3500);
}

/**
 * confirmDialog(message) -> Promise<boolean>
 */
export function confirmDialog(message = 'Are you sure?') {
  return new Promise((res) => {
    const m = showModal(`
      <p class="mb-4">${message}</p>
      <div class="flex gap-2 justify-end">
        <button id="noBtn" class="px-3 py-1 rounded border">No</button>
        <button id="yesBtn" class="px-3 py-1 rounded bg-red-600 text-white">Yes</button>
      </div>
    `);
    m.root.querySelector('#noBtn').addEventListener('click', () => { res(false); m.close(); });
    m.root.querySelector('#yesBtn').addEventListener('click', () => { res(true); m.close(); });
  });
}
