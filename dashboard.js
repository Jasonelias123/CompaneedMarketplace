import { auth, db } from './firebase-config.js';
import { getCurrentUser, requireAuth, handleLogout } from './auth.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { 
    collection, 
    addDoc, 
    query, 
    where, 
    orderBy, 
    getDocs,
    doc,
    updateDoc
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Check authentication for this page specifically
    const unsubscribe = onAuthStateChanged(auth, (user) => {
        if (!user) {
            window.location.href = 'login.html';
            return;
        }
        
        // User is authenticated, initialize dashboard
        initializeDashboard();
        setupNavigation();
        unsubscribe(); // Stop listening after initial check
    });
});

function setupNavigation() {
    const postProjectBtn = document.getElementById('postProjectBtn');
    const myProjectsBtn = document.getElementById('myProjectsBtn');
    const viewBidsBtn = document.getElementById('viewBidsBtn');
    const postProjectSection = document.getElementById('postProjectSection');
    const myProjectsSection = document.getElementById('myProjectsSection');
    const viewBidsSection = document.getElementById('viewBidsSection');

    postProjectBtn.addEventListener('click', () => {
        setActiveTab(postProjectBtn, postProjectSection);
    });

    myProjectsBtn.addEventListener('click', () => {
        setActiveTab(myProjectsBtn, myProjectsSection);
        loadUserProjects();
    });

    viewBidsBtn.addEventListener('click', () => {
        setActiveTab(viewBidsBtn, viewBidsSection);
        loadProjectApplications();
    });
}

function setActiveTab(activeBtn, activeSection) {
    // Remove active class from all buttons
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    // Hide all sections
    document.querySelectorAll('.dashboard-section').forEach(section => section.style.display = 'none');
    
    // Set active button and show section
    activeBtn.classList.add('active');
    activeSection.style.display = 'block';
}

function initializeDashboard() {
    // Set up project form
    const projectForm = document.getElementById('projectForm');
    if (projectForm) {
        projectForm.addEventListener('submit', handleProjectSubmission);
    }
    
    // Set up logout button
    const logoutBtn = document.getElementById('logoutBtn');
    console.log('Looking for logout button:', logoutBtn);
    if (logoutBtn) {
        console.log('Logout button found, adding event listener');
        logoutBtn.addEventListener('click', handleLogout);
    } else {
        console.error('Logout button not found in DOM');
    }
    
    // Load existing projects
    loadUserProjects();
}

