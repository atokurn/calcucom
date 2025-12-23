/**
 * CategoryModal - Category selection modal functionality
 * Handles 3-column category selection with search
 */
const CategoryModal = (function () {
    'use strict';

    // ==================== PRIVATE STATE ====================

    // Track if modal is open
    let isOpen = false;

    // Category group descriptions and details
    const CATEGORY_GROUP_INFO = {
        A: {
            icon: '👗',
            title: 'Fashion & Kecantikan',
            desc: 'Pakaian, Sepatu, Tas, Aksesoris, Makeup, Skincare, Parfum',
            feeLabel: 'Tertinggi'
        },
        B: {
            icon: '🍼',
            title: 'FMCG & Kesehatan',
            desc: 'Makanan, Minuman, Suplemen, Vitamin, Popok, Perawatan Bayi',
            feeLabel: 'Tinggi'
        },
        C: {
            icon: '🏠',
            title: 'Rumah & Lifestyle',
            desc: 'Peralatan Rumah, Dekorasi, Olahraga, Hobi, Mainan',
            feeLabel: 'Sedang'
        },
        D: {
            icon: '📱',
            title: 'Elektronik & Gadget',
            desc: 'Handphone, Tablet, Laptop, Komputer, Aksesoris Elektronik',
            feeLabel: 'Rendah'
        },
        E: {
            icon: '🍎',
            title: 'Fresh & Large Items',
            desc: 'Makanan Segar, TV, AC, Kulkas, Mesin Cuci, Furniture Besar',
            feeLabel: 'Terendah'
        },
        F: {
            icon: '📚',
            title: 'Buku & Lainnya',
            desc: 'Buku, Majalah, Alat Tulis, Koleksi, Produk Virtual',
            feeLabel: 'Khusus'
        }
    };

    // ==================== DOM HELPERS ====================

    function getModal() {
        return document.getElementById('categoryModal');
    }

    function getColumns() {
        return {
            col1: document.getElementById('col1'),
            col2: document.getElementById('col2'),
            col3: document.getElementById('col3')
        };
    }

    // ==================== MODAL CONTROL ====================

    /**
     * Open the category modal
     */
    function open() {
        const modal = getModal();
        if (modal) {
            modal.classList.remove('hidden');
            isOpen = true;
            resetView();
        }
    }

    /**
     * Open modal for single product mode
     */
    function openSingle() {
        // Clear editing index if in bulk mode
        if (typeof window.editingProductIndex !== 'undefined') {
            window.editingProductIndex = null;
        }
        open();
    }

    /**
     * Close the category modal
     */
    function close() {
        const modal = getModal();
        if (modal) {
            modal.classList.add('hidden');
            isOpen = false;
        }
    }

    /**
     * Check if modal is open
     */
    function isModalOpen() {
        return isOpen;
    }

    // ==================== VIEW MANAGEMENT ====================

    /**
     * Reset modal to initial view state
     */
    function resetView() {
        // Reset search input
        const searchInput = document.querySelector('#categoryModal input[type="text"]');
        if (searchInput) searchInput.value = '';

        // Show columns, hide search results
        const cols = getColumns();
        Object.values(cols).forEach(col => {
            if (col) col.classList.remove('hidden');
        });

        const searchResults = document.getElementById('searchResultList');
        if (searchResults) searchResults.classList.add('hidden');

        // Render first column with category data
        const categoryData = typeof getCategoryData === 'function' ? getCategoryData() : [];
        renderColumn1(categoryData);

        if (cols.col2) cols.col2.innerHTML = '';
        if (cols.col3) cols.col3.innerHTML = '';

        // Clear selection state visually
        document.querySelectorAll('.cat-item').forEach(el => el.classList.remove('active'));

        // Reset selection variables (using global selectedPath for backward compatibility)
        if (typeof selectedPath !== 'undefined') {
            selectedPath = { l1: null, l2: null, l3: null, group: null }; // Default: No Group Selected
        }

        // Reset Footer Text
        const footerText = document.getElementById('modalSelectionText');
        if (footerText) footerText.innerText = '-';

        const footerBadge = document.getElementById('modalGroupBadge');
        if (footerBadge) footerBadge.classList.add('hidden');

        // Disable Confirm Button
        const btn = document.getElementById('btnConfirmCat');
        if (btn) btn.disabled = true;
    }

    // ==================== COLUMN RENDERING ====================

    /**
     * Render Level 1 categories (first column)
     */
    function renderColumn1(data) {
        const col = document.getElementById('col1');
        if (!col) return;

        col.innerHTML = '';

        data.forEach(item => {
            const el = document.createElement('div');
            el.className = 'cat-item p-3 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer flex justify-between items-center transition-colors';

            const arrow = (item.subs && item.subs.length > 0)
                ? '<i class="fas fa-chevron-right text-xs ml-2 text-slate-300 dark:text-slate-500"></i>'
                : '';

            el.innerHTML = `<span>${item.name}</span>${arrow}`;

            el.onclick = () => {
                // Highlight selection
                Array.from(col.children).forEach(child => child.classList.remove('active'));
                el.classList.add('active');

                if (item.subs) {
                    renderColumn2(item.subs, item);
                } else {
                    selectPath(item.name, null, null, item.group || 'A');
                }
            };

            col.appendChild(el);
        });
    }

    /**
     * Render Level 2 categories (second column)
     */
    function renderColumn2(subs, parentL1) {
        const col2 = document.getElementById('col2');
        const col3 = document.getElementById('col3');

        if (!col2) return;

        col2.innerHTML = '';
        if (col3) col3.innerHTML = '';

        subs.forEach(item => {
            const el = document.createElement('div');
            el.className = 'cat-item p-3 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer flex justify-between items-center transition-colors';

            const arrow = (item.subs && item.subs.length > 0)
                ? '<i class="fas fa-chevron-right text-xs ml-2 text-slate-300 dark:text-slate-500"></i>'
                : '';

            el.innerHTML = `<span>${item.name}</span>${arrow}`;

            el.onclick = () => {
                Array.from(col2.children).forEach(child => child.classList.remove('active'));
                el.classList.add('active');

                if (item.subs) {
                    renderColumn3(item.subs, parentL1, item);
                } else {
                    selectPath(parentL1.name, item.name, null, item.group || parentL1.group || 'A');
                }
            };

            col2.appendChild(el);
        });
    }

    /**
     * Render Level 3 categories (third column)
     */
    function renderColumn3(subs, parentL1, parentL2) {
        const col3 = document.getElementById('col3');
        if (!col3) return;

        col3.innerHTML = '';

        subs.forEach(item => {
            const el = document.createElement('div');
            el.className = 'cat-item p-3 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer transition-colors';
            el.innerHTML = `<span>${item.name}</span>`;

            el.onclick = () => {
                Array.from(col3.children).forEach(child => child.classList.remove('active'));
                el.classList.add('active');

                // Group priority: L3 > L2 > L1 > 'A'
                const group = item.group || parentL2.group || parentL1.group || 'A';
                selectPath(parentL1.name, parentL2.name, item.name, group);
            };

            col3.appendChild(el);
        });
    }

    // ==================== SEARCH ====================

    /**
     * Filter categories by search query
     */
    function filterCategories(query) {
        query = query.toLowerCase();
        const resultList = document.getElementById('searchResultList');
        const cols = getColumns();

        if (!query) {
            // Revert to column view
            if (resultList) resultList.classList.add('hidden');
            Object.values(cols).forEach(col => {
                if (col) col.classList.remove('hidden');
            });
            return;
        }

        // Switch to list view
        Object.values(cols).forEach(col => {
            if (col) col.classList.add('hidden');
        });
        if (resultList) {
            resultList.classList.remove('hidden');
            resultList.innerHTML = '';
        }

        // Get category data
        const categoryData = typeof getCategoryData === 'function' ? getCategoryData() : [];

        // Flatten and search
        let matches = [];

        categoryData.forEach(l1 => {
            if (l1.subs) {
                l1.subs.forEach(l2 => {
                    if (l2.subs) {
                        l2.subs.forEach(l3 => {
                            if (l3.name.toLowerCase().includes(query)) {
                                matches.push({ l1, l2, l3 });
                            }
                        });
                    }
                });
            }
        });

        if (matches.length === 0) {
            resultList.innerHTML = '<div class="p-4 text-center text-slate-400">Tidak ditemukan</div>';
            return;
        }

        matches.forEach(m => {
            const el = document.createElement('div');
            el.className = 'search-item text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 p-3 border-b border-slate-100 dark:border-slate-700 cursor-pointer transition-colors';
            el.innerHTML = `<span class="font-semibold text-slate-800 dark:text-white">${m.l3.name}</span> <br><span class="text-xs text-slate-400">${m.l1.name} > ${m.l2.name}</span>`;

            el.onclick = () => {
                const group = m.l3.group || m.l2.group || m.l1.group || 'A';
                selectPath(m.l1.name, m.l2.name, m.l3.name, group);
            };

            resultList.appendChild(el);
        });
    }

    // ==================== SELECTION ====================

    /**
     * Select a category path
     */
    function selectPath(l1, l2, l3, group) {
        // Update global selectedPath for backward compatibility
        if (typeof window.selectedPath !== 'undefined') {
            window.selectedPath = { l1, l2, l3, group };
        }

        // Update footer display
        let text = l1;
        if (l2) text += ` > ${l2}`;
        if (l3) text += ` > ${l3}`;

        const footerText = document.getElementById('modalSelectionText');
        if (footerText) footerText.innerText = text;

        const footerBadge = document.getElementById('modalGroupBadge');
        if (footerBadge) {
            footerBadge.innerText = `Grup ${group}`;
            footerBadge.className = `ml-2 px-2 py-1 rounded text-xs font-bold inline-block badge-${group}`;
            footerBadge.classList.remove('hidden');
        }

        // Enable confirm button
        const btn = document.getElementById('btnConfirmCat');
        if (btn) btn.disabled = false;
    }

    /**
     * Confirm category selection and close modal
     */
    function confirm() {
        const path = typeof selectedPath !== 'undefined' ? selectedPath : { l1: null, l2: null, l3: null, group: null };

        // Check if in bulk mode with editing index
        if (typeof inputMode !== 'undefined' && inputMode === 'bulk' &&
            typeof editingProductIndex !== 'undefined' && editingProductIndex !== null &&
            typeof products !== 'undefined' && products[editingProductIndex]) {

            const p = products[editingProductIndex];
            p.categoryName = path.l3 || path.l2 || path.l1;
            p.categoryGroup = path.group;

            if (typeof renderBulkTable === 'function') {
                renderBulkTable();
            }
            editingProductIndex = null;
        } else {
            // Single Mode
            const elText = document.getElementById('selectedCategoryText');
            if (elText) {
                let text = path.l1 || '';
                if (path.l2) text += ` > ${path.l2}`;
                if (path.l3) text += ` > ${path.l3}`;
                elText.innerText = text;
            }

            const elGroup = document.getElementById('currentCategoryGroup');
            if (elGroup) {
                elGroup.value = path.group;
            }

            const mainBadge = document.getElementById('categoryGroupBadge');
            if (mainBadge) {
                if (path.group) {
                    mainBadge.innerText = `Grup ${path.group}`;
                    // Remove all previous badge classes first to be safe
                    mainBadge.className = `text-[10px] px-1.5 py-0.5 rounded font-bold badge-${path.group}`;
                    mainBadge.classList.remove('hidden');
                } else {
                    mainBadge.classList.add('hidden');
                }
            }
        }

        close();

        // Trigger recalculation
        setTimeout(() => {
            if (typeof recalcAfterCategoryChange === 'function') {
                recalcAfterCategoryChange();
            }
        }, 50);
    }

    /**
     * Set category group quickly without opening modal
     */
    function setQuickCategory(group) {
        // Update global selected path
        if (typeof window.selectedPath !== 'undefined') {
            window.selectedPath.group = group;
            window.selectedPath.l1 = `Kategori Group ${group}`;
            window.selectedPath.l2 = null;
            window.selectedPath.l3 = null;
        }

        // Update hidden input
        const elGroup = document.getElementById('currentCategoryGroup');
        if (elGroup) elGroup.value = group;

        // Update display text
        const catText = document.getElementById('selectedCategoryText');
        if (catText) catText.innerText = `Kategori Group ${group}`;

        // Update badge
        const mainBadge = document.getElementById('categoryGroupBadge');
        if (mainBadge) {
            mainBadge.innerText = `Grup ${group}`;
            mainBadge.className = `text-[10px] px-1.5 py-0.5 rounded font-bold badge-${group}`;
            mainBadge.classList.remove('hidden');
        }

        // Update quick buttons visual state
        document.querySelectorAll('.quick-cat-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.group === group);
        });

        // Update category detail panel
        updateGroupDetail(group);

        // Recalculate
        if (typeof calculate === 'function') {
            calculate();
        }
    }

    /**
     * Update quick category buttons to reflect current selection
     */
    function updateQuickButtons() {
        const currentGroup = (typeof selectedPath !== 'undefined' && selectedPath.group) || 'A';

        document.querySelectorAll('.quick-cat-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.group === currentGroup);
        });

        updateGroupDetail(currentGroup);
    }

    /**
     * Update category group detail info panel
     */
    function updateGroupDetail(group) {
        const info = CATEGORY_GROUP_INFO[group] || CATEGORY_GROUP_INFO['A'];

        // Get fee rate based on current platform and seller type
        let feeRate = 0;
        const sellerType = document.getElementById('sellerType')?.value || 'nonstar';

        if (typeof getPlatformRates === 'function') {
            const rates = getPlatformRates(sellerType);
            if (rates && rates[group] !== undefined) {
                feeRate = rates[group];
            }
        }

        // Update UI elements
        const iconEl = document.getElementById('categoryGroupIcon');
        const titleEl = document.getElementById('categoryGroupTitle');
        const feeEl = document.getElementById('categoryGroupFee');
        const descEl = document.getElementById('categoryGroupDesc');

        if (iconEl) iconEl.innerText = info.icon;
        if (titleEl) titleEl.innerText = info.title;
        if (feeEl) feeEl.innerText = feeRate > 0 ? `${feeRate}%` : info.feeLabel;
        if (descEl) descEl.innerText = info.desc;
    }

    // ==================== PUBLIC API ====================

    return {
        // Modal control
        open,
        openSingle,
        close,
        isOpen: isModalOpen,

        // View management
        resetView,

        // Column rendering
        renderColumn1,
        renderColumn2,
        renderColumn3,

        // Search
        filterCategories,

        // Selection
        selectPath,
        confirm,
        setQuickCategory,
        updateQuickButtons,
        updateGroupDetail,

        // Constants
        CATEGORY_GROUP_INFO
    };
})();

// ==================== BACKWARD COMPATIBILITY ====================
// Expose functions globally for onclick handlers in HTML

if (typeof window !== 'undefined') {
    window.CategoryModal = CategoryModal;

    // Legacy function mappings
    window.openCategoryModal = CategoryModal.open;
    window.openSingleCategoryModal = CategoryModal.openSingle;
    window.closeCategoryModal = CategoryModal.close;
    window.resetModalView = CategoryModal.resetView;
    window.filterCategories = CategoryModal.filterCategories;
    window.confirmCategory = CategoryModal.confirm;
    window.setQuickCategory = CategoryModal.setQuickCategory;
    window.updateQuickCategoryButtons = CategoryModal.updateQuickButtons;
    window.updateCategoryGroupDetail = CategoryModal.updateGroupDetail;

    // Column rendering (needed by other parts)
    window.renderCol1 = CategoryModal.renderColumn1;
    window.renderCol2 = CategoryModal.renderColumn2;
    window.renderCol3 = CategoryModal.renderColumn3;
    window.selectPath = CategoryModal.selectPath;
}
