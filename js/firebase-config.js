// ============================================================
// firebase-config.js
//
// Central Firebase initialization for the KHUN AU Mystery web app.
// cart.html, login.html, and index.html all import from this file.
//
// NOTE: This file was missing from the project, which is why orders
// placed from cart.html were never actually reaching Firestore (the
// import 404'd, Firebase silently failed to load, and cart.html fell
// back to saving orders only in the customer's local browser storage).
// The Firebase project config below matches the one already used in
// admin.html so both sides read/write the same Firestore database.
// ============================================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";

import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

import {
  getFirestore,
  collection,
  addDoc,
  setDoc,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  where,
  increment,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// Same Firebase project used by admin.html, so customer orders/data
// and the admin dashboard read/write the same database.
const firebaseConfig = {
  apiKey: "AIzaSyDjp5b54yTDBjchJeJqEwcOXdpzl04Ov3g",
  authDomain: "khunaumystery-f0b63.firebaseapp.com",
  projectId: "khunaumystery-f0b63",
  storageBucket: "khunaumystery-f0b63.firebasestorage.app",
  messagingSenderId: "508588235711",
  appId: "1:508588235711:web:0455a68bbb795c46d95f0a",
};

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

export {
  app,
  auth,
  db,
  googleProvider,
  // Auth
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  // Firestore
  collection,
  addDoc,
  setDoc,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  where,
  increment,
};