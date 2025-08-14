// GSAP Registration
gsap.registerPlugin(ScrollTrigger);

// Design system constants
const COLORS = {
    primaryPurple: '#6C4CFF',
    deepPurple: '#5B36FF',
    spaceDark: '#0A0420',
    accentDepth: '#3A1CCC',
    white: '#ffffff'
};

// State management
let currentModalStep = 1;
let isRecording = false;
let starfields = [];

// Initialize everything when DOM loads
document.addEventListener('DOMContentLoaded', () => {
    initializeNavbar();
    initializeStarfields();
    initializeScrollAnimations();
    initializeModal();
    initializeRocketTwinkle();
    
    // Respect reduced motion preference
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        initializeParallax();
        initializeProgressComet();
    }
});

// Navbar functionality
function initializeNavbar() {
    const navbar = document.querySelector('.navbar');
    const brandText = document.querySelector('.brand-text');
    
    // Smooth scroll behavior
    window.addEventListener('scroll', () => {
        const scrollY = window.pageYOffset;
        
        // Navbar background
        if (scrollY > 120) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
        
        // Brand text color based on section
        const sections = document.querySelectorAll('section');
        const currentSection = getCurrentSection(sections, scrollY);
        
        if (currentSection && isLightSection(currentSection)) {
            navbar.classList.add('light-section');
        } else {
            navbar.classList.remove('light-section');
        }
    });
    
    // Micro float animation for logo
    gsap.to('.brand-logo', {
        y: -2,
        duration: 2,
        ease: 'sine.inOut',
        yoyo: true,
        repeat: -1
    });
}

function getCurrentSection(sections, scrollY) {
    for (let section of sections) {
        const rect = section.getBoundingClientRect();
        const top = rect.top + scrollY;
        const bottom = top + rect.height;
        
        if (scrollY >= top - 100 && scrollY < bottom - 100) {
            return section;
        }
    }
    return null;
}

function isLightSection(section) {
    // Check if section has light background
    return section.classList.contains('light') || 
           section.classList.contains('trusted-section');
}

// Starfield canvas implementation
function initializeStarfields() {
    const canvases = document.querySelectorAll('.starfield-canvas');
    
    canvases.forEach((canvas, index) => {
        const starfield = new Starfield(canvas, {
            starCount: 200,
            layers: 3,
            speed: 0.5 + index * 0.2,
            constellation: true
        });
        starfields.push(starfield);
    });
}

class Starfield {
    constructor(canvas, options = {}) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.options = {
            starCount: options.starCount || 200,
            layers: options.layers || 3,
            speed: options.speed || 0.5,
            constellation: options.constellation || false
        };
        
        this.stars = [];
        this.mouse = { x: 0, y: 0 };
        this.isVisible = true;
        
