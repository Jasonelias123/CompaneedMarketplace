import { auth, db } from './firebase-config.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { handleLogout } from './auth.js';
import { 
    collection, 
    addDoc,
    doc,
    updateDoc,
    serverTimestamp 
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

// Form validation functions
function validateURL(url) {
    if (!url) return true; // Optional fields
    try {
        new URL(url);
        return true;
    } catch (e) {
        return false;
    }
}

function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function validateVideoFile(file) {
    const maxSize = 50 * 1024 * 1024; // 50MB
    const allowedTypes = ['video/mp4', 'video/mov', 'video/avi', 'video/wmv', 'video/quicktime'];
    
    if (file.size > maxSize) {
        return { valid: false, message: 'Video file must be smaller than 50MB' };
    }
    
    if (!allowedTypes.includes(file.type)) {
        return { valid: false, message: 'Please upload a video file (MP4, MOV, AVI, WMV)' };
    }
    
    return { valid: true };
}

// Auth state monitoring
let currentUser = null;

onAuthStateChanged(auth, (user) => {
    currentUser = user;
    if (user) {
        document.getElementById('userEmail').textContent = user.email;
        document.getElementById('logoutBtn').style.display = 'block';
    } else {
        // Redirect to signup if not authenticated
        window.location.href = 'developer-signup.html';
    }
});

// Logout functionality
window.handleLogoutClick = async function() {
    try {
        await handleLogout();
        window.location.href = 'index.html';
    } catch (error) {
        console.error('Logout error:', error);
    }
};

// Form submission handler
document.getElementById('developerSignupForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    
    if (!currentUser) {
        alert('Please login first');
        window.location.href = 'developer-signup.html';
        return;
    }
    
    const uploadStatus = document.getElementById('uploadStatus');
    uploadStatus.style.display = 'block';
    uploadStatus.className = 'upload-status uploading';
    uploadStatus.innerHTML = 'Processing your application...';
    
    try {
        const formData = new FormData(event.target);
        
        // Basic validation
        const email = formData.get('email');
        if (!validateEmail(email)) {
            throw new Error('Please enter a valid email address');
        }
        
        // URL validation for optional fields
        const linkedinProfile = formData.get('linkedinProfile');
        const githubProfile = formData.get('githubProfile');
        
        if (linkedinProfile && !validateURL(linkedinProfile)) {
            throw new Error('Please enter a valid LinkedIn URL');
        }
        
        if (githubProfile && !validateURL(githubProfile)) {
            throw new Error('Please enter a valid GitHub URL');
        }
        
        // Video file validation (required)
        const videoFile = formData.get('videoSubmission');
        if (!videoFile || videoFile.size === 0) {
            throw new Error('Video submission is required');
        }
        
        const videoValidation = validateVideoFile(videoFile);
        if (!videoValidation.valid) {
            throw new Error(videoValidation.message);
        }
        
        // Validate privacy policy checkbox
        const agreePrivacyPolicy = formData.get('agreePrivacyPolicy');
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
        
        // Prepare application data
        const applicationData = {
            // User account info
            userId: currentUser.uid,
            userEmail: currentUser.email,
            
            // Basic Info
            fullName: formData.get('fullName').trim(),
            email: currentUser.email, // Use authenticated email
            location: formData.get('location').trim(),
            linkedinProfile: linkedinProfile ? linkedinProfile.trim() : null,
            githubProfile: githubProfile ? githubProfile.trim() : null,
            portfolioWebsite: formData.get('portfolioWebsite').trim() || null,
            
            // Skills & Experience
            techStack: formData.get('techStack').trim(),
            pastProjects: formData.get('pastProjects').trim(),
            challengingProblem: formData.get('challengingProblem').trim(),
            availability: formData.get('availability').trim(),
            hourlyRate: formData.get('hourlyRate').trim(),
            
            // AI & Automation Skills
            aiExperience: formData.get('aiExperience').trim(),
            
            // Professional Conduct
            projectFailures: formData.get('projectFailures').trim(),
            availableInterview: formData.get('availableInterview'),
            
            // Video submission metadata
            videoSubmission: {
                name: videoFile.name,
                size: videoFile.size,
                type: videoFile.type,
                uploaded: true
            },
            
            // Application metadata
            status: 'pending_review',
            submittedAt: serverTimestamp(),
            createdAt: new Date().toISOString(),
            timestamp: Date.now(),
            reviewed: false,
            approvalStatus: 'pending'
        };
        
        console.log('Submitting developer application:', applicationData);
        
        // Save to Firebase
        const docRef = await addDoc(collection(db, 'developerApplications'), applicationData);
        console.log('Application submitted with ID:', docRef.id);
        
        // Update user profile to mark application as submitted
        await updateDoc(doc(db, 'users', currentUser.uid), {
            accountType: 'application_submitted',
            applicationId: docRef.id,
            applicationSubmittedAt: new Date().toISOString()
        });
        
        // Also log for admin notification
        await addDoc(collection(db, 'adminNotifications'), {
            type: 'new_developer_application',
            applicationId: docRef.id,
            developerName: applicationData.fullName,
            developerEmail: applicationData.email,
            message: `New developer application received from ${applicationData.fullName}`,
            timestamp: Date.now(),
            createdAt: new Date().toISOString(),
            read: false
        });
        
        // Show success message and redirect
        uploadStatus.className = 'upload-status success';
        uploadStatus.innerHTML = 'Application submitted successfully! Redirecting to your developer dashboard...';
        
        // Redirect to pending page after delay
        setTimeout(() => {
            window.location.href = 'developer-pending.html';
        }, 3000);
        
        // Reset form
        event.target.reset();
        
    } catch (error) {
        console.error('Application submission error:', error);
        uploadStatus.className = 'upload-status error';
        uploadStatus.innerHTML = `
            ✗ Failed to submit application<br>
            Error: ${error.message}<br>
            Please check your information and try again.
        `;
    }
});

