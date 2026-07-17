// Polyfills the `window.storage` API that Claude.ai artifacts provide,
// backed by the browser's localStorage instead. This lets Panel.jsx's
// storage calls (get/set/delete/list) work unmodified in a normal
// deployed web app. Data is per-browser, not synced across devices.
//
// Swap this file out for a real backend (e.g. a small API + database)
// if you want results to sync across devices — see README.md.

const PREFIX = 'panel:';

function keyFor(key, shared) {
  // "shared" has no real meaning without a backend; kept for API
  // compatibility so Panel.jsx doesn't need to change.
  return `${PREFIX}${shared ? 'shared:' : 'local:'}${key}`;
}

window.storage = {
  async get(key, shared = false) {
    const raw = localStorage.getItem(keyFor(key, shared));
    if (raw === null) return null;
    return { key, value: raw, shared };
  },

  async set(key, value, shared = false) {
    localStorage.setItem(keyFor(key, shared), value);
    return { key, value, shared };
  },

  async delete(key, shared = false) {
    localStorage.removeItem(keyFor(key, shared));
    return { key, deleted: true, shared };
  },

  async list(prefix = '', shared = false) {
    const fullPrefix = keyFor(prefix, shared);
    const keys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(fullPrefix)) {
        keys.push(k.slice(keyFor('', shared).length));
      }
    }
    return { keys, prefix, shared };
  },
};
