import { auth, db } from './firebase-config.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { handleLogout } from './auth.js';
import { 
    doc, 
    getDoc,
    addDoc,
    updateDoc,
    collection,
    query,
    where,
    getDocs,
    arrayUnion,
    serverTimestamp 
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

let currentUser = null;
let projectData = null;
let revieweeData = null;
let ratings = {};

// Auth state monitoring
onAuthStateChanged(auth, async (user) => {
    currentUser = user;
    if (user) {
        document.getElementById('userEmail').textContent = user.email;
        await loadProjectData();
    } else {
        window.location.href = 'login.html';
    }
});

// Load project data from URL params
async function loadProjectData() {
    const urlParams = new URLSearchParams(window.location.search);
    const projectId = urlParams.get('projectId');
    const revieweeId = urlParams.get('revieweeId');
    
    if (!projectId || !revieweeId) {
        alert('Invalid review URL. Missing project or user information.');
        window.history.back();
        return;
    }
    
    try {
        // Load project data
        const projectDoc = await getDoc(doc(db, 'projects', projectId));
        if (!projectDoc.exists()) {
            throw new Error('Project not found');
        }
        projectData = { id: projectId, ...projectDoc.data() };
        
        // Load reviewee data
        const revieweeDoc = await getDoc(doc(db, 'users', revieweeId));
        if (!revieweeDoc.exists()) {
            throw new Error('User not found');
        }
        revieweeData = { id: revieweeId, ...revieweeDoc.data() };
        
        // Verify user is authorized to review
        const isAuthorized = (currentUser.uid === projectData.companyId && revieweeData.role === 'developer') ||
                           (currentUser.uid === revieweeId && projectData.companyId !== currentUser.uid);
        
        if (!isAuthorized) {
            alert('You are not authorized to review this collaboration.');
            window.history.back();
            return;
        }
        
        displayProjectSummary();
        
    } catch (error) {
        console.error('Error loading project data:', error);
        alert('Error loading project information. Please try again.');
        window.history.back();
    }
}

// Display project summary
function displayProjectSummary() {
    const projectSummary = document.getElementById('projectSummary');
    const revieweeName = revieweeData.displayName || revieweeData.email.split('@')[0];
    const revieweeRole = revieweeData.role === 'developer' ? 'Developer' : 'Company';
    
    projectSummary.innerHTML = `
        <div class="project-details">
            <h3>${escapeHtml(projectData.title)}</h3>
            <div class="project-meta">
                <div class="meta-item">
                    <strong>Collaborator:</strong> ${escapeHtml(revieweeName)} (${revieweeRole})
                </div>
                <div class="meta-item">
                    <strong>Project Budget:</strong> $${projectData.budget?.toLocaleString() || 'Not specified'}
                </div>
                <div class="meta-item">
                    <strong>Tech Stack:</strong> ${projectData.techStack ? projectData.techStack.join(', ') : projectData.skills || 'Not specified'}
                </div>
                <div class="meta-item">
                    <strong>Project Timeline:</strong> ${projectData.timeline || 'Not specified'}
                </div>
            </div>
        </div>
    `;
}

// Initialize star ratings
document.addEventListener('DOMContentLoaded', function() {
    initializeStarRatings();
});

function initializeStarRatings() {
    const starRatings = document.querySelectorAll('.star-rating');
    
    starRatings.forEach(rating => {
        const ratingType = rating.dataset.rating;
        const stars = rating.querySelectorAll('.star');
        
        stars.forEach((star, index) => {
            star.addEventListener('click', () => {
                setRating(ratingType, index + 1);
                updateStarDisplay(rating, index + 1);
            });
            
            star.addEventListener('mouseenter', () => {
                highlightStars(rating, index + 1);
            });
        });
        
        rating.addEventListener('mouseleave', () => {
            const currentRating = ratings[ratingType] || 0;
            updateStarDisplay(rating, currentRating);
        });
    });
}

function setRating(ratingType, value) {
    ratings[ratingType] = value;
    document.getElementById(`${ratingType}Rating`).value = value;
}

function updateStarDisplay(ratingContainer, value) {
    const stars = ratingContainer.querySelectorAll('.star');
    stars.forEach((star, index) => {
        if (index < value) {
            star.classList.add('active');
        } else {
            star.classList.remove('active');
        }
    });
}

function highlightStars(ratingContainer, value) {
    const stars = ratingContainer.querySelectorAll('.star');
    stars.forEach((star, index) => {
        if (index < value) {
            star.style.color = '#fbbf24';
        } else {
            star.style.color = '#d1d5db';
        }
    });
}

// Form submission
document.getElementById('reviewForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    
    if (!currentUser || !projectData || !revieweeData) {
        alert('Missing required data. Please refresh and try again.');
        return;
    }
    
    // Validate all ratings are provided
    const requiredRatings = ['overall', 'communication', 'quality', 'timeliness', 'professionalism'];
    const missingRatings = requiredRatings.filter(rating => !ratings[rating]);
    
    if (missingRatings.length > 0) {
        alert('Please provide all required ratings before submitting.');
        return;
    }
    
    const uploadStatus = document.getElementById('uploadStatus');
    uploadStatus.style.display = 'block';
    uploadStatus.className = 'upload-status uploading';
    uploadStatus.innerHTML = 'Submitting your review...';
    
    try {
        const formData = new FormData(event.target);
        
        const reviewData = {
            // Project and user info
            projectId: projectData.id,
            projectTitle: projectData.title,
            reviewerId: currentUser.uid,
            reviewerEmail: currentUser.email,
            reviewerRole: currentUser.uid === projectData.companyId ? 'company' : 'developer',
            revieweeId: revieweeData.id,
            revieweeEmail: revieweeData.email,
            revieweeRole: revieweeData.role,
            
            // Ratings
            ratings: {
                overall: ratings.overall,
                communication: ratings.communication,
                quality: ratings.quality,
                timeliness: ratings.timeliness,
                professionalism: ratings.professionalism
            },
            averageRating: calculateAverageRating(),
            
            // Written feedback
            positiveFeedback: formData.get('positiveFeedback').trim(),
            improvementFeedback: formData.get('improvementFeedback').trim(),
            wouldRecommend: formData.get('wouldRecommend'),
            
            // Settings
            isPublic: !!formData.get('publicReview'),
            verified: true,
            
            // Metadata
            createdAt: new Date().toISOString(),
            timestamp: Date.now(),
            submittedAt: serverTimestamp()
        };
        
        // Save review to Firestore
        const docRef = await addDoc(collection(db, 'reviews'), reviewData);
        
        // Update reviewee's rating statistics
        await updateRevieweeStats(revieweeData.id, reviewData);
        
        // Add review ID to project for tracking
        await updateDoc(doc(db, 'projects', projectData.id), {
            reviews: arrayUnion(docRef.id),
            reviewsCount: (projectData.reviewsCount || 0) + 1
        });
        
        // Success message and redirect
        uploadStatus.className = 'upload-status success';
        uploadStatus.innerHTML = 'Review submitted successfully! Thank you for your feedback.';
        
        setTimeout(() => {
            // Redirect based on user role
            if (currentUser.uid === projectData.companyId) {
                window.location.href = 'dashboard-new.html';
            } else {
                window.location.href = 'projects-new.html';
            }
        }, 3000);
        
    } catch (error) {
        console.error('Error submitting review:', error);
        uploadStatus.className = 'upload-status error';
        uploadStatus.innerHTML = 'Failed to submit review. Please try again.';
    }
});

