// Minimalist Cosmic Portal JavaScript
// Handles starfield, portal ring animations, and voice agent modal

class StarfieldRenderer {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) return;
        
        this.ctx = this.canvas.getContext('2d');
        this.stars = [];
        this.numStars = 200;
        this.resizeCanvas();
        this.createStars();
        this.animate();
        
        window.addEventListener('resize', () => this.resizeCanvas());
    }
    
    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }
    
    createStars() {
        this.stars = [];
        for (let i = 0; i < this.numStars; i++) {
            this.stars.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                radius: Math.random() * 2 + 0.5,
                opacity: Math.random() * 0.8 + 0.2,
                twinkleSpeed: Math.random() * 0.02 + 0.01,
                phase: Math.random() * Math.PI * 2
            });
        }
    }
    
    updateStars() {
        this.stars.forEach(star => {
            star.phase += star.twinkleSpeed;
            star.opacity = 0.3 + Math.sin(star.phase) * 0.5;
        });
    }
    
    drawStars() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.stars.forEach(star => {
            this.ctx.beginPath();
            this.ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
            this.ctx.fillStyle = `rgba(139, 92, 246, ${star.opacity})`;
            this.ctx.fill();
            
            // Add subtle glow effect
            this.ctx.shadowBlur = 10;
            this.ctx.shadowColor = '#8b5cf6';
            this.ctx.fill();
            this.ctx.shadowBlur = 0;
        });
    }
    
    animate() {
        this.updateStars();
        this.drawStars();
        requestAnimationFrame(() => this.animate());
    }
}

class VoiceAgentModal {
    constructor() {
        this.modal = document.getElementById('voice-modal');
        this.closeBtn = document.getElementById('modal-close');
        this.micButton = document.getElementById('mic-button');
        this.nextButton = document.getElementById('next-button');
        this.finishButton = document.getElementById('finish-button');
        this.currentStep = 1;
        this.maxSteps = 5;
        this.isListening = false;
        
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        // CTA buttons - hero opens modal, final redirects
        document.addEventListener('click', (e) => {
            const clickedElement = e.target.closest('.cta-button, #hero-cta');
            if (clickedElement && clickedElement.id !== 'final-cta') {
                console.log('Hero button clicked:', clickedElement.id || clickedElement.className);
                e.preventDefault();
                this.openModal();
            }
        });
        
        // Close modal
        this.closeBtn?.addEventListener('click', () => this.closeModal());
        this.modal?.addEventListener('click', (e) => {
            if (e.target === this.modal) this.closeModal();
        });
        
        // Next step
        this.nextButton?.addEventListener('click', () => this.nextStep());
        
        // Finish setup
        this.finishButton?.addEventListener('click', () => this.finishSetup());
        
        // Microphone toggle
        this.micButton?.addEventListener('click', () => this.toggleMicrophone());
        
        // Auto-advance on input
        this.setupAutoAdvance();
    }
    
    setupAutoAdvance() {
        const inputs = document.querySelectorAll('.question-step input, .question-step textarea');
        inputs.forEach(input => {
            input.addEventListener('input', () => {
                if (input.value.trim().length > 0) {
                    setTimeout(() => this.nextStep(), 1000);
                }
            });
        });
    }
    
    openModal() {
        console.log('Opening modal, modal element:', this.modal);
        if (this.modal) {
            this.modal.classList.add('active');
            document.body.style.overflow = 'hidden';
            this.createModalStars();
        } else {
            console.error('Modal element not found!');
        }
    }
    
    closeModal() {
        this.modal?.classList.remove('active');
        document.body.style.overflow = '';
        this.currentStep = 1;
        this.updateStep();
    }
    
    createModalStars() {
        const starsContainer = document.querySelector('.modal-stars');
        if (!starsContainer) return;
        
        starsContainer.innerHTML = '';
        for (let i = 0; i < 50; i++) {
            const star = document.createElement('div');
            star.className = 'modal-star';
            star.style.left = Math.random() * 100 + '%';
            star.style.top = Math.random() * 100 + '%';
            star.style.animationDelay = Math.random() * 3 + 's';
            starsContainer.appendChild(star);
        }
    }
    
    nextStep() {
        if (this.currentStep < this.maxSteps) {
            this.currentStep++;
            this.updateStep();
        }
    }
    
