// Messaging Dashboard JavaScript
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { getFirestore, collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

// Firebase configuration (placeholder - replace with actual config)
const firebaseConfig = {
    apiKey: "demo-key",
    authDomain: "companeeds-demo.firebaseapp.com",
    projectId: "companeeds-demo",
    storageBucket: "companeeds-demo.appspot.com",
    messagingSenderId: "123456789",
    appId: "demo-app-id"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Global variables
let currentUser = null;
let currentChat = null;
let currentChatType = 'consultants';
let consultants = [];
let conversations = [];
let aiIntakeSession = null;
let intakeType = 'consultant'; // 'consultant' or 'company'

// AI Intake Questions Flow for Consultants
const consultantIntakeQuestions = [
    {
        id: 'welcome',
        text: "Hello! I'm the Companeeds AI assistant. I'll help gather some information about your AI consulting expertise. What's your full name?",
        field: 'fullName'
    },
    {
        id: 'email',
        text: "Great to meet you! What's your email address?",
        field: 'email'
    },
    {
        id: 'location',
        text: "Where are you currently located? (City, Country)",
        field: 'location'
    },
    {
        id: 'experience',
        text: "How many years of experience do you have with AI and machine learning technologies?",
        field: 'experience'
    },
    {
        id: 'specialties',
        text: "What are your main AI specialties? (e.g., Natural Language Processing, Computer Vision, Machine Learning, etc.)",
        field: 'specialties'
    },
    {
        id: 'tools',
        text: "Which AI tools and frameworks do you work with most? (e.g., TensorFlow, PyTorch, OpenAI API, etc.)",
        field: 'tools'
    },
    {
        id: 'industries',
        text: "What industries have you worked in? (e.g., Healthcare, Finance, E-commerce, etc.)",
        field: 'industries'
    },
    {
        id: 'projectTypes',
        text: "What types of AI projects do you typically work on? Please describe a few examples.",
        field: 'projectTypes'
    },
    {
        id: 'rates',
        text: "What are your typical hourly or project rates?",
        field: 'rates'
    },
    {
        id: 'availability',
        text: "What's your current availability? (e.g., Part-time, Full-time, Project-based)",
        field: 'availability'
    },
    {
        id: 'portfolio',
        text: "Do you have a portfolio website or LinkedIn profile you'd like to share?",
        field: 'portfolio'
    },
    {
        id: 'motivation',
        text: "What attracts you to working with Companeeds and our client companies?",
        field: 'motivation'
    },
    {
        id: 'complete',
        text: "Excellent! I've collected all the details about your AI expertise and experience. Our team will carefully review your application and get back to you within 24-48 hours regarding next steps. If approved, you'll be invited to join our exclusive network of vetted AI consultants. Thank you for your interest in Companeeds!",
        field: null
    }
];

// AI Intake Questions Flow for Companies
const companyIntakeQuestions = [
    {
        id: 'welcome',
        text: "Hello! I'm the Companeeds AI assistant. I'll help you find the perfect AI consultant for your business needs. Let's start with your name - what should I call you?",
        field: 'contactName'
    },
    {
        id: 'company',
        text: "Great to meet you! What's the name of your company?",
        field: 'companyName'
    },
    {
        id: 'email',
        text: "What's the best email address to reach you?",
        field: 'email'
    },
    {
        id: 'role',
        text: "What's your role at the company? (e.g., CEO, CTO, Product Manager, etc.)",
        field: 'role'
    },
    {
        id: 'companySize',
        text: "How many employees does your company have?",
        field: 'companySize'
    },
    {
        id: 'industry',
        text: "What industry is your company in? (e.g., E-commerce, Healthcare, Finance, etc.)",
        field: 'industry'
    },
    {
        id: 'aiGoals',
        text: "What are your main goals with AI? What business problems are you looking to solve?",
        field: 'aiGoals'
    },
    {
        id: 'currentAI',
        text: "Do you currently use any AI tools or have any AI initiatives in place?",
        field: 'currentAI'
    },
    {
        id: 'projectType',
        text: "What type of AI project are you most interested in? (e.g., Chatbots, Data Analytics, Process Automation, etc.)",
        field: 'projectType'
    },
    {
        id: 'timeline',
        text: "What's your ideal timeline for getting started? (e.g., ASAP, Within 1 month, 2-3 months, etc.)",
        field: 'timeline'
    },
    {
        id: 'budget',
        text: "What's your approximate budget range for this AI project? (This helps us match you with the right consultant)",
        field: 'budget'
    },
    {
        id: 'success',
        text: "How will you measure success for this AI project? What specific outcomes are you hoping to achieve?",
        field: 'successMetrics'
    },
    {
        id: 'challenges',
        text: "What's the biggest challenge or pain point you're hoping AI will help solve?",
        field: 'challenges'
    },
    {
        id: 'complete',
        text: "Perfect! I've gathered all the information we need about your business and AI goals. Our team will personally review your requirements and hand-select 2-3 ideal AI consultants from our vetted network. You'll receive an email within 24 hours with consultant profiles matched specifically to your needs. Thank you for choosing Companeeds!",
        field: null
    }
];

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    // Check for URL parameters to determine intake type
    const urlParams = new URLSearchParams(window.location.search);
    const type = urlParams.get('type');
    
    if (type === 'company') {
        intakeType = 'company';
        currentChatType = 'ai-intake';
        // Hide consultant sidebar and auto-start company intake
        document.querySelector('.sidebar').style.display = 'none';
        document.querySelector('.chat-main').style.width = '100%';
        setTimeout(() => {
            startNewAiIntake();
        }, 500);
    } else if (type === 'consultant') {
        intakeType = 'consultant';
        currentChatType = 'ai-intake';
        // Hide consultant sidebar and auto-start consultant intake
        document.querySelector('.sidebar').style.display = 'none';
        document.querySelector('.chat-main').style.width = '100%';
        setTimeout(() => {
            startNewAiIntake();
        }, 500);
    }
    
    // Temporary bypass for testing
    console.log('TESTING MODE: Bypassing authentication');
    currentUser = {
        uid: 'admin-user-123',
        email: 'admin@companeeds.com'
    };
    
    initializeMessagingWithMockData();
});

