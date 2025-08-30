/**
 * Theme Toggle JavaScript
 * Handles dark/light mode switching with localStorage persistence
 */

(function() {
    'use strict';
    
    // Theme management
    function getStoredTheme() {
        return localStorage.getItem('theme');
    }
    
    function setStoredTheme(theme) {
        localStorage.setItem('theme', theme);
    }
    
    function getPreferredTheme() {
        const storedTheme = getStoredTheme();
        if (storedTheme) {
            return storedTheme;
        }
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    
    function setTheme(theme) {
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }
    
    function showActiveTheme(theme) {
        const themeSwitcher = document.querySelector('#theme-toggle');
        if (!themeSwitcher) return;
        
        const sunIcon = themeSwitcher.querySelector('svg:first-child');
        const moonIcon = themeSwitcher.querySelector('svg:last-child');
        
        if (theme === 'dark') {
            sunIcon?.classList.remove('hidden');
            moonIcon?.classList.add('hidden');
        } else {
            sunIcon?.classList.add('hidden');
            moonIcon?.classList.remove('hidden');
        }
        
        themeSwitcher.setAttribute('aria-label', `Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`);
    }
    
    // Initialize theme on page load
    function initTheme() {
        const theme = getPreferredTheme();
        setTheme(theme);
        showActiveTheme(theme);
    }
    
    // Toggle theme function
    function toggleTheme() {
        const currentTheme = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        setTheme(newTheme);
        setStoredTheme(newTheme);
        showActiveTheme(newTheme);
    }
    
    // Wait for DOM to be ready
    function ready(fn) {
        if (document.readyState !== 'loading') {
            fn();
        } else {
            document.addEventListener('DOMContentLoaded', fn);
        }
    }
    
    // Initialize everything when DOM is ready
    ready(function() {
        initTheme();
        
        // Add click event listener to theme toggle button
        const themeSwitcher = document.querySelector('#theme-toggle');
        if (themeSwitcher) {
            themeSwitcher.addEventListener('click', toggleTheme);
        }
        
        // Listen for system theme changes
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function(e) {
            const storedTheme = getStoredTheme();
            if (!storedTheme) {
                setTheme(e.matches ? 'dark' : 'light');
                showActiveTheme(e.matches ? 'dark' : 'light');
            }
        });
    });
    
    // Export functions for potential external use
    window.themeManager = {
        getPreferredTheme,
        setTheme,
        toggleTheme,
        getStoredTheme,
        setStoredTheme
    };
})();