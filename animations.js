// Dynamic Loading Animations System
class AnimationController {
    constructor() {
        this.init();
        this.setupIntersectionObserver();
        this.addPageLoadAnimations();
    }

    init() {
        // Bind methods to maintain context
        this.handleIntersection = this.handleIntersection.bind(this);
        this.animateCounter = this.animateCounter.bind(this);
    }

    setupIntersectionObserver() {
        // Create intersection observer for scroll animations
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        this.observer = new IntersectionObserver(this.handleIntersection, observerOptions);

        // Observe all elements with animation classes
        document.addEventListener('DOMContentLoaded', () => {
            this.observeElements();
        });
    }

    observeElements() {
        const animatedElements = document.querySelectorAll('.animate-on-scroll');
        animatedElements.forEach(element => {
            this.observer.observe(element);
        });
    }

    handleIntersection(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animated');
                
                // Handle special animation types
                if (entry.target.classList.contains('counter')) {
                    this.animateCounter(entry.target);
                }
                
                // Add staggered animation for child elements
                this.staggerChildAnimations(entry.target);
                
                // Unobserve after animation starts
                this.observer.unobserve(entry.target);
            }
        });
    }

    staggerChildAnimations(parent) {
        const children = parent.querySelectorAll('.animate-child');
        children.forEach((child, index) => {
            setTimeout(() => {
                child.classList.add('animated');
            }, index * 100);
        });
    }

    animateCounter(element) {
        const target = parseInt(element.dataset.target || element.textContent);
        const duration = parseInt(element.dataset.duration) || 2000;
        const start = 0;
        const increment = target / (duration / 16);
        let current = start;

        const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
                current = target;
                clearInterval(timer);
            }
            element.textContent = Math.floor(current);
        }, 16);
    }

    addPageLoadAnimations() {
        document.addEventListener('DOMContentLoaded', () => {
            // Add initial loading state
            document.body.classList.add('loaded');
            
            // Trigger any immediate animations
            this.triggerImmediateAnimations();
        });
    }

    triggerImmediateAnimations() {
        // Animate elements that should appear immediately
        const immediateElements = document.querySelectorAll('.animate-immediate');
        immediateElements.forEach((element, index) => {
            setTimeout(() => {
                element.classList.add('animated');
            }, index * 200);
        });
    }

    // Method to manually trigger animations
    triggerAnimation(selector, animationType = 'fade-up') {
        const elements = document.querySelectorAll(selector);
        elements.forEach((element, index) => {
            element.classList.add('animate-on-scroll', `animate-${animationType}`);
            setTimeout(() => {
                element.classList.add('animated');
            }, index * 100);
        });
    }

    // Method to add new content with animations
    addAnimatedContent(container, content, animationType = 'fade-up') {
        const wrapper = document.createElement('div');
        wrapper.innerHTML = content;
        wrapper.classList.add('animate-on-scroll', `animate-${animationType}`);
        
        container.appendChild(wrapper);
        this.observer.observe(wrapper);
        
        return wrapper;
    }

    // Method to create loading skeleton animations
    createLoadingSkeleton(container, items = 3) {
        for (let i = 0; i < items; i++) {
            const skeleton = document.createElement('div');
            skeleton.className = 'skeleton-item animate-pulse';
            skeleton.style.cssText = `
                height: 60px;
                background: linear-gradient(90deg, rgba(255,255,255,0.1) 25%, rgba(255,255,255,0.2) 50%, rgba(255,255,255,0.1) 75%);
                background-size: 200% 100%;
                animation: shimmer 1.5s infinite;
                border-radius: 8px;
                margin-bottom: 16px;
            `;
            container.appendChild(skeleton);
        }
    }

    // Method to remove loading skeletons
    removeLoadingSkeletons(container) {
        const skeletons = container.querySelectorAll('.skeleton-item');
        skeletons.forEach(skeleton => {
            skeleton.classList.add('animate-fade-out');
            setTimeout(() => {
                skeleton.remove();
            }, 300);
        });
    }
}

// CSS for shimmer effect
const shimmerCSS = `
@keyframes shimmer {
    0% { background-position: -200% 0; }
    100% { background-position: 200% 0; }
}

@keyframes animate-pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
}

.skeleton-item {
    animation: shimmer 1.5s infinite, animate-pulse 2s infinite;
}

.animate-fade-out {
    opacity: 0;
    transform: scale(0.9);
    transition: all 0.3s ease;
}
`;

// Add shimmer CSS to document
const style = document.createElement('style');
style.textContent = shimmerCSS;
document.head.appendChild(style);

// Initialize animation controller
const animationController = new AnimationController();

// Export for global access
window.AnimationController = AnimationController;
window.animationController = animationController;

// Helper functions for easy use
window.animateElement = (selector, type = 'fade-up') => {
    animationController.triggerAnimation(selector, type);
};

window.addAnimatedContent = (container, content, type = 'fade-up') => {
    return animationController.addAnimatedContent(container, content, type);
};

// Utility function to add animation classes to existing elements
window.makeAnimated = (element, animationType = 'fade-up', delay = 0) => {
    if (typeof element === 'string') {
        element = document.querySelector(element);
    }
    if (element) {
        element.classList.add('animate-on-scroll', `animate-${animationType}`);
        if (delay > 0) {
            element.classList.add(`delay-${delay}`);
        }
        animationController.observer.observe(element);
    }
};

console.log('🎬 Dynamic animations system loaded');