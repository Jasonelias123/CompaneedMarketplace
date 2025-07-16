// FAQ Accordion Functionality
document.addEventListener('DOMContentLoaded', function() {
    initializeFAQ();
});

function initializeFAQ() {
    const faqItems = document.querySelectorAll('.faq-item');
    
    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        const answer = item.querySelector('.faq-answer');
        
        question.addEventListener('click', () => {
            toggleFAQItem(question, answer);
        });
        
        // Add keyboard support
        question.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                toggleFAQItem(question, answer);
            }
        });
    });
}

function toggleFAQItem(question, answer) {
    const isExpanded = question.getAttribute('aria-expanded') === 'true';
    
    // Close all other FAQ items
    const allQuestions = document.querySelectorAll('.faq-question');
    const allAnswers = document.querySelectorAll('.faq-answer');
    
    allQuestions.forEach(q => {
        q.setAttribute('aria-expanded', 'false');
    });
    
    allAnswers.forEach(a => {
        a.classList.remove('active');
    });
    
    // Toggle current item (if it wasn't already open)
    if (!isExpanded) {
        question.setAttribute('aria-expanded', 'true');
        answer.classList.add('active');
        
        // Smooth scroll to the question
        setTimeout(() => {
            question.scrollIntoView({
                behavior: 'smooth',
                block: 'start',
                inline: 'nearest'
            });
        }, 100);
    }
}

// Search functionality (optional enhancement)
function initializeFAQSearch() {
    const searchInput = document.getElementById('faq-search');
    if (!searchInput) return;
    
    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        const faqItems = document.querySelectorAll('.faq-item');
        
        faqItems.forEach(item => {
            const question = item.querySelector('.faq-question span').textContent.toLowerCase();
            const answer = item.querySelector('.faq-answer p').textContent.toLowerCase();
            
            if (question.includes(searchTerm) || answer.includes(searchTerm)) {
                item.style.display = 'block';
            } else {
                item.style.display = 'none';
            }
        });
        
        // Show/hide category headers based on visible items
        const categories = document.querySelectorAll('.faq-category');
        categories.forEach(category => {
            const visibleItems = category.querySelectorAll('.faq-item[style="display: block"], .faq-item:not([style*="display: none"])');
            if (visibleItems.length === 0) {
                category.style.display = 'none';
            } else {
                category.style.display = 'block';
            }
        });
    });
}

// Initialize search if search input exists
document.addEventListener('DOMContentLoaded', function() {
    initializeFAQSearch();
});

// Analytics tracking (optional)
function trackFAQInteraction(question) {
    // Add analytics tracking here if needed
    if (typeof gtag !== 'undefined') {
        gtag('event', 'faq_question_opened', {
            'question': question.querySelector('span').textContent,
            'page_location': window.location.href
        });
    }
}

// Smooth animations for better UX
function addSmoothAnimations() {
    const style = document.createElement('style');
    style.textContent = `
        .faq-answer {
            transition: max-height 0.3s ease-in-out, opacity 0.3s ease-in-out;
            max-height: 0;
            opacity: 0;
            overflow: hidden;
        }
        
        .faq-answer.active {
            max-height: 200px;
            opacity: 1;
            transition: max-height 0.3s ease-in-out, opacity 0.3s ease-in-out;
        }
    `;
    document.head.appendChild(style);
}

// Initialize smooth animations
document.addEventListener('DOMContentLoaded', addSmoothAnimations);