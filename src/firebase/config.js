// ============================================================
//  FIREBASE CONFIGURATION
//  Replace the values below with your own Firebase project.
//  Go to: Firebase Console → Project Settings → Your Apps → SDK setup
// ============================================================

import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyA7Eck_2qLLBVt8FVEue728hHc5d37ZH5g",
  authDomain: "walkheroyt-8b266.firebaseapp.com",
  databaseURL: "https://walkheroyt-8b266-default-rtdb.firebaseio.com",
  projectId: "walkheroyt-8b266",
  storageBucket: "walkheroyt-8b266.firebasestorage.app",
  messagingSenderId: "596559003879",
  appId: "1:596559003879:web:f25f6f84868ec8b34e2242",
  measurementId: "G-MRHT1C9GBD"
};

const app = initializeApp(firebaseConfig);

export const auth    = getAuth(app);
export const db      = getFirestore(app);
export const storage = getStorage(app);
