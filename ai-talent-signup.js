import { auth, db } from './firebase-config.js';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { doc, setDoc, getDoc, collection, addDoc } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import { getStorage, ref, uploadBytes, uploadBytesResumable, getDownloadURL } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js';

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
        
        // Work type preferences removed - direct matching model
        
        // Upload files if provided
        const storage = getStorage();
        let pitchDeckURL = null;
        let videoURL = null;
        
        // Upload pitch deck if provided
        const pitchDeckFile = formData.get('pitchDeck');
        if (pitchDeckFile && pitchDeckFile.size > 0) {
            // Check file size (10MB limit)
            const maxPitchSize = 10 * 1024 * 1024; // 10MB in bytes
            if (pitchDeckFile.size > maxPitchSize) {
                throw new Error('Pitch deck file is too large. Please keep it under 10MB.');
            }
            
            console.log(`Uploading pitch deck: ${pitchDeckFile.name}, size: ${(pitchDeckFile.size / 1024 / 1024).toFixed(2)}MB`);
            uploadStatus.innerHTML = '<div class="status-message processing">Uploading pitch deck...</div>';
            
            try {
                const pitchDeckRef = ref(storage, `applications/${user.uid}/pitch-deck-${Date.now()}-${pitchDeckFile.name}`);
                const pitchDeckSnapshot = await uploadBytes(pitchDeckRef, pitchDeckFile);
                pitchDeckURL = await getDownloadURL(pitchDeckSnapshot.ref);
                console.log('Pitch deck uploaded successfully:', pitchDeckURL);
            } catch (uploadError) {
                console.error('Pitch deck upload failed:', uploadError);
                throw new Error(`Pitch deck upload failed: ${uploadError.message}`);
            }
        }
        
        // Upload video (required)
        const videoFile = formData.get('videoSubmission');
        if (!videoFile || videoFile.size === 0) {
            throw new Error('Video introduction is required');
        }
        
        // Check file size (10MB limit for better upload reliability)
        const maxSize = 10 * 1024 * 1024; // 10MB in bytes
        if (videoFile.size > maxSize) {
            throw new Error('Video file is too large. Please compress it to under 10MB for reliable upload.');
        }
        
        console.log(`Uploading video file: ${videoFile.name}, size: ${(videoFile.size / 1024 / 1024).toFixed(2)}MB`);
        
        // Create upload task with progress tracking
        const videoRef = ref(storage, `applications/${user.uid}/video-${Date.now()}-${videoFile.name}`);
        
        try {
            uploadStatus.innerHTML = '<div class="status-message processing">Starting video upload...</div>';
            
            // Use uploadBytesResumable for progress tracking
            const uploadTask = uploadBytesResumable(videoRef, videoFile);
            
            // Set up progress monitoring
            await new Promise((resolve, reject) => {
                uploadTask.on('state_changed',
                    (snapshot) => {
                        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                        uploadStatus.innerHTML = `<div class="status-message processing">Uploading video... ${Math.round(progress)}%</div>`;
                        console.log('Upload progress:', Math.round(progress) + '%');
                    },
                    (error) => {
                        console.error('Upload error:', error);
                        reject(error);
                    },
                    () => {
                        console.log('Video upload completed');
                        resolve();
                    }
                );
                
                // Add timeout to prevent infinite hanging
                setTimeout(() => {
                    reject(new Error('Upload timeout - please try with a smaller file'));
                }, 120000); // 2 minute timeout
            });
            
            videoURL = await getDownloadURL(uploadTask.snapshot.ref);
            console.log('Video uploaded successfully:', videoURL);
            
        } catch (uploadError) {
            console.error('Video upload failed:', uploadError);
            if (uploadError.code === 'storage/unauthorized') {
                throw new Error('Upload failed: Storage access denied. Please try again or contact support.');
            } else if (uploadError.code === 'storage/canceled') {
                throw new Error('Upload was canceled. Please try again.');
            } else if (uploadError.code === 'storage/unknown') {
                throw new Error('Upload failed due to network issues. Please check your connection and try again.');
            } else {
                throw new Error(`Video upload failed: ${uploadError.message}`);
            }
        }
        
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
            // workType removed for direct matching model
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