import { auth, db } from './firebase-config.js';
import { 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signOut, 
    onAuthStateChanged 
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { 
    doc, 
    setDoc, 
    getDoc 
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

// Authentication state management
let currentUser = null;
let userRole = null;

// Minimal auth state tracking - no automatic actions
onAuthStateChanged(auth, (user) => {
    currentUser = user;
    if (user) {
        // Just track the user, no actions
        console.log('User authenticated:', user.uid);
    } else {
        // User signed out
        currentUser = null;
        userRole = null;
    }
});

// Update UI with user information
function updateUIWithUser(user) {
    const userEmailElement = document.getElementById('userEmail');
    const logoutBtn = document.getElementById('logoutBtn');
    
    // Handle signup page logout
    const currentUserEmail = document.getElementById('currentUserEmail');
    const loggedInUser = document.getElementById('loggedInUser');
    const logoutFromSignup = document.getElementById('logoutFromSignup');
    
    if (userEmailElement) {
        userEmailElement.textContent = user.email;
    }
    
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
    
    // Show logout option on signup page if user is logged in
    if (currentUserEmail && loggedInUser) {
        currentUserEmail.textContent = `Logged in as: ${user.email}`;
        loggedInUser.style.display = 'block';
    }
    
    if (logoutFromSignup) {
        logoutFromSignup.addEventListener('click', handleLogout);
    }
}

// Handle signup
export async function handleSignup(event) {
    console.log('=== SIGNUP PROCESS STARTED ===');
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const email = formData.get('email');
    const password = formData.get('password');
    const confirmPassword = formData.get('confirmPassword');
    const role = formData.get('role');
    
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
        console.log('Creating user account with email:', email);
        // Create user account
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        console.log('User account created successfully:', user.uid);
        
        // Save user role to Firestore
        console.log('Saving user role to Firestore:', role);
        const userDoc = {
            email: user.email,
            role: role,
            createdAt: new Date().toISOString()
        };
        
        // For developers from the new signup flow, mark as pending application
        if (role === 'developer') {
            userDoc.accountType = 'pending_application';
        }
        
        await setDoc(doc(db, 'users', user.uid), userDoc);
        console.log('User role saved successfully');
        
        userRole = role;
        console.log('Setting userRole to:', userRole);
        
        // Hide loading and redirect immediately
        loadingDiv.style.display = 'none';
        
        // Force immediate redirect without delay
        console.log('=== EXECUTING IMMEDIATE REDIRECT ===');
        console.log('Role:', role);
        if (role === 'company') {
            console.log('Redirecting to dashboard-new.html');
            window.location.replace('dashboard-new.html');
        } else if (role === 'developer') {
            console.log('Redirecting to projects.html (AI talent signup)');
            window.location.replace('projects.html');
        } else {
            console.error('Unknown role:', role);
        }
        
    } catch (error) {
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
        } else if (error.code === 'auth/invalid-api-key') {
            errorMessage = 'Firebase project configuration issue. Please verify that Authentication is enabled in your Firebase console and that the API key is correct.';
        } else if (error.code === 'auth/network-request-failed') {
            errorMessage = 'Network error. Please check your internet connection.';
        } else if (error.code === 'auth/project-not-found') {
            errorMessage = 'Firebase project not found. Please check your project ID.';
        } else {
            errorMessage = `Error: ${error.message}`;
        }
        
        showError(errorMessage);
    } finally {
        loadingDiv.style.display = 'none';
    }
}

// Handle login
export async function handleLogin(event) {
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
            userRole = userDoc.data().role;
            console.log('User role found:', userRole);
            
            // Hide loading before redirect
            loadingDiv.style.display = 'none';
            
            // Redirect immediately based on role
            console.log('Redirecting user based on role...');
            if (userRole === 'company') {
                console.log('Redirecting to dashboard.html');
                window.location.href = 'dashboard.html';
            } else if (userRole === 'developer') {
                console.log('Redirecting to projects-new.html');
                window.location.href = 'projects-new.html';
            } else {
                console.log('Unknown role, redirecting to index.html');
                window.location.href = 'index.html';
            }
        } else {
            console.error('User document not found in Firestore');
            showError('User profile not found. Please contact support.');
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
        
        showError(errorMessage);
        loadingDiv.style.display = 'none';
    }
}

// Handle logout
export async function handleLogout() {
    console.log('Logout function called');
    try {
        console.log('Attempting to sign out user');
        await signOut(auth);
        console.log('Sign out successful, redirecting to index.html');
        window.location.href = 'index.html';
    } catch (error) {
        console.error('Logout error:', error);
        alert('Failed to logout. Please try again.');
    }
}

// Redirect to appropriate dashboard based on user role
function redirectToUserDashboard() {
    console.log('redirectToUserDashboard called with userRole:', userRole);
    if (userRole === 'company') {
        console.log('Redirecting to dashboard.html');
        window.location.href = 'dashboard.html';
    } else if (userRole === 'developer') {
        console.log('Redirecting to projects.html');
        window.location.href = 'projects.html';
    } else {
        console.error('Unknown user role:', userRole);
        console.log('Redirecting to index.html as fallback');
        window.location.href = 'index.html';
    }
}

// Show error message
function showError(message) {
    const errorDiv = document.getElementById('error-message');
    if (errorDiv) {
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
    }
}

// Export current user and role for other modules
export function getCurrentUser() {
    return currentUser;
}

export function getUserRole() {
    return userRole;
}

// Check if user is authenticated
export function requireAuth() {
    if (!currentUser) {
        window.location.href = 'login.html';
        return false;
    }
    return true;
}
