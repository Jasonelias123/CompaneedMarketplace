// Modern JavaScript for Companeeds Landing Page
// Inspired by Linear, Vercel, and Notion interactions

document.addEventListener('DOMContentLoaded', function() {
    initializeNavigation();
    initializeAnimations();
    initializeIntersectionObserver();
    initializeScrollAnimations();
    initializeSmoothScrolling();
});

// Navigation functionality
function initializeNavigation() {
    const navbar = document.querySelector('.navbar');
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const mobileMenu = document.querySelector('.mobile-menu');
    const navLinks = document.querySelectorAll('.mobile-nav-link, .mobile-nav-cta');

    // Handle scroll effects on navbar
    let lastScrollY = window.scrollY;
    let ticking = false;

    function updateNavbar() {
        const scrollY = window.scrollY;
        
        if (scrollY > 20) {
            navbar.style.background = 'rgba(255, 255, 255, 0.98)';
            navbar.style.boxShadow = '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)';
        } else {
            navbar.style.background = 'rgba(255, 255, 255, 0.95)';
            navbar.style.boxShadow = 'none';
        }

        lastScrollY = scrollY;
        ticking = false;
    }

    function requestTick() {
        if (!ticking) {
            requestAnimationFrame(updateNavbar);
            ticking = true;
        }
    }

    window.addEventListener('scroll', requestTick, { passive: true });

    // Mobile menu toggle
    if (mobileMenuBtn && mobileMenu) {
        mobileMenuBtn.addEventListener('click', function() {
            const isOpen = mobileMenu.classList.contains('active');
            
            if (isOpen) {
                closeMobileMenu();
            } else {
                openMobileMenu();
            }
        });

        // Close mobile menu when clicking nav links
        navLinks.forEach(link => {
            link.addEventListener('click', closeMobileMenu);
        });

        // Close mobile menu when clicking outside
        document.addEventListener('click', function(e) {
            if (!navbar.contains(e.target) && mobileMenu.classList.contains('active')) {
                closeMobileMenu();
            }
        });
    }

    function openMobileMenu() {
        mobileMenu.classList.add('active');
        mobileMenuBtn.classList.add('active');
        document.body.style.overflow = 'hidden';
        
        // Animate hamburger to X
        const spans = mobileMenuBtn.querySelectorAll('span');
        spans[0].style.transform = 'rotate(45deg) translate(5px, 5px)';
        spans[1].style.opacity = '0';
        spans[2].style.transform = 'rotate(-45deg) translate(7px, -6px)';
    }

    function closeMobileMenu() {
        mobileMenu.classList.remove('active');
        mobileMenuBtn.classList.remove('active');
        document.body.style.overflow = '';
        
        // Animate X back to hamburger
        const spans = mobileMenuBtn.querySelectorAll('span');
        spans[0].style.transform = '';
        spans[1].style.opacity = '';
        spans[2].style.transform = '';
    }
}

// Enhanced animations
function initializeAnimations() {
    // Add stagger animation to grid items
    const gridItems = document.querySelectorAll('.step-card, .feature-card, .role-card');
    
    gridItems.forEach((item, index) => {
        item.style.animationDelay = `${index * 0.1}s`;
    });

    // Dashboard mockup interactive elements
    const dashboardSteps = document.querySelectorAll('.flow-step');
    
    dashboardSteps.forEach((step, index) => {
        setTimeout(() => {
            step.addEventListener('mouseenter', function() {
                // Add pulse effect
                const icon = step.querySelector('.step-icon');
                if (icon) {
                    icon.style.transform = 'scale(1.1)';
                    icon.style.transition = 'transform 0.3s ease';
                }
            });

            step.addEventListener('mouseleave', function() {
                const icon = step.querySelector('.step-icon');
                if (icon) {
                    icon.style.transform = 'scale(1)';
                }
            });
        }, index * 200);
    });

    // Floating shapes interaction
    const shapes = document.querySelectorAll('.shape');
    
    shapes.forEach(shape => {
        shape.addEventListener('mouseenter', function() {
            this.style.transform = 'scale(1.1)';
            this.style.opacity = '0.8';
        });

        shape.addEventListener('mouseleave', function() {
            this.style.transform = 'scale(1)';
            this.style.opacity = '0.6';
        });
    });
}

// Enhanced Intersection Observer for scroll animations
function initializeIntersectionObserver() {
    const observerOptions = {
        threshold: 0.15,
        rootMargin: '0px 0px -100px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
                entry.target.classList.add('aos-animate');
                
                // Special handling for step cards with stagger effect
                if (entry.target.classList.contains('step-card')) {
                    const stepNumber = entry.target.querySelector('.step-number');
                    if (stepNumber) {
                        setTimeout(() => {
                            stepNumber.style.transform = 'scale(1.1)';
                            setTimeout(() => {
                                stepNumber.style.transform = 'scale(1)';
                            }, 200);
                        }, 300);
                    }
                }

                // Handle grid items with stagger
                if (entry.target.parentElement?.classList.contains('steps-grid') || 
                    entry.target.parentElement?.classList.contains('features-grid') ||
                    entry.target.parentElement?.classList.contains('role-selection')) {
                    
                    const siblings = Array.from(entry.target.parentElement.children);
                    const index = siblings.indexOf(entry.target);
                    entry.target.style.transitionDelay = `${index * 0.1}s`;
                }
            }
        });
    }, observerOptions);

    // Elements to animate on scroll
    const animatedElements = [
        '.section-header',
        '.step-card',
        '.feature-card', 
        '.role-card',
        '.hero-text',
        '.dashboard-preview',
        '.footer',
        '[data-aos]'
    ];

    animatedElements.forEach(selector => {
        document.querySelectorAll(selector).forEach(el => {
            observer.observe(el);
        });
    });

    // Add scroll-animate class to all observable elements
    document.querySelectorAll('.step-card, .feature-card, .role-card').forEach(el => {
        el.classList.add('scroll-animate');
    });
}

