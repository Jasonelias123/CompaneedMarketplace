/* ===== GOD LEVEL INTERACTIVE ENHANCEMENTS ===== */

class GodLevelAnimations {
    constructor() {
        this.init();
    }

    init() {
        this.setupIntersectionObserver();
        this.setupParallaxScrolling();
        this.setupCursorEffects();
        this.setupParticleSystem();
        this.setupAdvancedHovers();
        this.setupSmoothScrolling();
        this.setupDynamicBackgrounds();
        this.setupTypingAnimations();
        this.setupMorphingElements();
    }

    // Advanced Intersection Observer for Scroll Animations
    setupIntersectionObserver() {
        const observerOptions = {
            threshold: [0, 0.1, 0.25, 0.5, 0.75, 1],
            rootMargin: '-10% 0px -10% 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const element = entry.target;
                    
                    // Apply different animations based on data attributes
                    if (element.dataset.animation === 'fadeInUp') {
                        element.classList.add('animate-fadeInUp');
                    } else if (element.dataset.animation === 'fadeInLeft') {
                        element.classList.add('animate-fadeInLeft');
                    } else if (element.dataset.animation === 'fadeInRight') {
                        element.classList.add('animate-fadeInRight');
                    } else if (element.dataset.animation === 'zoomIn') {
                        element.classList.add('animate-zoomIn');
                    }
                    
                    // Add revealed class for custom animations
                    element.classList.add('revealed');
                    
                    // Stagger animations for grid elements
                    if (element.classList.contains('stagger-animation')) {
                        const children = element.children;
                        Array.from(children).forEach((child, index) => {
                            setTimeout(() => {
                                child.classList.add('revealed');
                            }, index * 150);
                        });
                    }
                }
            });
        }, observerOptions);

        // Observe all animated elements
        document.querySelectorAll('.scroll-reveal, .scroll-reveal-left, .scroll-reveal-right, [data-animation]').forEach(el => {
            observer.observe(el);
        });
    }

    // Advanced Parallax Scrolling
    setupParallaxScrolling() {
        let ticking = false;

        const updateParallax = () => {
            const scrollTop = window.pageYOffset;
            
            // Parallax for hero background
            const heroSection = document.querySelector('.hero-section');
            if (heroSection) {
                const speed = scrollTop * 0.5;
                heroSection.style.transform = `translateY(${speed}px)`;
            }

            // Parallax for floating elements
            document.querySelectorAll('.parallax-element').forEach((element, index) => {
                const speed = (index + 1) * 0.2;
                const yPos = -(scrollTop * speed);
                element.style.transform = `translate3d(0, ${yPos}px, 0)`;
            });

            ticking = false;
        };

        const requestTick = () => {
            if (!ticking) {
                requestAnimationFrame(updateParallax);
                ticking = true;
            }
        };

        window.addEventListener('scroll', requestTick, { passive: true });
    }

    // Advanced Cursor Effects
    setupCursorEffects() {
        // Create custom cursor
        const cursor = document.createElement('div');
        cursor.className = 'custom-cursor';
        cursor.innerHTML = '<div class="cursor-inner"></div>';
        document.body.appendChild(cursor);

        let mouseX = 0, mouseY = 0;
        let cursorX = 0, cursorY = 0;

        // Smooth cursor following
        const animateCursor = () => {
            const dx = mouseX - cursorX;
            const dy = mouseY - cursorY;
            
            cursorX += dx * 0.1;
            cursorY += dy * 0.1;
            
            cursor.style.transform = `translate(${cursorX - 20}px, ${cursorY - 20}px)`;
            
            requestAnimationFrame(animateCursor);
        };

        document.addEventListener('mousemove', (e) => {
            mouseX = e.clientX;
            mouseY = e.clientY;
        });

        animateCursor();

        // Interactive hover effects
        document.querySelectorAll('a, button, .interactive').forEach(element => {
            element.addEventListener('mouseenter', () => {
                cursor.classList.add('cursor-hover');
            });
            
            element.addEventListener('mouseleave', () => {
                cursor.classList.remove('cursor-hover');
            });
        });
    }

    // Dynamic Particle System
    setupParticleSystem() {
        const createParticle = () => {
            const particle = document.createElement('div');
            particle.className = 'particle';
            
            // Random starting position
            particle.style.left = Math.random() * 100 + '%';
            particle.style.animationDelay = Math.random() * 8 + 's';
            particle.style.animationDuration = (8 + Math.random() * 4) + 's';
            
            return particle;
        };

        // Add particles to hero section
        const heroSection = document.querySelector('.hero-section');
        if (heroSection) {
            const particlesContainer = document.createElement('div');
            particlesContainer.className = 'floating-particles';
            
            // Create 20 particles
            for (let i = 0; i < 20; i++) {
                particlesContainer.appendChild(createParticle());
            }
            
            heroSection.appendChild(particlesContainer);
        }
    }

    // Advanced Hover Effects
    setupAdvancedHovers() {
        // Royal purple cards enhanced hover
        document.querySelectorAll('.royal-purple-card').forEach(card => {
            card.addEventListener('mouseenter', () => {
                card.style.transform = 'translateY(-15px) rotateY(8deg) rotateX(8deg) scale(1.05)';
                card.style.zIndex = '10';
                
                // Create ripple effect
                const ripple = document.createElement('div');
                ripple.className = 'hover-ripple';
                card.appendChild(ripple);
                
                setTimeout(() => {
                    ripple.remove();
                }, 600);
            });
            
            card.addEventListener('mouseleave', () => {
                card.style.transform = 'translateY(0) rotateY(0deg) rotateX(0deg) scale(1)';
                card.style.zIndex = '1';
            });
        });

        // Button magnetic effect
        document.querySelectorAll('.cta-button, .btn-primary').forEach(button => {
            button.addEventListener('mousemove', (e) => {
                const rect = button.getBoundingClientRect();
                const x = e.clientX - rect.left - rect.width / 2;
                const y = e.clientY - rect.top - rect.height / 2;
                
                button.style.transform = `translate(${x * 0.1}px, ${y * 0.1}px) scale(1.05)`;
            });
            
            button.addEventListener('mouseleave', () => {
                button.style.transform = 'translate(0px, 0px) scale(1)';
            });
        });
    }

    // Ultra Smooth Scrolling
    setupSmoothScrolling() {
        // Smooth anchor scrolling
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                const target = document.querySelector(this.getAttribute('href'));
                
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });

        // Scroll progress indicator
        const createScrollProgress = () => {
            const progressBar = document.createElement('div');
            progressBar.className = 'scroll-progress';
            progressBar.innerHTML = '<div class="scroll-progress-bar"></div>';
            document.body.appendChild(progressBar);

            window.addEventListener('scroll', () => {
                const windowHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
                const scrolled = (window.scrollY / windowHeight) * 100;
                progressBar.querySelector('.scroll-progress-bar').style.width = scrolled + '%';
            });
        };

        createScrollProgress();
    }

    // Dynamic Background Morphing
    setupDynamicBackgrounds() {
        const sections = document.querySelectorAll('section');
        
        sections.forEach((section, index) => {
            // Add dynamic gradient based on scroll position
            const updateGradient = () => {
                const rect = section.getBoundingClientRect();
                const viewportHeight = window.innerHeight;
                const elementVisible = rect.top < viewportHeight && rect.bottom > 0;
                
                if (elementVisible) {
                    const scrollProgress = Math.max(0, Math.min(1, (viewportHeight - rect.top) / viewportHeight));
                    const hue = 250 + (scrollProgress * 60); // Purple to blue range
                    
                    if (section.classList.contains('royal-purple-section')) {
                        section.style.filter = `hue-rotate(${hue}deg) saturate(${1 + scrollProgress * 0.5})`;
                    }
                }
            };

            window.addEventListener('scroll', updateGradient, { passive: true });
            updateGradient();
        });
    }

    // Advanced Typing Animations
    setupTypingAnimations() {
        const typeWriterElements = document.querySelectorAll('[data-typewriter]');
        
        typeWriterElements.forEach(element => {
            const text = element.textContent;
            element.textContent = '';
            element.style.borderRight = '2px solid';
            
            let i = 0;
            const typeWriter = () => {
                if (i < text.length) {
                    element.textContent += text.charAt(i);
                    i++;
                    setTimeout(typeWriter, 50 + Math.random() * 50);
                } else {
                    element.style.borderRight = 'none';
                }
            };
            
            // Start typing when element comes into view
            const observer = new IntersectionObserver((entries) => {
                if (entries[0].isIntersecting) {
                    setTimeout(typeWriter, 500);
                    observer.disconnect();
                }
            });
            
            observer.observe(element);
        });
    }

    // Morphing UI Elements
    setupMorphingElements() {
        // Logo morphing on scroll
        const logo = document.querySelector('.logo');
        if (logo) {
            window.addEventListener('scroll', () => {
                const scrolled = window.scrollY;
                const rate = scrolled * -0.5;
                
                logo.style.transform = `translateY(${rate}px) rotateY(${scrolled * 0.1}deg)`;
            }, { passive: true });
        }

        // Navigation morphing
        const nav = document.querySelector('.nav');
        if (nav) {
            let lastScrollY = window.scrollY;
            
            window.addEventListener('scroll', () => {
                const currentScrollY = window.scrollY;
                
                if (currentScrollY > 100) {
                    nav.classList.add('nav-scrolled');
                } else {
                    nav.classList.remove('nav-scrolled');
                }
                
                // Hide/show nav based on scroll direction
                if (currentScrollY > lastScrollY && currentScrollY > 200) {
                    nav.style.transform = 'translateY(-100%)';
                } else {
                    nav.style.transform = 'translateY(0)';
                }
                
                lastScrollY = currentScrollY;
            }, { passive: true });
        }
    }
}

