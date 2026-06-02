/**
 * Sanitize - small escaping helpers for safe DOM rendering.
 *
 * Use escapeHtml() for any user-controlled value before injecting it into
 * template strings assigned to innerHTML. Prefer textContent/createElement for
 * new UI code when possible.
 */
const Sanitize = (function () {
    'use strict';

    /**
     * Escape HTML special characters.
     * @param {unknown} value
     * @returns {string}
     */
    function escapeHtml(value) {
        return String(value ?? '')
            .replaceAll('&', '&amp;')
            .replaceAll('<', '&lt;')
            .replaceAll('>', '&gt;')
            .replaceAll('"', '&quot;')
            .replaceAll("'", '&#039;');
    }

    return { escapeHtml };
})();

if (typeof window !== 'undefined') {
    window.Sanitize = Sanitize;
    window.escapeHtml = Sanitize.escapeHtml;
}