// Handle project submission
async function handleProjectSubmission(event) {
    event.preventDefault();
    console.log('Form submission started');
    
    const user = getCurrentUser();
    if (!user) {
        console.error('No user found');
        return;
    }
    
    const formData = new FormData(event.target);
    console.log('Form data collected');
    
    // Parse skills from comma-separated string
    const skillsInput = formData.get('skills') || '';
    const skills = skillsInput.split(',').map(skill => skill.trim()).filter(skill => skill.length > 0);
    
    const projectData = {
        title: formData.get('title').trim(),
        description: formData.get('description').trim(),
        category: formData.get('category'),
        skills: skills,
        budget: parseInt(formData.get('budget')),
        deadline: formData.get('deadline'),
        ndaRequired: formData.get('ndaRequired') === 'on',
        companyId: user.uid,
        companyEmail: user.email,
        companyName: user.email.split('@')[0], // Use email prefix as company name
        projectStatus: 'Open',
        createdAt: new Date().toISOString(),
        status: 'open',
        applications: []
    };
    
    console.log('Project data prepared:', projectData);
    
    const successDiv = document.getElementById('project-success');
    const errorDiv = document.getElementById('project-error');
    
    // Clear previous messages
    successDiv.style.display = 'none';
    errorDiv.style.display = 'none';
    
    // Enhanced form validation
    const validationErrors = [];
    
    if (!projectData.title.trim()) {
        validationErrors.push('Project title is required');
    }
    if (!projectData.description.trim()) {
        validationErrors.push('Project description is required');
    }
    if (!projectData.category) {
        validationErrors.push('Project category is required');
    }
    if (!projectData.budget || projectData.budget <= 0) {
        validationErrors.push('Valid budget amount is required');
    }
    if (!projectData.deadline) {
        validationErrors.push('Project deadline is required');
    }
    if (!skills || skills.length === 0) {
        validationErrors.push('At least one skill is required');
    }
    
    // Validate deadline is in the future
    const selectedDate = new Date(projectData.deadline);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (selectedDate < today) {
        validationErrors.push('Project deadline must be in the future');
    }
    
    if (validationErrors.length > 0) {
        console.log('Validation errors:', validationErrors);
        showProjectError(validationErrors.join(', '));
        return;
    }
    
    console.log('Validation passed, submitting to Firebase...');
    
    try {
        // Add project to main collection
        const docRef = await addDoc(collection(db, 'projects'), projectData);
        console.log('Project added with ID:', docRef.id);
        console.log('Project created with ID:', docRef.id);
        
        // Add to admin logging collection for moderation
        await addDoc(collection(db, 'adminProjectLogs'), {
            ...projectData,
            originalProjectId: docRef.id,
            action: 'project_submitted',
            timestamp: Date.now()
        });
        
        // Show success message
        successDiv.style.display = 'block';
        
        // Reset form
        event.target.reset();
        
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

// Load project applications (secure - no contact info exposed)
async function loadProjectApplications() {
    const bidsList = document.getElementById('bidsList');
    const user = getCurrentUser();
    
    if (!user) return;
    
    bidsList.innerHTML = '<div class="loading">Loading applications...</div>';
    
    try {
        // Get all projects by this company
        const projectsQuery = query(
            collection(db, 'projects'),
            where('companyId', '==', user.uid),
            orderBy('createdAt', 'desc')
        );
        
        const projectsSnapshot = await getDocs(projectsQuery);
        
        if (projectsSnapshot.empty) {
            bidsList.innerHTML = '<div class="no-data">No projects posted yet. Post a project to start receiving applications.</div>';
            return;
        }
        
        let allApplications = [];
        
        // For each project, get its applications from subcollection
        for (const projectDoc of projectsSnapshot.docs) {
            const projectData = projectDoc.data();
            const projectRef = doc(db, 'projects', projectDoc.id);
            const applicationsRef = collection(projectRef, 'applications');
            
            const applicationsQuery = query(
                applicationsRef,
                orderBy('timestamp', 'desc')
            );
            
            const applicationsSnapshot = await getDocs(applicationsQuery);
            
            applicationsSnapshot.forEach(appDoc => {
                allApplications.push({
                    id: appDoc.id,
                    projectId: projectDoc.id,
                    ...appDoc.data(),
                    projectTitle: projectData.title,
                    projectBudget: projectData.budget
                });
            });
        }
        
        if (allApplications.length === 0) {
            bidsList.innerHTML = '<div class="no-data">No applications received yet. Your projects will start receiving applications from developers soon.</div>';
            return;
        }
        
        // Group applications by project to calculate averages
        const applicationsByProject = {};
        allApplications.forEach(app => {
            if (!applicationsByProject[app.projectId]) {
                applicationsByProject[app.projectId] = {
                    applications: [],
                    projectTitle: app.projectTitle,
                    projectBudget: app.projectBudget
                };
            }
            applicationsByProject[app.projectId].applications.push(app);
        });

        // Display applications with budget analytics
        const applicationsHTML = allApplications.map(app => {
            const projectApps = applicationsByProject[app.projectId].applications;
            const proposedPrices = projectApps.filter(a => a.proposedPrice).map(a => a.proposedPrice);
            const averageProposed = proposedPrices.length > 0 
                ? Math.round(proposedPrices.reduce((sum, price) => sum + price, 0) / proposedPrices.length)
                : null;
            
            const budgetInfo = app.projectBudget && app.proposedPrice ? `
                <div class="budget-analytics">
                    <div class="budget-row">
                        <span class="budget-label">Budget posted:</span>
                        <span class="budget-value">$${app.projectBudget.toLocaleString()}</span>
                    </div>
                    ${averageProposed ? `
                        <div class="budget-row">
                            <span class="budget-label">Average proposed so far:</span>
                            <span class="budget-value ${averageProposed < app.projectBudget ? 'under-budget' : 'over-budget'}">$${averageProposed.toLocaleString()}</span>
                        </div>
                    ` : ''}
                    <div class="budget-row">
                        <span class="budget-label">This proposal:</span>
                        <span class="budget-value ${app.proposedPrice < app.projectBudget ? 'under-budget' : 'over-budget'}">$${app.proposedPrice.toLocaleString()}</span>
                    </div>
                </div>
            ` : '';

            return `
            <div class="application-card">
                <div class="application-header">
                    <h3>${escapeHtml(app.projectTitle)}</h3>
                    <span class="application-date">${new Date(app.createdAt).toLocaleDateString()}</span>
                </div>
                <div class="application-content">
                    <p><strong>Developer:</strong> ${escapeHtml(app.developerName)}</p>
                    ${budgetInfo}
                    <p><strong>Application Message:</strong></p>
                    <div class="application-message">${escapeHtml(app.message)}</div>
                    ${app.attachments && (app.attachments.pitchDeck || app.attachments.dataFile) ? `
                        <div class="attachments-section">
                            <p><strong>Attachments:</strong></p>
                            <div class="attachment-list">
                                ${app.attachments.pitchDeck ? `<span class="attachment-item">📄 ${app.attachments.pitchDeck.name}</span>` : ''}
                                ${app.attachments.dataFile ? `<span class="attachment-item">📊 ${app.attachments.dataFile.name}</span>` : ''}
                            </div>
                        </div>
                    ` : ''}
                    <div class="application-actions">
                        <select class="application-status-select" onchange="updateApplicationStatus('${app.projectId}', '${app.id}', this.value)">
                            <option value="pending" ${app.status === 'pending' ? 'selected' : ''}>Pending Review</option>
                            <option value="reviewed" ${app.status === 'reviewed' ? 'selected' : ''}>Reviewed</option>
                            <option value="accepted" ${app.status === 'accepted' ? 'selected' : ''}>Accepted</option>
                            <option value="declined" ${app.status === 'declined' ? 'selected' : ''}>Declined</option>
                        </select>
                    </div>
                </div>
            </div>
            `;
        }).join('');
        
        bidsList.innerHTML = applicationsHTML;
        
    } catch (error) {
        console.error('Error loading applications:', error);
        bidsList.innerHTML = '<div class="error">Error loading applications. Please try again.</div>';
    }
}

// Update application status (secure in-platform communication)
window.updateApplicationStatus = async function(projectId, applicationId, newStatus) {
    try {
        const projectRef = doc(db, 'projects', projectId);
        const applicationRef = doc(collection(projectRef, 'applications'), applicationId);
        
        await updateDoc(applicationRef, {
            status: newStatus,
            updatedAt: new Date().toISOString()
        });
        
        console.log('Application status updated successfully');
    } catch (error) {
        console.error('Error updating application status:', error);
        alert('Failed to update application status. Please try again.');
    }
}



// Utility function to escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
