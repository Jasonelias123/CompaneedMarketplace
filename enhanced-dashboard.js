// Enhanced dashboard functionality for premium marketplace features
import { auth, db } from './firebase-config.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { 
    collection, 
    addDoc, 
    doc, 
    getDoc,
    updateDoc,
    serverTimestamp 
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

let selectedTechStack = [];

// Tech stack management
function initializeTechStackSelector() {
    const techStackSelect = document.getElementById('techStackSelect');
    const techTagsContainer = document.getElementById('selectedTechStack');
    const skillsHidden = document.getElementById('skills');

    if (!techStackSelect || !techTagsContainer) return;

    techStackSelect.addEventListener('change', function() {
        const selectedTech = this.value;
        if (selectedTech && !selectedTechStack.includes(selectedTech)) {
            selectedTechStack.push(selectedTech);
            updateTechStackDisplay();
            this.selectedIndex = 0; // Reset dropdown
        }
    });

    function updateTechStackDisplay() {
        techTagsContainer.innerHTML = selectedTechStack.map(tech => `
            <div class="tech-tag">
                ${tech}
                <button type="button" class="tech-tag-remove" onclick="removeTechStack('${tech}')">×</button>
            </div>
        `).join('');
        
        // Update hidden field
        if (skillsHidden) {
            skillsHidden.value = selectedTechStack.join(', ');
        }
    }

    // Make removeTechStack globally accessible
    window.removeTechStack = function(tech) {
        selectedTechStack = selectedTechStack.filter(t => t !== tech);
        updateTechStackDisplay();
    };
}

// Milestone payment management
function initializeMilestoneToggle() {
    const enableMilestonesCheckbox = document.getElementById('enableMilestones');
    const milestoneSection = document.getElementById('milestoneSection');

    if (!enableMilestonesCheckbox || !milestoneSection) return;

    enableMilestonesCheckbox.addEventListener('change', function() {
        if (this.checked) {
            milestoneSection.classList.add('active');
        } else {
            milestoneSection.classList.remove('active');
        }
    });
}