        this.setupCanvas();
        this.createStars();
        this.bindEvents();
        this.animate();
    }
    
    setupCanvas() {
        const updateSize = () => {
            const rect = this.canvas.getBoundingClientRect();
            this.canvas.width = rect.width * window.devicePixelRatio;
            this.canvas.height = rect.height * window.devicePixelRatio;
            this.ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
            this.canvas.style.width = rect.width + 'px';
            this.canvas.style.height = rect.height + 'px';
        };
        
        updateSize();
        window.addEventListener('resize', updateSize);
    }
    
    createStars() {
        const rect = this.canvas.getBoundingClientRect();
        
        for (let i = 0; i < this.options.starCount; i++) {
            this.stars.push({
                x: Math.random() * rect.width,
                y: Math.random() * rect.height,
                size: Math.random() * 2 + 0.5,
                opacity: Math.random() * 0.8 + 0.2,
                speed: Math.random() * 0.5 + 0.1,
                layer: Math.floor(Math.random() * this.options.layers),
                twinkle: Math.random() * Math.PI * 2,
                color: this.getStarColor()
            });
        }
    }
    
    getStarColor() {
        const colors = [
            'rgba(255, 255, 255, 0.8)',
            'rgba(108, 76, 255, 0.6)',
            'rgba(91, 54, 255, 0.7)',
            'rgba(255, 255, 255, 0.9)'
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    }
    
    bindEvents() {
        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            this.mouse.x = e.clientX - rect.left;
            this.mouse.y = e.clientY - rect.top;
        });
        
        // Optimize performance with intersection observer
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                this.isVisible = entry.isIntersecting;
            });
        });
        observer.observe(this.canvas);
    }
    
    animate() {
        if (!this.isVisible) {
            requestAnimationFrame(() => this.animate());
            return;
        }
        
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.stars.forEach((star, index) => {
            // Parallax based on mouse movement
            const parallaxX = (this.mouse.x - this.canvas.width / 2) * 0.01 * (star.layer + 1);
            const parallaxY = (this.mouse.y - this.canvas.height / 2) * 0.01 * (star.layer + 1);
            
            // Update position
            star.x += star.speed * this.options.speed;
            star.twinkle += 0.02;
            
            // Wrap around
            if (star.x > this.canvas.width) {
                star.x = -10;
            }
            
            // Draw star with twinkle effect
            const twinkleOpacity = star.opacity * (0.7 + 0.3 * Math.sin(star.twinkle));
            this.ctx.fillStyle = star.color.replace('0.8)', `${twinkleOpacity})`);
            this.ctx.beginPath();
            this.ctx.arc(
                star.x + parallaxX, 
                star.y + parallaxY, 
                star.size, 
                0, 
                Math.PI * 2
            );
            this.ctx.fill();
            
            // Constellation lines (occasional)
            if (this.options.constellation && Math.random() < 0.001) {
                this.drawConstellationLine(star, index);
            }
        });
        
        requestAnimationFrame(() => this.animate());
    }
    
    drawConstellationLine(star, index) {
        const nearbyStars = this.stars.filter((otherStar, otherIndex) => {
            if (otherIndex === index) return false;
            const dx = star.x - otherStar.x;
            const dy = star.y - otherStar.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            return distance < 100;
        });
        
        if (nearbyStars.length > 0) {
            const targetStar = nearbyStars[0];
            this.ctx.strokeStyle = 'rgba(108, 76, 255, 0.1)';
            this.ctx.lineWidth = 0.5;
            this.ctx.beginPath();
            this.ctx.moveTo(star.x, star.y);
            this.ctx.lineTo(targetStar.x, targetStar.y);
            this.ctx.stroke();
            
            // Fade out the line
            setTimeout(() => {
                // Line naturally fades with next frame
            }, 2000);
        }
    }
}

// Scroll animations with GSAP
function initializeScrollAnimations() {
    // Hero content animation
    gsap.timeline()
        .from('.hero-headline', {
            y: 60,
            opacity: 0,
            duration: 1,
            ease: 'power3.out'
        })
        .from('.hero-subheadline', {
            y: 40,
            opacity: 0,
            duration: 0.8,
            ease: 'power3.out'
        }, '-=0.5')
        .from('.cta-button', {
            y: 30,
            opacity: 0,
            duration: 0.6,
            ease: 'back.out(1.7)'
        }, '-=0.3')
        .from('.how-it-works-link', {
            opacity: 0,
            duration: 0.5
        }, '-=0.2');
    
    // Value cards stagger animation
    gsap.from('.value-card', {
        y: 60,
        opacity: 0,
        duration: 0.8,
        stagger: 0.2,
        ease: 'power3.out',
        scrollTrigger: {
            trigger: '.value-cards',
            start: 'top 80%'
        }
    });
    
    // Process steps reveal
    gsap.from('.process-step', {
        y: 80,
        opacity: 0,
        duration: 1,
        stagger: 0.3,
        ease: 'power3.out',
        scrollTrigger: {
            trigger: '.process-steps',
            start: 'top 70%'
        }
    });
    
    // Logo fade in
    gsap.from('.client-logo', {
        opacity: 0,
        scale: 0.8,
        duration: 0.6,
        stagger: 0.1,
        ease: 'back.out(1.7)',
        scrollTrigger: {
            trigger: '.logos-grid',
            start: 'top 80%'
        }
    });
    
    // Final CTA animation
    gsap.from('.final-cta-section .final-headline', {
        y: 50,
        opacity: 0,
        duration: 0.8,
        ease: 'power3.out',
        scrollTrigger: {
            trigger: '.final-cta-section',
            start: 'top 70%'
        }
    });
}

