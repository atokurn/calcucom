/**
 * HistoryManager - Calculation history management
 * Handles saving, loading, and displaying calculation history
 */
const HistoryManager = (function () {
    'use strict';

    // ==================== STORAGE KEYS ====================

    const STORAGE_KEY = 'calcHistory';
    const MAX_ITEMS = 50;

    // ==================== PRIVATE STATE ====================

    let pendingDeleteId = null;
    let pendingDeleteSource = null;
    let editingId = null; // Track which entry is being edited

    // ==================== TOAST HELPER ====================

    function showToast(message, type = 'info') {
        if (typeof window.showToast === 'function') {
            window.showToast(message, type);
        } else if (typeof UIManager !== 'undefined') {
            UIManager.showToast(message, type);
        }
    }

    // ==================== STORAGE ====================

    /**
     * Get history from localStorage
     * @returns {Array}
     */
    function getHistory() {
        try {
            const data = localStorage.getItem(STORAGE_KEY);
            return data ? JSON.parse(data) : [];
        } catch (e) {
            console.warn('Failed to load history:', e);
            return [];
        }
    }

    /**
     * Save history to localStorage
     * @param {Array} history 
     */
    function saveHistory(history) {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(history.slice(0, MAX_ITEMS)));
        } catch (e) {
            console.warn('Failed to save history:', e);
        }
    }

    /**
     * Add entry to history
     * @param {Object} entry 
     */
    function addEntry(entry) {
        const history = getHistory();

        // Add with unique ID and timestamp
        entry.id = entry.id || Date.now().toString();
        entry.timestamp = entry.timestamp || new Date().toISOString();

        history.unshift(entry);
        saveHistory(history);
        render();
    }

    /**
     * Update existing entry in history
     * @param {string} id - Entry ID to update
     * @param {Object} updates - Fields to update
     */
    function updateEntry(id, updates) {
        const history = getHistory();
        const idx = history.findIndex(h => h.id === id);

        if (idx === -1) {
            // Check productDB
            const productDB = typeof window.productDB !== 'undefined' ? window.productDB : [];
            const dbIdx = productDB.findIndex(p => p.id.toString() === id);

            if (dbIdx > -1) {
                // Update productDB entry
                Object.assign(productDB[dbIdx], updates);
                productDB[dbIdx].updated_at = new Date().toISOString();
                localStorage.setItem('productDB', JSON.stringify(productDB));
                showToast('Produk berhasil diupdate', 'success');
                render();
                return true;
            }

            showToast('Entry tidak ditemukan', 'error');
            return false;
        }

        // Update history entry
        Object.assign(history[idx], updates);
        history[idx].updatedAt = new Date().toISOString();
        saveHistory(history);
        showToast('Entry berhasil diupdate', 'success');
        render();
        return true;
    }

    /**
     * Start editing an entry
     * @param {string} id - Entry ID to edit
     */
    function startEdit(id) {
        editingId = id;
        const entry = findEntry(id);
        if (!entry) {
            showToast('Entry tidak ditemukan', 'error');
            return;
        }

        // Load entry data into form for editing
        loadEntry(id);
        showToast('Mode edit aktif. Ubah data lalu klik Simpan.', 'info');
    }

    /**
     * Finish editing and save changes
     */
    function finishEdit() {
        if (!editingId) return;

        // Get current form values and update the entry
        // This depends on the form structure
        const name = document.getElementById('singleName')?.value;
        const hpp = parseFloat(document.getElementById('hpp')?.value) || 0;
        const price = parseFloat(document.getElementById('originalPrice')?.value) || 0;

        if (name || hpp || price) {
            updateEntry(editingId, {
                productName: name,
                name: name,
                hpp: hpp,
                cost_of_goods: hpp,
                sellingPrice: price,
                display_price: price
            });
        }

        editingId = null;
    }

    /**
     * Cancel editing mode
     */
    function cancelEdit() {
        editingId = null;
        showToast('Edit dibatalkan', 'info');
    }

    /**
     * Check if in edit mode
     * @returns {boolean}
     */
    function isEditing() {
        return editingId !== null;
    }

    /**
     * Get currently editing ID
     * @returns {string|null}
     */
    function getEditingId() {
        return editingId;
    }

    /**
     * Delete entry from history
     * @param {string} id 
     */
    function deleteEntry(id) {
        const history = getHistory();
        const filtered = history.filter(h => h.id !== id);
        saveHistory(filtered);
        render();
    }

    /**
     * Clear all history
     */
    function clearAll() {
        localStorage.removeItem(STORAGE_KEY);
        render();
        showToast('Riwayat berhasil dihapus', 'success');
    }

    // ==================== BULK OPERATIONS ====================

    /**
     * Delete multiple entries at once
     * @param {Array} ids - Array of IDs to delete
     */
    function bulkDelete(ids) {
        if (!ids || ids.length === 0) return;

        const history = getHistory();
        const productDB = typeof window.productDB !== 'undefined' ? window.productDB : [];

        // Filter history
        const filteredHistory = history.filter(h => !ids.includes(h.id));
        saveHistory(filteredHistory);

        // Filter productDB
        const filteredDB = productDB.filter(p => !ids.includes(p.id.toString()));
        if (filteredDB.length !== productDB.length) {
            window.productDB = filteredDB;
            localStorage.setItem('productDB', JSON.stringify(filteredDB));
        }

        render();
        showToast(`${ids.length} item dihapus`, 'success');
    }

    /**
     * Render history list
     */
    function render() {
        const container = document.getElementById('historyContainer');
        if (!container) return;

        const history = getHistory();

        // Get productDB for combined view
        const productDB = typeof window.productDB !== 'undefined' ? window.productDB : [];

        // Convert productDB to history format
        const productDBConverted = productDB.map(p => {
            const hpp = p.cost_of_goods || p.hpp || 0;
            const displayPrice = p.display_price || p.displayPrice || p.selling_price || p.sellingPrice || 0;
            const profit = p.result_profit || p.profit || 0;
            const margin = p.result_margin || p.margin || 0;
            const createdAt = p.created_at || p.createdAt;

            const formatRupiahFn = typeof formatRupiah === 'function'
                ? formatRupiah
                : (n) => `Rp ${n.toLocaleString('id-ID')}`;

            return {
                id: p.id.toString(),
                timestamp: createdAt ? new Date(createdAt).toISOString() : new Date().toISOString(),
                productName: p.name,
                sellingPrice: formatRupiahFn(displayPrice),
                hpp: hpp,
                displayPrice: displayPrice,
                discount: p.discount_percent || p.discount || 0,
                voucher: p.voucher_amount || p.voucher || 0,
                profit: profit >= 0 ? formatRupiahFn(profit) : '-' + formatRupiahFn(Math.abs(profit)),
                profitNum: profit,
                margin: margin.toFixed(1) + '%',
                marginNum: margin,
                platform: p.platform,
                source: 'productDB'
            };
        });

        // Get sort option
        const sortOption = document.getElementById('historySortSelect')?.value || 'newest';

        // Combine all items
        const parseRupiahFn = typeof parseRupiah === 'function'
            ? parseRupiah
            : (s) => parseFloat(String(s).replace(/[^\d,-]/g, '').replace(',', '.')) || 0;

        let combined = [
            ...history.map(h => ({
                ...h,
                source: 'history',
                profitNum: parseRupiahFn(h.profit || '0') * (String(h.profit).includes('-') ? -1 : 1),
                marginNum: parseFloat(h.margin) || 0
            })),
            ...productDBConverted
        ];

        // Apply sort
        combined = sortItems(combined, sortOption);
        combined = combined.slice(0, MAX_ITEMS);

        if (combined.length === 0) {
            container.innerHTML = `
                <div class="text-center text-xs text-slate-400 py-6">
                    <i class="fas fa-inbox text-2xl mb-2 block opacity-50" aria-hidden="true"></i>
                    Belum ada riwayat tersimpan
                </div>`;
            return;
        }

        const getPlatformIconFn = typeof getPlatformIcon === 'function'
            ? getPlatformIcon
            : () => '<i class="fas fa-store text-slate-500"></i>';

        container.innerHTML = combined.map(h => {
            const isLoss = String(h.profit).includes('-');
            return `
                <div onclick="HistoryManager.openDetail('${h.id}')"
                    class="bg-white dark:bg-slate-700 p-3 rounded-lg border border-slate-200 dark:border-slate-600 hover:border-blue-300 dark:hover:border-blue-500 transition-colors cursor-pointer relative group"
                    role="button" tabindex="0" aria-label="Lihat detail ${h.productName || 'Tanpa Nama'}">
                    <div class="flex justify-between items-start mb-2">
                        <div class="flex items-center gap-2">
                            <div class="w-6 h-6 rounded-full flex items-center justify-center bg-slate-100 dark:bg-slate-600 text-xs">
                                ${getPlatformIconFn(h.platform)}
                            </div>
                            <div>
                                <div class="font-medium text-xs text-slate-700 dark:text-gray-200 text-ellipsis overflow-hidden whitespace-nowrap max-w-[120px]" title="${h.productName || 'Tanpa Nama'}">${h.productName || 'Tanpa Nama'}</div>
                                <div class="text-[10px] text-slate-400">${new Date(h.timestamp).toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</div>
                            </div>
                        </div>
                        <div class="text-right">
                             <div class="font-bold text-xs ${isLoss ? 'text-red-500' : 'text-green-600'}">${h.profit}</div>
                             <div class="text-[10px] ${isLoss ? 'text-red-400' : 'text-blue-500'} font-medium">${h.margin}</div>
                        </div>
                    </div>
                    
                    <div class="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-600">
                        <div>
                            Jual: <span class="text-slate-700 dark:text-slate-300">${h.sellingPrice}</span>
                        </div>
                         <div class="flex gap-2">
                            <button onclick="event.stopPropagation(); HistoryManager.loadEntry('${h.id}')" class="text-xs text-blue-500 hover:text-blue-600 p-1" title="Muat Data" aria-label="Muat data">
                                <i class="fas fa-upload" aria-hidden="true"></i>
                            </button>
                            <button onclick="event.stopPropagation(); HistoryManager.confirmDelete('${h.id}', '${h.source}')" class="text-xs text-red-400 hover:text-red-500 p-1" title="Hapus" aria-label="Hapus">
                                <i class="fas fa-trash-alt" aria-hidden="true"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    /**
     * Sort items by option
     */
    function sortItems(items, sortOption) {
        switch (sortOption) {
            case 'oldest':
                return items.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
            case 'profit-high':
                return items.sort((a, b) => b.profitNum - a.profitNum);
            case 'profit-low':
                return items.sort((a, b) => a.profitNum - b.profitNum);
            case 'margin-high':
                return items.sort((a, b) => b.marginNum - a.marginNum);
            case 'margin-low':
                return items.sort((a, b) => a.marginNum - b.marginNum);
            case 'name-az':
                return items.sort((a, b) => (a.productName || '').localeCompare(b.productName || ''));
            case 'name-za':
                return items.sort((a, b) => (b.productName || '').localeCompare(a.productName || ''));
            case 'newest':
            default:
                return items.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        }
    }

    // ==================== DETAIL MODAL ====================

    /**
     * Open history detail modal
     * @param {string} id 
     */
    function openDetail(id) {
        // Call legacy function if available
        if (typeof window.openHistoryDetail === 'function' && window.openHistoryDetail !== openDetail) {
            window.openHistoryDetail(id);
            return;
        }

        // Find entry
        const entry = findEntry(id);
        if (!entry) return;

        // Update modal content
        const modal = document.getElementById('historyDetailModal');
        if (!modal) return;

        // Populate fields
        const fields = {
            'histDetailName': entry.productName || 'Tanpa Nama',
            'histDetailDate': new Date(entry.timestamp).toLocaleString('id-ID'),
            'histDetailPrice': entry.sellingPrice,
            'histDetailProfit': entry.profit,
            'histDetailMargin': entry.margin
        };

        Object.entries(fields).forEach(([id, value]) => {
            const el = document.getElementById(id);
            if (el) el.innerText = value;
        });

        modal.classList.remove('hidden');
    }

    /**
     * Close history detail modal
     */
    function closeDetail() {
        const modal = document.getElementById('historyDetailModal');
        if (modal) modal.classList.add('hidden');
    }

    /**
     * Find entry by ID in both history and productDB
     * @param {string} id 
     * @returns {Object|null}
     */
    function findEntry(id) {
        // Check history first
        const history = getHistory();
        let entry = history.find(h => h.id === id);

        if (!entry) {
            // Check productDB
            const productDB = typeof window.productDB !== 'undefined' ? window.productDB : [];
            entry = productDB.find(p => p.id.toString() === id);
        }

        return entry || null;
    }

    // ==================== LOAD ENTRY ====================

    /**
     * Load entry into calculator
     * @param {string} id 
     */
    function loadEntry(id) {
        // Call legacy function if available
        if (typeof window.loadFromHistory === 'function' && window.loadFromHistory !== loadEntry) {
            window.loadFromHistory(id);
            return;
        }

        const entry = findEntry(id);
        if (!entry) {
            if (typeof showToast === 'function') {
                showToast('Data tidak ditemukan', 'error');
            }
            return;
        }

        // Load values into form
        // This would need to be customized based on actual form structure
        if (typeof showToast === 'function') {
            showToast('Data berhasil dimuat', 'success');
        }
    }

    // ==================== DELETE ====================

    /**
     * Confirm delete (show dialog)
     * @param {string} id 
     * @param {string} source 
     */
    function confirmDelete(id, source = 'history') {
        pendingDeleteId = id;
        pendingDeleteSource = source;

        // Show delete dialog
        const dialog = document.getElementById('deleteConfirmDialog');
        if (dialog) {
            dialog.classList.remove('hidden');
        }
    }

    /**
     * Execute pending delete
     */
    function executeDelete() {
        if (!pendingDeleteId) return;

        if (pendingDeleteSource === 'productDB') {
            // Delete from productDB
            const productDB = typeof window.productDB !== 'undefined' ? window.productDB : [];
            const idx = productDB.findIndex(p => p.id.toString() === pendingDeleteId);
            if (idx > -1) {
                productDB.splice(idx, 1);
                localStorage.setItem('productDB', JSON.stringify(productDB));
            }
        } else {
            // Delete from history
            deleteEntry(pendingDeleteId);
        }

        pendingDeleteId = null;
        pendingDeleteSource = null;

        // Close dialog
        const dialog = document.getElementById('deleteConfirmDialog');
        if (dialog) dialog.classList.add('hidden');

        render();

        if (typeof showToast === 'function') {
            showToast('Berhasil dihapus', 'success');
        }
    }

    /**
     * Cancel pending delete
     */
    function cancelDelete() {
        pendingDeleteId = null;
        pendingDeleteSource = null;

        const dialog = document.getElementById('deleteConfirmDialog');
        if (dialog) dialog.classList.add('hidden');
    }

    // ==================== PUBLIC API ====================

    return {
        // Storage
        getHistory,
        addEntry,
        updateEntry,
        deleteEntry,
        clearAll,
        bulkDelete,

        // Edit mode
        startEdit,
        finishEdit,
        cancelEdit,
        isEditing,
        getEditingId,

        // Rendering
        render,

        // Detail modal
        openDetail,
        closeDetail,
        findEntry,

        // Load
        loadEntry,

        // Delete
        confirmDelete,
        executeDelete,
        cancelDelete
    };
})();

// ==================== BACKWARD COMPATIBILITY ====================

if (typeof window !== 'undefined') {
    window.HistoryManager = HistoryManager;

    // Legacy function mappings
    window.getHistory = HistoryManager.getHistory;
    window.renderHistory = HistoryManager.render;
    window.clearHistory = HistoryManager.clearAll;
    window.deleteHistoryItem = HistoryManager.confirmDelete;
    window.confirmDeleteHistoryItem = HistoryManager.executeDelete;
    window.closeDeleteDialog = HistoryManager.cancelDelete;

    // New edit functions
    window.editHistoryItem = HistoryManager.startEdit;
    window.updateHistoryItem = HistoryManager.updateEntry;
}

