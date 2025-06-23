import { auth, db } from './firebase-config.js';
import { 
    createUserWithEmailAndPassword,
    signOut
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { 
    doc, 
    setDoc 
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

// Handle signup form submission
export async function handleSignup(event) {
    console.log('=== SIGNUP PROCESS STARTED ===');
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const email = formData.get('email');
    const password = formData.get('password');
    const confirmPassword = formData.get('confirmPassword');
    const role = formData.get('role');
    
    console.log('Form data:', { email, role, password: '***' });
    
    const errorDiv = document.getElementById('error-message');
    const loadingDiv = document.getElementById('loading');
    
    // Clear previous errors
    errorDiv.style.display = 'none';
    
    // Validate passwords match
    if (password !== confirmPassword) {
        showError('Passwords do not match');
        return;
    }
    
    // Show loading
    loadingDiv.style.display = 'block';
    
    try {
        // Set flag to prevent auth listener interference
        sessionStorage.setItem('signingUp', 'true');
        
        console.log('Creating user account with email:', email);
        // Create user account
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        console.log('User account created successfully:', user.uid);
        
        // Save user role to Firestore
        console.log('Saving user role to Firestore:', role);
        await setDoc(doc(db, 'users', user.uid), {
            email: user.email,
            role: role,
            createdAt: new Date().toISOString()
        });
        console.log('User role saved successfully');
        
        // Clear the signup flag before redirect
        sessionStorage.removeItem('signingUp');
        
        // Hide loading
        loadingDiv.style.display = 'none';
        
        // Force immediate redirect
        console.log('=== EXECUTING IMMEDIATE REDIRECT ===');
        console.log('Role:', role);
        if (role === 'company') {
            console.log('Redirecting to dashboard.html');
            window.location.replace('dashboard.html');
        } else if (role === 'developer') {
            console.log('Redirecting to projects.html');
            window.location.replace('projects.html');
        } else {
            console.error('Unknown role:', role);
        }
        
    } catch (error) {
        console.error('=== SIGNUP ERROR ===');
        console.error('Signup error:', error);
        console.error('Error code:', error.code);
        console.error('Error message:', error.message);
        
        let errorMessage = 'Failed to create account. Please try again.';
        
        if (error.code === 'auth/email-already-in-use') {
            errorMessage = 'An account with this email already exists.';
        } else if (error.code === 'auth/weak-password') {
            errorMessage = 'Password is too weak. Please use at least 6 characters.';
        } else if (error.code === 'auth/invalid-email') {
            errorMessage = 'Please enter a valid email address.';
        }
        
        showError(errorMessage);
        loadingDiv.style.display = 'none';
    }
}

// Handle logout
export async function handleLogout() {
    try {
        await signOut(auth);
        window.location.href = 'index.html';
    } catch (error) {
        console.error('Logout error:', error);
    }
}

// Show error message
function showError(message) {
    const errorDiv = document.getElementById('error-message');
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
}