// Terms modal management
function initializeTermsModal() {
    // Create terms modal if it doesn't exist
    if (!document.getElementById('termsModal')) {
        const modalHTML = `
            <div id="termsModal" class="terms-modal">
                <div class="terms-content">
                    <button class="terms-close" onclick="closeTermsModal()">×</button>
                    <h2>Terms of Use</h2>
                    <div class="terms-text">
                        <h3>Companeeds AI Platform Terms of Service</h3>
                        
                        <h4>1. Platform Usage</h4>
                        <p>By using Companeeds AI, you agree to use the platform responsibly and professionally. All interactions must remain within the platform's secure environment.</p>
                        
                        <h4>2. Privacy and Information Sharing</h4>
                        <p>Users are strictly prohibited from sharing personal contact information (email addresses, phone numbers, social media profiles, or personal names) outside the platform's messaging system. Violations will result in immediate account suspension.</p>
                        
                        <h4>3. Payment and Disputes</h4>
                        <p>Companeeds AI facilitates connections between companies and developers but is not liable for payment disputes, project outcomes, or contract fulfillment. Users are encouraged to use milestone payments and clear project specifications.</p>
                        
                        <h4>4. Intellectual Property</h4>
                        <p>All work created through platform connections is subject to agreements between the parties involved. Companeeds AI does not claim ownership of any intellectual property created through platform collaborations.</p>
                        
                        <h4>5. Account Termination</h4>
                        <p>Companeeds AI reserves the right to terminate accounts that violate platform policies, engage in fraudulent activity, or provide false information during the vetting process.</p>
                        
                        <h4>6. Platform Liability</h4>
                        <p>Companeeds AI is not responsible for the quality of work, timeliness of delivery, or any damages arising from collaborations facilitated through the platform. Users engage at their own risk.</p>
                        
                        <p><strong>By checking this box, you acknowledge that you have read, understood, and agree to be bound by these Terms of Use.</strong></p>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }

    window.showTermsModal = function() {
        document.getElementById('termsModal').classList.add('active');
    };

    window.closeTermsModal = function() {
        document.getElementById('termsModal').classList.remove('active');
    };

    // Close modal when clicking outside
    document.getElementById('termsModal').addEventListener('click', function(e) {
        if (e.target === this) {
            closeTermsModal();
        }
    });
}

// Enhanced project submission with new fields
async function enhancedProjectSubmission(event) {
    event.preventDefault();
    
    const user = auth.currentUser;
    if (!user) {
        alert('Please login first');
        return;
    }

    const formData = new FormData(event.target);
    const agreeTerms = formData.get('agreeTerms');
    
    if (!agreeTerms) {
        alert('You must agree to the Terms of Use to post a project');
        return;
    }

    // Validate tech stack
    if (selectedTechStack.length === 0) {
        alert('Please select at least one required technology');
        return;
    }

    // Validate milestones if enabled
    const enableMilestones = formData.get('enableMilestones');
    if (enableMilestones) {
        const milestone1Percent = parseInt(formData.get('milestone1_percent') || 0);
        const milestone2Percent = parseInt(formData.get('milestone2_percent') || 0);
        const milestone3Percent = parseInt(formData.get('milestone3_percent') || 0);
        
        if (milestone1Percent + milestone2Percent + milestone3Percent !== 100) {
            alert('Milestone percentages must total exactly 100%');
            return;
        }
    }

    try {
        // Get company profile for verification status
        const companyProfile = await getDoc(doc(db, 'companyProfiles', user.uid));
        const verificationStatus = companyProfile.exists() ? 
            companyProfile.data().verificationStatus || 'unverified' : 'unverified';

        const projectData = {
            title: formData.get('title'),
            description: formData.get('description'),
            category: formData.get('category'),
            budget: parseInt(formData.get('budget')),
            deadline: formData.get('deadline'),
            techStack: selectedTechStack,
            skills: selectedTechStack.join(', '), // Legacy compatibility
            timeline: formData.get('timeline'),
            urgency: formData.get('urgency'),
            ndaRequired: !!formData.get('ndaRequired'),
            enableMilestones: !!enableMilestones,
            milestones: enableMilestones ? {
                milestone1: {
                    description: formData.get('milestone1_desc'),
                    percentage: parseInt(formData.get('milestone1_percent'))
                },
                milestone2: {
                    description: formData.get('milestone2_desc'),
                    percentage: parseInt(formData.get('milestone2_percent'))
                },
                milestone3: {
                    description: formData.get('milestone3_desc'),
                    percentage: parseInt(formData.get('milestone3_percent'))
                }
            } : null,
            companyId: user.uid,
            companyEmail: user.email,
            companyName: user.displayName || user.email.split('@')[0],
            companyVerificationStatus: verificationStatus,
            status: 'pending',
            createdAt: new Date().toISOString(),
            timestamp: Date.now(),
            agreeToTerms: true
        };

        // Add project to Firestore
        const docRef = await addDoc(collection(db, 'projects'), projectData);
        
        // Log for admin review
        await addDoc(collection(db, 'adminProjectLogs'), {
            ...projectData,
            originalProjectId: docRef.id,
            action: 'project_submitted',
            timestamp: Date.now()
        });

        // Show success message
        alert('Project submitted successfully! It will be reviewed and published once approved.');
        
        // Reset form and tech stack
        event.target.reset();
        selectedTechStack = [];
        document.getElementById('selectedTechStack').innerHTML = '';
        document.getElementById('milestoneSection').classList.remove('active');
        
    } catch (error) {
        console.error('Error submitting project:', error);
        alert('Failed to submit project. Please try again.');
    }
}

// Check if user has company profile and prompt if needed
async function checkCompanyProfile(user) {
    try {
        const companyProfile = await getDoc(doc(db, 'companyProfiles', user.uid));
        
        if (!companyProfile.exists()) {
            // Show prompt to complete profile
            const completeProfile = confirm(
                'Complete your company profile to earn the "Verified Buyer" badge and build trust with developers. Would you like to complete it now?'
            );
            
            if (completeProfile) {
                window.location.href = 'company-profile.html';
                return false;
            }
        }
        
        return true;
    } catch (error) {
        console.error('Error checking company profile:', error);
        return true; // Continue anyway
    }
}

// Initialize all enhanced features
document.addEventListener('DOMContentLoaded', function() {
    initializeTechStackSelector();
    initializeMilestoneToggle();
    initializeTermsModal();
    
    // Attach enhanced submission handler
    const projectForm = document.getElementById('projectForm');
    if (projectForm) {
        projectForm.addEventListener('submit', enhancedProjectSubmission);
    }
    
    // Check for company profile on load
    onAuthStateChanged(auth, async (user) => {
        if (user && window.location.pathname.includes('dashboard')) {
            await checkCompanyProfile(user);
        }
    });
});

export { selectedTechStack, initializeTechStackSelector };