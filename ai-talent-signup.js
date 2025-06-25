import { auth, db } from './firebase-config.js';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { doc, setDoc, getDoc, collection, addDoc } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js';

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
            throw new Error('You must agree to the privacy policy regarding personal information sharing');
        }
        
        // Collect work types
        const workTypes = [];
        const workTypeCheckboxes = document.querySelectorAll('input[name="workType"]:checked');
        workTypeCheckboxes.forEach(checkbox => {
            workTypes.push(checkbox.value);
        });
        
        // Validate required fields
        if (workTypes.length === 0) {
            throw new Error('Please select at least one work type preference');
        }
        
        // Upload files if provided
        const storage = getStorage();
        let pitchDeckURL = null;
        let videoURL = null;
        
        // Upload pitch deck if provided
        const pitchDeckFile = formData.get('pitchDeck');
        if (pitchDeckFile && pitchDeckFile.size > 0) {
            uploadStatus.innerHTML = '<div class="status-message processing">Uploading pitch deck...</div>';
            const pitchDeckRef = ref(storage, `applications/${user.uid}/pitch-deck-${Date.now()}`);
            const pitchDeckSnapshot = await uploadBytes(pitchDeckRef, pitchDeckFile);
            pitchDeckURL = await getDownloadURL(pitchDeckSnapshot.ref);
        }
        
        // Upload video (required)
        const videoFile = formData.get('videoSubmission');
        if (!videoFile || videoFile.size === 0) {
            throw new Error('Video introduction is required');
        }
        
        uploadStatus.innerHTML = '<div class="status-message processing">Uploading video introduction...</div>';
        const videoRef = ref(storage, `applications/${user.uid}/video-${Date.now()}`);
        const videoSnapshot = await uploadBytes(videoRef, videoFile);
        videoURL = await getDownloadURL(videoSnapshot.ref);
        
        uploadStatus.innerHTML = '<div class="status-message processing">Saving application...</div>';
        
        // Prepare application data
        const applicationData = {
            fullName: formData.get('fullName'),
            email: formData.get('email'),
            location: formData.get('location'),
            aiToolsStacks: formData.get('aiToolsStacks'),
            projectTypes: formData.get('projectTypes'),
            shortBio: formData.get('shortBio'),
            portfolioURL: formData.get('portfolioURL'),
            workType: workTypes,
            availability: formData.get('availability'),
            pitchDeckURL: pitchDeckURL,
            videoURL: videoURL,
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
        
        uploadStatus.innerHTML = '<div class="status-message success">Application submitted successfully! You will be redirected to your pending status page.</div>';
        
        // Redirect to pending page after short delay
        setTimeout(() => {
            window.location.href = 'developer-pending.html';
        }, 2000);
        
    } catch (error) {
        console.error('Application submission error:', error);
        const uploadStatus = document.getElementById('uploadStatus');
        uploadStatus.style.display = 'block';
        uploadStatus.innerHTML = `<div class="status-message error">Error: ${error.message}</div>`;
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