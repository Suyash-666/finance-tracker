// src/services/firebase.js
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Replace with your Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyA5gssj6GDWL7FysOCQZ-ieLkQOuGwWkuE",
  authDomain: "finance-tracker-50234.firebaseapp.com",
  projectId: "finance-tracker-50234",
  storageBucket: "finance-tracker-50234.firebasestorage.app",
  messagingSenderId: "84020516201",
  appId: "1:84020516201:web:d2386454c28db96170d9f8",
  measurementId: "G-WHT9YE2P94"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Google Auth Provider
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

export default app;