import { auth, db } from './firebase-config.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { handleLogout } from './auth.js';
import { 
    collection, 
    doc, 
    addDoc,
    getDoc,
    getDocs,
    query, 
    where, 
    orderBy, 
    limit,
    onSnapshot,
    updateDoc,
    serverTimestamp 
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

let currentUser = null;
let currentConversationId = null;
let unsubscribeMessages = null;

// Auth state monitoring
onAuthStateChanged(auth, async (user) => {
    currentUser = user;
    if (user) {
        document.getElementById('userEmail').textContent = user.email;
        await loadConversations();
    } else {
        window.location.href = 'login.html';
    }
});

// Load conversations for current user
async function loadConversations() {
    const conversationsList = document.getElementById('conversationsList');
    
    try {
        conversationsList.innerHTML = '<div class="loading">Loading conversations...</div>';
        
        // Get conversations where user is a participant
        const conversationsQuery = query(
            collection(db, 'conversations'),
            where('participants', 'array-contains', currentUser.uid),
            orderBy('lastMessageAt', 'desc')
        );
        
        const snapshot = await getDocs(conversationsQuery);
        
        if (snapshot.empty) {
            conversationsList.innerHTML = `
                <div class="no-conversations">
                    <p>No conversations yet</p>
                    <small>Conversations start when you apply to projects or receive applications</small>
                </div>
            `;
            return;
        }
        
        const conversationsHTML = await Promise.all(
            snapshot.docs.map(async (docSnapshot) => {
                const conversation = docSnapshot.data();
                const conversationId = docSnapshot.id;
                
                // Get other participant info
                const otherParticipantId = conversation.participants.find(id => id !== currentUser.uid);
                const otherUserDoc = await getDoc(doc(db, 'users', otherParticipantId));
                const otherUser = otherUserDoc.exists() ? otherUserDoc.data() : { displayName: 'Unknown User' };
                
                // Get unread count
                const unreadCount = conversation.unreadCount?.[currentUser.uid] || 0;
                
                return `
                    <div class="conversation-item ${unreadCount > 0 ? 'unread' : ''}" 
                         onclick="selectConversation('${conversationId}')">
                        <div class="conversation-info">
                            <h4>${conversation.projectTitle || 'Project Discussion'}</h4>
                            <p class="conversation-participant">${otherUser.displayName || otherUser.email}</p>
                            <p class="last-message">${conversation.lastMessage || 'No messages yet'}</p>
                        </div>
                        <div class="conversation-meta">
                            <span class="conversation-time">${formatTime(conversation.lastMessageAt)}</span>
                            ${unreadCount > 0 ? `<span class="unread-badge">${unreadCount}</span>` : ''}
                        </div>
                    </div>
                `;
            })
        );
        
        conversationsList.innerHTML = conversationsHTML.join('');
        
    } catch (error) {
        console.error('Error loading conversations:', error);
        conversationsList.innerHTML = '<div class="error">Error loading conversations</div>';
    }
}

// Select and load a conversation
window.selectConversation = async function(conversationId) {
    currentConversationId = conversationId;
    
    // Update UI
    document.querySelector('.conversation-header').style.display = 'flex';
    document.querySelector('.no-conversation').style.display = 'none';
    document.getElementById('messageInputContainer').style.display = 'block';
    
    // Unsubscribe from previous messages listener
    if (unsubscribeMessages) {
        unsubscribeMessages();
    }
    
    try {
        // Get conversation details
        const conversationDoc = await getDoc(doc(db, 'conversations', conversationId));
        const conversation = conversationDoc.data();
        
        // Update header
        document.getElementById('conversationTitle').textContent = conversation.projectTitle || 'Project Discussion';
        document.getElementById('conversationProject').textContent = `Project: ${conversation.projectTitle}`;
        
        // Mark conversation as read
        await updateDoc(doc(db, 'conversations', conversationId), {
            [`unreadCount.${currentUser.uid}`]: 0
        });
        
        // Load messages with real-time updates
        loadMessages(conversationId);
        
        // Update conversation item to remove unread indicator
        const conversationItem = document.querySelector(`[onclick="selectConversation('${conversationId}')"]`);
        if (conversationItem) {
            conversationItem.classList.remove('unread');
            const unreadBadge = conversationItem.querySelector('.unread-badge');
            if (unreadBadge) unreadBadge.remove();
        }
        
    } catch (error) {
        console.error('Error loading conversation:', error);
    }
};

// Load messages for current conversation
function loadMessages(conversationId) {
    const messagesContainer = document.getElementById('messagesContainer');
    
    // Set up real-time listener
    const messagesQuery = query(
        collection(db, 'conversations', conversationId, 'messages'),
        orderBy('timestamp', 'asc')
    );
    
    unsubscribeMessages = onSnapshot(messagesQuery, (snapshot) => {
        const messages = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        
        displayMessages(messages);
    });
}

// Display messages in the conversation
function displayMessages(messages) {
    const messagesContainer = document.getElementById('messagesContainer');
    
    if (messages.length === 0) {
        messagesContainer.innerHTML = `
            <div class="no-messages">
                <p>No messages yet. Start the conversation!</p>
            </div>
        `;
        return;
    }
    
    const messagesHTML = messages.map(message => {
        const isOwnMessage = message.senderId === currentUser.uid;
        return `
            <div class="message ${isOwnMessage ? 'own-message' : 'other-message'}">
                <div class="message-content">
                    <p>${escapeHtml(message.content)}</p>
                    ${message.filtered ? '<small class="filtered-notice">⚠️ Content filtered</small>' : ''}
                </div>
                <div class="message-meta">
                    <span class="message-time">${formatTime(message.timestamp)}</span>
                    ${isOwnMessage ? '<span class="message-status">✓</span>' : ''}
                </div>
            </div>
        `;
    }).join('');
    
    messagesContainer.innerHTML = messagesHTML;
    
    // Scroll to bottom
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Send message
document.getElementById('messageForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    if (!currentConversationId) return;
    
    const messageInput = document.getElementById('messageInput');
    const content = messageInput.value.trim();
    
    if (!content) return;
    
    // Check for prohibited content
    const contentCheck = checkProhibitedContent(content);
    if (contentCheck.hasViolation) {
        showContentWarning(contentCheck.violations, content);
        return;
    }
    
    try {
        await sendMessage(content);
        messageInput.value = '';
        updateCharCount();
    } catch (error) {
        console.error('Error sending message:', error);
        alert('Failed to send message. Please try again.');
    }
});

// Send message to Firebase
async function sendMessage(content, bypassFilter = false) {
    const messageData = {
        content: content,
        senderId: currentUser.uid,
        senderEmail: currentUser.email,
        timestamp: serverTimestamp(),
        filtered: false
    };
    
    // Apply content filtering
    if (!bypassFilter) {
        const filteredContent = filterPersonalInfo(content);
        if (filteredContent !== content) {
            messageData.content = filteredContent;
            messageData.filtered = true;
        }
    }
    
    // Add message to conversation
    await addDoc(collection(db, 'conversations', currentConversationId, 'messages'), messageData);
    
    // Update conversation metadata
    await updateDoc(doc(db, 'conversations', currentConversationId), {
        lastMessage: messageData.content.substring(0, 100),
        lastMessageAt: serverTimestamp(),
        // Increment unread count for other participants
        ...Object.fromEntries(
            (await getDoc(doc(db, 'conversations', currentConversationId)))
                .data().participants
                .filter(id => id !== currentUser.uid)
                .map(id => [`unreadCount.${id}`, (messageData.unreadCount?.[id] || 0) + 1])
        )
    });
}

// Check for prohibited content
function checkProhibitedContent(content) {
    const violations = [];
    const prohibitedPatterns = [
        { pattern: /\b[\w.-]+@[\w.-]+\.\w+\b/g, type: 'email address' },
        { pattern: /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, type: 'phone number' },
        { pattern: /\b(?:whatsapp|telegram|discord|skype|zoom)\b/gi, type: 'external messaging app' },
        { pattern: /\b(?:facebook|instagram|twitter|linkedin|github)\.com\/\S+/gi, type: 'social media link' },
        { pattern: /\b(?:my name is|call me|i'm)\s+([a-zA-Z]+\s*[a-zA-Z]*)/gi, type: 'personal name sharing' }
    ];
    
    prohibitedPatterns.forEach(({ pattern, type }) => {
        const matches = content.match(pattern);
        if (matches) {
            violations.push({ type, matches });
        }
    });
    
    return {
        hasViolation: violations.length > 0,
        violations
    };
}

// Filter personal information from messages
function filterPersonalInfo(content) {
    return content
        .replace(/\b[\w.-]+@[\w.-]+\.\w+\b/g, '[EMAIL FILTERED]')
        .replace(/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, '[PHONE FILTERED]')
        .replace(/\b(?:whatsapp|telegram|discord|skype|zoom)\b/gi, '[MESSAGING APP FILTERED]')
        .replace(/\b(?:facebook|instagram|twitter|linkedin|github)\.com\/\S+/gi, '[SOCIAL LINK FILTERED]');
}

// Show content warning modal
function showContentWarning(violations, originalContent) {
    const modal = document.getElementById('contentWarningModal');
    const warningMessage = document.getElementById('warningMessage');
    
    const violationText = violations.map(v => v.type).join(', ');
    warningMessage.innerHTML = `
        Your message contains prohibited content: <strong>${violationText}</strong>.<br>
        Sharing personal information violates our Terms of Service.<br>
        Please remove this information and try again.
    `;
    
    modal.style.display = 'flex';
    
    // Store original content for potential bypass
    modal.dataset.originalContent = originalContent;
}

// Close warning modal
window.closeWarningModal = function() {
    document.getElementById('contentWarningModal').style.display = 'none';
};

// Character count update
document.getElementById('messageInput').addEventListener('input', updateCharCount);

function updateCharCount() {
    const input = document.getElementById('messageInput');
    const charCount = document.getElementById('charCount');
    charCount.textContent = `${input.value.length}/2000`;
    
    if (input.value.length > 1800) {
        charCount.style.color = 'var(--error-red)';
    } else {
        charCount.style.color = 'var(--gray-500)';
    }
}

// Logout functionality
window.handleLogoutClick = async function() {
    try {
        if (unsubscribeMessages) {
            unsubscribeMessages();
        }
        await handleLogout();
        window.location.href = 'index.html';
    } catch (error) {
        console.error('Logout error:', error);
    }
};

// Utility functions
function formatTime(timestamp) {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffHours = diffMs / (1000 * 60 * 60);
    
    if (diffHours < 1) {
        return 'Just now';
    } else if (diffHours < 24) {
        return `${Math.floor(diffHours)}h ago`;
    } else {
        return date.toLocaleDateString();
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

// Create conversation when user applies to project
export async function createConversation(projectId, projectTitle, companyId, developerId) {
    try {
        const conversationData = {
            projectId,
            projectTitle,
            participants: [companyId, developerId],
            createdAt: serverTimestamp(),
            lastMessageAt: serverTimestamp(),
            lastMessage: 'Conversation started',
            unreadCount: {
                [companyId]: 0,
                [developerId]: 0
            }
        };
        
        const docRef = await addDoc(collection(db, 'conversations'), conversationData);
        return docRef.id;
    } catch (error) {
        console.error('Error creating conversation:', error);
        return null;
    }
}