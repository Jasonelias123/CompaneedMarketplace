import { auth, db } from './firebase-config.js';
import { getCurrentUser, requireAuth, handleLogout } from './auth.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { 
    collection, 
    addDoc, 
    query, 
    orderBy, 
    getDocs,
    where,
    doc,
    updateDoc,
    arrayUnion
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

let currentProject = null;
let allProjects = []; // Store all projects for filtering

// Initialize projects page when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Check authentication for this page specifically
    const unsubscribe = onAuthStateChanged(auth, (user) => {
        if (!user) {
            window.location.href = 'login.html';
            return;
        }
        
        // User is authenticated, initialize projects
        initializeProjects();
        unsubscribe(); // Stop listening after initial check
    });
});

function initializeProjects() {
    // Set up event listeners
    setupEventListeners();
    
    // Set up logout button
    const logoutBtn = document.getElementById('logoutBtn');
    console.log('Projects page - Looking for logout button:', logoutBtn);
    if (logoutBtn) {
        console.log('Projects page - Logout button found, adding event listener');
        logoutBtn.addEventListener('click', handleLogout);
    } else {
        console.error('Projects page - Logout button not found in DOM');
    }
    
    // Load all projects
    loadAllProjects();
}

function setupEventListeners() {
    // Close modal buttons
    const closeButtons = document.querySelectorAll('.close-modal');
    closeButtons.forEach(button => {
        button.addEventListener('click', closeModal);
    });
    
    // Application form submission
    const applicationForm = document.getElementById('applicationForm');
    if (applicationForm) {
        applicationForm.addEventListener('submit', handleApplicationSubmission);
    }
    
    // Success modal close
    const closeSuccessBtn = document.getElementById('closeSuccessModal');
    if (closeSuccessBtn) {
        closeSuccessBtn.addEventListener('click', closeSuccessModal);
    }
}

// Load all projects from Firebase
async function loadAllProjects() {
    const projectsList = document.getElementById('projectsList');
    projectsList.innerHTML = '<div class="loading">Loading projects...</div>';
    
    try {
        const projectsQuery = query(
            collection(db, 'projects'),
            where('status', '==', 'open'),
            orderBy('createdAt', 'desc')
        );
        
        const querySnapshot = await getDocs(projectsQuery);
        allProjects = [];
        
        querySnapshot.forEach((doc) => {
            allProjects.push({
                id: doc.id,
                ...doc.data()
            });
        });
        
        displayProjects(allProjects);
        
    } catch (error) {
        console.error('Error loading projects:', error);
        projectsList.innerHTML = '<div class="error">Failed to load projects. Please refresh the page.</div>';
    }
}

// Show project details modal
function showProjectDetails(projectId) {
    const project = allProjects.find(p => p.id === projectId);
    if (!project) return;
    
    currentProject = project;
    
    // Populate modal with project details
    document.getElementById('modalProjectTitle').textContent = project.title;
    document.getElementById('modalProjectCategory').textContent = project.category;
    document.getElementById('modalProjectBudget').textContent = `$${project.budget?.toLocaleString() || 'Not specified'}`;
    document.getElementById('modalProjectDeadline').textContent = project.deadline || 'Not specified';
    document.getElementById('modalProjectDescription').textContent = project.description;
    
    // Handle skills display
    const skillsContainer = document.getElementById('modalProjectSkills');
    if (project.skills && project.skills.length > 0) {
        skillsContainer.innerHTML = project.skills.map(skill => 
            `<span class="skill-tag">${skill}</span>`
        ).join('');
    } else {
        skillsContainer.innerHTML = '<span class="no-skills">No specific skills listed</span>';
    }
    
    // Show modal
    document.getElementById('projectModal').style.display = 'block';
}

// Close project modal
function closeModal() {
    document.getElementById('projectModal').style.display = 'none';
    currentProject = null;
}

// Close success modal
function closeSuccessModal() {
    document.getElementById('successModal').style.display = 'none';
}

