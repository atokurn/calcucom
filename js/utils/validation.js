/**
 * Validation - Input validation utilities
 * Using IIFE pattern for browser compatibility
 */
const Validation = (function () {
    'use strict';

    // ==================== CONSTANTS ====================

    const LIMITS = {
        MAX_PRICE: 999999999,
        MIN_PRICE: 0,
        MAX_PERCENT: 100,
        MIN_PERCENT: 0,
        MAX_QUANTITY: 9999,
        MIN_QUANTITY: 1
    };

    // ==================== VALIDATION FUNCTIONS ====================

    /**
     * Validate price value (0 to max)
     * @param {number|string} value - Value to validate
     * @param {number} min - Minimum value (default 0)
     * @param {number} max - Maximum value (default MAX_PRICE)
     * @returns {number} Validated price
     */
    function validatePrice(value, min = LIMITS.MIN_PRICE, max = LIMITS.MAX_PRICE) {
        const num = parseNumber(value);
        if (isNaN(num) || num < min) return min;
        if (num > max) return max;
        return Math.round(num);
    }

    /**
     * Validate percentage value (0-100)
     * @param {number|string} value - Value to validate
     * @param {boolean} allowNegative - Allow negative values
     * @returns {number} Validated percentage
     */
    function validatePercent(value, allowNegative = false) {
        const num = parseNumber(value);
        const min = allowNegative ? -LIMITS.MAX_PERCENT : LIMITS.MIN_PERCENT;
        if (isNaN(num) || num < min) return min;
        if (num > LIMITS.MAX_PERCENT) return LIMITS.MAX_PERCENT;
        return num;
    }

    /**
     * Validate positive number
     * @param {number|string} value - Value to validate
     * @param {number} defaultValue - Default if invalid
     * @returns {number} Validated positive number
     */
    function validatePositiveNumber(value, defaultValue = 0) {
        const num = parseNumber(value);
        if (isNaN(num) || num < 0) return defaultValue;
        return num;
    }

    /**
     * Validate quantity
     * @param {number|string} value - Value to validate
     * @returns {number} Validated quantity (1 to MAX_QUANTITY)
     */
    function validateQuantity(value) {
        const num = parseInt(parseNumber(value), 10);
        if (isNaN(num) || num < LIMITS.MIN_QUANTITY) return LIMITS.MIN_QUANTITY;
        if (num > LIMITS.MAX_QUANTITY) return LIMITS.MAX_QUANTITY;
        return num;
    }

    /**
     * Parse number from various formats
     * @param {*} value - Value to parse
     * @returns {number} Parsed number
     */
    function parseNumber(value) {
        if (typeof value === 'number') return value;
        if (!value) return 0;

        // Remove thousand separators and handle Indonesian format
        const cleaned = String(value)
            .replace(/[Rp\s.]/gi, '')
            .replace(/,/g, '.');

        return parseFloat(cleaned) || 0;
    }

    /**
     * Sanitize text input
     * @param {string} value - Text to sanitize
     * @param {number} maxLength - Maximum length (default 200)
     * @returns {string} Sanitized text
     */
    function sanitizeText(value, maxLength = 200) {
        if (!value) return '';
        return String(value)
            .replace(/[<>'"&]/g, '') // Remove dangerous characters
            .trim()
            .substring(0, maxLength);
    }

    /**
     * Validate email format
     * @param {string} email - Email to validate
     * @returns {boolean} Is valid email
     */
    function isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    /**
     * Check if value is empty or zero
     * @param {*} value - Value to check
     * @returns {boolean} Is empty
     */
    function isEmpty(value) {
        if (value === null || value === undefined) return true;
        if (typeof value === 'string') return value.trim() === '';
        if (typeof value === 'number') return value === 0;
        if (Array.isArray(value)) return value.length === 0;
        return false;
    }

    /**
     * Validate form input and return result with errors
     * @param {Object} data - Form data object
     * @param {Object} rules - Validation rules
     * @returns {Object} { isValid, errors, sanitizedData }
     */
    function validateForm(data, rules) {
        const errors = {};
        const sanitizedData = {};

        for (const [field, rule] of Object.entries(rules)) {
            const value = data[field];

            if (rule.required && isEmpty(value)) {
                errors[field] = `${field} wajib diisi`;
                continue;
            }

            switch (rule.type) {
                case 'price':
                    sanitizedData[field] = validatePrice(value, rule.min, rule.max);
                    break;
                case 'percent':
                    sanitizedData[field] = validatePercent(value, rule.allowNegative);
                    break;
                case 'quantity':
                    sanitizedData[field] = validateQuantity(value);
                    break;
                case 'text':
                    sanitizedData[field] = sanitizeText(value, rule.maxLength);
                    break;
                default:
                    sanitizedData[field] = value;
            }
        }

        return {
            isValid: Object.keys(errors).length === 0,
            errors,
            sanitizedData
        };
    }

    // ==================== PUBLIC API ====================

    return {
        // Individual validators
        validatePrice,
        validatePercent,
        validatePositiveNumber,
        validateQuantity,
        parseNumber,
        sanitizeText,
        isValidEmail,
        isEmpty,

        // Form validation
        validateForm,

        // Constants
        LIMITS
    };
})();

// Make available globally
if (typeof window !== 'undefined') {
    window.Validation = Validation;
}
