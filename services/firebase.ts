
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDBVm-hUMshicbVBw9OiPPzcvPLTStN4sE",
  authDomain: "mahder-c8eb7.firebaseapp.com",
  projectId: "mahder-c8eb7",
  storageBucket: "mahder-c8eb7.firebasestorage.app",
  messagingSenderId: "325795132880",
  appId: "1:325795132880:web:35b742d846a9383060b5d5",
  measurementId: "G-8V4FVH553X"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
let analytics = null;

// Initialize Firestore with offline persistence
const db = getFirestore(app);

// Enable offline persistence
enableIndexedDbPersistence(db).then(() => {
  console.log("Firestore offline persistence enabled");
}).catch((e) => {
  if (e.code === 'failed-precondition') {
    console.warn("Multiple tabs open, persistence can only be enabled in one tab at a time.");
  } else if (e.code === 'unimplemented') {
    console.warn("The current browser doesn't support offline persistence.");
  }
});

// Only initialize analytics in production environment
try {
  if (import.meta.env.PROD) {
    analytics = getAnalytics(app);
  }
} catch (e) {
  console.warn("Firebase Analytics failed to initialize:", e);
}

export { app, analytics, db };