// Calculate average rating
function calculateAverageRating() {
    const ratingValues = Object.values(ratings);
    return Math.round((ratingValues.reduce((sum, rating) => sum + rating, 0) / ratingValues.length) * 10) / 10;
}

// Update reviewee's rating statistics
async function updateRevieweeStats(revieweeId, reviewData) {
    try {
        // Get current stats
        const statsRef = doc(db, 'userStats', revieweeId);
        const statsDoc = await getDoc(statsRef);
        
        let currentStats = {
            totalReviews: 0,
            averageRating: 0,
            ratingsSum: 0,
            ratingBreakdown: {
                overall: { sum: 0, count: 0 },
                communication: { sum: 0, count: 0 },
                quality: { sum: 0, count: 0 },
                timeliness: { sum: 0, count: 0 },
                professionalism: { sum: 0, count: 0 }
            },
            recommendationStats: {
                yes: 0,
                maybe: 0,
                no: 0
            }
        };
        
        if (statsDoc.exists()) {
            currentStats = { ...currentStats, ...statsDoc.data() };
        }
        
        // Update stats with new review
        currentStats.totalReviews += 1;
        currentStats.ratingsSum += reviewData.averageRating;
        currentStats.averageRating = Math.round((currentStats.ratingsSum / currentStats.totalReviews) * 10) / 10;
        
        // Update rating breakdown
        Object.keys(reviewData.ratings).forEach(ratingType => {
            currentStats.ratingBreakdown[ratingType].sum += reviewData.ratings[ratingType];
            currentStats.ratingBreakdown[ratingType].count += 1;
        });
        
        // Update recommendation stats
        currentStats.recommendationStats[reviewData.wouldRecommend] += 1;
        
        // Update last review date
        currentStats.lastReviewAt = new Date().toISOString();
        currentStats.updatedAt = serverTimestamp();
        
        // Save updated stats
        await updateDoc(statsRef, currentStats);
        
    } catch (error) {
        console.error('Error updating reviewee stats:', error);
        // Don't throw error - review was still saved successfully
    }
}

// Logout functionality
window.handleLogoutClick = async function() {
    try {
        await handleLogout();
        window.location.href = 'index.html';
    } catch (error) {
        console.error('Logout error:', error);
    }
};

// Utility function
function escapeHtml(text) {
    if (!text) return '';
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, function(m) { return map[m]; });
}

// Trigger review process function (to be called from project completion)
export async function triggerReviewProcess(projectId, companyId, developerId) {
    try {
        // Create review notifications for both parties
        const notifications = [
            {
                userId: companyId,
                type: 'review_request',
                projectId: projectId,
                revieweeId: developerId,
                message: 'Please review your collaboration with the developer',
                createdAt: new Date().toISOString(),
                read: false,
                actionUrl: `rating-system.html?projectId=${projectId}&revieweeId=${developerId}`
            },
            {
                userId: developerId,
                type: 'review_request',
                projectId: projectId,
                revieweeId: companyId,
                message: 'Please review your collaboration with the company',
                createdAt: new Date().toISOString(),
                read: false,
                actionUrl: `rating-system.html?projectId=${projectId}&revieweeId=${companyId}`
            }
        ];
        
        for (const notification of notifications) {
            await addDoc(collection(db, 'notifications'), notification);
        }
        
        return true;
    } catch (error) {
        console.error('Error triggering review process:', error);
        return false;
    }
}