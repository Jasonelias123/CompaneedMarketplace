// Environment configuration - inject Replit secrets into window object
window.VITE_FIREBASE_API_KEY = "AIzaSyAHFrr8Rrw2ww-jXNjCM0r_7b7jkY8HSqM";
window.VITE_FIREBASE_PROJECT_ID = "companies-mvp";
window.VITE_FIREBASE_APP_ID = "1:309095143835:web:e998bd470855a27ab6a93e";
window.VITE_FIREBASE_MESSAGING_SENDER_ID = "309095143835";
window.VITE_FIREBASE_MEASUREMENT_ID = "G-1VLQ95TDHJ";

// GoHighLevel Integration Configuration
window.GHL_WEBHOOK_URL = "https://services.leadconnectorhq.com/hooks/FL2r5c4AyrqlNBuFs1oD/webhook-trigger/2cea896f-a6bc-4adf-8d90-44c740273e70";
window.GHL_INTEGRATION_ENABLED = "true"; // Set to "false" to disable GHL integration

console.log('Environment configuration loaded:', {
    firebase: {
        apiKey: window.VITE_FIREBASE_API_KEY ? 'present' : 'missing',
        projectId: window.VITE_FIREBASE_PROJECT_ID ? 'present' : 'missing',
        appId: window.VITE_FIREBASE_APP_ID ? 'present' : 'missing',
        messagingSenderId: window.VITE_FIREBASE_MESSAGING_SENDER_ID ? 'present' : 'missing'
    },
    gohighlevel: {
        webhookUrl: window.GHL_WEBHOOK_URL ? 'configured' : 'missing',
        integrationEnabled: window.GHL_INTEGRATION_ENABLED
    }
});
