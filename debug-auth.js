// Debug authentication directly
import { auth, db } from './firebase-config.js';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { doc, setDoc, getDoc } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

async function createTestAccount() {
    try {
        console.log('Creating test account...');
        const email = 'test@company.com';
        const password = 'password123';
        
        // Create user
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        console.log('User created:', user.uid);
        
        // Save to Firestore
        await setDoc(doc(db, 'users', user.uid), {
            email: user.email,
            role: 'company',
            createdAt: new Date().toISOString()
        });
        
        console.log('✓ Test account created successfully');
        return user;
    } catch (error) {
        console.error('Account creation failed:', error);
        if (error.code === 'auth/email-already-in-use') {
            console.log('Account already exists, proceeding with login test');
            return null;
        }
        throw error;
    }
}

async function testLogin() {
    try {
        console.log('Testing login...');
        const email = 'test@company.com';
        const password = 'password123';
        
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        console.log('Login successful:', user.uid);
        
        // Check user document
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
            console.log('User data:', userDoc.data());
            console.log('✓ Login test successful');
        } else {
            console.log('⚠ User document missing');
        }
        
        return user;
    } catch (error) {
        console.error('Login failed:', error);
        throw error;
    }
}

// Run tests
window.runAuthTests = async function() {
    console.log('=== FIREBASE AUTH DEBUG ===');
    
    try {
        // Test 1: Create account
        await createTestAccount();
        
        // Test 2: Login
        await testLogin();
        
        console.log('✓ All tests passed');
    } catch (error) {
        console.error('Tests failed:', error);
    }
};

console.log('Debug script loaded. Run runAuthTests() in console.');