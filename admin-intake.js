// Admin Intake Management
const ADMIN_EMAIL = 'admin@companeeds.com';

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        if (!requireAuth()) {
            return;
        }
        checkAdminAccess();
        initializeIntakeAdmin();
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

function initializeIntakeAdmin() {
    loadAdminStatistics();
    loadCompanyIntakes();
    setupEmailForm();
}

// Tab switching
function switchTab(tabName) {
    // Update nav tabs
    document.querySelectorAll('.nav-tab').forEach(tab => tab.classList.remove('active'));
    event.target.classList.add('active');
    
    // Update sections
    document.querySelectorAll('.intake-section').forEach(section => section.classList.remove('active'));
    document.getElementById(`${tabName}Section`).classList.add('active');
    
    // Load appropriate data
    switch(tabName) {
        case 'companies':
            loadCompanyIntakes();
            break;
        case 'consultants':
            loadConsultantApplications();
            break;
        case 'matches':
            loadMatchingHistory();
            break;
    }
}

// Load admin statistics
async function loadAdminStatistics() {
    try {
        const [companyIntakes, consultantApps, matches] = await Promise.all([
            firebase.firestore().collection('company_intakes').get(),
            firebase.firestore().collection('consultant_applications').get(),
            firebase.firestore().collection('matches').get()
        ]);
        
        const pendingCompanies = companyIntakes.docs.filter(doc => !doc.data().reviewed).length;
        const pendingConsultants = consultantApps.docs.filter(doc => doc.data().status === 'pending_approval').length;
        const totalMatches = matches.size;
        const successfulMatches = matches.docs.filter(doc => doc.data().status === 'successful').length;
        
        document.getElementById('pendingCompanies').textContent = pendingCompanies;
        document.getElementById('pendingConsultants').textContent = pendingConsultants;
        document.getElementById('totalMatches').textContent = totalMatches;
        document.getElementById('successfulMatches').textContent = successfulMatches;
    } catch (error) {
        console.error('Error loading statistics:', error);
    }
}

// Load company intakes
async function loadCompanyIntakes() {
    const companiesList = document.getElementById('companiesList');
    companiesList.innerHTML = '<div class="loading">Loading company intakes...</div>';
    
    try {
        const snapshot = await firebase.firestore()
            .collection('company_intakes')
            .orderBy('timestamp', 'desc')
            .get();
        
        if (snapshot.empty) {
            companiesList.innerHTML = '<div class="loading">No company intakes found.</div>';
            return;
        }
        
        let html = '';
        snapshot.forEach(doc => {
            const data = doc.data();
            const id = doc.id;
            
            html += `
                <div class="intake-item">
                    <div class="intake-header">
                        <h3>Company Intake</h3>
                        <span class="status-badge status-${data.reviewed ? (data.matched ? 'matched' : 'reviewed') : 'pending'}">
                            ${data.reviewed ? (data.matched ? 'Matched' : 'Reviewed') : 'Pending Review'}
                        </span>
                    </div>
                    <div class="intake-meta">
                        <div class="meta-field">
                            <div class="meta-label">Company Name</div>
                            <div class="meta-value">${escapeHtml(data.responses?.company_name || 'N/A')}</div>
                        </div>
                        <div class="meta-field">
                            <div class="meta-label">Contact Email</div>
                            <div class="meta-value">${escapeHtml(data.responses?.contact_email || 'N/A')}</div>
                        </div>
                        <div class="meta-field">
                            <div class="meta-label">Industry</div>
                            <div class="meta-value">${escapeHtml(data.responses?.industry || 'N/A')}</div>
                        </div>
                        <div class="meta-field">
                            <div class="meta-label">AI Goals</div>
                            <div class="meta-value">${escapeHtml(data.responses?.ai_goals || 'N/A')}</div>
                        </div>
                        <div class="meta-field">
                            <div class="meta-label">Budget</div>
                            <div class="meta-value">${escapeHtml(data.responses?.budget || 'N/A')}</div>
                        </div>
                        <div class="meta-field">
                            <div class="meta-label">Timeline</div>
                            <div class="meta-value">${escapeHtml(data.responses?.timeline || 'N/A')}</div>
                        </div>
                        <div class="meta-field">
                            <div class="meta-label">Challenges</div>
                            <div class="meta-value">${escapeHtml(data.responses?.challenges || 'N/A')}</div>
                        </div>
                        <div class="meta-field">
                            <div class="meta-label">Submitted</div>
                            <div class="meta-value">${new Date(data.timestamp?.toDate() || data.timestamp).toLocaleDateString()}</div>
                        </div>
                    </div>
                    <div class="intake-actions">
                        ${!data.reviewed ? `
                            <button class="btn btn-primary" onclick="markAsReviewed('${id}', 'company_intakes')">
                                Mark as Reviewed
                            </button>
                        ` : ''}
                        ${data.reviewed && !data.matched ? `
                            <button class="btn btn-success" onclick="createMatch('${id}', 'company')">
                                Create Match
                            </button>
                        ` : ''}
                        <button class="btn btn-secondary" onclick="sendEmail('${data.responses?.contact_email || ''}', 'company')">
                            Send Email
                        </button>
                    </div>
                </div>
            `;
        });
        
        companiesList.innerHTML = html;
    } catch (error) {
        console.error('Error loading company intakes:', error);
        companiesList.innerHTML = '<div class="loading">Error loading company intakes.</div>';
    }
}

