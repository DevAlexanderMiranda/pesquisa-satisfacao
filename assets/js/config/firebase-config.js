// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.8.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.8.0/firebase-analytics.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/11.8.0/firebase-auth.js";
import { getFirestore, collection, doc, setDoc, getDoc, query, where, getDocs, deleteDoc } from "https://www.gstatic.com/firebasejs/11.8.0/firebase-firestore.js";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCtNLfOJD4CRwkv9juSmUh7IYatwYlp4Wk",
  authDomain: "pesquisa-cgmp.firebaseapp.com",
  projectId: "pesquisa-cgmp",
  storageBucket: "pesquisa-cgmp.firebasestorage.app",
  messagingSenderId: "119370101321",
  appId: "1:119370101321:web:c51d32c3e2164514034598",
  measurementId: "G-64QV87VNP3"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);

// Export the Firebase instance and services
export { app, analytics, auth, db, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, sendPasswordResetEmail, collection, doc, setDoc, getDoc, query, where, getDocs, deleteDoc }; 