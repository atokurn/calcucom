/**
 * StorageUtils - LocalStorage helpers with error handling
 * Using IIFE pattern for browser compatibility
 */
const StorageUtils = (function () {
    'use strict';

    const STORAGE_PREFIX = 'cekbiaya_';

    /**
     * Check if localStorage is available
     * @returns {boolean}
     */
    function isAvailable() {
        try {
            const test = '__storage_test__';
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            return true;
        } catch (e) {
            return false;
        }
    }

    /**
     * Get item from localStorage with JSON parsing
     * @param {string} key 
     * @param {*} defaultValue 
     * @returns {*}
     */
    function get(key, defaultValue = null) {
        if (!isAvailable()) return defaultValue;

        try {
            const item = localStorage.getItem(STORAGE_PREFIX + key);
            if (item === null) return defaultValue;
            return JSON.parse(item);
        } catch (e) {
            console.warn(`StorageUtils.get error for key "${key}":`, e);
            return defaultValue;
        }
    }

    /**
     * Set item to localStorage with JSON stringify
     * @param {string} key 
     * @param {*} value 
     * @returns {boolean}
     */
    function set(key, value) {
        if (!isAvailable()) return false;

        try {
            localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value));
            return true;
        } catch (e) {
            console.warn(`StorageUtils.set error for key "${key}":`, e);
            return false;
        }
    }

    /**
     * Remove item from localStorage
     * @param {string} key 
     * @returns {boolean}
     */
    function remove(key) {
        if (!isAvailable()) return false;

        try {
            localStorage.removeItem(STORAGE_PREFIX + key);
            return true;
        } catch (e) {
            console.warn(`StorageUtils.remove error for key "${key}":`, e);
            return false;
        }
    }

    /**
     * Get all keys with prefix
     * @returns {string[]}
     */
    function getAllKeys() {
        if (!isAvailable()) return [];

        const keys = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith(STORAGE_PREFIX)) {
                keys.push(key.replace(STORAGE_PREFIX, ''));
            }
        }
        return keys;
    }

    /**
     * Clear all items with prefix
     * @returns {boolean}
     */
    function clearAll() {
        if (!isAvailable()) return false;

        try {
            const keys = getAllKeys();
            keys.forEach(key => remove(key));
            return true;
        } catch (e) {
            console.warn('StorageUtils.clearAll error:', e);
            return false;
        }
    }

    // Return public API
    return {
        isAvailable,
        get,
        set,
        remove,
        getAllKeys,
        clearAll,
        STORAGE_PREFIX
    };
})();

// Make available globally
if (typeof window !== 'undefined') {
    window.StorageUtils = StorageUtils;
}
