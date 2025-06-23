import { auth, db } from './firebase-config.js';
import { getCurrentUser, requireAuth } from './auth.js';
import { 
    collection, 
    addDoc, 
    query, 
    where, 
    orderBy, 
    getDocs 
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Wait for auth state before initializing
    setTimeout(() => {
        if (!requireAuth()) {
            return;
        }
        initializeDashboard();
        setupNavigation();
    }, 1000);
});

function setupNavigation() {
    const postProjectBtn = document.getElementById('postProjectBtn');
    const viewBidsBtn = document.getElementById('viewBidsBtn');
    const postProjectSection = document.getElementById('postProjectSection');
    const viewBidsSection = document.getElementById('viewBidsSection');

    postProjectBtn.addEventListener('click', () => {
        postProjectBtn.classList.add('active');
        viewBidsBtn.classList.remove('active');
        postProjectSection.style.display = 'block';
        viewBidsSection.style.display = 'none';
    });

    viewBidsBtn.addEventListener('click', () => {
        viewBidsBtn.classList.add('active');
        postProjectBtn.classList.remove('active');
        postProjectSection.style.display = 'none';
        viewBidsSection.style.display = 'block';
        loadProjectBids();
    });
}

function initializeDashboard() {
    // Set up project form
    const projectForm = document.getElementById('projectForm');
    if (projectForm) {
        projectForm.addEventListener('submit', handleProjectSubmission);
    }
    
    // Load existing projects
    loadUserProjects();
}

// Handle project submission
async function handleProjectSubmission(event) {
    event.preventDefault();
    
    const user = getCurrentUser();
    if (!user) return;
    
    const formData = new FormData(event.target);
    const projectData = {
        title: formData.get('title').trim(),
        description: formData.get('description').trim(),
        budget: formData.get('budget'),
        timeline: formData.get('timeline'),
        contactEmail: formData.get('contactEmail').trim(),
        ndaRequired: formData.get('ndaRequired') === 'on',
        companyId: user.uid,
        companyEmail: user.email,
        createdAt: new Date().toISOString(),
        status: 'pending'
    };
    
    const successDiv = document.getElementById('project-success');
    const errorDiv = document.getElementById('project-error');
    
    // Clear previous messages
    successDiv.style.display = 'none';
    errorDiv.style.display = 'none';
    
    // Validate required fields
    if (!projectData.title || !projectData.description || !projectData.budget || !projectData.timeline || !projectData.contactEmail) {
        showProjectError('Please fill in all required fields.');
        return;
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(projectData.contactEmail)) {
        showProjectError('Please enter a valid contact email address.');
        return;
    }
    
    try {
        // Add project to Firestore
        const docRef = await addDoc(collection(db, 'projects'), projectData);
        console.log('Project created with ID:', docRef.id);
        
        // Show success message
        successDiv.style.display = 'block';
        
        // Reset form
        event.target.reset();
        
        // Reload projects list
        loadUserProjects();
        
        // Hide success message after 5 seconds
        setTimeout(() => {
            successDiv.style.display = 'none';
        }, 5000);
        
    } catch (error) {
        console.error('Error adding project:', error);
        showProjectError('Failed to post project. Please try again.');
    }
}