// Parallax effects
function initializeParallax() {
    // Portal ring parallax
    gsap.to('.portal-ring', {
        y: -50,
        ease: 'none',
        scrollTrigger: {
            trigger: '.hero-section',
            start: 'top bottom',
            end: 'bottom top',
            scrub: 1
        }
    });
    
    // Starfield parallax layers
    starfields.forEach((starfield, index) => {
        const speed = 0.5 + index * 0.2;
        gsap.to(starfield.canvas, {
            y: -100 * speed,
            ease: 'none',
            scrollTrigger: {
                trigger: starfield.canvas.parentElement,
                start: 'top bottom',
                end: 'bottom top',
                scrub: 1
            }
        });
    });
}

// Progress comet animation
function initializeProgressComet() {
    gsap.to('.progress-comet', {
        width: '100%',
        ease: 'power2.out',
        scrollTrigger: {
            trigger: '.process-section',
            start: 'top 60%',
            end: 'bottom 40%',
            scrub: 1
        }
    });
}

// Modal functionality
function initializeModal() {
    const modal = document.getElementById('voice-modal');
    const heroCtaBtn = document.getElementById('hero-cta');
    const finalCtaBtn = document.getElementById('final-cta');
    const closeBtn = document.getElementById('modal-close');
    const nextBtn = document.getElementById('next-button');
    const finishBtn = document.getElementById('finish-button');
    const micBtn = document.getElementById('mic-button');
    
    // Open modal
    [heroCtaBtn, finalCtaBtn].forEach(btn => {
        btn.addEventListener('click', () => {
            openModal();
        });
    });
    
    // Close modal
    closeBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });
    
    // ESC key to close
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.classList.contains('active')) {
            closeModal();
        }
    });
    
    // Next button
    nextBtn.addEventListener('click', () => {
        nextModalStep();
    });
    
    // Finish button
    finishBtn.addEventListener('click', () => {
        finishSetup();
    });
    
    // Mic button
    micBtn.addEventListener('click', () => {
        toggleRecording();
    });
    
    // Focus trap
    setupFocusTrap(modal);
}

function openModal() {
    const modal = document.getElementById('voice-modal');
    modal.classList.add('active');
    
    // Focus first input
    const firstInput = modal.querySelector('input');
    if (firstInput) {
        setTimeout(() => firstInput.focus(), 300);
    }
    
    // Animate modal stars
    animateModalStars();
}

function closeModal() {
    const modal = document.getElementById('voice-modal');
    modal.classList.remove('active');
    
    // Reset modal state
    currentModalStep = 1;
    updateModalStep();
}

function nextModalStep() {
    if (currentModalStep < 5) {
        currentModalStep++;
        updateModalStep();
    }
}

function updateModalStep() {
    const steps = document.querySelectorAll('.question-step');
    const nextBtn = document.getElementById('next-button');
    const finishBtn = document.getElementById('finish-button');
    
    steps.forEach((step, index) => {
        step.classList.toggle('active', index + 1 === currentModalStep);
    });
    
    if (currentModalStep === 5) {
        nextBtn.style.display = 'none';
        finishBtn.style.display = 'inline-block';
    } else {
        nextBtn.style.display = 'inline-block';
        finishBtn.style.display = 'none';
    }
    
    // Focus current input
    const currentStep = document.querySelector('.question-step.active');
    const input = currentStep.querySelector('input, textarea');
    if (input) {
        setTimeout(() => input.focus(), 100);
    }
}

function finishSetup() {
    // Collect form data
    const formData = {};
    const steps = document.querySelectorAll('.question-step');
    
    steps.forEach((step, index) => {
        const input = step.querySelector('input, textarea');
        if (input) {
            const label = step.querySelector('label').textContent.replace(':', '');
            formData[label] = input.value;
        }
    });
    
    console.log('Setup complete:', formData);
    
    // Show success state
    const modalContent = document.querySelector('.modal-content');
    modalContent.innerHTML = `
        <div class="setup-complete">
            <div class="success-icon">✓</div>
            <h3>Thanks — we're preparing your tailored plan</h3>
            <p>We'll be in touch within 24 hours with your custom AI roadmap.</p>
            <button class="cta-button" onclick="closeModal()">Perfect</button>
        </div>
    `;
    
    // Add success styles
    const style = document.createElement('style');
    style.textContent = `
        .setup-complete {
            text-align: center;
            padding: 2rem 0;
        }
        .success-icon {
            width: 80px;
            height: 80px;
            border-radius: 50%;
            background: linear-gradient(135deg, var(--primary-purple), var(--deep-purple));
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 2rem;
            margin: 0 auto 1.5rem;
            color: white;
        }
    `;
    document.head.appendChild(style);
}

