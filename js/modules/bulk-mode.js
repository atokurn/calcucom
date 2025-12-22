/**
 * BulkMode - Bulk product input mode functionality
 * Handles multiple product calculations at once
 */
const BulkMode = (function () {
    'use strict';

    // ==================== PRIVATE STATE ====================

    // Track current mode
    let currentMode = 'single';

    // ==================== MODE SWITCHING ====================

    /**
     * Switch between single and bulk input modes
     * @param {string} mode - 'single' or 'bulk'
     */
    function switchMode(mode) {
        currentMode = mode;

        // Update global state for backward compatibility
        if (typeof window.inputMode !== 'undefined') {
            window.inputMode = mode;
        }

        // Also update AppState if available
        if (typeof AppState !== 'undefined') {
            AppState.set('inputMode', mode);
        }

        // Get UI elements
        const btnSingle = document.getElementById('btnInputSingle');
        const btnBulk = document.getElementById('btnInputBulk');
        const divSingle = document.getElementById('modeSingleContent');
        const divBulk = document.getElementById('modeBulkContent');
        const catSingle = document.getElementById('catSelectorSingle');
        const catBulk = document.getElementById('catSelectorBulk');

        // Active button styles
        const activeClass = "px-3 py-1 text-xs font-bold rounded-md bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 shadow-sm transition-all";
        const inactiveClass = "px-3 py-1 text-xs font-bold rounded-md text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all";

        if (mode === 'single') {
            if (btnSingle) btnSingle.className = activeClass;
            if (btnBulk) btnBulk.className = inactiveClass;
            if (divSingle) divSingle.classList.remove('hidden');
            if (divBulk) divBulk.classList.add('hidden');
            if (catSingle) catSingle.classList.remove('hidden');
            if (catBulk) catBulk.classList.add('hidden');
        } else {
            if (btnBulk) btnBulk.className = activeClass;
            if (btnSingle) btnSingle.className = inactiveClass;
            if (divBulk) divBulk.classList.remove('hidden');
            if (divSingle) divSingle.classList.add('hidden');
            if (catSingle) catSingle.classList.add('hidden');
            if (catBulk) catBulk.classList.remove('hidden');
        }

        // Trigger recalculation
        if (typeof calculate === 'function') {
            calculate();
        }
    }

    /**
     * Get current mode
     * @returns {string}
     */
    function getMode() {
        return currentMode;
    }

    /**
     * Check if in bulk mode
     * @returns {boolean}
     */
    function isBulkMode() {
        return currentMode === 'bulk';
    }

    // ==================== PRODUCT MANAGEMENT ====================

    /**
     * Get products array (from global for backward compatibility)
     * @returns {Array}
     */
    function getProducts() {
        return typeof window.products !== 'undefined' ? window.products : [];
    }

    /**
     * Add a new product row
     */
    function addRow() {
        const products = getProducts();
        const id = Date.now();

        products.push({
            id: id,
            name: '',
            categoryName: 'Pilih Kategori',
            categoryGroup: 'A',
            price: 0,
            discount: 0,
            voucher: 0,
            hpp: 0,
            profit: 0,
            // Fields for export
            finalSellingPrice: 0,
            adminFee: 0,
            serviceFee: 0,
            affiliateFee: 0,
            orderProcessFee: 0,
            fixedFee: 0,
            operationalCost: 0,
            customCostsTotal: 0,
            totalDeductions: 0,
            netIncome: 0
        });

        renderTable();

        if (typeof calculate === 'function') {
            calculate();
        }
    }

    /**
     * Update a product field
     * @param {number} index - Product index
     * @param {string} field - Field name
     * @param {*} value - New value
     */
    function updateProduct(index, field, value) {
        const products = getProducts();

        if (products[index]) {
            if (field === 'name') {
                products[index].name = value;
            } else {
                products[index][field] = parseFloat(value) || 0;
            }

            if (typeof calculate === 'function') {
                calculate();
            }
        }
    }

    /**
     * Delete a product row
     * @param {number} index - Product index to delete
     */
    function deleteRow(index) {
        const products = getProducts();

        if (products.length > 1) {
            products.splice(index, 1);
            renderTable();

            if (typeof calculate === 'function') {
                calculate();
            }
        }
    }

    /**
     * Open category modal for a specific product
     * @param {number} index - Product index
     */
    function openProductCategory(index) {
        // Set global editing index for backward compatibility
        if (typeof window.editingProductIndex !== 'undefined') {
            window.editingProductIndex = index;
        }

        // Open category modal
        if (typeof openCategoryModal === 'function') {
            openCategoryModal();
        } else if (typeof CategoryModal !== 'undefined') {
            CategoryModal.open();
        }
    }

    // ==================== TABLE RENDERING ====================

    /**
     * Render the bulk products table
     */
    function renderTable() {
        const tbody = document.getElementById('bulkProductBody');
        if (!tbody) return;

        const products = getProducts();
        tbody.innerHTML = '';

        products.forEach((p, index) => {
            const tr = document.createElement('tr');
            tr.className = "hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors group";

            tr.innerHTML = `
                <td class="p-3 align-top">
                    <input type="text" value="${p.name}" oninput="BulkMode.updateProduct(${index}, 'name', this.value)"
                        class="w-full p-2 text-xs border border-slate-200 dark:border-slate-600 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white dark:bg-slate-700 text-slate-700 dark:text-white" placeholder="Nama Produk...">
                </td>
                <td class="p-3 align-top">
                    <button onclick="BulkMode.openProductCategory(${index})"
                        class="w-full text-left p-2 text-xs border border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-900/20 rounded text-orange-700 dark:text-orange-400 hover:bg-orange-100 dark:hover:bg-orange-900/40 flex justify-between items-center transition-colors">
                        <span class="truncate max-w-[100px] font-medium">${p.categoryName}</span>
                        <span class="ml-1 text-[10px] px-1 rounded bg-white dark:bg-slate-800 border border-orange-200 dark:border-orange-800 text-orange-600 dark:text-orange-400 font-bold">${p.categoryGroup}</span>
                    </button>
                </td>
                <td class="p-3 align-top">
                    <div class="relative">
                        <span class="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 text-[10px]">Rp</span>
                        <input type="number" value="${p.price || ''}" oninput="BulkMode.updateProduct(${index}, 'price', this.value)"
                            class="w-full pl-6 p-2 text-xs border border-slate-200 dark:border-slate-600 rounded font-medium text-slate-700 dark:text-white text-right bg-white dark:bg-slate-700" placeholder="0">
                    </div>
                </td>
                <td class="p-3 align-top">
                    <div class="relative">
                        <span class="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 text-[10px]">Rp</span>
                        <input type="number" value="${p.hpp || ''}" oninput="BulkMode.updateProduct(${index}, 'hpp', this.value)"
                            class="w-full pl-6 p-2 text-xs border border-slate-200 dark:border-slate-600 rounded text-right bg-white dark:bg-slate-700 text-slate-700 dark:text-white" placeholder="0">
                    </div>
                </td>
                <td class="p-3 align-top">
                    <div class="relative">
                        <input type="number" value="${p.discount || ''}" oninput="BulkMode.updateProduct(${index}, 'discount', this.value)"
                            class="w-full pr-6 p-2 text-xs border border-slate-200 dark:border-slate-600 rounded text-right bg-white dark:bg-slate-700 text-slate-700 dark:text-white" placeholder="0">
                        <span class="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 text-[10px]">%</span>
                    </div>
                </td>
                <td class="p-3 align-top">
                    <div class="relative">
                        <span class="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 text-[10px]">Rp</span>
                        <input type="number" value="${p.voucher || ''}" oninput="BulkMode.updateProduct(${index}, 'voucher', this.value)"
                            class="w-full pl-6 p-2 text-xs border border-slate-200 dark:border-slate-600 rounded text-right bg-white dark:bg-slate-700 text-slate-700 dark:text-white" placeholder="0">
                    </div>
                </td>
                <td class="p-3 align-top text-center">
                    <div id="p-profit-${index}" class="text-right font-bold text-xs text-slate-400">Rp 0</div>
                </td>
                <td class="p-3 align-top text-center">
                    ${products.length > 1 ? `<button onclick="BulkMode.deleteRow(${index})" class="text-red-400 hover:text-red-600 p-1" aria-label="Hapus produk"><i class="fas fa-trash-alt" aria-hidden="true"></i></button>` : ''}
                </td>
            `;

            tbody.appendChild(tr);
        });

        // Update product count badge
        if (typeof setText === 'function') {
            setText('productCountBadge', products.length);
        } else {
            const badge = document.getElementById('productCountBadge');
            if (badge) badge.innerText = products.length;
        }
    }

    /**
     * Update profit display for a product
     * @param {number} index - Product index
     * @param {number} profit - Profit value
     */
    function updateProductProfit(index, profit) {
        const el = document.getElementById(`p-profit-${index}`);
        if (!el) return;

        const formatted = typeof formatRupiah === 'function'
            ? formatRupiah(profit)
            : `Rp ${profit.toLocaleString('id-ID')}`;

        el.innerText = formatted;

        // Update color based on profit
        if (profit > 0) {
            el.className = 'text-right font-bold text-xs text-emerald-600 dark:text-emerald-400';
        } else if (profit < 0) {
            el.className = 'text-right font-bold text-xs text-red-500';
        } else {
            el.className = 'text-right font-bold text-xs text-slate-400';
        }
    }

    // ==================== EXPORT ====================

    /**
     * Export bulk products to CSV
     */
    function exportToCSV() {
        const products = getProducts();
        if (products.length === 0) {
            if (typeof showToast === 'function') {
                showToast('Tidak ada produk untuk diexport', 'warning');
            }
            return;
        }

        const headers = ['Nama Produk', 'Kategori', 'Grup', 'Harga Jual', 'HPP', 'Diskon %', 'Voucher', 'Profit'];
        const rows = products.map(p => [
            p.name,
            p.categoryName,
            p.categoryGroup,
            p.price,
            p.hpp,
            p.discount,
            p.voucher,
            p.profit
        ]);

        let csv = headers.join(',') + '\n';
        rows.forEach(row => {
            csv += row.map(val => `"${val}"`).join(',') + '\n';
        });

        // Download
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `bulk_products_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();

        if (typeof showToast === 'function') {
            showToast('Berhasil export ke CSV', 'success');
        }
    }

    // ==================== PUBLIC API ====================

    return {
        // Mode control
        switchMode,
        getMode,
        isBulkMode,

        // Product management
        addRow,
        updateProduct,
        deleteRow,
        openProductCategory,

        // Table rendering
        renderTable,
        updateProductProfit,

        // Export
        exportToCSV
    };
})();

// ==================== BACKWARD COMPATIBILITY ====================

if (typeof window !== 'undefined') {
    window.BulkMode = BulkMode;

    // Legacy function mappings
    window.switchInputMode = BulkMode.switchMode;
    window.addBulkRow = BulkMode.addRow;
    window.renderBulkTable = BulkMode.renderTable;
    window.updateProduct = BulkMode.updateProduct;
    // Note: deleteProduct is also defined in script.js for different purpose
    // so we only map if it's for bulk mode context
    window.openProductCategory = BulkMode.openProductCategory;
}