// Load consultant applications
async function loadConsultantApplications() {
    const consultantsList = document.getElementById('consultantsList');
    consultantsList.innerHTML = '<div class="loading">Loading consultant applications...</div>';
    
    try {
        const snapshot = await firebase.firestore()
            .collection('consultant_applications')
            .orderBy('timestamp', 'desc')
            .get();
        
        if (snapshot.empty) {
            consultantsList.innerHTML = '<div class="loading">No consultant applications found.</div>';
            return;
        }
        
        let html = '';
        snapshot.forEach(doc => {
            const data = doc.data();
            const id = doc.id;
            
            html += `
                <div class="intake-item">
                    <div class="intake-header">
                        <h3>Consultant Application</h3>
                        <span class="status-badge status-${data.status?.replace('_', '-') || 'pending'}">
                            ${data.status?.replace('_', ' ').toUpperCase() || 'PENDING'}
                        </span>
                    </div>
                    <div class="intake-meta">
                        <div class="meta-field">
                            <div class="meta-label">Full Name</div>
                            <div class="meta-value">${escapeHtml(data.responses?.full_name || 'N/A')}</div>
                        </div>
                        <div class="meta-field">
                            <div class="meta-label">Email</div>
                            <div class="meta-value">${escapeHtml(data.responses?.email || 'N/A')}</div>
                        </div>
                        <div class="meta-field">
                            <div class="meta-label">Location</div>
                            <div class="meta-value">${escapeHtml(data.responses?.location || 'N/A')}</div>
                        </div>
                        <div class="meta-field">
                            <div class="meta-label">Experience</div>
                            <div class="meta-value">${escapeHtml(data.responses?.experience || 'N/A')}</div>
                        </div>
                        <div class="meta-field">
                            <div class="meta-label">Specialties</div>
                            <div class="meta-value">${escapeHtml(data.responses?.specialties || 'N/A')}</div>
                        </div>
                        <div class="meta-field">
                            <div class="meta-label">Tools</div>
                            <div class="meta-value">${escapeHtml(data.responses?.tools || 'N/A')}</div>
                        </div>
                        <div class="meta-field">
                            <div class="meta-label">Industries</div>
                            <div class="meta-value">${escapeHtml(data.responses?.industries || 'N/A')}</div>
                        </div>
                        <div class="meta-field">
                            <div class="meta-label">Rates</div>
                            <div class="meta-value">${escapeHtml(data.responses?.rates || 'N/A')}</div>
                        </div>
                        <div class="meta-field">
                            <div class="meta-label">Availability</div>
                            <div class="meta-value">${escapeHtml(data.responses?.availability || 'N/A')}</div>
                        </div>
                        <div class="meta-field">
                            <div class="meta-label">Submitted</div>
                            <div class="meta-value">${new Date(data.timestamp?.toDate() || data.timestamp).toLocaleDateString()}</div>
                        </div>
                    </div>
                    <div class="intake-actions">
                        ${data.status === 'pending_approval' ? `
                            <button class="btn btn-success" onclick="approveConsultant('${id}')">
                                Approve
                            </button>
                            <button class="btn btn-danger" onclick="rejectConsultant('${id}')">
                                Reject
                            </button>
                        ` : ''}
                        <button class="btn btn-secondary" onclick="sendEmail('${data.responses?.email || ''}', 'consultant')">
                            Send Email
                        </button>
                    </div>
                </div>
            `;
        });
        
        consultantsList.innerHTML = html;
    } catch (error) {
        console.error('Error loading consultant applications:', error);
        consultantsList.innerHTML = '<div class="loading">Error loading consultant applications.</div>';
    }
}

