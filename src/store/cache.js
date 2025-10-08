// src/store/cache.js

/**
 * key -> string
 * data -> any (serializable)
 * ttlMinutes -> number
 */
export function cacheSet(key, data, ttlMinutes = 30) {
  try {
    const payload = {
      ts: Date.now(),
      ttl: ttlMinutes * 60 * 1000,
      data
    };
    localStorage.setItem(`ilp_cache:${key}`, JSON.stringify(payload));
  } catch (err) {
    console.warn('cacheSet failed', err);
  }
}

export function cacheGet(key) {
  try {
    const raw = localStorage.getItem(`ilp_cache:${key}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (Date.now() - parsed.ts > parsed.ttl) {
      localStorage.removeItem(`ilp_cache:${key}`);
      return null;
    }
    return parsed.data;
  } catch (err) {
    return null;
  }
}

export function cacheClear(key) {
  localStorage.removeItem(`ilp_cache:${key}`);
}

export function cacheClearAll() {
  Object.keys(localStorage).forEach(k => {
    if (k.startsWith('ilp_cache:')) localStorage.removeItem(k);
  });
}
