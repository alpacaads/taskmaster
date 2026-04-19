// Admin override store: persists uploaded replacement images per scene
// in IndexedDB (localStorage's ~5MB quota is too small for a single PNG).
//
// Exposes window.Overrides with a small Promise-based API. Both the game
// (index.html) and the admin (admin.html) call loadAll() to populate an
// in-memory { sceneId: objectURL } map. scenes.js reads that map
// synchronously at render time.
window.Overrides = (function () {
  const DB_NAME = "dead-light-overrides";
  const STORE = "images";
  const VERSION = 1;

  function openDB() {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  function tx(mode, fn) {
    return openDB().then(db => new Promise((resolve, reject) => {
      const t = db.transaction(STORE, mode);
      const store = t.objectStore(STORE);
      const result = fn(store);
      t.oncomplete = () => resolve(result && result.__value);
      t.onerror = () => reject(t.error);
      t.onabort = () => reject(t.error);
    }));
  }

  function save(id, blob) {
    return tx("readwrite", store => { store.put(blob, id); });
  }

  function remove(id) {
    return tx("readwrite", store => { store.delete(id); });
  }

  function clear() {
    return tx("readwrite", store => { store.clear(); });
  }

  function list() {
    return openDB().then(db => new Promise((resolve, reject) => {
      const t = db.transaction(STORE, "readonly");
      const store = t.objectStore(STORE);
      const out = [];
      const req = store.openCursor();
      req.onsuccess = () => {
        const cur = req.result;
        if (cur) { out.push({ id: cur.key, blob: cur.value }); cur.continue(); }
        else resolve(out);
      };
      req.onerror = () => reject(req.error);
    }));
  }

  function get(id) {
    return openDB().then(db => new Promise((resolve, reject) => {
      const t = db.transaction(STORE, "readonly");
      const req = t.objectStore(STORE).get(id);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    }));
  }

  // Populate a global map { id: objectURL } that scenes.js reads at render
  // time. Old object URLs are revoked and replaced so repeated calls are safe.
  let current = {};
  function loadAll() {
    return list().then(items => {
      Object.values(current).forEach(u => {
        try { URL.revokeObjectURL(u); } catch (e) {}
      });
      current = {};
      items.forEach(({ id, blob }) => {
        current[id] = URL.createObjectURL(blob);
      });
      window.__OVERRIDES = current;
      return current;
    }).catch(() => (window.__OVERRIDES = current));
  }

  // Ensure a map exists even before loadAll resolves.
  window.__OVERRIDES = current;

  return { save, remove, clear, list, get, loadAll };
})();
