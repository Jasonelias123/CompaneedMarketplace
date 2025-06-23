import { auth, db } from './firebase-config.js';
import { getCurrentUser, requireAuth } from './auth.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { 
    collection, 
    addDoc, 
    query, 
    where, 
    orderBy, 
    getDocs,
    doc,
    getDoc,
    onSnapshot,
    serverTimestamp,
    updateDoc
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

let currentConversation = null;
let messagesListener = null;

// Initialize messages page
document.addEventListener('DOMContentLoaded', function() {
    // Check authentication for this page specifically
    const unsubscribe = onAuthStateChanged(auth, (user) => {
        if (!user) {
            window.location.href = 'login.html';
            return;
        }
        
        // User is authenticated, initialize messages
        initializeMessages();
        unsubscribe(); // Stop listening after initial check
    });
});

function initializeMessages() {
    loadConversations();
    setupMessageForm();
    setupReportForm();
}

// Load conversations for current user
async function loadConversations() {
    const user = getCurrentUser();
    if (!user) return;

    const conversationsList = document.getElementById('conversationsList');
    conversationsList.innerHTML = '<div class="loading">Loading conversations...</div>';

    try {
        // Get user role to determine how to fetch conversations
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        const userRole = userDoc.exists() ? userDoc.data().role : null;

        let conversations = [];

        if (userRole === 'company') {
            // For companies: get conversations from their projects
            const projectsQuery = query(
                collection(db, 'projects'),
                where('companyId', '==', user.uid)
            );
            const projectsSnapshot = await getDocs(projectsQuery);

            for (const projectDoc of projectsSnapshot.docs) {
                const projectData = projectDoc.data();
                
                // Get applications for this project
                const applicationsQuery = query(
                    collection(db, 'projects', projectDoc.id, 'applications'),
                    where('status', 'in', ['accepted', 'in_progress'])
                );
                const applicationsSnapshot = await getDocs(applicationsQuery);

                applicationsSnapshot.forEach(appDoc => {
                    const appData = appDoc.data();
                    conversations.push({
                        id: `${projectDoc.id}_${appData.developerUid}`,
                        projectId: projectDoc.id,
                        projectTitle: projectData.title,
                        otherUserId: appData.developerUid,
                        otherUserName: appData.developerName,
                        type: 'company_to_developer',
                        lastActivity: appData.lastMessageTime || appData.timestamp,
                        projectStatus: projectData.projectStatus || 'Open'
                    });
                });
            }
        } else if (userRole === 'developer') {
            // For developers: get conversations from accepted applications
            const applicationsQuery = query(
                collection(db, 'projectApplications'),
                where('developerUid', '==', user.uid),
                where('status', 'in', ['accepted', 'in_progress'])
            );
            const applicationsSnapshot = await getDocs(applicationsQuery);

            for (const appDoc of applicationsSnapshot.docs) {
                const appData = appDoc.data();
                
                // Get project details
                const projectDoc = await getDoc(doc(db, 'projects', appData.projectId));
                if (projectDoc.exists()) {
                    const projectData = projectDoc.data();
                    conversations.push({
                        id: `${appData.projectId}_${user.uid}`,
                        projectId: appData.projectId,
                        projectTitle: projectData.title,
                        otherUserId: projectData.companyId,
                        otherUserName: projectData.companyEmail.split('@')[0],
                        type: 'developer_to_company',
                        lastActivity: appData.lastMessageTime || appData.timestamp,
                        projectStatus: projectData.projectStatus || 'Open'
                    });
                }
            }
        }

        displayConversations(conversations);
        
    } catch (error) {
        console.error('Error loading conversations:', error);
        conversationsList.innerHTML = '<div class="error-message">Failed to load conversations</div>';
    }
}

