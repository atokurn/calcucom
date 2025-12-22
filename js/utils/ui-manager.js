/**
 * UIManager - Common UI utilities and interactions
 * Handles toast notifications, animations, and UI state management
 */
const UIManager = (function () {
    'use strict';

    // ==================== TOAST NOTIFICATIONS ====================

    /**
     * Show a toast notification
     * @param {string} message - Toast message
     * @param {string} type - 'success', 'error', 'warning', 'info'
     * @param {number} duration - Duration in milliseconds
     */
    function showToast(message, type = 'info', duration = 3000) {
        const container = document.getElementById('toastContainer');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;

        // Icons for each type
        const icons = {
            success: 'fa-check-circle',
            error: 'fa-times-circle',
            warning: 'fa-exclamation-triangle',
            info: 'fa-info-circle'
        };

        const icon = icons[type] || icons.info;

        toast.innerHTML = `
            <i class="fas ${icon}" aria-hidden="true"></i>
            <span>${message}</span>
        `;

        container.appendChild(toast);

        // Trigger animation
        setTimeout(() => toast.classList.add('show'), 10);

        // Remove after duration
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, duration);
    }

    // ==================== TEXT UPDATES ====================

    /**
     * Set text content of element by ID
     * @param {string} id - Element ID
     * @param {string} text - Text content
     */
    function setText(id, text) {
        const el = document.getElementById(id);
        if (el) el.innerText = text;
    }

    /**
     * Set HTML content of element by ID
     * @param {string} id - Element ID
     * @param {string} html - HTML content
     */
    function setHTML(id, html) {
        const el = document.getElementById(id);
        if (el) el.innerHTML = html;
    }

    /**
     * Show/hide element by ID
     * @param {string} id - Element ID
     * @param {boolean} show - Whether to show
     */
    function toggleVisibility(id, show) {
        const el = document.getElementById(id);
        if (el) {
            if (show) {
                el.classList.remove('hidden');
            } else {
                el.classList.add('hidden');
            }
        }
    }

    // ==================== ANIMATIONS ====================

    /**
     * Animate a value change
     * @param {string} id - Element ID
     */
    function animateValue(id) {
        const el = document.getElementById(id);
        if (!el) return;

        el.classList.add('value-animation');
        setTimeout(() => el.classList.remove('value-animation'), 500);
    }

    /**
     * Add pulse animation to element
     * @param {string} id - Element ID
     */
    function pulseElement(id) {
        const el = document.getElementById(id);
        if (!el) return;

        el.classList.add('pulse');
        setTimeout(() => el.classList.remove('pulse'), 600);
    }

    // ==================== DEBOUNCE ====================

    /**
     * Create a debounced function
     * @param {Function} func - Function to debounce
     * @param {number} wait - Wait time in ms
     * @returns {Function}
     */
    function debounce(func, wait = 300) {
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

    // ==================== COPY TO CLIPBOARD ====================

    /**
     * Copy text to clipboard
     * @param {string} text - Text to copy
     * @param {string} successMessage - Message to show on success
     */
    async function copyToClipboard(text, successMessage = 'Berhasil disalin!') {
        try {
            await navigator.clipboard.writeText(text);
            showToast(successMessage, 'success');
        } catch (err) {
            // Fallback for older browsers
            const textarea = document.createElement('textarea');
            textarea.value = text;
            textarea.style.position = 'fixed';
            textarea.style.left = '-9999px';
            document.body.appendChild(textarea);
            textarea.select();

            try {
                document.execCommand('copy');
                showToast(successMessage, 'success');
            } catch (e) {
                showToast('Gagal menyalin', 'error');
            }

            document.body.removeChild(textarea);
        }
    }

    /**
     * Copy calculator results to clipboard
     */
    function copyResults() {
        // Gather key values
        const profit = document.getElementById('finalProfit')?.innerText || '0';
        const margin = document.getElementById('finalMarginBadge')?.innerText || '';
        const net = document.getElementById('netIncome')?.innerText || '0';

        const text = `📊 Hasil Kalkulasi CekBiayaJualan\n` +
            `💰 Profit: ${profit}\n` +
            `📈 ${margin}\n` +
            `💵 Net Income: ${net}`;

        copyToClipboard(text, 'Hasil berhasil disalin!');
    }

    // ==================== SCROLL ====================

    /**
     * Scroll to element by ID
     * @param {string} id - Element ID
     * @param {string} behavior - 'smooth' or 'auto'
     */
    function scrollToElement(id, behavior = 'smooth') {
        const el = document.getElementById(id);
        if (el) {
            el.scrollIntoView({ behavior, block: 'start' });
        }
    }

    /**
     * Scroll to top of page
     * @param {string} behavior - 'smooth' or 'auto'
     */
    function scrollToTop(behavior = 'smooth') {
        window.scrollTo({ top: 0, behavior });
    }

    // ==================== MODAL HELPERS ====================

    /**
     * Open a modal by ID
     * @param {string} id - Modal element ID
     */
    function openModal(id) {
        const modal = document.getElementById(id);
        if (modal) {
            modal.classList.remove('hidden');
            document.body.style.overflow = 'hidden'; // Prevent background scroll
        }
    }

    /**
     * Close a modal by ID
     * @param {string} id - Modal element ID
     */
    function closeModal(id) {
        const modal = document.getElementById(id);
        if (modal) {
            modal.classList.add('hidden');
            document.body.style.overflow = ''; // Restore scroll
        }
    }

    // ==================== THEME ====================

    /**
     * Toggle dark mode
     */
    function toggleTheme() {
        const html = document.documentElement;
        const isDark = html.classList.toggle('dark');

        localStorage.setItem('theme', isDark ? 'dark' : 'light');

        // Update theme label if exists
        const label = document.getElementById('themeLabel');
        if (label) {
            label.innerText = isDark ? '🌙' : '☀️';
        }

        return isDark;
    }

    /**
     * Apply saved theme on load
     */
    function applyStoredTheme() {
        const savedTheme = localStorage.getItem('theme');
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

        if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
            document.documentElement.classList.add('dark');
        }
    }

    // ==================== ACCORDION ====================

    /**
     * Toggle accordion item
     * @param {string|Element} triggerEl - Trigger element or ID
     */
    function toggleAccordion(triggerEl) {
        const trigger = typeof triggerEl === 'string'
            ? document.getElementById(triggerEl)
            : triggerEl;

        if (!trigger) return;

        const content = trigger.nextElementSibling;
        const icon = trigger.querySelector('.accordion-icon, .fa-chevron-down');

        if (content) {
            content.classList.toggle('hidden');
        }

        if (icon) {
            icon.classList.toggle('rotate-180');
        }

        // Update aria-expanded
        const isExpanded = !content?.classList.contains('hidden');
        trigger.setAttribute('aria-expanded', isExpanded);
    }

    // ==================== PUBLIC API ====================

    return {
        // Toast
        showToast,

        // Text/HTML
        setText,
        setHTML,
        toggleVisibility,

        // Animations
        animateValue,
        pulseElement,

        // Utilities
        debounce,
        copyToClipboard,
        copyResults,

        // Scroll
        scrollToElement,
        scrollToTop,

        // Modals
        openModal,
        closeModal,

        // Theme
        toggleTheme,
        applyStoredTheme,

        // Accordion
        toggleAccordion
    };
})();

// ==================== BACKWARD COMPATIBILITY ====================

if (typeof window !== 'undefined') {
    window.UIManager = UIManager;

    // Legacy function mappings
    window.showToast = UIManager.showToast;
    window.copyResults = UIManager.copyResults;
    window.toggleAccordionItem = UIManager.toggleAccordion;

    // Apply theme on load
    UIManager.applyStoredTheme();
}
