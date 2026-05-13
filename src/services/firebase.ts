import { initializeApp } from "firebase/app";
import { initializeFirestore } from "firebase/firestore";
import { initializeAuth, getReactNativePersistence } from "firebase/auth";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getFunctions } from "firebase/functions";

const firebaseConfig = {
    apiKey: "AIzaSyCcmJeDPobzD-6IcJF96-IHdLkvPudi-N0",
    authDomain: "onedelhii.firebaseapp.com",
    projectId: "onedelhii",
    storageBucket: "onedelhii.firebasestorage.app",
    messagingSenderId: "645784683590",
    appId: "1:645784683590:web:4bd8fdc3ee5a690a883647",
    measurementId: "G-NPCJGVC37D"
};

const app = initializeApp(firebaseConfig);

// Initialize Auth with AsyncStorage for persistence
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});

export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
});

export const functions = getFunctions(app);

export default app;