// Display conversations list
function displayConversations(conversations) {
    const conversationsList = document.getElementById('conversationsList');
    
    if (conversations.length === 0) {
        conversationsList.innerHTML = `
            <div class="no-conversations">
                <h4>No Conversations</h4>
                <p>You don't have any active project conversations yet.</p>
            </div>
        `;
        return;
    }

    // Sort by last activity
    conversations.sort((a, b) => (b.lastActivity || 0) - (a.lastActivity || 0));

    const conversationsHTML = conversations.map(conv => {
        const lastActivityDate = conv.lastActivity ? 
            new Date(conv.lastActivity).toLocaleDateString() : 
            'No recent activity';

        return `
            <div class="conversation-item" onclick="openConversation('${conv.id}', ${JSON.stringify(conv).replace(/"/g, '&quot;')})">
                <div class="conversation-info">
                    <h4>${escapeHtml(conv.projectTitle)}</h4>
                    <p class="conversation-partner">with ${escapeHtml(conv.otherUserName)}</p>
                    <span class="conversation-date">${lastActivityDate}</span>
                </div>
                <div class="conversation-status">
                    <span class="status-badge status-${conv.projectStatus.toLowerCase().replace(' ', '-')}">${conv.projectStatus}</span>
                </div>
            </div>
        `;
    }).join('');

    conversationsList.innerHTML = conversationsHTML;
}

// Open conversation
window.openConversation = function(conversationId, conversationData) {
    currentConversation = conversationData;
    
    // Hide no chat selected, show chat container
    document.getElementById('noChatSelected').style.display = 'none';
    document.getElementById('chatContainer').style.display = 'flex';
    
    // Update chat header
    document.getElementById('chatTitle').textContent = conversationData.projectTitle;
    document.getElementById('chatSubtitle').textContent = `Conversation with ${conversationData.otherUserName}`;
    
    // Load messages for this conversation
    loadMessages(conversationId);
}

// Load messages for conversation
function loadMessages(conversationId) {
    const messagesContainer = document.getElementById('messagesContainer');
    messagesContainer.innerHTML = '<div class="loading">Loading messages...</div>';

    // Clean up previous listener
    if (messagesListener) {
        messagesListener();
    }

    const messagesQuery = query(
        collection(db, 'conversations', conversationId, 'messages'),
        orderBy('timestamp', 'asc')
    );

    messagesListener = onSnapshot(messagesQuery, (snapshot) => {
        const messages = [];
        snapshot.forEach(doc => {
            messages.push({ id: doc.id, ...doc.data() });
        });

        displayMessages(messages);
    }, (error) => {
        console.error('Error loading messages:', error);
        messagesContainer.innerHTML = '<div class="error-message">Failed to load messages</div>';
    });
}

