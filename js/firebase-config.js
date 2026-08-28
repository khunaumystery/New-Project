// Firebase Configuration for KHUN AU Mystery Web App (Browser Native ESM)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAnalytics, isSupported } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-analytics.js";
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  updateProfile
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDjp5b54yTDBjchJeJqEwcOXdpzl04Ov3g",
  authDomain: "khunaumystery-f0b63.firebaseapp.com",
  projectId: "khunaumystery-f0b63",
  storageBucket: "khunaumystery-f0b63.firebasestorage.app",
  messagingSenderId: "508588235711",
  appId: "1:508588235711:web:0455a68bbb795c46d95f0a",
  measurementId: "G-VPSGLDNZ5C"
};

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Initialize Firebase Analytics safely
let analytics = null;
isSupported().then(supported => {
  if (supported) {
    analytics = getAnalytics(app);
  }
}).catch(() => {});

// Initialize Firebase Authentication
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

export { 
  app, 
  analytics, 
  auth, 
  googleProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  firebaseConfig
};
export default app;