// Load user's projects
async function loadUserProjects() {
    const user = getCurrentUser();
    if (!user) return;
    
    const projectsList = document.getElementById('projectsList');
    
    // Show loading state
    projectsList.innerHTML = '<div class="loading">Loading your projects...</div>';
    
    try {
        // Query projects for current user
        const q = query(
            collection(db, 'projects'),
            where('companyId', '==', user.uid),
            orderBy('createdAt', 'desc')
        );
        
        const querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty) {
            projectsList.innerHTML = `
                <div class="empty-state">
                    <h3>No projects posted yet</h3>
                    <p>Post your first AI project above to start connecting with developers.</p>
                </div>
            `;
            return;
        }
        
        // Build projects HTML
        let projectsHTML = '';
        querySnapshot.forEach((doc) => {
            const project = doc.data();
            const createdDate = new Date(project.createdAt).toLocaleDateString();
            
            const statusClass = project.status || 'pending';
            const statusText = project.status === 'active' ? 'APPROVED' : (project.status || 'PENDING').toUpperCase();
            
            projectsHTML += `
                <div class="project-item">
                    <div class="project-header">
                        <h4>${escapeHtml(project.title)}</h4>
                        <span class="project-status status-${statusClass}">${statusText}</span>
                    </div>
                    <p>${escapeHtml(project.description)}</p>
                    <div class="project-info">
                        <span><strong>Budget:</strong> ${escapeHtml(project.budget)}</span>
                        <span><strong>Timeline:</strong> ${escapeHtml(project.timeline)}</span>
                        <span><strong>Posted:</strong> ${createdDate}</span>
                        ${project.ndaRequired ? '<span class="nda-badge">NDA Required</span>' : ''}
                    </div>
                </div>
            `;
        });
        
        projectsList.innerHTML = projectsHTML;
        
    } catch (error) {
        console.error('Error loading projects:', error);
        projectsList.innerHTML = `
            <div class="error-message">
                Failed to load projects. Please refresh the page to try again.
            </div>
        `;
    }
}

// Show project error message
function showProjectError(message) {
    const errorDiv = document.getElementById('project-error');
    if (errorDiv) {
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            errorDiv.style.display = 'none';
        }, 5000);
    }
}

async function loadProjectBids() {
    const bidsList = document.getElementById('bidsList');
    const user = getCurrentUser();
    
    if (!user) return;
    
    try {
        // Get all projects by this company
        const projectsQuery = query(
            collection(db, 'projects'),
            where('companyId', '==', user.uid),
            orderBy('createdAt', 'desc')
        );
        
        const projectsSnapshot = await getDocs(projectsQuery);
        
        if (projectsSnapshot.empty) {
            bidsList.innerHTML = '<div class="no-data">No projects posted yet. Post a project to start receiving bids.</div>';
            return;
        }
        
        let allBids = [];
        
        // For each project, get its bids
        for (const projectDoc of projectsSnapshot.docs) {
            const projectData = projectDoc.data();
            
            const bidsQuery = query(
                collection(db, 'bids'),
                where('projectId', '==', projectDoc.id),
                orderBy('createdAt', 'desc')
            );
            
            const bidsSnapshot = await getDocs(bidsQuery);
            
            bidsSnapshot.forEach(bidDoc => {
                allBids.push({
                    id: bidDoc.id,
                    ...bidDoc.data(),
                    projectTitle: projectData.title
                });
            });
        }
        
        if (allBids.length === 0) {
            bidsList.innerHTML = '<div class="no-data">No bids received yet. Your projects will start receiving bids from developers soon.</div>';
            return;
        }
        
        // Display bids
        bidsList.innerHTML = allBids.map(bid => `
            <div class="bid-card">
                <div class="bid-header">
                    <h3>${escapeHtml(bid.projectTitle)}</h3>
                    <span class="bid-date">${new Date(bid.createdAt).toLocaleDateString()}</span>
                </div>
                <div class="bid-content">
                    <p><strong>Developer:</strong> ${escapeHtml(bid.developerEmail)}</p>
                    <p><strong>Message:</strong> ${escapeHtml(bid.message)}</p>
                    <div class="bid-actions">
                        <button class="btn btn-primary" onclick="contactDeveloper('${bid.developerEmail}', '${escapeHtml(bid.projectTitle)}')">
                            Contact Developer
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
        
    } catch (error) {
        console.error('Error loading bids:', error);
        bidsList.innerHTML = '<div class="error">Error loading bids. Please try again.</div>';
    }
}

function contactDeveloper(email, projectTitle) {
    const subject = encodeURIComponent(`Re: ${projectTitle} - Project Inquiry`);
    const body = encodeURIComponent(`Hi,\n\nI saw your interest in my project "${projectTitle}" and would like to discuss it further.\n\nBest regards`);
    window.open(`mailto:${email}?subject=${subject}&body=${body}`);
}

// Utility function to escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
