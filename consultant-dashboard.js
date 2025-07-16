// Consultant Dashboard JavaScript

import { 
    initializeApp 
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';

import { 
    getAuth,
    onAuthStateChanged, 
    signOut 
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';

import { 
    getFirestore,
    doc, 
    getDoc, 
    collection, 
    query, 
    where, 
    orderBy, 
    getDocs,
    updateDoc 
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

// Firebase initialization
const firebaseConfig = {
    apiKey: window.VITE_FIREBASE_API_KEY,
    authDomain: `${window.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
    projectId: window.VITE_FIREBASE_PROJECT_ID,
    storageBucket: `${window.VITE_FIREBASE_PROJECT_ID}.firebasestorage.app`,
    appId: window.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Global state
let currentUser = null;
let currentTab = 'overview';
let consultantData = null;
let projectsData = [];

// Initialize dashboard
document.addEventListener('DOMContentLoaded', function() {
    // Check authentication
    onAuthStateChanged(auth, (user) => {
        if (user) {
            currentUser = user;
            initializeDashboard();
        } else {
            // Redirect to login if not authenticated
            window.location.href = 'login.html';
        }
    });
});

// Initialize dashboard data
async function initializeDashboard() {
    try {
        // Load consultant profile
        await loadConsultantProfile();
        
        // Load projects data
        await loadProjectsData();
        
        // Update UI with data
        updateDashboardUI();
        
        // Load tab-specific content
        loadTabContent(currentTab);
        
    } catch (error) {
        console.error('Error initializing dashboard:', error);
        showError('Failed to load dashboard data');
    }
}

// Load consultant profile from Firestore
async function loadConsultantProfile() {
    try {
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists()) {
            const userData = userDoc.data();
            
            // Only allow approved consultants
            if (userData.role !== 'developer' || userData.status !== 'approved') {
                window.location.href = 'developer-pending.html';
                return;
            }
            
            consultantData = userData;
        } else {
            throw new Error('User profile not found');
        }
    } catch (error) {
        console.error('Error loading consultant profile:', error);
        throw error;
    }
}

// Load projects data
async function loadProjectsData() {
    try {
        // Load projects where consultant is assigned
        const projectsQuery = query(
            collection(db, 'projects'),
            where('assignedConsultant', '==', currentUser.uid),
            orderBy('createdAt', 'desc')
        );
        
        const projectsSnapshot = await getDocs(projectsQuery);
        projectsData = projectsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        
    } catch (error) {
        console.error('Error loading projects:', error);
        // Continue with empty projects array
        projectsData = [];
    }
}

// Update dashboard UI with loaded data
function updateDashboardUI() {
    // Update consultant name
    const name = consultantData?.fullName || consultantData?.name || 'Consultant';
    document.getElementById('consultantName').textContent = name;
    
    // Update header stats
    const totalProjects = projectsData.length;
    const activeProjects = projectsData.filter(p => p.status === 'active' || p.status === 'in-progress').length;
    const completedProjects = projectsData.filter(p => p.status === 'completed').length;
    
    document.getElementById('totalProjects').textContent = totalProjects;
    document.getElementById('activeProjects').textContent = activeProjects;
    document.getElementById('completedProjects').textContent = completedProjects;
    
    // Calculate and update performance metrics
    updatePerformanceMetrics();
}

// Update performance metrics
function updatePerformanceMetrics() {
    const completedProjects = projectsData.filter(p => p.status === 'completed');
    
    // Success rate (completed / total)
    const successRate = projectsData.length > 0 
        ? Math.round((completedProjects.length / projectsData.length) * 100)
        : 0;
    document.getElementById('successRate').textContent = `${successRate}%`;
    
    // Average rating
    const ratedProjects = completedProjects.filter(p => p.consultantRating);
    const avgRating = ratedProjects.length > 0
        ? (ratedProjects.reduce((sum, p) => sum + p.consultantRating, 0) / ratedProjects.length).toFixed(1)
        : 'N/A';
    document.getElementById('avgRating').textContent = avgRating === 'N/A' ? avgRating : `${avgRating}/5`;
    
    // Total earnings
    const totalEarnings = completedProjects.reduce((sum, p) => sum + (p.consultantFee || 0), 0);
    document.getElementById('totalEarnings').textContent = formatCurrency(totalEarnings);
}

// Tab switching
function switchTab(tabName) {
    // Update active tab button
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    
    // Update active tab pane
    document.querySelectorAll('.tab-pane').forEach(pane => {
        pane.classList.remove('active');
    });
    document.getElementById(`${tabName}-tab`).classList.add('active');
    
    currentTab = tabName;
    loadTabContent(tabName);
}

// Load content for specific tab
function loadTabContent(tabName) {
    switch (tabName) {
        case 'overview':
            loadOverviewContent();
            break;
        case 'profile':
            loadProfileContent();
            break;
        case 'projects':
            loadProjectsContent();
            break;
        case 'earnings':
            loadEarningsContent();
            break;
    }
}

// Load overview tab content
function loadOverviewContent() {
    // Load recent projects (last 3)
    const recentProjects = projectsData.slice(0, 3);
    const recentProjectsContainer = document.getElementById('recentProjects');
    
    if (recentProjects.length === 0) {
        recentProjectsContainer.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">
                    <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
                        <path d="M16 16h32v32H16z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        <path d="M24 24h16M24 32h12M24 40h8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                    </svg>
                </div>
                <p>No projects yet. Your first project will appear here once assigned.</p>
            </div>
        `;
    } else {
        recentProjectsContainer.innerHTML = recentProjects.map(project => `
            <div class="project-item">
                <div class="project-header">
                    <h4 class="project-title">${escapeHtml(project.title || 'Untitled Project')}</h4>
                    <span class="project-status ${project.status || 'pending'}">${getStatusText(project.status)}</span>
                </div>
                <p class="project-company">${escapeHtml(project.companyName || 'Unknown Company')}</p>
                <p class="project-description">${escapeHtml(truncateText(project.description || 'No description available', 100))}</p>
            </div>
        `).join('');
    }
}

// Load profile tab content
function loadProfileContent() {
    if (!consultantData) return;
    
    // Update profile information
    const name = consultantData.fullName || consultantData.name || 'Consultant';
    document.getElementById('profileName').textContent = name;
    document.getElementById('profileEmail').textContent = consultantData.email || 'N/A';
    document.getElementById('profileLocation').textContent = consultantData.location || 'N/A';
    document.getElementById('profileSpecialties').textContent = consultantData.aiTools || consultantData.specialties || 'N/A';
    document.getElementById('profileBio').textContent = consultantData.bio || 'No bio available';
    
    // Update member since date
    const memberSince = consultantData.createdAt 
        ? new Date(consultantData.createdAt.seconds * 1000).toLocaleDateString()
        : 'N/A';
    document.getElementById('memberSince').textContent = memberSince;
    
    // Update avatar
    const avatarElement = document.getElementById('avatarPlaceholder');
    const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    avatarElement.textContent = initials;
}

// Load projects tab content
function loadProjectsContent() {
    const projectsList = document.getElementById('projectsList');
    const filteredProjects = getFilteredProjects();
    
    if (filteredProjects.length === 0) {
        projectsList.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">
                    <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
                        <path d="M16 16h32v32H16z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        <path d="M24 24h16M24 32h12M24 40h8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                    </svg>
                </div>
                <p>No projects match the selected filter.</p>
            </div>
        `;
    } else {
        projectsList.innerHTML = filteredProjects.map(project => `
            <div class="project-card">
                <div class="project-card-header">
                    <div class="project-meta">
                        <h3 class="project-card-title">${escapeHtml(project.title || 'Untitled Project')}</h3>
                        <p class="project-card-company">${escapeHtml(project.companyName || 'Unknown Company')}</p>
                    </div>
                    <div class="project-dates">
                        <div class="project-status ${project.status || 'pending'}">${getStatusText(project.status)}</div>
                        <div style="margin-top: 8px; font-size: 12px;">
                            ${formatProjectDate(project.createdAt)}
                        </div>
                    </div>
                </div>
                <p class="project-card-description">
                    ${escapeHtml(project.description || 'No description available')}
                </p>
                <div class="project-card-footer">
                    <div class="project-earnings">
                        ${project.consultantFee ? formatCurrency(project.consultantFee) : 'Fee TBD'}
                    </div>
                    <div>
                        ${project.status === 'completed' && project.consultantRating 
                            ? `<span style="color: var(--color-accent-orange);">★ ${project.consultantRating}/5</span>`
                            : ''
                        }
                    </div>
                </div>
            </div>
        `).join('');
    }
}

// Load earnings tab content
function loadEarningsContent() {
    const completedProjects = projectsData.filter(p => p.status === 'completed' && p.consultantFee);
    
    // Calculate earnings by period
    const now = new Date();
    const thisMonth = completedProjects.filter(p => {
        const projectDate = new Date(p.completedAt?.seconds * 1000 || p.createdAt?.seconds * 1000);
        return projectDate.getMonth() === now.getMonth() && projectDate.getFullYear() === now.getFullYear();
    });
    
    const thisYear = completedProjects.filter(p => {
        const projectDate = new Date(p.completedAt?.seconds * 1000 || p.createdAt?.seconds * 1000);
        return projectDate.getFullYear() === now.getFullYear();
    });
    
    const monthlyTotal = thisMonth.reduce((sum, p) => sum + (p.consultantFee || 0), 0);
    const yearlyTotal = thisYear.reduce((sum, p) => sum + (p.consultantFee || 0), 0);
    const lifetimeTotal = completedProjects.reduce((sum, p) => sum + (p.consultantFee || 0), 0);
    
    document.getElementById('monthlyEarnings').textContent = formatCurrency(monthlyTotal);
    document.getElementById('yearlyEarnings').textContent = formatCurrency(yearlyTotal);
    document.getElementById('lifetimeEarnings').textContent = formatCurrency(lifetimeTotal);
    
    // Load earnings history
    const earningsHistory = document.getElementById('earningsHistory');
    
    if (completedProjects.length === 0) {
        earningsHistory.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">
                    <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
                        <path d="M32 16v32M24 24h16M24 40h16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                    </svg>
                </div>
                <p>No earnings history yet. Complete projects to see earnings here.</p>
            </div>
        `;
    } else {
        earningsHistory.innerHTML = `
            <h4 style="margin-bottom: 16px; color: var(--color-gray-900);">Recent Earnings</h4>
            ${completedProjects.slice(0, 10).map(project => `
                <div class="earnings-item">
                    <div>
                        <div class="earnings-project">${escapeHtml(project.title || 'Untitled Project')}</div>
                        <div class="earnings-date">${formatProjectDate(project.completedAt || project.createdAt)}</div>
                    </div>
                    <div class="earnings-amount-small">${formatCurrency(project.consultantFee || 0)}</div>
                </div>
            `).join('')}
        `;
    }
}

// Filter projects based on selected filter
function filterProjects() {
    loadProjectsContent();
}

function getFilteredProjects() {
    const filter = document.getElementById('projectFilter')?.value || 'all';
    
    if (filter === 'all') {
        return projectsData;
    }
    
    return projectsData.filter(project => {
        switch (filter) {
            case 'active':
                return project.status === 'active' || project.status === 'in-progress';
            case 'completed':
                return project.status === 'completed';
            case 'cancelled':
                return project.status === 'cancelled';
            default:
                return true;
        }
    });
}

// Edit profile function
function editProfile() {
    // For now, show alert - could implement modal in future
    alert('Profile editing feature coming soon. Please contact support to update your profile.');
}

// Logout function
async function handleLogout() {
    try {
        await signOut(auth);
        window.location.href = 'index.html';
    } catch (error) {
        console.error('Error signing out:', error);
        showError('Failed to sign out');
    }
}

// Utility functions
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function truncateText(text, maxLength) {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(amount || 0);
}

function formatProjectDate(timestamp) {
    if (!timestamp) return 'Date unknown';
    
    const date = timestamp.seconds 
        ? new Date(timestamp.seconds * 1000)
        : new Date(timestamp);
    
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function getStatusText(status) {
    const statusMap = {
        'pending': 'Pending',
        'active': 'Active',
        'in-progress': 'In Progress', 
        'completed': 'Completed',
        'cancelled': 'Cancelled',
        'on-hold': 'On Hold'
    };
    
    return statusMap[status] || 'Unknown';
}

function showError(message) {
    // Simple error display - could be enhanced with toast notifications
    console.error(message);
    alert(message);
}

// Make functions available globally
window.switchTab = switchTab;
window.filterProjects = filterProjects;
window.editProfile = editProfile;
window.handleLogout = handleLogout;