import { initializeApp } from 'firebase/app';
import { getFirestore, initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyCHGC8tKq_WXXZrLm3QocsvqqF1JGZyoGE",
  authDomain: "glucotrack-app-aaryan.firebaseapp.com",
  projectId: "glucotrack-app-aaryan",
  storageBucket: "glucotrack-app-aaryan.firebasestorage.app",
  messagingSenderId: "797853725119",
  appId: "1:797853725119:web:6a60c1b92ba2869100b10a"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore with persistent offline cache and multi-tab synchronization support (with fail-safe fallback)
let db;
try {
  db = initializeFirestore(app, {
    localCache: persistentLocalCache({
      tabManager: persistentMultipleTabManager()
    })
  });
} catch (err) {
  console.warn("Firestore offline persistence initialization failed, falling back to default getFirestore:", err);
  db = getFirestore(app);
}

// Initialize Authentication
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

export { app, db, auth, googleProvider };