    updateStep() {
        // Hide all steps
        document.querySelectorAll('.question-step').forEach(step => {
            step.classList.remove('active');
        });
        
        // Show current step
        const currentStepEl = document.querySelector(`[data-step="${this.currentStep}"]`);
        currentStepEl?.classList.add('active');
        
        // Update button visibility
        if (this.currentStep === this.maxSteps) {
            this.nextButton.style.display = 'none';
            this.finishButton.style.display = 'block';
        } else {
            this.nextButton.style.display = 'block';
            this.finishButton.style.display = 'none';
        }
        
        // Focus on input
        const input = currentStepEl?.querySelector('input, textarea');
        input?.focus();
    }
    
    toggleMicrophone() {
        this.isListening = !this.isListening;
        const micStatus = document.querySelector('.mic-status');
        
        if (this.isListening) {
            this.micButton.classList.add('listening');
            micStatus.textContent = 'Listening...';
            this.startSpeechRecognition();
        } else {
            this.micButton.classList.remove('listening');
            micStatus.textContent = 'Click to speak';
            this.stopSpeechRecognition();
        }
    }
    
    startSpeechRecognition() {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            this.recognition = new SpeechRecognition();
            this.recognition.continuous = true;
            this.recognition.interimResults = true;
            
            this.recognition.onresult = (event) => {
                const result = event.results[event.results.length - 1];
                if (result.isFinal) {
                    const activeInput = document.querySelector('.question-step.active input, .question-step.active textarea');
                    if (activeInput) {
                        activeInput.value = result[0].transcript;
                        setTimeout(() => this.nextStep(), 1500);
                    }
                }
            };
            
            this.recognition.onerror = () => {
                this.isListening = false;
                this.micButton.classList.remove('listening');
                document.querySelector('.mic-status').textContent = 'Click to speak';
            };
            
            this.recognition.start();
        } else {
            alert('Speech recognition not supported in your browser');
            this.isListening = false;
            this.micButton.classList.remove('listening');
        }
    }
    
    stopSpeechRecognition() {
        if (this.recognition) {
            this.recognition.stop();
        }
    }
    
    finishSetup() {
        // Collect all form data
        const formData = {};
        document.querySelectorAll('.question-step').forEach((step, index) => {
            const input = step.querySelector('input, textarea');
            if (input) {
                const label = step.querySelector('label').textContent.replace(':', '');
                formData[label] = input.value;
            }
        });
        
        console.log('Form data collected:', formData);
        
        // Show success message
        const modalContent = document.querySelector('.modal-content');
        modalContent.innerHTML = `
            <div class="modal-success">
                <div class="success-icon">🚀</div>
                <h3>Setup Complete!</h3>
                <p>We're analyzing your requirements and will be in touch within 24 hours.</p>
                <button class="close-success-btn" onclick="document.getElementById('voice-modal').classList.remove('active'); document.body.style.overflow = '';">
                    Close
                </button>
            </div>
        `;
        
        // Form completed successfully - no redirect needed
    }
}

// Portal ring animation
class PortalRing {
    constructor() {
        this.ring = document.querySelector('.portal-ring');
        if (!this.ring) return;
        
        this.animateRing();
    }
    
    animateRing() {
        let rotation = 0;
        const animate = () => {
            rotation += 0.5;
            this.ring.style.transform = `translate(-50%, -50%) rotate(${rotation}deg)`;
            requestAnimationFrame(animate);
        };
        animate();
    }
}

// Smooth scroll for navigation links
function initSmoothScroll() {
    document.addEventListener('click', (e) => {
        const link = e.target.closest('a[href^="#"]');
        if (link) {
            e.preventDefault();
            const targetId = link.getAttribute('href').substring(1);
            const targetElement = document.getElementById(targetId);
            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        }
    });
}

// Progress comet animation
function initProgressComet() {
    const comet = document.querySelector('.progress-comet');
    if (!comet) return;
    
    const processSection = document.querySelector('.process-section');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                comet.classList.add('animate');
            }
        });
    }, { threshold: 0.5 });
    
    observer.observe(processSection);
}

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Initialize starfields
    new StarfieldRenderer('starfield');
    new StarfieldRenderer('bridge-starfield');
    new StarfieldRenderer('final-starfield');
    
    // Initialize portal ring
    new PortalRing();
    
    // Initialize voice agent modal
    new VoiceAgentModal();
    
    // Initialize smooth scrolling
    initSmoothScroll();
    
    // Initialize progress comet
    initProgressComet();
    
    // Add cosmic breathing effect to hero
    const heroContent = document.querySelector('.hero-content');
    if (heroContent) {
        heroContent.classList.add('cosmic-breathing');
    }
    
    // FORCE FIX: Multiple event listeners for bottom button
    const finalCtaButton = document.getElementById('final-cta');
    if (finalCtaButton) {
        console.log('Final CTA button found, adding multiple listeners');
        
        // Method 1: Direct click - redirect to signup
        finalCtaButton.onclick = function(e) {
            console.log('FINAL CTA - Redirecting to signup');
            e.preventDefault();
            e.stopPropagation();
            window.location.href = 'company-signup.html';
        };
        
        // Method 2: Event listener - redirect to signup  
        finalCtaButton.addEventListener('click', function(e) {
            console.log('FINAL CTA - Redirecting to signup');
            e.preventDefault();
            e.stopPropagation();
            window.location.href = 'company-signup.html';
        }, true);
        
        // Method 3: Force style cursor
        finalCtaButton.style.cursor = 'pointer';
        finalCtaButton.style.pointerEvents = 'auto';
        finalCtaButton.style.zIndex = '9999';
        
    } else {
        console.error('Final CTA button NOT found!');
    }
    
    console.log('🚀 Cosmic Portal initialized');
    
    // Initialize enhanced animations and counters
    initEnhancedAnimations();
    initCounterAnimations();
});

