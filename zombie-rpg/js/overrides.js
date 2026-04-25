// Admin override store: persists uploaded replacement images per scene
// in IndexedDB (localStorage's ~5MB quota is too small for a single PNG).
//
// Exposes window.Overrides with a small Promise-based API. Both the game
// (index.html) and the admin (admin.html) call loadAll() to populate an
// in-memory { sceneId: objectURL } map. scenes.js reads that map
// synchronously at render time.
//
// Bumped to DB version 2 to add a second 'audio' store (same shape) for
// the audio admin tab. window.AudioOverrides exposes the parallel API.
const __DL_DB_NAME = "dead-light-overrides";
const __DL_DB_VERSION = 2;
const __DL_IMG_STORE = "images";
const __DL_AUDIO_STORE = "audio";

function __dlOpenDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(__DL_DB_NAME, __DL_DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(__DL_IMG_STORE))   db.createObjectStore(__DL_IMG_STORE);
      if (!db.objectStoreNames.contains(__DL_AUDIO_STORE)) db.createObjectStore(__DL_AUDIO_STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

// Factory — same Promise-based API for both stores. globalKey is the
// window.* property the loaded {id: objectURL} map is mirrored to so
// game-side code can read it synchronously.
function __dlMakeOverrideStore(storeName, globalKey) {
  function tx(mode, fn) {
    return __dlOpenDB().then(db => new Promise((resolve, reject) => {
      const t = db.transaction(storeName, mode);
      const store = t.objectStore(storeName);
      const result = fn(store);
      t.oncomplete = () => resolve(result && result.__value);
      t.onerror = () => reject(t.error);
      t.onabort = () => reject(t.error);
    }));
  }
  function save(id, blob) {
    return tx("readwrite", store => { store.put(blob, id); });
  }
  function refreshOne(id, blob) {
    if (current[id]) {
      try { URL.revokeObjectURL(current[id]); } catch (e) {}
    }
    current[id] = URL.createObjectURL(blob);
    window[globalKey] = current;
    return current[id];
  }
  function remove(id) {
    return tx("readwrite", store => { store.delete(id); });
  }
  function clear() {
    return tx("readwrite", store => { store.clear(); });
  }
  function list() {
    return __dlOpenDB().then(db => new Promise((resolve, reject) => {
      const t = db.transaction(storeName, "readonly");
      const store = t.objectStore(storeName);
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
    return __dlOpenDB().then(db => new Promise((resolve, reject) => {
      const t = db.transaction(storeName, "readonly");
      const req = t.objectStore(storeName).get(id);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    }));
  }
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
      window[globalKey] = current;
      return current;
    }).catch(() => (window[globalKey] = current));
  }
  // Pre-seed empty map so game code can read it before loadAll resolves.
  window[globalKey] = current;
  return { save, remove, clear, list, get, loadAll, refreshOne };
}

window.Overrides      = __dlMakeOverrideStore(__DL_IMG_STORE,   "__OVERRIDES");
window.AudioOverrides = __dlMakeOverrideStore(__DL_AUDIO_STORE, "__AUDIO_OVERRIDES");