// Initialize with mock data for testing
function initializeMessagingWithMockData() {
    console.log('Loading messaging interface...');
    
    // Check if this is a direct intake session
    const urlParams = new URLSearchParams(window.location.search);
    const type = urlParams.get('type');
    
    if (type === 'company' || type === 'consultant') {
        // For direct intake, don't load any consultant data or conversations
        // Keep arrays empty for clean intake experience
        consultants = [];
        conversations = [];
    } else {
        // Only load mock data for admin/general messaging interface
        consultants = [
            {
                id: 'consultant-1',
                name: 'Sarah Chen',
                email: 'sarah.chen@email.com',
                specialties: 'Machine Learning, NLP',
                status: 'online',
                lastMessage: 'Thanks for the project details. I can definitely help with this.',
                lastMessageTime: new Date(Date.now() - 300000), // 5 minutes ago
                avatar: 'SC'
            },
            {
                id: 'consultant-2', 
                name: 'Marcus Rodriguez',
                email: 'marcus.r@email.com',
                specialties: 'Computer Vision, Deep Learning',
                status: 'away',
                lastMessage: 'I have experience with similar projects. When can we schedule a call?',
                lastMessageTime: new Date(Date.now() - 3600000), // 1 hour ago
                avatar: 'MR'
            },
            {
                id: 'consultant-3',
                name: 'Dr. Priya Patel',
                email: 'priya.patel@email.com',
                specialties: 'AI Strategy, Ethics',
                status: 'offline',
                lastMessage: 'I\'d like to learn more about your company\'s AI goals.',
                lastMessageTime: new Date(Date.now() - 86400000), // 1 day ago
                avatar: 'PP'
            }
        ];
        
        // Mock conversations data
        conversations = [
            {
                id: 'conv-1',
                consultantId: 'consultant-1',
                messages: [
                    {
                        id: 'msg-1',
                        senderId: currentUser.uid,
                        text: 'Hi Sarah, I saw your profile and I think you\'d be perfect for our customer service AI project.',
                        timestamp: new Date(Date.now() - 900000), // 15 minutes ago
                        senderType: 'admin'
                    },
                    {
                        id: 'msg-2',
                        senderId: 'consultant-1',
                        text: 'Hi! Thank you for reaching out. I\'d love to learn more about the project. Could you share some details about the scope and requirements?',
                        timestamp: new Date(Date.now() - 600000), // 10 minutes ago
                        senderType: 'consultant'
                    },
                    {
                        id: 'msg-3',
                        senderId: currentUser.uid,
                        text: 'Absolutely! We need to build an AI chatbot that can handle customer inquiries, integrate with our CRM, and provide 24/7 support. The project budget is around $15,000.',
                        timestamp: new Date(Date.now() - 450000), // 7.5 minutes ago
                        senderType: 'admin'
                    },
                    {
                        id: 'msg-4',
                        senderId: 'consultant-1',
                        text: 'Thanks for the project details. I can definitely help with this. I have experience building similar chatbots using NLP and can integrate with most CRM systems. When would you like to start?',
                        timestamp: new Date(Date.now() - 300000), // 5 minutes ago
                        senderType: 'consultant'
                    }
                ]
            }
        ];
        
        loadConsultantsList();
    }
    
    setupEventListeners();
}

