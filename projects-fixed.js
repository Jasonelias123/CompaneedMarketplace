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
    
    // File input previews
    const pitchDeckInput = document.getElementById('pitchDeck');
    const dataFileInput = document.getElementById('dataFile');
    
    if (pitchDeckInput) {
        pitchDeckInput.addEventListener('change', function(e) {
            showFilePreview(e.target, 'pitch-preview');
        });
    }
    
    if (dataFileInput) {
        dataFileInput.addEventListener('change', function(e) {
            showFilePreview(e.target, 'data-preview');
        });
    }
}

function showFilePreview(input, previewId) {
    const file = input.files[0];
    let existingPreview = document.getElementById(previewId);
    
    // Remove existing preview
    if (existingPreview) {
        existingPreview.remove();
    }
    
    if (file) {
        const preview = document.createElement('div');
        preview.id = previewId;
        preview.className = 'file-preview';
        preview.innerHTML = `
            📄 ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)
            <button type="button" onclick="clearFile('${input.id}', '${previewId}')" style="margin-left: 10px; background: none; border: none; color: #ef4444; cursor: pointer;">✕</button>
        `;
        input.parentNode.appendChild(preview);
    }
}

function clearFile(inputId, previewId) {
    const input = document.getElementById(inputId);
    const preview = document.getElementById(previewId);
    
    if (input) input.value = '';
    if (preview) preview.remove();
}

// Load all projects from Firebase
async function loadAllProjects() {
    const projectsList = document.getElementById('projectsList');
    projectsList.innerHTML = '<div class="loading">Loading projects...</div>';
    
    try {
        const projectsQuery = query(
            collection(db, 'projects'),
            where('status', '==', 'open')
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
    const proposedPrice = formData.get('proposedPrice');
    const pitchDeckFile = formData.get('pitchDeck');
    const dataFile = formData.get('dataFile');
    
    console.log('Form message:', message);
    console.log('Proposed price:', proposedPrice);
    console.log('Pitch deck file:', pitchDeckFile ? pitchDeckFile.name : 'None');
    console.log('Data file:', dataFile ? dataFile.name : 'None');
    
    if (!message || !message.trim()) {
        alert('Please describe why you are interested in this project.');
        return;
    }
    
    if (!proposedPrice || isNaN(proposedPrice) || parseInt(proposedPrice) <= 0) {
        alert('Please enter a valid proposed price.');
        return;
    }
    
    // Validate file uploads
    const maxFileSize = 10 * 1024 * 1024; // 10MB limit
    const pitchDeckTypes = ['application/pdf', 'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation'];
    const dataFileTypes = ['text/csv', 'application/json', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
    
    if (pitchDeckFile && pitchDeckFile.size > 0) {
        if (pitchDeckFile.size > maxFileSize) {
            alert('Pitch deck file must be smaller than 10MB');
            return;
        }
        if (!pitchDeckTypes.includes(pitchDeckFile.type) && !pitchDeckFile.name.toLowerCase().endsWith('.key')) {
            alert('Pitch deck must be a PDF, PowerPoint, or Keynote file');
            return;
        }
    }
    
    if (dataFile && dataFile.size > 0) {
        if (dataFile.size > maxFileSize) {
            alert('Data file must be smaller than 10MB');
            return;
        }
        if (!dataFileTypes.includes(dataFile.type)) {
            alert('Data file must be CSV, JSON, or Excel format');
            return;
        }
    }
    
    // Show upload status
    const uploadStatus = document.getElementById('uploadStatus');
    uploadStatus.style.display = 'block';
    uploadStatus.className = 'upload-status uploading';
    uploadStatus.innerHTML = 'Processing application...';
    
    const applicationData = {
        projectId: currentProject.id,
        projectTitle: currentProject.title,
        developerUid: user.uid,
        developerName: user.displayName || user.email.split('@')[0],
        developerEmail: user.email,
        message: message.trim(),
        proposedPrice: parseInt(proposedPrice),
        status: 'pending',
        createdAt: new Date().toISOString(),
        timestamp: Date.now(),
        attachments: {
            pitchDeck: pitchDeckFile ? {
                name: pitchDeckFile.name,
                size: pitchDeckFile.size,
                type: pitchDeckFile.type,
                uploaded: true
            } : null,
            dataFile: dataFile ? {
                name: dataFile.name,
                size: dataFile.size,
                type: dataFile.type,
                uploaded: true
            } : null
        }
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
            uploadStatus.className = 'upload-status error';
            uploadStatus.innerHTML = 'You have already applied to this project.';
            return;
        }
        
        console.log('Adding application to Firebase...');
        const docRef = await addDoc(applicationsRef, applicationData);
        console.log('Application submitted successfully with ID:', docRef.id);
        
        // Show success status
        uploadStatus.className = 'upload-status success';
        uploadStatus.innerHTML = `
            ✓ Application submitted successfully!<br>
            ${pitchDeckFile ? `• Pitch deck: ${pitchDeckFile.name}<br>` : ''}
            ${dataFile ? `• Data file: ${dataFile.name}<br>` : ''}
            The company will review your application and contact you through the messaging system.
        `;
        
        // Close project modal after delay
        setTimeout(() => {
            closeModal();
            // Reset upload status
            uploadStatus.style.display = 'none';
        }, 3000);
        
        // Clear form
        event.target.reset();
        
    } catch (error) {
        console.error('=== APPLICATION SUBMISSION ERROR ===');
        console.error('Error object:', error);
        console.error('Error message:', error.message);
        console.error('Error code:', error.code);
        console.error('Error stack:', error.stack);
        
        // Show error status
        uploadStatus.className = 'upload-status error';
        uploadStatus.innerHTML = `
            ✗ Failed to submit application<br>
            Error: ${error.message || 'Unknown error'}<br>
            Please try again or contact support if the problem persists.
        `;
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
window.clearFile = clearFile;