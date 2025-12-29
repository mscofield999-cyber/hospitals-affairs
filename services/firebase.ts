
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";

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

// Only initialize analytics in production environment
try {
  if (import.meta.env.PROD) {
    analytics = getAnalytics(app);
  }
} catch (e) {
  console.warn("Firebase Analytics failed to initialize:", e);
}

export { app, analytics };
