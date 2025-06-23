// Firebase configuration and initialization
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

// Firebase configuration - using environment variables from Replit secrets
const firebaseConfig = {
    apiKey: window.VITE_FIREBASE_API_KEY,
    authDomain: `${window.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
    projectId: window.VITE_FIREBASE_PROJECT_ID, 
    storageBucket: `${window.VITE_FIREBASE_PROJECT_ID}.appspot.com`,
    appId: window.VITE_FIREBASE_APP_ID
};

// Validate Firebase configuration
if (!firebaseConfig.apiKey || !firebaseConfig.projectId || !firebaseConfig.appId) {
    console.error('Firebase configuration is incomplete:', firebaseConfig);
    throw new Error('Firebase configuration is missing required values');
}

// Initialize Firebase
console.log('Initializing Firebase with config:', firebaseConfig);
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);

console.log('Firebase initialized successfully');

// Export the app instance
export default app;
