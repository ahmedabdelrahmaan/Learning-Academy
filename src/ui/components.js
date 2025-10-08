// src/ui/components.js
export function loader(msg = 'Loading...') {
  return `<div class="text-gray-500 animate-pulse p-4 text-center">${msg}</div>`;
}

export function card(title, body) {
  return `<div class="card p-4 mb-3 text-left">
    <h3 class="font-semibold mb-1">${title}</h3>
    <div>${body}</div>
  </div>`;
}
