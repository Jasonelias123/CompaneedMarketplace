import { auth, db } from './firebase-config.js';
import { getCurrentUser, requireAuth } from './auth.js';
import { 
    collection, 
    addDoc, 
    query, 
    orderBy, 
    getDocs,
    where 
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

// Ensure user is authenticated and is a developer
if (!requireAuth()) {
    throw new Error('Authentication required');
}

let currentProject = null;

// Initialize projects page when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeProjects();
});

function initializeProjects() {
    // Load all projects
    loadAllProjects();
    
    // Set up interest form
    const interestForm = document.getElementById('interestForm');
    if (interestForm) {
        interestForm.addEventListener('submit', handleInterestSubmission);
    }
}

// Load all active projects
async function loadAllProjects() {
    const projectsList = document.getElementById('projectsList');
    
    // Show loading state
    projectsList.innerHTML = '<div class="loading">Loading projects...</div>';
    
    try {
        // Query all active projects
        const q = query(
            collection(db, 'projects'),
            where('status', '==', 'active'),
            orderBy('createdAt', 'desc')
        );
        
        const querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty) {
            projectsList.innerHTML = `
                <div class="empty-state">
                    <h3>No projects available</h3>
                    <p>Check back soon for new AI project opportunities!</p>
                </div>
            `;
            return;
        }
        
        // Build projects HTML
        let projectsHTML = '';
        querySnapshot.forEach((doc) => {
            const project = doc.data();
            const projectId = doc.id;
            const createdDate = new Date(project.createdAt).toLocaleDateString();
            
            // Truncate description for preview
            const truncatedDescription = project.description.length > 120 
                ? project.description.substring(0, 120) + '...' 
                : project.description;
            
            projectsHTML += `
                <div class="project-card" onclick="openProjectModal('${projectId}', ${JSON.stringify(project).replace(/"/g, '&quot;')})">
                    <h3 class="project-title">${escapeHtml(project.title)}</h3>
                    <p class="project-description preview">${escapeHtml(truncatedDescription)}</p>
                    <div class="project-meta">
                        <div class="meta-item">
                            <strong>Budget:</strong> <span>${escapeHtml(project.budget)}</span>
                        </div>
                        <div class="meta-item">
                            <strong>Timeline:</strong> <span>${escapeHtml(project.timeline)}</span>
                        </div>
                    </div>
                    <div class="project-actions">
                        <span class="project-date">Posted ${createdDate}</span>
                        <strong style="color: var(--primary-blue);">View Details →</strong>
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

// Open project detail modal
window.openProjectModal = function(projectId, projectData) {
    currentProject = { id: projectId, ...projectData };
    
    // Populate modal with project details
    document.getElementById('modalTitle').textContent = projectData.title;
    document.getElementById('modalDescription').textContent = projectData.description;
    document.getElementById('modalBudget').textContent = projectData.budget;
    document.getElementById('modalTimeline').textContent = projectData.timeline;
    document.getElementById('modalContact').textContent = projectData.contactEmail;
    
    // Reset interest form
    document.getElementById('interestForm').reset();
    
    // Show modal
    document.getElementById('projectModal').style.display = 'block';
}

// Close project modal
window.closeModal = function() {
    document.getElementById('projectModal').style.display = 'none';
    currentProject = null;
}

// Close success modal
window.closeSuccessModal = function() {
    document.getElementById('successModal').style.display = 'none';
}

// Handle interest submission
async function handleInterestSubmission(event) {
    event.preventDefault();
    
    if (!currentProject) return;
    
    const user = getCurrentUser();
    if (!user) return;
    
    const formData = new FormData(event.target);
    const interestData = {
        projectId: currentProject.id,
        projectTitle: currentProject.title,
        companyId: currentProject.companyId,
        companyEmail: currentProject.companyEmail,
        developerId: user.uid,
        developerName: formData.get('developerName').trim(),
        developerEmail: formData.get('developerEmail').trim(),
        message: formData.get('message').trim(),
        submittedAt: new Date().toISOString(),
        status: 'pending'
    };
    
    // Validate required fields
    if (!interestData.developerName || !interestData.developerEmail) {
        alert('Please fill in all required fields.');
        return;
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(interestData.developerEmail)) {
        alert('Please enter a valid email address.');
        return;
    }
    
    try {
        // Check if user already submitted interest for this project
        const existingInterestQuery = query(
            collection(db, 'interests'),
            where('projectId', '==', currentProject.id),
            where('developerId', '==', user.uid)
        );
        
        const existingInterests = await getDocs(existingInterestQuery);
        
        if (!existingInterests.empty) {
            alert('You have already submitted interest for this project.');
            return;
        }
        
        // Add interest to Firestore
        await addDoc(collection(db, 'interests'), interestData);
        
        // Close project modal
        closeModal();
        
        // Show success modal
        document.getElementById('successModal').style.display = 'block';
        
    } catch (error) {
        console.error('Error submitting interest:', error);
        alert('Failed to submit interest. Please try again.');
    }
}

// Close modal when clicking outside
window.onclick = function(event) {
    const projectModal = document.getElementById('projectModal');
    const successModal = document.getElementById('successModal');
    
    if (event.target === projectModal) {
        closeModal();
    } else if (event.target === successModal) {
        closeSuccessModal();
    }
}

// Utility function to escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
