/**
 * Debounce - Debounce utility for input handlers
 * Using IIFE pattern for browser compatibility
 */
const DebounceUtils = (function () {
    'use strict';

    /**
     * Create a debounced version of a function
     * @param {Function} func - Function to debounce
     * @param {number} wait - Milliseconds to wait
     * @param {boolean} immediate - Trigger on leading edge
     * @returns {Function}
     */
    function debounce(func, wait = 150, immediate = false) {
        let timeout;

        return function executedFunction(...args) {
            const context = this;

            const later = function () {
                timeout = null;
                if (!immediate) func.apply(context, args);
            };

            const callNow = immediate && !timeout;

            clearTimeout(timeout);
            timeout = setTimeout(later, wait);

            if (callNow) func.apply(context, args);
        };
    }

    /**
     * Create a throttled version of a function
     * @param {Function} func - Function to throttle
     * @param {number} limit - Minimum time between calls
     * @returns {Function}
     */
    function throttle(func, limit = 150) {
        let inThrottle;

        return function executedFunction(...args) {
            const context = this;

            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    // Return public API
    return {
        debounce,
        throttle
    };
})();

// Make available globally
if (typeof window !== 'undefined') {
    window.DebounceUtils = DebounceUtils;
    // Also expose debounce directly for convenience
    window.debounce = DebounceUtils.debounce;
    window.throttle = DebounceUtils.throttle;
}
