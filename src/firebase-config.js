import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDjp5b54yTDBjchJeJqEwcOXdpzl04Ov3g",
  authDomain: "khunaumystery-f0b63.firebaseapp.com",
  projectId: "khunaumystery-f0b63",
  storageBucket: "khunaumystery-f0b63.firebasestorage.app",
  messagingSenderId: "508588235711",
  appId: "1:508588235711:web:0455a68bbb795c46d95f0a",
  measurementId: "G-VPSGLDNZ5C"
};

const app = initializeApp(firebaseConfig);
const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

export { app, analytics, auth, googleProvider, firebaseConfig };
export default app;