// Load consultants list in sidebar
function loadConsultantsList() {
    const consultantChats = document.getElementById('consultantChats');
    consultantChats.innerHTML = '';
    
    consultants.forEach(consultant => {
        const chatItem = document.createElement('div');
        chatItem.className = 'chat-item';
        chatItem.onclick = () => openConsultantChat(consultant.id);
        
        const statusDot = consultant.status === 'online' ? '<span class="status-dot"></span>' : '';
        const timeStr = formatTimeAgo(consultant.lastMessageTime);
        
        chatItem.innerHTML = `
            <div class="chat-item-header">
                <span class="chat-item-name">${consultant.name}</span>
                <span class="chat-item-time">${timeStr}</span>
            </div>
            <div class="chat-item-preview">${consultant.lastMessage}</div>
            <div class="chat-item-status">
                ${statusDot}
                ${consultant.status} • ${consultant.specialties}
            </div>
        `;
        
        consultantChats.appendChild(chatItem);
    });
}

// Open consultant chat
function openConsultantChat(consultantId) {
    const consultant = consultants.find(c => c.id === consultantId);
    if (!consultant) return;
    
    currentChat = consultantId;
    
    // Update active chat in sidebar
    document.querySelectorAll('.chat-item').forEach(item => item.classList.remove('active'));
    event.currentTarget.classList.add('active');
    
    // Show chat interface
    document.getElementById('welcomeScreen').classList.add('hidden');
    document.getElementById('chatInterface').classList.remove('hidden');
    
    // Update chat header
    document.getElementById('chatAvatar').textContent = consultant.avatar;
    document.getElementById('chatTitle').textContent = consultant.name;
    document.getElementById('chatStatus').textContent = `AI Consultant • ${consultant.status}`;
    
    // Load messages
    loadMessages(consultantId);
}