// CSS for custom cursor and effects
const advancedStyles = `
<style>
.custom-cursor {
    position: fixed;
    width: 40px;
    height: 40px;
    border: 2px solid rgba(123, 58, 237, 0.6);
    border-radius: 50%;
    pointer-events: none;
    z-index: 9999;
    mix-blend-mode: difference;
    transition: all 0.3s ease;
}

.cursor-inner {
    width: 8px;
    height: 8px;
    background: rgba(123, 58, 237, 0.8);
    border-radius: 50%;
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
}

.cursor-hover {
    transform: scale(1.5);
    background: rgba(123, 58, 237, 0.1);
}

.scroll-progress {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 4px;
    background: rgba(255, 255, 255, 0.1);
    z-index: 1000;
}

.scroll-progress-bar {
    height: 100%;
    background: linear-gradient(90deg, #663399, #7c3aed, #8b5cf6);
    width: 0%;
    transition: width 0.3s ease;
}

.hover-ripple {
    position: absolute;
    top: 50%;
    left: 50%;
    width: 0;
    height: 0;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.3);
    transform: translate(-50%, -50%);
    animation: ripple 0.6s ease-out;
}

@keyframes ripple {
    to {
        width: 200px;
        height: 200px;
        opacity: 0;
    }
}

.nav-scrolled {
    backdrop-filter: blur(20px);
    background: rgba(26, 26, 46, 0.9) !important;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3) !important;
}

.nav {
    transition: all 0.4s cubic-bezier(0.23, 1, 0.32, 1) !important;
}

@media (pointer: coarse) {
    .custom-cursor {
        display: none;
    }
}
</style>
`;

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Add advanced styles
    document.head.insertAdjacentHTML('beforeend', advancedStyles);
    
    // Initialize god level animations
    new GodLevelAnimations();
    
    // Add GPU acceleration classes
    document.querySelectorAll('.royal-purple-card, .hero-section, .cta-button').forEach(el => {
        el.classList.add('gpu-accelerated');
    });
});

// Performance monitoring and optimization
const performanceMonitor = {
    init() {
        // Monitor frame rate
        let lastTime = performance.now();
        let frameCount = 0;
        
        const checkPerformance = (currentTime) => {
            frameCount++;
            
            if (currentTime - lastTime >= 1000) {
                const fps = Math.round((frameCount * 1000) / (currentTime - lastTime));
                
                // Reduce animations if performance is poor
                if (fps < 30) {
                    document.documentElement.classList.add('reduce-motion');
                } else {
                    document.documentElement.classList.remove('reduce-motion');
                }
                
                frameCount = 0;
                lastTime = currentTime;
            }
            
            requestAnimationFrame(checkPerformance);
        };
        
        requestAnimationFrame(checkPerformance);
    }
};

// Start performance monitoring
performanceMonitor.init();