// Initialize animations with enhanced effects
function initializeScrollAnimations() {
    // Trigger hero animations on load
    setTimeout(() => {
        const heroText = document.querySelector('.hero-text');
        const dashboardPreview = document.querySelector('.dashboard-preview');
        
        if (heroText) heroText.classList.add('animate-in');
        if (dashboardPreview) {
            setTimeout(() => {
                dashboardPreview.classList.add('animate-in');
            }, 200);
        }
    }, 300);

    // Enhanced scroll-triggered animations
    const scrollElements = document.querySelectorAll('.scroll-animate');
    
    const scrollObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
                
                // Add progressive delay for grid items
                const parent = entry.target.parentElement;
                if (parent?.classList.contains('steps-grid') || 
                    parent?.classList.contains('features-grid')) {
                    
                    const index = Array.from(parent.children).indexOf(entry.target);
                    entry.target.style.transitionDelay = `${index * 0.15}s`;
                }
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -80px 0px'
    });

    scrollElements.forEach(el => scrollObserver.observe(el));
}

// Smooth scrolling
function initializeSmoothScrolling() {
    // Handle anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            
            if (target) {
                const navHeight = document.querySelector('.navbar').offsetHeight;
                const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - navHeight;
                
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
}

// Role selection functions
window.goToRole = function(role) {
    // Add loading state
    const card = event.currentTarget;
    const originalContent = card.innerHTML;
    
    card.style.opacity = '0.7';
    card.style.pointerEvents = 'none';
    
    // Add loading animation
    const cta = card.querySelector('.role-cta');
    if (cta) {
        cta.innerHTML = 'Loading... <div class="spinner"></div>';
    }
    
    // Navigate after short delay for visual feedback
    setTimeout(() => {
        if (role === 'company') {
            window.location.href = 'company-intake-toptal.html';
        } else if (role === 'talent') {
            window.location.href = 'ai-talent-intake-toptal.html';
        }
    }, 300);
};

// Enhanced button interactions
document.addEventListener('DOMContentLoaded', function() {
    // Add ripple effect to buttons
    const buttons = document.querySelectorAll('.btn-primary, .nav-cta, .role-card');
    
    buttons.forEach(button => {
        button.addEventListener('click', function(e) {
            const ripple = document.createElement('span');
            const rect = this.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            const x = e.clientX - rect.left - size / 2;
            const y = e.clientY - rect.top - size / 2;
            
            ripple.style.width = ripple.style.height = size + 'px';
            ripple.style.left = x + 'px';
            ripple.style.top = y + 'px';
            ripple.classList.add('ripple');
            
            this.appendChild(ripple);
            
            setTimeout(() => {
                ripple.remove();
            }, 600);
        });
    });
});

// Performance optimizations
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Optimize scroll events
const optimizedScrollHandler = debounce(function() {
    // Additional scroll-based animations can go here
}, 16); // ~60fps

window.addEventListener('scroll', optimizedScrollHandler, { passive: true });

// Keyboard navigation support
document.addEventListener('keydown', function(e) {
    // Escape key closes mobile menu
    if (e.key === 'Escape') {
        const mobileMenu = document.querySelector('.mobile-menu');
        if (mobileMenu && mobileMenu.classList.contains('active')) {
            const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
            if (mobileMenuBtn) {
                mobileMenuBtn.click();
            }
        }
    }
    
    // Enter key activates role cards
    if (e.key === 'Enter' && e.target.classList.contains('role-card')) {
        e.target.click();
    }
});

// Add CSS for ripple effect and spinner
const style = document.createElement('style');
style.textContent = `
    .ripple {
        position: absolute;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.3);
        transform: scale(0);
        animation: ripple-animation 0.6s linear;
        pointer-events: none;
    }
    
    @keyframes ripple-animation {
        to {
            transform: scale(4);
            opacity: 0;
        }
    }
    
    .spinner {
        display: inline-block;
        width: 16px;
        height: 16px;
        border: 2px solid rgba(255, 255, 255, 0.3);
        border-radius: 50%;
        border-top-color: #fff;
        animation: spin 0.8s linear infinite;
        margin-left: 8px;
    }
    
    @keyframes spin {
        to {
            transform: rotate(360deg);
        }
    }
    
    /* Focus indicators for accessibility */
    .role-card:focus {
        outline: 2px solid var(--color-primary-500);
        outline-offset: 2px;
    }
    
    /* Enhanced hover states */
    .btn-primary:hover {
        box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);
    }
    
    .step-card:hover .step-number {
        transform: scale(1.05);
    }
    
    /* Mobile menu styles */
    .mobile-menu {
        display: none;
        position: absolute;
        top: 100%;
        left: 0;
        right: 0;
        background: rgba(255, 255, 255, 0.98);
        backdrop-filter: blur(20px);
        border-bottom: 1px solid var(--color-gray-200);
        box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1);
    }
    
    .mobile-menu.active {
        display: block;
        animation: slideDown 0.3s ease-out;
    }
    
    @keyframes slideDown {
        from {
            opacity: 0;
            transform: translateY(-10px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
    
    /* Responsive adjustments */
    @media (max-width: 768px) {
        .mobile-menu {
            display: none;
        }
        
        .mobile-menu.active {
            display: block;
        }
        
        .nav-menu {
            display: none;
        }
        
        .mobile-menu-btn {
            display: flex;
        }
    }
`;

document.head.appendChild(style);