// Load messages for a conversation
function loadMessages(consultantId) {
    const conversation = conversations.find(c => c.consultantId === consultantId);
    const messagesContainer = document.getElementById('messagesContainer');
    messagesContainer.innerHTML = '';
    
    if (conversation && conversation.messages) {
        conversation.messages.forEach(message => {
            const messageDiv = createMessageElement(message);
            messagesContainer.appendChild(messageDiv);
        });
        
        // Scroll to bottom
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
}

// Create message element
function createMessageElement(message) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${message.senderType === 'admin' ? 'sent' : 'received'}`;
    
    const avatar = message.senderType === 'admin' ? 'AD' : 
                  consultants.find(c => c.id === message.senderId)?.avatar || 'AI';
    
    const timeStr = formatTime(message.timestamp);
    
    messageDiv.innerHTML = `
        <div class="message-avatar">${avatar}</div>
        <div class="message-content">
            <div class="message-bubble">${escapeHtml(message.text)}</div>
            <div class="message-time">${timeStr}</div>
        </div>
    `;
    
    return messageDiv;
}

// Send message
function sendMessage() {
    const messageInput = document.getElementById('messageInput');
    const messageText = messageInput.value.trim();
    
    if (!messageText || !currentChat) return;
    
    // Find or create conversation
    let conversation = conversations.find(c => c.consultantId === currentChat);
    if (!conversation) {
        conversation = {
            id: `conv-${Date.now()}`,
            consultantId: currentChat,
            messages: []
        };
        conversations.push(conversation);
    }
    
    // Add message
    const newMessage = {
        id: `msg-${Date.now()}`,
        senderId: currentUser.uid,
        text: messageText,
        timestamp: new Date(),
        senderType: 'admin'
    };
    
    conversation.messages.push(newMessage);
    
    // Update UI
    const messageDiv = createMessageElement(newMessage);
    document.getElementById('messagesContainer').appendChild(messageDiv);
    
    // Update last message in consultant list
    const consultant = consultants.find(c => c.id === currentChat);
    if (consultant) {
        consultant.lastMessage = messageText;
        consultant.lastMessageTime = new Date();
        loadConsultantsList();
    }
    
    // Clear input and scroll
    messageInput.value = '';
    const messagesContainer = document.getElementById('messagesContainer');
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    
    // Simulate consultant response after 2-3 seconds
    setTimeout(() => {
        simulateConsultantResponse(currentChat);
    }, 2000 + Math.random() * 1000);
}

// Simulate consultant response
function simulateConsultantResponse(consultantId) {
    const responses = [
        "That sounds interesting! I'd love to help with this project.",
        "I have experience with similar challenges. Let me know how I can assist.",
        "Great! When would be a good time to discuss this in more detail?",
        "I can definitely work on this. What's the timeline you're thinking?",
        "This aligns perfectly with my expertise. I'm excited to collaborate!",
        "I have some ideas on how to approach this. Should we schedule a call?"
    ];
    
    const conversation = conversations.find(c => c.consultantId === consultantId);
    if (!conversation) return;
    
    const responseText = responses[Math.floor(Math.random() * responses.length)];
    const newMessage = {
        id: `msg-${Date.now()}`,
        senderId: consultantId,
        text: responseText,
        timestamp: new Date(),
        senderType: 'consultant'
    };
    
    conversation.messages.push(newMessage);
    
    // Update UI if this chat is currently open
    if (currentChat === consultantId) {
        const messageDiv = createMessageElement(newMessage);
        document.getElementById('messagesContainer').appendChild(messageDiv);
        
        const messagesContainer = document.getElementById('messagesContainer');
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
    
    // Update consultant list
    const consultant = consultants.find(c => c.id === consultantId);
    if (consultant) {
        consultant.lastMessage = responseText;
        consultant.lastMessageTime = new Date();
        loadConsultantsList();
    }
}

// Switch chat type
function switchChatType(type) {
    currentChatType = type;
    
    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    event.currentTarget.classList.add('active');
    
    // Show/hide chat lists
    document.getElementById('consultantChats').classList.toggle('hidden', type !== 'consultants');
    document.getElementById('aiIntakeChats').classList.toggle('hidden', type !== 'ai-intake');
    
    if (type === 'ai-intake') {
        loadAiIntakeList();
    }
    
    // Reset chat interface
    closeChat();
}

// Load AI intake conversations list
function loadAiIntakeList() {
    const aiIntakeChats = document.getElementById('aiIntakeChats');
    aiIntakeChats.innerHTML = `
        <div class="chat-item" onclick="startNewAiIntake('consultant')">
            <div class="chat-item-header">
                <span class="chat-item-name">Consultant Intake</span>
            </div>
            <div class="chat-item-preview">AI interview for AI consultants</div>
        </div>
        <div class="chat-item" onclick="startNewAiIntake('company')">
            <div class="chat-item-header">
                <span class="chat-item-name">Company Intake</span>
            </div>
            <div class="chat-item-preview">AI interview for companies seeking AI solutions</div>
        </div>
    `;
}

// Start new AI intake session
function startNewAiIntake(type = null) {
    if (type) {
        intakeType = type;
    }
    
    const questions = intakeType === 'company' ? companyIntakeQuestions : consultantIntakeQuestions;
    
    aiIntakeSession = {
        id: `intake-${Date.now()}`,
        type: intakeType,
        currentQuestion: 0,
        responses: {},
        messages: []
    };
    
    document.getElementById('aiIntakeModal').classList.remove('hidden');
    document.getElementById('aiMessages').innerHTML = '';
    
    // Update modal title based on type
    const modalTitle = document.querySelector('#aiIntakeModal .modal-header h3');
    modalTitle.textContent = intakeType === 'company' ? 'Company AI Intake' : 'AI Consultant Intake';
    
    // Start with welcome message
    addAiMessage(questions[0].text, 'bot');
}

// Add AI message to intake chat
function addAiMessage(text, sender) {
    const aiMessages = document.getElementById('aiMessages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `ai-message ${sender}`;
    
    if (sender === 'bot') {
        messageDiv.innerHTML = `
            <div class="ai-avatar">AI</div>
            <div class="ai-bubble">${text}</div>
        `;
    } else {
        messageDiv.innerHTML = `
            <div class="ai-bubble">${escapeHtml(text)}</div>
        `;
    }
    
    aiMessages.appendChild(messageDiv);
    aiMessages.scrollTop = aiMessages.scrollHeight;
}

// Send AI response
function sendAiResponse() {
    const aiInput = document.getElementById('aiInput');
    const responseText = aiInput.value.trim();
    
    if (!responseText || !aiIntakeSession) return;
    
    // Add user response
    addAiMessage(responseText, 'user');
    aiInput.value = '';
    
    // Get the appropriate question set
    const questions = aiIntakeSession.type === 'company' ? companyIntakeQuestions : consultantIntakeQuestions;
    
    // Store response
    const currentQ = questions[aiIntakeSession.currentQuestion];
    if (currentQ.field) {
        aiIntakeSession.responses[currentQ.field] = responseText;
    }
    
    // Move to next question
    aiIntakeSession.currentQuestion++;
    
    setTimeout(() => {
        if (aiIntakeSession.currentQuestion < questions.length) {
            const nextQuestion = questions[aiIntakeSession.currentQuestion];
            addAiMessage(nextQuestion.text, 'bot');
        } else {
            // Intake complete
            console.log(`${aiIntakeSession.type} AI Intake Complete:`, aiIntakeSession.responses);
            const completionMessage = aiIntakeSession.type === 'company' ? 
                'Company intake completed! Our team will personally review your needs and match you with ideal AI consultants within 24 hours.' :
                'Consultant application completed! Our team will review your profile and contact you within 24-48 hours.';
            setTimeout(() => {
                closeAiIntake();
                alert(completionMessage);
            }, 2000);
        }
    }, 1000);
}

// Close AI intake modal
function closeAiIntake() {
    document.getElementById('aiIntakeModal').classList.add('hidden');
    aiIntakeSession = null;
}

// Setup event listeners
function setupEventListeners() {
    // Message input enter key
    document.getElementById('messageInput').addEventListener('keypress', handleKeyPress);
    
    // AI input enter key
    document.getElementById('aiInput').addEventListener('keypress', handleAiKeyPress);
}

// Handle key press for message input
function handleKeyPress(event) {
    if (event.key === 'Enter') {
        sendMessage();
    }
}

// Handle key press for AI input
function handleAiKeyPress(event) {
    if (event.key === 'Enter') {
        sendAiResponse();
    }
}

// Utility functions
function formatTime(date) {
    return date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
    });
}

function formatTimeAgo(date) {
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'now';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    return `${diffDays}d`;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Global functions for HTML onclick handlers
window.switchChatType = switchChatType;
window.startNewChat = () => {
    if (currentChatType === 'ai-intake') {
        startNewAiIntake();
    } else {
        alert('Select a consultant to start messaging');
    }
};
window.closeChat = () => {
    document.getElementById('welcomeScreen').classList.remove('hidden');
    document.getElementById('chatInterface').classList.add('hidden');
    currentChat = null;
};
window.viewProfile = () => {
    if (currentChat) {
        const consultant = consultants.find(c => c.id === currentChat);
        alert(`Consultant Profile:\n\nName: ${consultant.name}\nEmail: ${consultant.email}\nSpecialties: ${consultant.specialties}`);
    }
};
window.sendMessage = sendMessage;
window.handleKeyPress = handleKeyPress;
window.startNewAiIntake = startNewAiIntake;
window.sendAiResponse = sendAiResponse;
window.handleAiKeyPress = handleAiKeyPress;
window.closeAiIntake = closeAiIntake;