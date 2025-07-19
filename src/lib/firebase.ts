
// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration - UPDATED
const firebaseConfig = {
  apiKey: "AIzaSyDFN5E2a_jH-a-T5QxY8u7z9b6n4C0o2k",
  authDomain: "heyhi-chat-app.firebaseapp.com",
  projectId: "heyhi-chat-app",
  storageBucket: "heyhi-chat-app.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:a1b2c3d4e5f6a7b8c9d0e1"
};


// Initialize Firebase for server-side rendering (SSR) or when no apps are present.
// This prevents re-initialization on every hot-reload in development.
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };
