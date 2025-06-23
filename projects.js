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

let currentProject = null;
let allProjects = []; // Store all projects for filtering

// Initialize projects page when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Wait for auth state before initializing
    setTimeout(() => {
        if (!requireAuth()) {
            return;
        }
        initializeProjects();
    }, 1000);
});

function initializeProjects() {
    // Load all projects
    loadAllProjects();
    
    // Set up application form
    const applicationForm = document.getElementById('applicationForm');
    if (applicationForm) {
        applicationForm.addEventListener('submit', handleApplicationSubmission);
    }
}

// Load all active projects
async function loadAllProjects() {
    const projectsList = document.getElementById('projectsList');
    
    // Show loading state
    projectsList.innerHTML = '<div class="loading">Loading projects...</div>';
    
    try {
        // Query all projects (simplified to avoid index requirements)
        const q = query(
            collection(db, 'projects'),
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
        
        // Store all projects for filtering
        allProjects = [];
        querySnapshot.forEach((doc) => {
            const project = doc.data();
            const projectId = doc.id;
            
            // Filter out inactive/unapproved projects
            if (project.status && project.status !== 'approved') {
                return;
            }
            
            allProjects.push({ id: projectId, ...project });
        });
        
        // Display projects
        displayProjects(allProjects);
        
    } catch (error) {
        console.error('Error loading projects:', error);
        console.error('Error code:', error.code);
        console.error('Error message:', error.message);
        
        let errorMessage = 'Failed to load projects. Please refresh the page to try again.';
        
        if (error.code === 'permission-denied') {
            errorMessage = 'Access denied. Please make sure you are logged in as a developer.';
        } else if (error.code === 'unavailable') {
            errorMessage = 'Database temporarily unavailable. Please try again in a moment.';
        }
        
        projectsList.innerHTML = `
            <div class="error-message">
                ${errorMessage}
                <br><small>Error: ${error.message}</small>
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
    document.getElementById('modalBudget').textContent = `$${projectData.budget?.toLocaleString() || 'Not specified'}`;
    document.getElementById('modalTimeline').textContent = projectData.deadline ? new Date(projectData.deadline).toLocaleDateString() : 'Not specified';
    // Display project category
    document.getElementById('modalCategory').textContent = projectData.category || 'General';
    
    // Reset application form
    document.getElementById('applicationForm').reset();
    
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

// Handle application form submission
async function handleApplicationSubmission(event) {
    event.preventDefault();
    
    if (!currentProject) return;
    
    const user = getCurrentUser();
    if (!user) {
        alert('Please log in to submit an application.');
        return;
    }
    
    const formData = new FormData(event.target);
    const applicationData = {
        projectId: currentProject.id,
        projectTitle: currentProject.title,
        developerUid: user.uid,
        developerName: user.displayName || user.email.split('@')[0],
        message: formData.get('applicationMessage').trim(),
        status: 'pending',
        createdAt: new Date().toISOString(),
        timestamp: Date.now()
    };
    
    // Validate required fields
    if (!applicationData.message) {
        alert('Please describe why you are interested in this project.');
        return;
    }
    
    try {
        // Check if user already applied to this project
        const projectRef = doc(db, 'projects', currentProject.id);
        const applicationsRef = collection(projectRef, 'applications');
        const existingAppQuery = query(
            applicationsRef,
            where('developerUid', '==', user.uid)
        );
        
        const existingApps = await getDocs(existingAppQuery);
        
        if (!existingApps.empty) {
            alert('You have already applied to this project.');
            return;
        }
        
        // Save application to project subcollection
        await addDoc(applicationsRef, applicationData);
        
        // Close project modal
        closeModal();
        
        // Show success modal
        document.getElementById('successModal').style.display = 'block';
        
    } catch (error) {
        console.error('Error submitting application:', error);
        alert('Failed to submit application. Please try again.');
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

// Display projects with filtering support
function displayProjects(projects) {
    const projectsList = document.getElementById('projectsList');
    
    if (projects.length === 0) {
        projectsList.innerHTML = `
            <div class="empty-state">
                <h3>No projects match your criteria</h3>
                <p>Try adjusting your filters or check back soon for new opportunities!</p>
            </div>
        `;
        return;
    }
    
    let projectsHTML = '';
    projects.forEach((project) => {
        const createdDate = new Date(project.createdAt).toLocaleDateString();
        
        // Truncate description for preview
        const truncatedDescription = project.description.length > 120 
            ? project.description.substring(0, 120) + '...' 
            : project.description;
        
        projectsHTML += `
            <div class="project-card" onclick="openProjectModal('${project.id}', ${JSON.stringify(project).replace(/"/g, '&quot;')})">
                <div class="project-header">
                    <h3 class="project-title">${escapeHtml(project.title)}</h3>
                    <span class="project-category">${escapeHtml(project.category || 'General')}</span>
                </div>
                <p class="project-description preview">${escapeHtml(truncatedDescription)}</p>
                <div class="project-meta">
                    <div class="meta-item">
                        <strong>Budget:</strong> <span>$${project.budget?.toLocaleString() || 'Not specified'}</span>
                    </div>
                    <div class="meta-item">
                        <strong>Deadline:</strong> <span>${project.deadline ? new Date(project.deadline).toLocaleDateString() : 'Not specified'}</span>
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
}

// Filter projects by category and search term
window.filterProjects = function() {
    const categoryFilter = document.getElementById('categoryFilter').value;
    const searchFilter = document.getElementById('searchFilter').value.toLowerCase();
    
    let filteredProjects = allProjects;
    
    // Filter by category
    if (categoryFilter) {
        filteredProjects = filteredProjects.filter(project => 
            project.category === categoryFilter
        );
    }
    
    // Filter by search term
    if (searchFilter) {
        filteredProjects = filteredProjects.filter(project => 
            project.title.toLowerCase().includes(searchFilter) ||
            project.description.toLowerCase().includes(searchFilter) ||
            (project.category && project.category.toLowerCase().includes(searchFilter))
        );
    }
    
    displayProjects(filteredProjects);
}

// Utility function to escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
