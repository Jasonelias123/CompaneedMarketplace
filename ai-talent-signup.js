import { auth, db } from './firebase-config.js';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { doc, setDoc, getDoc, collection, addDoc } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('aiTalentApplicationForm');
    const uploadStatus = document.getElementById('uploadStatus');
    
    if (form) {
        form.addEventListener('submit', handleApplicationSubmission);
    }

    // Check authentication state
    onAuthStateChanged(auth, (user) => {
        if (user) {
            console.log('User authenticated:', user.uid);
            document.getElementById('userEmail').textContent = user.email;
            document.getElementById('logoutBtn').style.display = 'block';
        } else {
            // Redirect to signup if not authenticated
            window.location.href = 'ai-talent-signup.html';
        }
    });
});

async function handleApplicationSubmission(event) {
    event.preventDefault();
    
    try {
        const formData = new FormData(event.target);
        const uploadStatus = document.getElementById('uploadStatus');
        
        uploadStatus.style.display = 'block';
        uploadStatus.innerHTML = '<div class="status-message processing">Processing your application...</div>';
        
        // Check if user is authenticated
        const user = auth.currentUser;
        if (!user) {
            throw new Error('You must be logged in to submit an application');
        }
        
        // Validate required checkboxes
        const agreeTerms = document.getElementById('agreeTerms').checked;
        const agreePrivacyPolicy = document.getElementById('agreePrivacyPolicy').checked;
        
        if (!agreeTerms) {
            throw new Error('You must agree to the terms of service');
        }
        
        if (!agreePrivacyPolicy) {
            throw new Error('You must agree to the privacy policy');
        }
        
        // Get call availability
        const callAvailability = document.querySelector('input[name="callAvailability"]:checked');
        if (!callAvailability) {
            throw new Error('Please indicate your availability for an introductory call');
        }
        
        console.log('Call availability:', callAvailability.value);
        
        // Prepare application data
        const applicationData = {
            fullName: formData.get('fullName'),
            email: user.email,
            location: formData.get('location'),
            aiTools: formData.get('aiTools'),
            projectTypes: formData.get('projectTypes'),
            bio: formData.get('bio'),
            portfolio: formData.get('portfolioURL'),
            availability: formData.get('availability'),
            callAvailability: callAvailability.value,
            userId: user.uid,
            userEmail: user.email,
            submittedAt: new Date().toISOString(),
            status: 'pending',
            agreeTerms: agreeTerms,
            agreePrivacyPolicy: agreePrivacyPolicy
        };
        
        // Save to applications collection
        const applicationRef = await addDoc(collection(db, 'applications'), applicationData);
        
        // Update user document with application status
        await setDoc(doc(db, 'users', user.uid), {
            role: 'developer',
            status: 'pending',
            applicationId: applicationRef.id,
            fullName: formData.get('fullName'),
            location: formData.get('location'),
            portfolioURL: formData.get('portfolioURL'),
            submittedAt: new Date().toISOString(),
            email: user.email
        }, { merge: true });
        
        uploadStatus.innerHTML = '<div class="status-message success">Application submitted successfully! Redirecting to your status page...</div>';
        
        console.log('Application submitted successfully, redirecting to pending page');
        
        // Redirect to pending page after short delay
        setTimeout(() => {
            console.log('Redirecting to developer-pending.html');
            window.location.href = 'developer-pending.html';
        }, 1500);
        
    } catch (error) {
        console.error('Application submission error:', error);
        const uploadStatus = document.getElementById('uploadStatus');
        uploadStatus.style.display = 'block';
        uploadStatus.innerHTML = `<div class="status-message error">✗ Failed to submit application<br/>Error: ${error.message}<br/>Please check your information and try again.</div>`;
    }
}

// Logout function for the header button
window.handleLogoutClick = async function() {
    try {
        await auth.signOut();
        window.location.href = 'index.html';
    } catch (error) {
        console.error('Logout error:', error);
    }
};