// Enhanced scroll animations for all new sections
function initEnhancedAnimations() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0) translateX(0) scale(1)';
            }
        });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

    // Animate stat cards with bounce effect
    document.querySelectorAll('.stat-card').forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(30px) scale(0.9)';
        card.style.transition = `all 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55) ${index * 0.1}s`;
        observer.observe(card);
    });

    // Animate case study cards with slide effect
    document.querySelectorAll('.case-study-card').forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateX(-50px)';
        card.style.transition = `all 0.8s ease-out ${index * 0.15}s`;
        observer.observe(card);
    });

    // Animate logo items with stagger
    document.querySelectorAll('.logo-item').forEach((item, index) => {
        item.style.opacity = '0';
        item.style.transform = 'scale(0.8)';
        item.style.transition = `all 0.4s ease-out ${index * 0.03}s`;
        observer.observe(item);
    });

    // Remove the old trusted logo items animation since we're using .logo-item now

    // Animate Why Companeeds section elements
    document.querySelectorAll('.why-feature-card').forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(40px) scale(0.95)';
        card.style.transition = `all 0.8s cubic-bezier(0.22, 1, 0.36, 1) ${index * 0.2}s`;
        observer.observe(card);
    });

    // Animate guarantee section with special effect
    const guaranteeSection = document.querySelector('.confidence-guarantee');
    if (guaranteeSection) {
        guaranteeSection.style.opacity = '0';
        guaranteeSection.style.transform = 'scale(0.9)';
        guaranteeSection.style.transition = 'all 1s cubic-bezier(0.22, 1, 0.36, 1)';
        observer.observe(guaranteeSection);
    }

    // Add purple card glow effects
    document.querySelectorAll('.purple-card').forEach(card => {
        card.addEventListener('mouseenter', () => {
            card.style.boxShadow = '0 25px 50px rgba(139, 92, 246, 0.6), inset 0 2px 0 rgba(255, 255, 255, 0.3)';
            card.style.transform = 'translateY(-8px) scale(1.02)';
        });
        
        card.addEventListener('mouseleave', () => {
            card.style.boxShadow = '0 15px 35px rgba(139, 92, 246, 0.4), inset 0 2px 0 rgba(255, 255, 255, 0.15)';
            card.style.transform = 'translateY(0) scale(1)';
        });
    });
}

// Counter animation for statistics
function initCounterAnimations() {
    const counters = document.querySelectorAll('.stat-number');
    
    const counterObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const counter = entry.target;
                const target = counter.textContent;
                let current = 0;
                
                // Extract number from text
                const match = target.match(/(\d+)/);
                if (match) {
                    const targetNum = parseInt(match[1]);
                    const increment = Math.max(targetNum / 50, 1);
                    const suffix = target.replace(/\d+/, '');
                    
                    const timer = setInterval(() => {
                        current += increment;
                        if (current >= targetNum) {
                            counter.textContent = target;
                            clearInterval(timer);
                        } else {
                            counter.textContent = Math.floor(current) + suffix;
                        }
                    }, 30);
                }
                
                counterObserver.unobserve(counter);
            }
        });
    }, { threshold: 0.5 });

    counters.forEach(counter => {
        counterObserver.observe(counter);
    });
}

// Initialize all components when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Cosmic Portal initialized');
    
    // Initialize all components
    new VoiceAgentModal();
    new PortalRing();
    new StarField('hero-starfield', { density: 0.8, speed: 0.3 });
    new StarField('final-starfield', { density: 1.2, speed: 0.5 });
    
    // Initialize animations
    initScrollAnimations();
    initCounterAnimations();
});