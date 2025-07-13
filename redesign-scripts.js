// Modern JavaScript for Companeeds Landing Page

document.addEventListener('DOMContentLoaded', function() {
    initializeAnimations();
    initializeNavigation();
    initializeSmoothScrolling();
});

// Intersection Observer for fade-in animations
function initializeAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, observerOptions);

    // Add fade-in class to elements and observe them
    const animateElements = document.querySelectorAll('.step-card, .benefit-card, .section-header');
    animateElements.forEach((el, index) => {
        el.classList.add('fade-in');
        el.style.transitionDelay = `${index * 100}ms`;
        observer.observe(el);
    });
}

// Navigation functionality
function initializeNavigation() {
    const nav = document.querySelector('.nav-sticky');
    const mobileToggle = document.querySelector('.nav-mobile-toggle');
    const navLinks = document.querySelector('.nav-links');

    // Add scroll effect to navigation
    let lastScrollY = window.scrollY;
    
    window.addEventListener('scroll', () => {
        const currentScrollY = window.scrollY;
        
        if (currentScrollY > 100) {
            nav.style.backgroundColor = 'rgba(255, 255, 255, 0.98)';
            nav.style.boxShadow = '0 4px 6px -1px rgb(0 0 0 / 0.1)';
        } else {
            nav.style.backgroundColor = 'rgba(255, 255, 255, 0.95)';
            nav.style.boxShadow = 'none';
        }
        
        lastScrollY = currentScrollY;
    });

    // Mobile menu toggle (for future implementation)
    if (mobileToggle && navLinks) {
        mobileToggle.addEventListener('click', () => {
            navLinks.classList.toggle('mobile-open');
        });
    }
}

// Smooth scrolling for anchor links
function initializeSmoothScrolling() {
    const links = document.querySelectorAll('a[href^="#"]');
    
    links.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            
            const targetId = link.getAttribute('href').substring(1);
            const targetElement = document.getElementById(targetId);
            
            if (targetElement) {
                const navHeight = document.querySelector('.nav-sticky').offsetHeight;
                const targetPosition = targetElement.getBoundingClientRect().top + window.pageYOffset - navHeight;
                
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
}

// Enhanced CTA button interactions
document.querySelectorAll('.cta-primary, .cta-secondary').forEach(button => {
    button.addEventListener('mouseenter', function() {
        this.style.transform = 'translateY(-2px)';
    });
    
    button.addEventListener('mouseleave', function() {
        this.style.transform = 'translateY(0)';
    });
    
    button.addEventListener('mousedown', function() {
        this.style.transform = 'translateY(0)';
    });
    
    button.addEventListener('mouseup', function() {
        this.style.transform = 'translateY(-2px)';
    });
});

// Dashboard mockup animations
function animateDashboard() {
    const metrics = document.querySelectorAll('.metric-value');
    
    metrics.forEach((metric, index) => {
        const finalValue = metric.textContent;
        const isNumber = !isNaN(parseInt(finalValue));
        
        if (isNumber) {
            const number = parseInt(finalValue);
            let current = 0;
            const increment = number / 30;
            
            const timer = setInterval(() => {
                current += increment;
                if (current >= number) {
                    current = number;
                    clearInterval(timer);
                }
                metric.textContent = Math.floor(current) + (finalValue.includes('%') ? '%' : finalValue.includes('+') ? '+' : '');
            }, 50);
        }
    });
}

// Trigger dashboard animation when it comes into view
const dashboardObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            animateDashboard();
            dashboardObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.5 });

const dashboard = document.querySelector('.dashboard-mockup');
if (dashboard) {
    dashboardObserver.observe(dashboard);
}

// Floating shapes animation enhancement
function enhanceFloatingShapes() {
    const shapes = document.querySelectorAll('.shape');
    
    shapes.forEach((shape, index) => {
        // Add random movement on mouse interaction
        document.addEventListener('mousemove', (e) => {
            const x = (e.clientX / window.innerWidth) * 10;
            const y = (e.clientY / window.innerHeight) * 10;
            
            shape.style.transform = `translate(${x * (index + 1)}px, ${y * (index + 1)}px)`;
        });
    });
}

enhanceFloatingShapes();

// Performance optimization: Debounce scroll events
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

// Add loading states for CTA buttons
document.querySelectorAll('.cta-primary').forEach(button => {
    button.addEventListener('click', function(e) {
        // Add loading state if it's a form submission
        if (this.closest('form')) {
            e.preventDefault();
            this.innerHTML = 'Loading...';
            this.style.pointerEvents = 'none';
            
            // Simulate form submission (replace with actual form handling)
            setTimeout(() => {
                this.innerHTML = 'Get Matched Now <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M6 12L10 8L6 4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
                this.style.pointerEvents = 'auto';
            }, 2000);
        }
    });
});

// Keyboard navigation improvements
document.addEventListener('keydown', function(e) {
    // ESC key to close mobile menu
    if (e.key === 'Escape') {
        const navLinks = document.querySelector('.nav-links');
        if (navLinks && navLinks.classList.contains('mobile-open')) {
            navLinks.classList.remove('mobile-open');
        }
    }
    
    // Tab navigation enhancement
    if (e.key === 'Tab') {
        document.body.classList.add('keyboard-navigation');
    }
});

// Remove keyboard navigation class on mouse use
document.addEventListener('mousedown', function() {
    document.body.classList.remove('keyboard-navigation');
});

// Add CSS for keyboard navigation
const style = document.createElement('style');
style.textContent = `
    .keyboard-navigation *:focus {
        outline: 2px solid var(--primary-600) !important;
        outline-offset: 2px !important;
    }
`;
document.head.appendChild(style);