// Display messages
function displayMessages(messages) {
    const messagesContainer = document.getElementById('messagesContainer');
    const user = getCurrentUser();

    if (messages.length === 0) {
        messagesContainer.innerHTML = `
            <div class="no-messages">
                <h4>Start the Conversation</h4>
                <p>Send your first message to begin collaborating on this project.</p>
            </div>
        `;
        return;
    }

    const messagesHTML = messages.map(message => {
        const isOwnMessage = message.senderId === user.uid;
        const messageTime = message.timestamp ? 
            new Date(message.timestamp.toDate()).toLocaleString() : 
            'Sending...';

        return `
            <div class="message ${isOwnMessage ? 'own-message' : 'other-message'}">
                <div class="message-content">
                    <p>${escapeHtml(message.content)}</p>
                    ${message.filtered ? '<div class="message-warning">⚠️ This message was filtered for policy violations</div>' : ''}
                </div>
                <div class="message-meta">
                    <span class="message-sender">${escapeHtml(message.senderName)}</span>
                    <span class="message-time">${messageTime}</span>
                </div>
            </div>
        `;
    }).join('');

    messagesContainer.innerHTML = messagesHTML;
    
    // Scroll to bottom
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Setup message form
function setupMessageForm() {
    const messageForm = document.getElementById('messageForm');
    messageForm.addEventListener('submit', handleMessageSubmission);
}

// Handle message submission
async function handleMessageSubmission(event) {
    event.preventDefault();
    
    if (!currentConversation) return;
    
    const user = getCurrentUser();
    if (!user) return;

    const messageInput = document.getElementById('messageInput');
    const messageContent = messageInput.value.trim();

    if (!messageContent) return;

    try {
        // Filter message for contact information
        const filteredContent = filterContactInformation(messageContent);
        const isFiltered = filteredContent !== messageContent;

        // Create message data
        const messageData = {
            senderId: user.uid,
            senderName: user.displayName || user.email.split('@')[0],
            content: filteredContent,
            timestamp: serverTimestamp(),
            filtered: isFiltered,
            conversationId: currentConversation.id,
            projectId: currentConversation.projectId
        };

        // Add message to conversation
        await addDoc(collection(db, 'conversations', currentConversation.id, 'messages'), messageData);

        // Update last activity timestamp
        const conversationRef = doc(db, 'conversations', currentConversation.id);
        await updateDoc(conversationRef, {
            lastActivity: serverTimestamp(),
            lastMessage: filteredContent.substring(0, 100)
        });

        // Clear input
        messageInput.value = '';

        // Show warning if message was filtered
        if (isFiltered) {
            showMessageWarning('Your message contained contact information which has been filtered for security purposes.');
        }

    } catch (error) {
        console.error('Error sending message:', error);
        alert('Failed to send message. Please try again.');
    }
}

// Filter contact information from messages
function filterContactInformation(content) {
    // Email regex
    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
    
    // Phone number regex (various formats)
    const phoneRegex = /(\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/g;
    
    // URL regex for external links
    const urlRegex = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/g;
    
    // Common contact-sharing phrases
    const contactPhrases = [
        /contact me at/gi,
        /reach me at/gi,
        /email me/gi,
        /call me/gi,
        /text me/gi,
        /whatsapp/gi,
        /telegram/gi,
        /discord/gi,
        /skype/gi
    ];

    let filtered = content;

    // Filter emails
    filtered = filtered.replace(emailRegex, '[EMAIL FILTERED]');
    
    // Filter phone numbers
    filtered = filtered.replace(phoneRegex, '[PHONE FILTERED]');
    
    // Filter URLs
    filtered = filtered.replace(urlRegex, '[LINK FILTERED]');
    
    // Filter contact phrases
    contactPhrases.forEach(phrase => {
        filtered = filtered.replace(phrase, '[CONTACT REQUEST FILTERED]');
    });

    return filtered;
}

// Show message warning
function showMessageWarning(message) {
    const warningDiv = document.createElement('div');
    warningDiv.className = 'message-filter-warning';
    warningDiv.innerHTML = `
        <div class="warning-content">
            <span class="warning-icon">⚠️</span>
            <span>${message}</span>
        </div>
    `;
    
    document.body.appendChild(warningDiv);
    
    setTimeout(() => {
        warningDiv.remove();
    }, 5000);
}

// Setup report form
function setupReportForm() {
    const reportForm = document.getElementById('reportForm');
    reportForm.addEventListener('submit', handleReportSubmission);
    
    document.getElementById('reportBtn').addEventListener('click', () => {
        document.getElementById('reportModal').style.display = 'block';
    });
}

// Handle report submission
async function handleReportSubmission(event) {
    event.preventDefault();
    
    if (!currentConversation) return;
    
    const user = getCurrentUser();
    if (!user) return;

    const formData = new FormData(event.target);
    const reportData = {
        reporterId: user.uid,
        reporterEmail: user.email,
        conversationId: currentConversation.id,
        projectId: currentConversation.projectId,
        reason: formData.get('reportReason'),
        description: formData.get('reportDescription'),
        timestamp: serverTimestamp(),
        status: 'pending'
    };

    try {
        await addDoc(collection(db, 'reports'), reportData);
        
        alert('Report submitted successfully. Our team will review it shortly.');
        closeReportModal();
        
    } catch (error) {
        console.error('Error submitting report:', error);
        alert('Failed to submit report. Please try again.');
    }
}

// Close report modal
window.closeReportModal = function() {
    document.getElementById('reportModal').style.display = 'none';
    document.getElementById('reportForm').reset();
}

// Utility function to escape HTML
function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, function(m) { return map[m]; });
}