function toggleRecording() {
    const micBtn = document.getElementById('mic-button');
    const micStatus = document.querySelector('.mic-status');
    
    if (!isRecording) {
        // Start recording
        isRecording = true;
        micBtn.style.background = 'linear-gradient(135deg, #ef4444, #dc2626)';
        micStatus.textContent = 'Listening...';
        
        // Request microphone access
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            navigator.mediaDevices.getUserMedia({ audio: true })
                .then(stream => {
                    console.log('Microphone access granted');
                    // Implement speech recognition here
                    simulateTranscription();
                })
                .catch(err => {
                    console.log('Microphone access denied');
                    simulateTranscription();
                });
        } else {
            simulateTranscription();
        }
    } else {
        // Stop recording
        stopRecording();
    }
}

function stopRecording() {
    isRecording = false;
    const micBtn = document.getElementById('mic-button');
    const micStatus = document.querySelector('.mic-status');
    
    micBtn.style.background = 'linear-gradient(135deg, var(--primary-purple), var(--deep-purple))';
    micStatus.textContent = 'Click to speak';
}

function simulateTranscription() {
    // Simulate speech-to-text for demo
    setTimeout(() => {
        const currentStep = document.querySelector('.question-step.active');
        const input = currentStep.querySelector('input, textarea');
        
        if (input) {
            const responses = {
                1: 'Acme Corp',
                2: 'Software Development',
                3: 'Manual data entry is slowing us down',
                4: 'Increased revenue and efficiency',
                5: 'Slack, GitHub, Google Workspace'
            };
            
            input.value = responses[currentModalStep] || 'Voice input captured';
            
            // Auto-advance after a delay
            setTimeout(() => {
                if (currentModalStep < 5) {
                    nextModalStep();
                }
            }, 1000);
        }
        
        stopRecording();
    }, 2000);
}

function setupFocusTrap(modal) {
    const focusableElements = modal.querySelectorAll(
        'button, input, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];
    
    modal.addEventListener('keydown', (e) => {
        if (e.key === 'Tab') {
            if (e.shiftKey) {
                if (document.activeElement === firstElement) {
                    e.preventDefault();
                    lastElement.focus();
                }
            } else {
                if (document.activeElement === lastElement) {
                    e.preventDefault();
                    firstElement.focus();
                }
            }
        }
    });
}

function animateModalStars() {
    const modalStars = document.querySelector('.modal-stars');
    gsap.to(modalStars, {
        backgroundPosition: '100px 80px',
        duration: 20,
        ease: 'none',
        repeat: -1
    });
}

// Rocket twinkle animation
function initializeRocketTwinkle() {
    const rocketIcons = document.querySelectorAll('.rocket-icon, .rocket-emoji');
    
    rocketIcons.forEach(rocket => {
        gsap.to(rocket, {
            scale: 1.1,
            duration: 0.3,
            ease: 'power2.out',
            yoyo: true,
            repeat: 1,
            delay: Math.random() * 10 + 5, // Random delay between 5-15 seconds
            onComplete: () => {
                // Restart the animation
                setTimeout(() => initializeRocketTwinkle(), Math.random() * 10000 + 5000);
            }
        });
    });
}

// Smooth scroll for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            gsap.to(window, {
                duration: 1,
                scrollTo: {
                    y: target,
                    offsetY: 80
                },
                ease: 'power3.inOut'
            });
        }
    });
});

// Performance optimization
window.addEventListener('beforeunload', () => {
    // Clean up animations
    starfields.forEach(starfield => {
        starfield.isVisible = false;
    });
});

// Intersection Observer for performance
const observerOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0.1
};

const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('in-view');
        }
    });
}, observerOptions);

// Observe all sections
document.querySelectorAll('section').forEach(section => {
    sectionObserver.observe(section);
});