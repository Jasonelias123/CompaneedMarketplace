// Environment configuration - inject Replit secrets into window object
window.VITE_FIREBASE_API_KEY = "AIzaSyAHFrr8Rrw2ww-jXNjCM0r_7b7jkY8HSqM";
window.VITE_FIREBASE_PROJECT_ID = "companies-mvp";
window.VITE_FIREBASE_APP_ID = "1:309095143835:web:e998bd470855a27ab6a93e";
window.VITE_FIREBASE_MESSAGING_SENDER_ID = "309095143835";
window.VITE_FIREBASE_MEASUREMENT_ID = "G-1VLQ95TDHJ";

console.log('Firebase config loaded:', {
    apiKey: window.VITE_FIREBASE_API_KEY ? 'present' : 'missing',
    projectId: window.VITE_FIREBASE_PROJECT_ID ? 'present' : 'missing',
    appId: window.VITE_FIREBASE_APP_ID ? 'present' : 'missing',
    messagingSenderId: window.VITE_FIREBASE_MESSAGING_SENDER_ID ? 'present' : 'missing'
});
