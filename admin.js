import { auth, db } from './firebase-config.js';
import { getCurrentUser, requireAuth } from './auth.js';
import { 
    collection, 
    query, 
    orderBy, 
    getDocs,
    where,
    doc,
    updateDoc
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

// Admin email - only this user can access admin functions
const ADMIN_EMAIL = 'jasonegustaf@gmail.com';

// Initialize admin panel when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        if (!requireAuth()) {
            return;
        }
        checkAdminAccess();
        initializeAdmin();
        setupNavigation();
    }, 1000);
});

function checkAdminAccess() {
    const user = getCurrentUser();
    if (!user || user.email !== ADMIN_EMAIL) {
        alert('Access denied. Admin privileges required.');
        window.location.href = 'index.html';
        return;
    }
}

function setupNavigation() {
    const pendingBtn = document.getElementById('pendingProjectsBtn');
    const approvedBtn = document.getElementById('approvedProjectsBtn');
    const rejectedBtn = document.getElementById('rejectedProjectsBtn');
    const developersBtn = document.getElementById('developerApplicationsBtn');
    
    const pendingSection = document.getElementById('pendingProjectsSection');
    const approvedSection = document.getElementById('approvedProjectsSection');
    const rejectedSection = document.getElementById('rejectedProjectsSection');
    const developersSection = document.getElementById('developerApplicationsSection');

    pendingBtn.addEventListener('click', () => {
        setActiveSection(pendingBtn, pendingSection);
        loadProjectsByStatus('pending');
    });

    approvedBtn.addEventListener('click', () => {
        setActiveSection(approvedBtn, approvedSection);
        loadProjectsByStatus('active');
    });

    rejectedBtn.addEventListener('click', () => {
        setActiveSection(rejectedBtn, rejectedSection);
        loadProjectsByStatus('rejected');
    });

    developersBtn.addEventListener('click', () => {
        setActiveSection(developersBtn, developersSection);
        loadDeveloperApplications();
    });
}

function setActiveSection(activeBtn, activeSection) {
    // Remove active class from all buttons
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    // Hide all sections
    document.querySelectorAll('.dashboard-section').forEach(section => section.style.display = 'none');
    
    // Set active button and show section
    activeBtn.classList.add('active');
    activeSection.style.display = 'block';
}

function initializeAdmin() {
    loadAdminStatistics();
    loadProjectsByStatus('pending');
}

// Load admin statistics
async function loadAdminStatistics() {
    try {
        const projectsRef = collection(db, 'projects');
        const allProjects = await getDocs(projectsRef);
        
        let pendingCount = 0;
        let approvedCount = 0;
        let rejectedCount = 0;
        
        allProjects.forEach((doc) => {
            const status = doc.data().status || 'pending';
            switch(status) {
                case 'pending':
                    pendingCount++;
                    break;
                case 'approved':
                    approvedCount++;
                    break;
                case 'rejected':
                    rejectedCount++;
                    break;
            }
        });
        
        document.getElementById('pendingCount').textContent = pendingCount;
        document.getElementById('approvedCount').textContent = approvedCount;
        document.getElementById('rejectedCount').textContent = rejectedCount;
    } catch (error) {
        console.error('Error loading statistics:', error);
    }
}

async function loadProjectsByStatus(status) {
    const listId = status === 'active' ? 'approvedProjectsList' : `${status}ProjectsList`;
    const projectsList = document.getElementById(listId);
    
    projectsList.innerHTML = '<div class="loading">Loading projects...</div>';
    
    try {
        const q = query(
            collection(db, 'projects'),
            where('status', '==', status),
            orderBy('createdAt', 'desc')
        );
        
        const querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty) {
            projectsList.innerHTML = `<div class="no-data">No ${status} projects found.</div>`;
            return;
        }
        
        let projectsHTML = '';
        querySnapshot.forEach((doc) => {
            const project = doc.data();
            const projectId = doc.id;
            const createdDate = new Date(project.createdAt).toLocaleDateString();
            
            projectsHTML += `
                <div class="admin-project-item">
                    <div class="project-header">
                        <h4>${escapeHtml(project.title)}</h4>
                        <span class="project-status status-${status}">${status.toUpperCase()}</span>
                    </div>
                    <p class="project-description">${escapeHtml(project.description)}</p>
                    <div class="project-meta">
                        <div class="meta-row">
                            <span><strong>Company:</strong> ${escapeHtml(project.companyEmail)}</span>
                            <span><strong>Budget:</strong> $${project.budget?.toLocaleString() || 'Not specified'}</span>
                        </div>
                        <div class="meta-row">
                            <span><strong>Deadline:</strong> ${project.deadline ? new Date(project.deadline).toLocaleDateString() : 'Not specified'}</span>
                            <span><strong>Posted:</strong> ${createdDate}</span>
                        </div>
                        <div class="meta-row">
                            <span><strong>Company Email:</strong> ${escapeHtml(project.companyEmail)}</span>
                            ${project.ndaRequired ? '<span class="nda-badge">NDA Required</span>' : ''}
                        </div>
                    </div>
                    <div class="admin-actions">
                        ${status === 'pending' ? `
                            <button class="btn btn-primary" onclick="approveProject('${projectId}')">
                                Approve
                            </button>
                            <button class="btn btn-danger" onclick="rejectProject('${projectId}')">
                                Reject
                            </button>
                        ` : ''}
                        ${status === 'active' ? `
                            <button class="btn btn-danger" onclick="rejectProject('${projectId}')">
                                Remove
                            </button>
                        ` : ''}
                        ${status === 'rejected' ? `
                            <button class="btn btn-primary" onclick="approveProject('${projectId}')">
                                Approve
                            </button>
                        ` : ''}
                    </div>
                </div>
            `;
        });
        
        projectsList.innerHTML = projectsHTML;
        
    } catch (error) {
        console.error('Error loading projects:', error);
        projectsList.innerHTML = `<div class="error">Error loading projects: ${error.message}</div>`;
    }
}

window.approveProject = async function(projectId) {
    try {
        await updateDoc(doc(db, 'projects', projectId), {
            status: 'active',
            approvedAt: new Date().toISOString()
        });
        
        alert('Project approved successfully!');
        // Reload current view
        const activeBtn = document.querySelector('.nav-btn.active');
        if (activeBtn.id === 'pendingProjectsBtn') {
            loadProjectsByStatus('pending');
        } else if (activeBtn.id === 'rejectedProjectsBtn') {
            loadProjectsByStatus('rejected');
        }
        
    } catch (error) {
        console.error('Error approving project:', error);
        alert('Error approving project. Please try again.');
    }
};

window.rejectProject = async function(projectId) {
    const reason = prompt('Enter rejection reason (optional):');
    
    try {
        await updateDoc(doc(db, 'projects', projectId), {
            status: 'rejected',
            rejectedAt: new Date().toISOString(),
            rejectionReason: reason || 'No reason provided'
        });
        
        alert('Project rejected successfully!');
        // Reload current view
        const activeBtn = document.querySelector('.nav-btn.active');
        if (activeBtn.id === 'pendingProjectsBtn') {
            loadProjectsByStatus('pending');
        } else if (activeBtn.id === 'approvedProjectsBtn') {
            loadProjectsByStatus('active');
        }
        
    } catch (error) {
        console.error('Error rejecting project:', error);
        alert('Error rejecting project. Please try again.');
    }
};

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}