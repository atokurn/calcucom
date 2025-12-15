/**
 * Formatters - Utility functions for formatting values
 * Using IIFE pattern for browser compatibility
 */
const Formatters = (function () {
    'use strict';

    /**
     * Format number to Indonesian Rupiah format
     * @param {number} value - Number to format
     * @param {boolean} withSymbol - Include "Rp" prefix
     * @returns {string}
     */
    function formatRupiah(value, withSymbol = true) {
        if (value === null || value === undefined || isNaN(value)) {
            return withSymbol ? 'Rp 0' : '0';
        }

        const absValue = Math.abs(value);
        const formatted = absValue.toLocaleString('id-ID');
        const sign = value < 0 ? '-' : '';

        return withSymbol ? `${sign}Rp ${formatted}` : `${sign}${formatted}`;
    }

    /**
     * Format number with thousand separators
     * @param {number|string} value 
     * @returns {string}
     */
    function formatThousands(value) {
        if (!value) return '';
        const numericValue = parseNumber(value);
        return numericValue.toLocaleString('id-ID');
    }

    /**
     * Parse formatted number string to number
     * @param {string|number} value 
     * @returns {number}
     */
    function parseNumber(value) {
        if (typeof value === 'number') return value;
        if (!value) return 0;

        // Remove all non-numeric characters except minus and decimal
        const cleaned = String(value)
            .replace(/[Rp\s.]/gi, '')
            .replace(/,/g, '.');

        return parseFloat(cleaned) || 0;
    }

    /**
     * Format percentage value
     * @param {number} value 
     * @param {number} decimals 
     * @returns {string}
     */
    function formatPercent(value, decimals = 1) {
        if (value === null || value === undefined || isNaN(value)) {
            return '0%';
        }
        return `${value.toFixed(decimals)}%`;
    }

    /**
     * Format number for input field with separators
     * @param {HTMLInputElement} input 
     */
    function formatInputWithSeparator(input) {
        if (!input) return;

        const cursorPos = input.selectionStart;
        const oldLength = input.value.length;

        // Parse and reformat
        const numValue = parseNumber(input.value);
        const formatted = numValue > 0 ? formatThousands(numValue) : '';

        input.value = formatted;

        // Restore cursor position
        const newLength = formatted.length;
        const diff = newLength - oldLength;
        const newPos = Math.max(0, cursorPos + diff);

        input.setSelectionRange(newPos, newPos);
    }

    /**
     * Format ROAS value
     * @param {number} value 
     * @returns {string}
     */
    function formatROAS(value) {
        if (!value || isNaN(value) || !isFinite(value)) return '0x';
        return `${value.toFixed(2)}x`;
    }

    /**
     * Compact number format (e.g., 1.5jt, 150rb)
     * @param {number} value 
     * @returns {string}
     */
    function formatCompact(value) {
        if (!value) return 'Rp 0';

        const absValue = Math.abs(value);
        const sign = value < 0 ? '-' : '';

        if (absValue >= 1000000000) {
            return `${sign}Rp ${(absValue / 1000000000).toFixed(1)}M`;
        }
        if (absValue >= 1000000) {
            return `${sign}Rp ${(absValue / 1000000).toFixed(1)}jt`;
        }
        if (absValue >= 1000) {
            return `${sign}Rp ${(absValue / 1000).toFixed(0)}rb`;
        }
        return formatRupiah(value);
    }

    // Return public API
    return {
        formatRupiah,
        formatThousands,
        parseNumber,
        formatPercent,
        formatInputWithSeparator,
        formatROAS,
        formatCompact
    };
})();

// Make available globally
if (typeof window !== 'undefined') {
    window.Formatters = Formatters;
}
