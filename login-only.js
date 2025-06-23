// Standalone login functionality - no global auth state interference
import { auth, db } from './firebase-config.js';
import { signInWithEmailAndPassword } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { doc, getDoc } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

// Handle login form submission
async function handleLoginForm(event) {
    event.preventDefault();
    
    console.log('Login form submitted');
    
    const formData = new FormData(event.target);
    const email = formData.get('email');
    const password = formData.get('password');
    
    console.log('Login attempt for email:', email);
    
    const errorDiv = document.getElementById('error-message');
    const loadingDiv = document.getElementById('loading');
    
    // Clear previous errors
    errorDiv.style.display = 'none';
    
    // Show loading
    loadingDiv.style.display = 'block';
    
    try {
        console.log('Attempting to sign in with Firebase...');
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        console.log('Firebase sign in successful, user:', user.uid);
        
        // Get user role and redirect immediately
        console.log('Fetching user role from Firestore...');
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
            const userRole = userDoc.data().role;
            console.log('User role found:', userRole);
            
            // Hide loading before redirect
            loadingDiv.style.display = 'none';
            
            // Redirect immediately based on role
            console.log('Redirecting user based on role...');
            if (userRole === 'company') {
                console.log('Redirecting to dashboard.html');
                window.location.href = 'dashboard.html';
            } else if (userRole === 'developer') {
                console.log('Redirecting to projects.html');
                window.location.href = 'projects.html';
            } else {
                console.log('Unknown role, redirecting to index.html');
                window.location.href = 'index.html';
            }
        } else {
            console.error('User document not found in Firestore');
            showLoginError('User profile not found. Please contact support.');
            loadingDiv.style.display = 'none';
        }
        
    } catch (error) {
        console.error('Login error:', error);
        let errorMessage = 'Failed to sign in. Please check your credentials.';
        
        if (error.code === 'auth/user-not-found') {
            errorMessage = 'No account found with this email address.';
        } else if (error.code === 'auth/wrong-password') {
            errorMessage = 'Incorrect password. Please try again.';
        } else if (error.code === 'auth/invalid-email') {
            errorMessage = 'Please enter a valid email address.';
        } else if (error.code === 'auth/too-many-requests') {
            errorMessage = 'Too many failed attempts. Please try again later.';
        } else if (error.code === 'auth/invalid-credential') {
            errorMessage = 'Invalid email or password. Please check your credentials.';
        }
        
        showLoginError(errorMessage);
        loadingDiv.style.display = 'none';
    }
}

// Show error message
function showLoginError(message) {
    const errorDiv = document.getElementById('error-message');
    if (errorDiv) {
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLoginForm);
    }
});