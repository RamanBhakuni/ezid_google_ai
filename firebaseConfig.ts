import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

// EZID Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyD2oCzadtyvtBQoKK5B7UwBhb2wgTDtNbc",
  authDomain: "ezid-12416.firebaseapp.com",
  projectId: "ezid-12416",
  storageBucket: "ezid-12416.firebasestorage.app",
  messagingSenderId: "95219075104",
  appId: "1:95219075104:web:327ca1aaf794bbd92a5445",
  measurementId: "G-K1D79B72KJ"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const analytics = getAnalytics(app);