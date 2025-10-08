// src/store/session.js

const KEY = 'ilp_session_profile';

export function setSessionProfile(profile) {
  try {
    localStorage.setItem(KEY, JSON.stringify(profile));
  } catch (e) {}
}

export function getSessionProfile() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) { return null; }
}

export function clearSession() {
  localStorage.removeItem(KEY);
}
