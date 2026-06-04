// IndexedDB storage manager for local audio MP3 files to bypass copyright hosting restrictions
const DB_NAME = 'GlucoTrackAudioDB';
const STORE_NAME = 'songs';
const DB_VERSION = 1;

const idb = typeof window !== 'undefined' ? (window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB) : null;

function openDB() {
  return new Promise((resolve, reject) => {
    if (!idb) {
      reject(new Error("IndexedDB is not supported in this environment"));
      return;
    }
    const request = idb.open(DB_NAME, DB_VERSION);
    
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    
    request.onsuccess = (e) => {
      resolve(e.target.result);
    };
    
    request.onerror = (e) => {
      reject(e.target.error);
    };
  });
}

export async function saveLocalSong(songId, fileBlob) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store.put(fileBlob, songId);
    
    request.onsuccess = () => resolve(true);
    request.onerror = () => reject(request.error);
  });
}

export async function getLocalSongUrl(songId) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.get(songId);
    
    request.onsuccess = (e) => {
      const blob = e.target.result;
      if (blob) {
        const url = URL.createObjectURL(blob);
        resolve(url);
      } else {
        resolve(null);
      }
    };
    request.onerror = () => reject(request.error);
  });
}

export async function hasLocalSong(songId) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.getKey(songId);
    
    request.onsuccess = (e) => {
      resolve(e.target.result !== undefined);
    };
    request.onerror = () => reject(request.error);
  });
}

export async function deleteLocalSong(songId) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store.delete(songId);
    
    request.onsuccess = () => resolve(true);
    request.onerror = () => reject(request.error);
  });
}