// Load matching history
async function loadMatchingHistory() {
    const matchesList = document.getElementById('matchesList');
    matchesList.innerHTML = '<div class="loading">Loading matching history...</div>';
    
    try {
        const snapshot = await firebase.firestore()
            .collection('matches')
            .orderBy('timestamp', 'desc')
            .get();
        
        if (snapshot.empty) {
            matchesList.innerHTML = '<div class="loading">No matches found.</div>';
            return;
        }
        
        let html = '';
        snapshot.forEach(doc => {
            const data = doc.data();
            const id = doc.id;
            
            html += `
                <div class="intake-item">
                    <div class="intake-header">
                        <h3>Match Record</h3>
                        <span class="status-badge status-${data.status || 'pending'}">
                            ${(data.status || 'pending').replace('_', ' ').toUpperCase()}
                        </span>
                    </div>
                    <div class="intake-meta">
                        <div class="meta-field">
                            <div class="meta-label">Company</div>
                            <div class="meta-value">${escapeHtml(data.company_name || 'N/A')}</div>
                        </div>
                        <div class="meta-field">
                            <div class="meta-label">Consultant</div>
                            <div class="meta-value">${escapeHtml(data.consultant_name || 'N/A')}</div>
                        </div>
                        <div class="meta-field">
                            <div class="meta-label">Match Date</div>
                            <div class="meta-value">${new Date(data.timestamp?.toDate() || data.timestamp).toLocaleDateString()}</div>
                        </div>
                        <div class="meta-field">
                            <div class="meta-label">Project Value</div>
                            <div class="meta-value">${escapeHtml(data.project_value || 'N/A')}</div>
                        </div>
                    </div>
                    <div class="intake-actions">
                        ${data.status === 'pending' ? `
                            <button class="btn btn-success" onclick="markMatchSuccessful('${id}')">
                                Mark Successful
                            </button>
                        ` : ''}
                        <button class="btn btn-secondary" onclick="followUpMatch('${id}')">
                            Follow Up
                        </button>
                    </div>
                </div>
            `;
        });
        
        matchesList.innerHTML = html;
    } catch (error) {
        console.error('Error loading matching history:', error);
        matchesList.innerHTML = '<div class="loading">Error loading matching history.</div>';
    }
}

// Admin actions
async function markAsReviewed(id, collection) {
    try {
        await firebase.firestore().collection(collection).doc(id).update({
            reviewed: true,
            reviewedAt: new Date()
        });
        
        // Reload the appropriate section
        if (collection === 'company_intakes') {
            loadCompanyIntakes();
        }
        loadAdminStatistics();
    } catch (error) {
        console.error('Error marking as reviewed:', error);
        alert('Error updating status. Please try again.');
    }
}

async function approveConsultant(id) {
    try {
        await firebase.firestore().collection('consultant_applications').doc(id).update({
            status: 'approved',
            approvedAt: new Date()
        });
        
        loadConsultantApplications();
        loadAdminStatistics();
        
        // Send approval email
        const doc = await firebase.firestore().collection('consultant_applications').doc(id).get();
        const email = doc.data().responses?.email;
        if (email) {
            sendEmail(email, 'consultant', 'Congratulations! Your Companeeds application has been approved.');
        }
    } catch (error) {
        console.error('Error approving consultant:', error);
        alert('Error approving consultant. Please try again.');
    }
}

async function rejectConsultant(id) {
    try {
        await firebase.firestore().collection('consultant_applications').doc(id).update({
            status: 'rejected',
            rejectedAt: new Date()
        });
        
        loadConsultantApplications();
        loadAdminStatistics();
    } catch (error) {
        console.error('Error rejecting consultant:', error);
        alert('Error rejecting consultant. Please try again.');
    }
}

async function createMatch(companyIntakeId, type) {
    // This would open a modal to select consultants and create matches
    // For now, just mark as matched
    try {
        await firebase.firestore().collection('company_intakes').doc(companyIntakeId).update({
            matched: true,
            matchedAt: new Date()
        });
        
        loadCompanyIntakes();
        loadAdminStatistics();
        alert('Match created successfully!');
    } catch (error) {
        console.error('Error creating match:', error);
        alert('Error creating match. Please try again.');
    }
}

async function markMatchSuccessful(matchId) {
    try {
        await firebase.firestore().collection('matches').doc(matchId).update({
            status: 'successful',
            completedAt: new Date()
        });
        
        loadMatchingHistory();
        loadAdminStatistics();
    } catch (error) {
        console.error('Error marking match successful:', error);
        alert('Error updating match status. Please try again.');
    }
}

// Email functionality
function sendEmail(email, type, defaultSubject = '') {
    document.getElementById('emailTo').value = email;
    document.getElementById('emailSubject').value = defaultSubject;
    document.getElementById('emailMessage').value = '';
    
    const title = type === 'company' ? 'Email Company' : 'Email Consultant';
    document.getElementById('emailModalTitle').textContent = title;
    
    document.getElementById('emailModal').classList.remove('hidden');
}

function closeEmailModal() {
    document.getElementById('emailModal').classList.add('hidden');
}

function setupEmailForm() {
    document.getElementById('emailForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const to = document.getElementById('emailTo').value;
        const subject = document.getElementById('emailSubject').value;
        const message = document.getElementById('emailMessage').value;
        
        // Here you would integrate with your email service (SendGrid, etc.)
        console.log('Sending email:', { to, subject, message });
        
        alert('Email functionality would be integrated with SendGrid or similar service.');
        closeEmailModal();
    });
}

function followUpMatch(matchId) {
    // Follow-up functionality for tracking project progress
    alert('Follow-up functionality would track project progress and satisfaction.');
}

async function handleLogout() {
    try {
        await firebase.auth().signOut();
        window.location.href = 'index.html';
    } catch (error) {
        console.error('Error signing out:', error);
    }
}

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