// Handle application form submission
async function handleApplicationSubmission(event) {
    event.preventDefault();
    console.log('=== APPLICATION SUBMISSION STARTED ===');
    
    if (!currentProject) {
        console.error('No current project selected');
        alert('No project selected. Please try again.');
        return;
    }
    
    console.log('Current project:', currentProject);
    
    const user = getCurrentUser();
    if (!user) {
        console.error('No user found');
        alert('Please log in to submit an application.');
        return;
    }
    
    console.log('User found:', { uid: user.uid, email: user.email });
    
    const formData = new FormData(event.target);
    const message = formData.get('applicationMessage');
    console.log('Form message:', message);
    
    if (!message || !message.trim()) {
        alert('Please describe why you are interested in this project.');
        return;
    }
    
    const applicationData = {
        projectId: currentProject.id,
        projectTitle: currentProject.title,
        developerUid: user.uid,
        developerName: user.displayName || user.email.split('@')[0],
        developerEmail: user.email,
        message: message.trim(),
        status: 'pending',
        createdAt: new Date().toISOString(),
        timestamp: Date.now()
    };
    
    console.log('Application data prepared:', applicationData);
    
    try {
        console.log('Creating Firebase document reference...');
        const projectRef = doc(db, 'projects', currentProject.id);
        console.log('Project reference created');
        
        console.log('Creating applications collection reference...');
        const applicationsRef = collection(projectRef, 'applications');
        console.log('Applications collection reference created');
        
        console.log('Checking for existing applications...');
        const existingAppQuery = query(
            applicationsRef,
            where('developerUid', '==', user.uid)
        );
        
        const existingApps = await getDocs(existingAppQuery);
        console.log('Existing applications check completed, found:', existingApps.size);
        
        if (!existingApps.empty) {
            alert('You have already applied to this project.');
            return;
        }
        
        console.log('Adding application to Firebase...');
        const docRef = await addDoc(applicationsRef, applicationData);
        console.log('Application submitted successfully with ID:', docRef.id);
        
        // Close project modal
        closeModal();
        
        // Clear form
        event.target.reset();
        
        // Show success message
        alert('Application submitted successfully! The company will review your application and contact you through the messaging system.');
        
    } catch (error) {
        console.error('=== APPLICATION SUBMISSION ERROR ===');
        console.error('Error object:', error);
        console.error('Error message:', error.message);
        console.error('Error code:', error.code);
        console.error('Error stack:', error.stack);
        alert(`Failed to submit application: ${error.message || 'Unknown error'}`);
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
                <p>Try adjusting your filters or check back later for new opportunities.</p>
            </div>
        `;
        return;
    }
    
    const projectsHTML = projects.map(project => {
        const skillsHTML = project.skills && project.skills.length > 0 
            ? project.skills.slice(0, 3).map(skill => `<span class="skill-tag">${escapeHtml(skill)}</span>`).join('')
            : '<span class="no-skills">No skills specified</span>';
        
        const moreSkills = project.skills && project.skills.length > 3 
            ? `<span class="more-skills">+${project.skills.length - 3} more</span>` 
            : '';
            
        return `
            <div class="project-card" onclick="showProjectDetails('${project.id}')">
                <div class="project-header">
                    <h3 class="project-title">${escapeHtml(project.title)}</h3>
                    <span class="project-budget">$${project.budget?.toLocaleString() || 'TBD'}</span>
                </div>
                
                <div class="project-meta">
                    <span class="project-category">${escapeHtml(project.category || 'General')}</span>
                    <span class="project-deadline">Due: ${project.deadline || 'Flexible'}</span>
                </div>
                
                <p class="project-description">
                    ${escapeHtml(project.description || '').substring(0, 150)}${project.description?.length > 150 ? '...' : ''}
                </p>
                
                <div class="project-skills">
                    ${skillsHTML}
                    ${moreSkills}
                </div>
                
                <div class="project-footer">
                    <span class="project-company">${escapeHtml(project.companyName || 'Anonymous Company')}</span>
                    <button class="btn btn-primary btn-sm" onclick="event.stopPropagation(); showProjectDetails('${project.id}')">
                        View Details
                    </button>
                </div>
            </div>
        `;
    }).join('');
    
    projectsList.innerHTML = projectsHTML;
}

// Escape HTML to prevent XSS
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

// Make functions globally accessible
window.showProjectDetails = showProjectDetails;
window.closeModal = closeModal;
window.closeSuccessModal = closeSuccessModal;