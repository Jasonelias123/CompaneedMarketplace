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

// Ensure user is authenticated and is a company
if (!requireAuth()) {
    throw new Error('Authentication required');
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeDashboard();
});

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
        companyId: user.uid,
        companyEmail: user.email,
        createdAt: new Date().toISOString(),
        status: 'active'
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
            
            projectsHTML += `
                <div class="project-item">
                    <h4>${escapeHtml(project.title)}</h4>
                    <p>${escapeHtml(project.description)}</p>
                    <div class="project-info">
                        <span><strong>Budget:</strong> ${escapeHtml(project.budget)}</span>
                        <span><strong>Timeline:</strong> ${escapeHtml(project.timeline)}</span>
                        <span><strong>Posted:</strong> ${createdDate}</span>
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

// Utility function to escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
