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

// Initialize auth state listener
onAuthStateChanged(auth, async (user) => {
    currentUser = user;
    
    if (user) {
        // Get user role from Firestore
        try {
            const userDoc = await getDoc(doc(db, 'users', user.uid));
            if (userDoc.exists()) {
                userRole = userDoc.data().role;
            }
            
            // Redirect based on current page and role
            const currentPage = window.location.pathname.split('/').pop();
            
            if (currentPage === 'login.html' || currentPage === 'signup.html') {
                redirectToUserDashboard();
            } else if (currentPage === 'dashboard.html' && userRole !== 'company') {
                window.location.href = 'projects.html';
            } else if (currentPage === 'projects.html' && userRole !== 'developer') {
                window.location.href = 'dashboard.html';
            }
            
            // Update UI with user info
            updateUIWithUser(user);
        } catch (error) {
            console.error('Error getting user role:', error);
        }
    } else {
        // User is signed out
        userRole = null;
        const currentPage = window.location.pathname.split('/').pop();
        
        // Redirect to login if on protected pages
        if (currentPage === 'dashboard.html' || currentPage === 'projects.html') {
            window.location.href = 'login.html';
        }
    }
});

// Update UI with user information
function updateUIWithUser(user) {
    const userEmailElement = document.getElementById('userEmail');
    const logoutBtn = document.getElementById('logoutBtn');
    
    if (userEmailElement) {
        userEmailElement.textContent = user.email;
    }
    
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
}

// Handle signup
export async function handleSignup(event) {
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
        await setDoc(doc(db, 'users', user.uid), {
            email: user.email,
            role: role,
            createdAt: new Date().toISOString()
        });
        console.log('User role saved successfully');
        
        userRole = role;
        
        // Redirect to appropriate dashboard
        redirectToUserDashboard();
        
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
            errorMessage = 'Firebase configuration error. Please check your setup.';
        } else if (error.code === 'auth/network-request-failed') {
            errorMessage = 'Network error. Please check your internet connection.';
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
    
    const formData = new FormData(event.target);
    const email = formData.get('email');
    const password = formData.get('password');
    
    const errorDiv = document.getElementById('error-message');
    const loadingDiv = document.getElementById('loading');
    
    // Clear previous errors
    errorDiv.style.display = 'none';
    
    // Show loading
    loadingDiv.style.display = 'block';
    
    try {
        await signInWithEmailAndPassword(auth, email, password);
        // Redirect is handled by auth state listener
        
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
        }
        
        showError(errorMessage);
    } finally {
        loadingDiv.style.display = 'none';
    }
}

// Handle logout
async function handleLogout() {
    try {
        await signOut(auth);
        window.location.href = 'index.html';
    } catch (error) {
        console.error('Logout error:', error);
        alert('Failed to logout. Please try again.');
    }
}

// Redirect to appropriate dashboard based on user role
function redirectToUserDashboard() {
    if (userRole === 'company') {
        window.location.href = 'dashboard.html';
    } else if (userRole === 'developer') {
        window.location.href = 'projects.html';
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