// Success message functions
function showSuccessMessage() {
    document.getElementById('successMessage').style.display = 'flex';
}

window.closeSuccessMessage = function() {
    document.getElementById('successMessage').style.display = 'none';
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

// Real-time form validation
document.addEventListener('DOMContentLoaded', function() {
    // Email validation
    const emailInput = document.getElementById('email');
    emailInput.addEventListener('blur', function() {
        if (this.value && !validateEmail(this.value)) {
            this.setCustomValidity('Please enter a valid email address');
        } else {
            this.setCustomValidity('');
        }
    });
    
    // LinkedIn URL validation
    const linkedinInput = document.getElementById('linkedinProfile');
    linkedinInput.addEventListener('blur', function() {
        if (this.value && !validateURL(this.value)) {
            this.setCustomValidity('Please enter a valid LinkedIn URL');
        } else {
            this.setCustomValidity('');
        }
    });
    
    // GitHub URL validation
    const githubInput = document.getElementById('githubProfile');
    githubInput.addEventListener('blur', function() {
        if (this.value && !validateURL(this.value)) {
            this.setCustomValidity('Please enter a valid GitHub URL');
        } else {
            this.setCustomValidity('');
        }
    });
    
    // Video file validation
    const videoInput = document.getElementById('videoSubmission');
    videoInput.addEventListener('change', function() {
        const file = this.files[0];
        if (file) {
            const validation = validateVideoFile(file);
            if (!validation.valid) {
                this.setCustomValidity(validation.message);
                alert(validation.message);
                this.value = '';
            } else {
                this.setCustomValidity('');
            }
        } else {
            this.setCustomValidity('Video submission is required');
        }
    });
    
    // Character count for text areas
    const textAreas = document.querySelectorAll('textarea');
    textAreas.forEach(textarea => {
        textarea.addEventListener('input', function() {
            // Optional: Add character count display
            const currentLength = this.value.length;
            if (currentLength > 2000) {
                this.style.borderColor = '#f59e0b';
            } else {
                this.style.borderColor = '';
            }
        });
    });
});