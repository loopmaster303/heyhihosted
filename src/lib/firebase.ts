// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBJbcwl1nlafV62VdmDZKP6pVN5bZ_aF3s",
  authDomain: "fluxflow-ai.firebaseapp.com",
  projectId: "fluxflow-ai",
  storageBucket: "fluxflow-ai.appspot.com",
  messagingSenderId: "647827922675",
  appId: "1:647827922675:web:52d20dd6a38345b217a186"
};


// Initialize Firebase for server-side rendering (SSR) or when no apps are present.
// This prevents re-initialization on every hot-reload in development.
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };
