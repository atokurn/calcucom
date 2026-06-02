/**
 * RecipeCalculator - Module for Recipe/Composition HPP & Pricing Calculations
 * Using IIFE pattern for browser compatibility and script-wide encapsulation
 */
const RecipeCalculator = (function () {
    'use strict';

    // ==================== PRIVATE STATE ====================
    let ingredients = [];
    let overheads = [];
    let yieldQty = 12; // Hasil Porsi per Resep
    let targetQty = 50; // Target Jumlah Produksi
    let sellingPrice = 15000; // Harga Jual per Unit
    let targetMargin = 35; // Target Margin (%)
    let salesChannel = 'offline'; // 'offline' | 'marketplace'
    let customAdminFee = 0; // Biaya admin marketplace custom %
    let currentRecipeId = null; // ID resep aktif jika memuat dari storage
    let currentRecipeName = '';
    let targetMode = 'margin'; // 'margin' | 'profit'
    let profitType = 'rupiah'; // 'rupiah' | 'percent'
    let targetProfitValue = 5000;
    let ignoreAutoFill = false;
    let isInitialized = false;

    // Unit factors mapping to handle conversions
    const UNIT_FACTORS = {
        'gram': { category: 'weight', factor: 1, label: 'gram' },
        'kg': { category: 'weight', factor: 1000, label: 'kg' },
        'ml': { category: 'volume', factor: 1, label: 'ml' },
        'liter': { category: 'volume', factor: 1000, label: 'liter' },
        'sdm': { category: 'spoon', factor: 15, label: 'sdm' },
        'sdt': { category: 'spoon', factor: 5, label: 'sdt' },
        'butir': { category: 'piece', factor: 1, label: 'butir' },
        'buah': { category: 'piece', factor: 1, label: 'buah' },
        'lembar': { category: 'piece', factor: 1, label: 'lembar' },
        'pcs': { category: 'piece', factor: 1, label: 'pcs' },
        'pack': { category: 'piece', factor: 1, label: 'pack' }
    };

    // Counters for generating unique IDs
    let ingredientIdCounter = 0;
    let overheadIdCounter = 0;

    // ==================== HELPER FUNCTIONS ====================
    
    function formatRupiah(num) {
        if (typeof window.formatRupiah === 'function') {
            return window.formatRupiah(num);
        }
        return 'Rp ' + Math.round(num).toLocaleString('id-ID');
    }

    function safeHtml(value) {
        return String(value ?? '')
            .replaceAll('&', '&amp;')
            .replaceAll('<', '&lt;')
            .replaceAll('>', '&gt;')
            .replaceAll('"', '&quot;')
            .replaceAll("'", '&#039;');
    }

    function parseCurrency(value) {
        if (typeof value === 'number') return value;
        if (!value) return 0;
        if (typeof window.parseFormattedNumber === 'function') {
            return window.parseFormattedNumber(value);
        }
        // Fallback: strip dots and non-digits
        const cleaned = String(value).replace(/\./g, '').replace(/[^\d.-]/g, '');
        return parseFloat(cleaned) || 0;
    }

    function parseQty(value) {
        if (typeof value === 'number') return value;
        if (!value) return 0;
        return parseFloat(value) || 0;
    }

    /**
     * Get multiplier to convert fromUnit to toUnit.
     * Returns null if units are incompatible.
     */
    function getConversionMultiplier(fromUnit, toUnit) {
        const from = UNIT_FACTORS[fromUnit];
        const to = UNIT_FACTORS[toUnit];
        if (!from || !to) return 1;

        let fromCat = from.category;
        let toCat = to.category;

        // Spoon to weight/volume adaptation
        if (fromCat === 'spoon') {
            if (toCat === 'weight' || toCat === 'volume') {
                fromCat = toCat;
            }
        }
        if (toCat === 'spoon') {
            if (fromCat === 'weight' || fromCat === 'volume') {
                toCat = fromCat;
            }
        }

        if (fromCat !== toCat) {
            return null; // Mismatched category
        }

        return from.factor / to.factor;
    }

    /**
     * Calculates cost of a single ingredient row
     */
    function calculateRowCost(item) {
        if (item.packageSize <= 0 || item.buyPrice <= 0 || item.recipeQty <= 0) return 0;
        
        const mult = getConversionMultiplier(item.packageUnit, item.recipeUnit);
        if (mult === null) {
            // Fallback to direct ratio if incompatible
            return (item.buyPrice * item.recipeQty) / item.packageSize;
        }

        const packageSizeInRecipeUnit = item.packageSize * mult;
        if (packageSizeInRecipeUnit <= 0) return 0;

        return (item.buyPrice * item.recipeQty) / packageSizeInRecipeUnit;
    }

    // ==================== STATE CRUD HANDLERS ====================

    function addIngredient(name = '', buyPrice = 0, packageSize = 1000, packageUnit = 'gram', recipeQty = 100, recipeUnit = 'gram') {
        ingredientIdCounter++;
        const item = {
            id: ingredientIdCounter,
            name,
            buyPrice,
            packageSize,
            packageUnit,
            recipeQty,
            recipeUnit
        };
        ingredients.push(item);
        renderIngredientRow(item);
        calculateAndRenderSummary();
    }

    function removeIngredient(id) {
        ingredients = ingredients.filter(item => item.id !== id);
        const row = document.getElementById(`ing-row-${id}`);
        if (row) row.remove();
        
        if (ingredients.length === 0) {
            renderEmptyIngredientsPlaceholder();
        }
        calculateAndRenderSummary();
    }

    function addOverhead(name = '', type = 'per_batch', cost = 0) {
        overheadIdCounter++;
        const item = {
            id: overheadIdCounter,
            name,
            type, // 'per_batch' | 'per_unit'
            cost
        };
        overheads.push(item);
        renderOverheadRow(item);
        calculateAndRenderSummary();
    }

    function removeOverhead(id) {
        overheads = overheads.filter(item => item.id !== id);
        const row = document.getElementById(`ovr-row-${id}`);
        if (row) row.remove();

        if (overheads.length === 0) {
            renderEmptyOverheadsPlaceholder();
        }
        calculateAndRenderSummary();
    }

    // ==================== RENDERING WORKFLOWS ====================

    function renderEmptyIngredientsPlaceholder() {
        const list = document.getElementById('recipe-ingredients-list');
        if (list) {
            list.innerHTML = `
                <tr id="ing-empty-row">
                    <td colspan="8" class="text-center py-8 text-slate-400 dark:text-slate-500">
                        <i class="fas fa-carrot text-2xl mb-2 block opacity-40"></i>
                        <span class="text-xs">Belum ada bahan baku. Klik "+ Tambah Bahan" di bawah.</span>
                    </td>
                </tr>
            `;
        }
    }

    function renderEmptyOverheadsPlaceholder() {
        const list = document.getElementById('recipe-overheads-list');
        if (list) {
            list.innerHTML = `
                <tr id="ovr-empty-row">
                    <td colspan="4" class="text-center py-6 text-slate-400 dark:text-slate-500">
                        <i class="fas fa-receipt text-xl mb-2 block opacity-40"></i>
                        <span class="text-xs">Belum ada biaya overhead tambahan.</span>
                    </td>
                </tr>
            `;
        }
    }

    function renderIngredientRow(item) {
        const list = document.getElementById('recipe-ingredients-list');
        if (!list) return;

        // Remove empty state if present
        const emptyRow = document.getElementById('ing-empty-row');
        if (emptyRow) emptyRow.remove();

        const tr = document.createElement('tr');
        tr.id = `ing-row-${item.id}`;
        tr.className = 'border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors';

        const rowCost = calculateRowCost(item);

        // Unit selector generator helper
        const makeUnitSelect = (selectedValue, onChangeAttr) => {
            return `
                <select onchange="${onChangeAttr}" class="w-full text-xs p-1 border border-slate-200 dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-slate-700 dark:text-white">
                    ${Object.keys(UNIT_FACTORS).map(u => `<option value="${u}" ${u === selectedValue ? 'selected' : ''}>${UNIT_FACTORS[u].label}</option>`).join('')}
                </select>
            `;
        };

        tr.innerHTML = `
            <td class="p-2 min-w-[140px]">
                <input type="text" value="${safeHtml(item.name)}" placeholder="Tepung Terigu" 
                    oninput="RecipeCalculator.updateIngredientField(${item.id}, 'name', this.value)"
                    class="w-full text-xs p-1 border border-slate-200 dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-slate-700 dark:text-white">
            </td>
            <td class="p-2 min-w-[110px]">
                <div class="relative">
                    <span class="absolute left-1.5 top-1.5 text-[10px] text-slate-400">Rp</span>
                    <input type="text" value="${item.buyPrice.toLocaleString('id-ID')}" placeholder="15.000"
                        oninput="formatInputWithSeparator(this); RecipeCalculator.updateIngredientField(${item.id}, 'buyPrice', this.value)"
                        class="w-full text-xs pl-6 pr-1.5 py-1 border border-slate-200 dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-slate-700 dark:text-white text-right">
                </div>
            </td>
            <td class="p-2 min-w-[80px]">
                <input type="number" value="${item.packageSize}" placeholder="1000" min="0.001" step="any"
                    oninput="RecipeCalculator.updateIngredientField(${item.id}, 'packageSize', this.value)"
                    class="w-full text-xs p-1 border border-slate-200 dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-slate-700 dark:text-white text-center">
            </td>
            <td class="p-2 min-w-[85px]">
                ${makeUnitSelect(item.packageUnit, `RecipeCalculator.updateIngredientField(${item.id}, 'packageUnit', this.value)`)}
            </td>
            <td class="p-2 min-w-[80px]">
                <input type="number" value="${item.recipeQty}" placeholder="100" min="0.001" step="any"
                    oninput="RecipeCalculator.updateIngredientField(${item.id}, 'recipeQty', this.value)"
                    class="w-full text-xs p-1 border border-slate-200 dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-slate-700 dark:text-white text-center">
            </td>
            <td class="p-2 min-w-[85px]">
                ${makeUnitSelect(item.recipeUnit, `RecipeCalculator.updateIngredientField(${item.id}, 'recipeUnit', this.value)`)}
            </td>
            <td class="p-2 text-right font-semibold text-xs text-slate-700 dark:text-slate-300 min-w-[100px]" id="ing-cost-${item.id}">
                ${formatRupiah(rowCost)}
            </td>
            <td class="p-2 text-center min-w-[40px]">
                <button onclick="RecipeCalculator.removeIngredient(${item.id})" title="Hapus Bahan"
                    class="text-red-400 hover:text-red-600 w-7 h-7 flex items-center justify-center rounded hover:bg-red-50 dark:hover:bg-red-950/20 transition-all">
                    <i class="fas fa-trash-alt text-xs"></i>
                </button>
            </td>
        `;

        list.appendChild(tr);
    }

    function renderOverheadRow(item) {
        const list = document.getElementById('recipe-overheads-list');
        if (!list) return;

        const emptyRow = document.getElementById('ovr-empty-row');
        if (emptyRow) emptyRow.remove();

        const tr = document.createElement('tr');
        tr.id = `ovr-row-${item.id}`;
        tr.className = 'border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors';

        tr.innerHTML = `
            <td class="p-2">
                <input type="text" value="${safeHtml(item.name)}" placeholder="Kemasan Box / Mika" 
                    oninput="RecipeCalculator.updateOverheadField(${item.id}, 'name', this.value)"
                    class="w-full text-xs p-1 border border-slate-200 dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-slate-700 dark:text-white">
            </td>
            <td class="p-2">
                <select onchange="RecipeCalculator.updateOverheadField(${item.id}, 'type', this.value)" 
                    class="w-full text-xs p-1 border border-slate-200 dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-slate-700 dark:text-white">
                    <option value="per_unit" ${item.type === 'per_unit' ? 'selected' : ''}>Per Unit Hasil</option>
                    <option value="per_batch" ${item.type === 'per_batch' ? 'selected' : ''}>Per Batch Resep</option>
                </select>
            </td>
            <td class="p-2 min-w-[110px]">
                <div class="relative">
                    <span class="absolute left-1.5 top-1.5 text-[10px] text-slate-400">Rp</span>
                    <input type="text" value="${item.cost.toLocaleString('id-ID')}" placeholder="2.000"
                        oninput="formatInputWithSeparator(this); RecipeCalculator.updateOverheadField(${item.id}, 'cost', this.value)"
                        class="w-full text-xs pl-6 pr-1.5 py-1 border border-slate-200 dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-slate-700 dark:text-white text-right">
                </div>
            </td>
            <td class="p-2 text-center min-w-[40px]">
                <button onclick="RecipeCalculator.removeOverhead(${item.id})" title="Hapus Overhead"
                    class="text-red-400 hover:text-red-600 w-7 h-7 flex items-center justify-center rounded hover:bg-red-50 dark:hover:bg-red-950/20 transition-all">
                    <i class="fas fa-trash-alt text-xs"></i>
                </button>
            </td>
        `;

        list.appendChild(tr);
    }

    // ==================== CALCULATION & INTEGRATION ====================

    function updateIngredientField(id, field, value) {
        const item = ingredients.find(i => i.id === id);
        if (!item) return;

        if (field === 'buyPrice') {
            item[field] = parseCurrency(value);
        } else if (field === 'packageSize' || field === 'recipeQty') {
            item[field] = parseQty(value);
        } else {
            item[field] = value;
        }

        // Recalculate this specific row's cost
        const rowCost = calculateRowCost(item);
        const costEl = document.getElementById(`ing-cost-${id}`);
        if (costEl) {
            costEl.innerText = formatRupiah(rowCost);
        }

        calculateAndRenderSummary();
    }

    function updateOverheadField(id, field, value) {
        const item = overheads.find(o => o.id === id);
        if (!item) return;

        if (field === 'cost') {
            item[field] = parseCurrency(value);
        } else {
            item[field] = value;
        }

        calculateAndRenderSummary();
    }

    /**
     * Re-renders the cost breakdown, sisa bahan, shopping list, and simulator
     */
    function calculateAndRenderSummary() {
        // Collect inputs from DOM for yieldQty, targetQty, sellingPrice, customAdminFee, targetMargin
        const yieldInput = document.getElementById('recipe-yield-qty');
        if (yieldInput) yieldQty = Math.max(1, parseInt(yieldInput.value) || 1);

        const targetInput = document.getElementById('recipe-target-qty');
        if (targetInput) targetQty = Math.max(1, parseInt(targetInput.value) || 1);

        const sellingPriceInput = document.getElementById('recipe-selling-price');
        if (sellingPriceInput) sellingPrice = parseCurrency(sellingPriceInput.value);

        const marginInput = document.getElementById('recipe-target-margin');
        const marginVal = document.getElementById('recipe-margin-value');
        if (marginInput) {
            targetMargin = parseFloat(marginInput.value) || 0;
            if (marginVal) marginVal.textContent = targetMargin + '%';
        }

        const profitInput = document.getElementById('recipe-target-profit');
        if (profitInput) {
            targetProfitValue = profitType === 'rupiah' ? parseCurrency(profitInput.value) : parseQty(profitInput.value);
        }

        const feeInput = document.getElementById('recipe-custom-fee');
        if (feeInput) customAdminFee = parseFloat(feeInput.value) || 0;

        // 1. Calculate Recipe Costs
        let totalRecipeCost = 0;
        ingredients.forEach(item => {
            totalRecipeCost += calculateRowCost(item);
        });

        // 2. Calculate Overheads
        let totalBatchOverhead = 0;
        let totalUnitOverhead = 0;
        overheads.forEach(item => {
            if (item.type === 'per_batch') {
                totalBatchOverhead += item.cost;
            } else {
                totalUnitOverhead += item.cost;
            }
        });

        // 3. Compute HPP (Cost of Goods Manufactured) per Unit
        // HPP per unit = (Total Recipe Cost + Total Batch Overheads) / yieldQty + Total Unit Overheads
        const recipeCostPerUnit = totalRecipeCost / yieldQty;
        const batchOverheadPerUnit = totalBatchOverhead / yieldQty;
        const totalHppPerUnit = recipeCostPerUnit + batchOverheadPerUnit + totalUnitOverhead;

        // 4. Update core result displays
        const batchCostEl = document.getElementById('result-batch-cost');
        if (batchCostEl) batchCostEl.textContent = formatRupiah(totalRecipeCost + totalBatchOverhead);

        const hppUnitEl = document.getElementById('result-hpp-unit');
        if (hppUnitEl) hppUnitEl.textContent = formatRupiah(totalHppPerUnit);

        const yieldTextEl = document.getElementById('result-yield-text');
        if (yieldTextEl) yieldTextEl.textContent = `(HPP untuk 1 dari ${yieldQty} unit hasil resep)`;

        // 5. Run Pricing Simulator
        const adminFeePct = salesChannel === 'offline' ? 0 : customAdminFee;

        // Formula for recommended price based on target profit margin/nominal and admin fee
        let recommendedPrice = 0;
        if (targetMode === 'margin') {
            const divisor = 1 - (targetMargin / 100) - (adminFeePct / 100);
            if (divisor > 0) {
                recommendedPrice = totalHppPerUnit / divisor;
            } else {
                recommendedPrice = totalHppPerUnit * (1 + (targetMargin / 100));
            }
        } else {
            let targetProfitAmount = 0;
            if (profitType === 'rupiah') {
                targetProfitAmount = targetProfitValue;
            } else {
                targetProfitAmount = totalHppPerUnit * (targetProfitValue / 100);
            }
            const divisor = 1 - (adminFeePct / 100);
            if (divisor > 0) {
                recommendedPrice = (totalHppPerUnit + targetProfitAmount) / divisor;
            } else {
                recommendedPrice = totalHppPerUnit + targetProfitAmount;
            }
        }

        // Round recommended price
        recommendedPrice = Math.round(recommendedPrice);

        // AUTO-FILL: If the user is NOT focusing/typing in the selling price input,
        // and we are not ignoring auto-fill (e.g. during loadRecipe).
        if (sellingPriceInput && document.activeElement !== sellingPriceInput && !ignoreAutoFill) {
            sellingPrice = recommendedPrice;
            sellingPriceInput.value = recommendedPrice.toLocaleString('id-ID');
        }

        const commissionCost = sellingPrice * (adminFeePct / 100);
        const netProfitPerUnit = sellingPrice - totalHppPerUnit - commissionCost;
        
        let actualMargin = 0;
        if (sellingPrice > 0) {
            actualMargin = (netProfitPerUnit / sellingPrice) * 100;
        }

        // Update Simulator DOM
        const recPriceEl = document.getElementById('sim-rec-price');
        if (recPriceEl) recPriceEl.textContent = formatRupiah(recommendedPrice);

        const netProfitEl = document.getElementById('sim-net-profit');
        if (netProfitEl) netProfitEl.textContent = formatRupiah(netProfitPerUnit);

        const actMarginEl = document.getElementById('sim-actual-margin');
        if (actMarginEl) actMarginEl.textContent = actualMargin.toFixed(1) + '%';

        // Update status badge for simulation
        const statusBadge = document.getElementById('sim-status-badge');
        if (statusBadge) {
            statusBadge.className = 'px-3 py-1 text-xs font-bold rounded-full text-center inline-block transition-colors';
            
            let isBelowTarget = false;
            if (targetMode === 'margin') {
                isBelowTarget = actualMargin < targetMargin;
            } else {
                if (profitType === 'rupiah') {
                    isBelowTarget = netProfitPerUnit < targetProfitValue;
                } else {
                    const actualProfitPctOfHpp = totalHppPerUnit > 0 ? (netProfitPerUnit / totalHppPerUnit) * 100 : 0;
                    isBelowTarget = actualProfitPctOfHpp < targetProfitValue;
                }
            }

            if (netProfitPerUnit <= 0) {
                statusBadge.classList.add('bg-red-100', 'text-red-800', 'dark:bg-red-950/40', 'dark:text-red-300');
                statusBadge.textContent = 'RUGI';
            } else if (isBelowTarget) {
                statusBadge.classList.add('bg-yellow-100', 'text-yellow-800', 'dark:bg-yellow-950/40', 'dark:text-yellow-300');
                statusBadge.textContent = 'PROFIT TIPIS (Di bawah target)';
            } else {
                statusBadge.classList.add('bg-emerald-100', 'text-emerald-800', 'dark:bg-emerald-950/40', 'dark:text-emerald-300');
                statusBadge.textContent = 'PROFIT SEHAT (Sesuai target)';
            }
        }

        // 6. Leftovers & Shopping List Projection
        renderLeftoversAndShopping(totalRecipeCost, totalHppPerUnit);
    }

    /**
     * Compute and render the Shopping List and Leftover Material inventory
     */
    function renderLeftoversAndShopping(totalRecipeCost, hppPerUnit) {
        const leftoversList = document.getElementById('recipe-leftovers-list');
        const shoppingList = document.getElementById('recipe-shopping-list');
        if (!leftoversList || !shoppingList) return;

        if (ingredients.length === 0) {
            leftoversList.innerHTML = `
                <tr>
                    <td colspan="5" class="text-center py-4 text-xs text-slate-400">Belum ada bahan baku.</td>
                </tr>
            `;
            shoppingList.innerHTML = `
                <div class="text-center py-4 text-xs text-slate-400">Belum ada daftar belanja.</div>
            `;
            
            const totalShoppingCostEl = document.getElementById('total-shopping-cost');
            if (totalShoppingCostEl) totalShoppingCostEl.textContent = 'Rp 0';
            return;
        }

        let totalShoppingCost = 0;
        let leftoverItemsHtml = '';
        let shoppingItemsHtml = '';

        ingredients.forEach(item => {
            if (item.buyPrice <= 0 || item.packageSize <= 0) return;

            // Total amount of this ingredient needed for targetQty
            // amountNeeded = (recipeQty / yieldQty) * targetQty
            const recipeQtyPerUnit = item.recipeQty / yieldQty;
            const totalNeeded = recipeQtyPerUnit * targetQty;

            // Convert package size to recipe unit
            const mult = getConversionMultiplier(item.packageUnit, item.recipeUnit);
            const packageSizeInRecipeUnit = mult !== null ? (item.packageSize * mult) : item.packageSize;
            
            // Calculate packages to buy
            const packagesToBuy = Math.ceil(totalNeeded / packageSizeInRecipeUnit);
            const totalBoughtQty = packagesToBuy * packageSizeInRecipeUnit;
            const costOfPackage = item.buyPrice;
            const itemShoppingCost = packagesToBuy * costOfPackage;
            totalShoppingCost += itemShoppingCost;

            // Leftover inventory math
            const leftoverQty = Math.max(0, totalBoughtQty - totalNeeded);
            const costPerRecipeUnit = costOfPackage / packageSizeInRecipeUnit;
            const leftoverValue = leftoverQty * costPerRecipeUnit;

            // Shopping list display (e.g. "2x Tepung Terigu (1 kg) @ Rp 12.000")
            shoppingItemsHtml += `
                <div class="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300">
                    <div class="flex items-center gap-2">
                        <span class="w-6 h-6 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-bold rounded flex items-center justify-center">${packagesToBuy}x</span>
                        <div>
                            <p class="font-medium text-slate-800 dark:text-slate-200">${safeHtml(item.name || 'Bahan Tanpa Nama')}</p>
                            <p class="text-[10px] text-slate-400">${item.packageSize} ${item.packageUnit} @ ${formatRupiah(costOfPackage)}</p>
                        </div>
                    </div>
                    <span class="font-semibold text-slate-800 dark:text-slate-200">${formatRupiah(itemShoppingCost)}</span>
                </div>
            `;

            // Leftover inventory row
            leftoverItemsHtml += `
                <tr class="border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 text-xs">
                    <td class="p-2 font-medium text-slate-800 dark:text-slate-200">${safeHtml(item.name || 'Bahan Tanpa Nama')}</td>
                    <td class="p-2 text-center text-slate-500 dark:text-slate-400">${totalNeeded.toFixed(1)} ${item.recipeUnit}</td>
                    <td class="p-2 text-center text-slate-500 dark:text-slate-400">${packagesToBuy} pack (${totalBoughtQty.toFixed(1)} ${item.recipeUnit})</td>
                    <td class="p-2 text-center text-blue-600 dark:text-blue-400 font-medium">${leftoverQty.toFixed(1)} ${item.recipeUnit}</td>
                    <td class="p-2 text-right font-semibold text-slate-700 dark:text-slate-300">${formatRupiah(leftoverValue)}</td>
                </tr>
            `;
        });

        leftoversList.innerHTML = leftoverItemsHtml;
        shoppingList.innerHTML = shoppingItemsHtml;

        // Update Total modal belanja awal
        const totalShoppingCostEl = document.getElementById('total-shopping-cost');
        if (totalShoppingCostEl) totalShoppingCostEl.textContent = formatRupiah(totalShoppingCost);
    }

    // ==================== LOCALSTORAGE PERSISTENCE ====================

    function getRecipesFromStorage() {
        try {
            return JSON.parse(localStorage.getItem('cekbiayajualan_recipes') || '{}');
        } catch (e) {
            console.error('Failed to parse recipes from storage:', e);
            return {};
        }
    }

    function saveRecipesToStorage(recipes) {
        try {
            localStorage.setItem('cekbiayajualan_recipes', JSON.stringify(recipes));
        } catch (e) {
            console.error('Failed to save recipes to storage:', e);
        }
    }

    function loadSavedRecipesList() {
        const selector = document.getElementById('recipe-selector');
        if (!selector) return;

        const recipes = getRecipesFromStorage();
        const ids = Object.keys(recipes);

        // Preserve first option
        selector.innerHTML = '<option value="">-- Pilih Resep Tersimpan --</option>';

        ids.forEach(id => {
            const r = recipes[id];
            const opt = document.createElement('option');
            opt.value = id;
            opt.textContent = r.name || `Resep #${id}`;
            selector.appendChild(opt);
        });

        // Set select value to active if loaded
        if (currentRecipeId && recipes[currentRecipeId]) {
            selector.value = currentRecipeId;
        }
    }

    function saveRecipe() {
        const nameInput = document.getElementById('recipe-name-input');
        if (!nameInput || !nameInput.value.trim()) {
            if (typeof window.showToast === 'function') {
                window.showToast('Masukkan nama resep terlebih dahulu', 'error');
            } else {
                alert('Masukkan nama resep terlebih dahulu');
            }
            return;
        }

        const name = nameInput.value.trim();
        const recipes = getRecipesFromStorage();

        // If not editing a loaded recipe, generate new ID
        let id = currentRecipeId;
        if (!id) {
            id = 'rec_' + Date.now();
            currentRecipeId = id;
        }

        recipes[id] = {
            id,
            name,
            ingredients,
            overheads,
            yieldQty,
            targetQty,
            sellingPrice,
            targetMargin,
            salesChannel,
            customAdminFee,
            targetMode,
            profitType,
            targetProfitValue
        };

        saveRecipesToStorage(recipes);
        currentRecipeName = name;
        loadSavedRecipesList();

        // Show toast
        if (typeof window.showToast === 'function') {
            window.showToast(`Resep "${name}" berhasil disimpan`, 'success');
        }
    }

    function loadRecipe(id) {
        if (!id) return;
        const recipes = getRecipesFromStorage();
        const r = recipes[id];
        if (!r) return;

        currentRecipeId = id;
        currentRecipeName = r.name || '';
        ingredients = r.ingredients || [];
        overheads = r.overheads || [];
        yieldQty = r.yieldQty || 1;
        targetQty = r.targetQty || 10;
        sellingPrice = r.sellingPrice || 0;
        targetMargin = r.targetMargin || 30;
        salesChannel = r.salesChannel || 'offline';
        customAdminFee = r.customAdminFee || 0;
        targetMode = r.targetMode || 'margin';
        profitType = r.profitType || 'rupiah';
        targetProfitValue = r.targetProfitValue !== undefined ? r.targetProfitValue : 5000;

        // Reset counters to prevent collision
        ingredientIdCounter = ingredients.reduce((max, item) => Math.max(max, item.id || 0), 0);
        overheadIdCounter = overheads.reduce((max, item) => Math.max(max, item.id || 0), 0);

        // Update form fields in DOM
        const nameInput = document.getElementById('recipe-name-input');
        if (nameInput) nameInput.value = currentRecipeName;

        const yieldInput = document.getElementById('recipe-yield-qty');
        if (yieldInput) yieldInput.value = yieldQty;

        const targetInput = document.getElementById('recipe-target-qty');
        if (targetInput) targetInput.value = targetQty;

        const sellingPriceInput = document.getElementById('recipe-selling-price');
        if (sellingPriceInput) sellingPriceInput.value = sellingPrice.toLocaleString('id-ID');

        const marginInput = document.getElementById('recipe-target-margin');
        const marginVal = document.getElementById('recipe-margin-value');
        if (marginInput) {
            marginInput.value = targetMargin;
            if (marginVal) marginVal.textContent = targetMargin + '%';
        }

        const profitInput = document.getElementById('recipe-target-profit');
        if (profitInput) {
            if (profitType === 'rupiah') {
                profitInput.value = targetProfitValue.toLocaleString('id-ID');
            } else {
                profitInput.value = targetProfitValue;
            }
        }

        const feeInput = document.getElementById('recipe-custom-fee');
        if (feeInput) feeInput.value = customAdminFee;

        ignoreAutoFill = true;

        // Sync channel tabs in UI
        switchChannel(salesChannel);

        // Sync target mode in UI
        setTargetMode(targetMode);
        setProfitType(profitType);

        // Re-render table lists
        rebuildTablesDOM();
        calculateAndRenderSummary();

        ignoreAutoFill = false;

        if (typeof window.showToast === 'function') {
            window.showToast(`Resep "${r.name}" berhasil dimuat`, 'success');
        }
    }

    function deleteRecipe() {
        const selector = document.getElementById('recipe-selector');
        if (!selector || !selector.value) {
            if (typeof window.showToast === 'function') {
                window.showToast('Pilih resep yang ingin dihapus', 'error');
            }
            return;
        }

        const id = selector.value;
        const recipes = getRecipesFromStorage();
        const name = recipes[id] ? recipes[id].name : 'Resep';

        if (confirm(`Apakah Anda yakin ingin menghapus resep "${name}"?`)) {
            delete recipes[id];
            saveRecipesToStorage(recipes);
            
            // Clear if loaded
            if (currentRecipeId === id) {
                resetForm();
            } else {
                loadSavedRecipesList();
            }

            if (typeof window.showToast === 'function') {
                window.showToast(`Resep "${name}" berhasil dihapus`, 'success');
            }
        }
    }

    function resetForm() {
        ingredients = [];
        overheads = [];
        yieldQty = 12;
        targetQty = 50;
        sellingPrice = 15000;
        targetMargin = 35;
        salesChannel = 'offline';
        customAdminFee = 0;
        currentRecipeId = null;
        currentRecipeName = '';
        targetMode = 'margin';
        profitType = 'rupiah';
        targetProfitValue = 5000;

        ingredientIdCounter = 0;
        overheadIdCounter = 0;

        // DOM resets
        const nameInput = document.getElementById('recipe-name-input');
        if (nameInput) nameInput.value = '';

        const yieldInput = document.getElementById('recipe-yield-qty');
        if (yieldInput) yieldInput.value = yieldQty;

        const targetInput = document.getElementById('recipe-target-qty');
        if (targetInput) targetInput.value = targetQty;

        const sellingPriceInput = document.getElementById('recipe-selling-price');
        if (sellingPriceInput) sellingPriceInput.value = sellingPrice.toLocaleString('id-ID');

        const marginInput = document.getElementById('recipe-target-margin');
        const marginVal = document.getElementById('recipe-margin-value');
        if (marginInput) {
            marginInput.value = targetMargin;
            if (marginVal) marginVal.textContent = targetMargin + '%';
        }

        const profitInput = document.getElementById('recipe-target-profit');
        if (profitInput) profitInput.value = '5.000';

        const feeInput = document.getElementById('recipe-custom-fee');
        if (feeInput) feeInput.value = customAdminFee;

        // Reset list selector
        const selector = document.getElementById('recipe-selector');
        if (selector) selector.value = '';

        switchChannel('offline');
        setTargetMode('margin');
        setProfitType('rupiah');
        rebuildTablesDOM();

        // Add 2 default empty rows for quick start
        addIngredient('Tepung Terigu', 12000, 1, 'kg', 150, 'gram');
        addIngredient('Gula Pasir', 16000, 1000, 'gram', 100, 'gram');
        addIngredient('Butir Telur', 30000, 15, 'butir', 2, 'butir');

        addOverhead('Box Kemasan', 'per_unit', 1500);

        calculateAndRenderSummary();
    }

    function rebuildTablesDOM() {
        const ingList = document.getElementById('recipe-ingredients-list');
        const ovrList = document.getElementById('recipe-overheads-list');

        if (ingList) ingList.innerHTML = '';
        if (ovrList) ovrList.innerHTML = '';

        if (ingredients.length === 0) {
            renderEmptyIngredientsPlaceholder();
        } else {
            ingredients.forEach(item => renderIngredientRow(item));
        }

        if (overheads.length === 0) {
            renderEmptyOverheadsPlaceholder();
        } else {
            overheads.forEach(item => renderOverheadRow(item));
        }
    }

    function switchChannel(channel) {
        if (channel !== 'offline' && channel !== 'marketplace') return;
        salesChannel = channel;

        const btnOffline = document.getElementById('recipe-channel-offline');
        const btnMarketplace = document.getElementById('recipe-channel-marketplace');
        const feeSection = document.getElementById('recipe-fee-section');

        const activeClass = 'flex-1 py-1.5 text-xs font-bold rounded-md bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-sm border border-slate-200 dark:border-slate-700 transition-all';
        const inactiveClass = 'flex-1 py-1.5 text-xs font-bold text-slate-400 rounded-md transition-all hover:bg-slate-100 dark:hover:bg-slate-700/50';

        if (channel === 'offline') {
            if (btnOffline) btnOffline.className = activeClass;
            if (btnMarketplace) btnMarketplace.className = inactiveClass;
            if (feeSection) feeSection.classList.add('hidden');
        } else {
            if (btnMarketplace) btnMarketplace.className = activeClass;
            if (btnOffline) btnOffline.className = inactiveClass;
            if (feeSection) feeSection.classList.remove('hidden');
            
            // Sync default marketplace fee from active state if available
            syncActiveMarketplaceFee();
        }

        calculateAndRenderSummary();
    }

    function syncActiveMarketplaceFee() {
        // Look up active fee from Profit Calculator
        const feeInput = document.getElementById('recipe-custom-fee');
        if (!feeInput) return;

        let detectedFee = 0;

        // Try to get computed fee rate from window variables or DOM elements of other modules
        const platform = window.AppState?.get('platform') || 'shopee';
        const sellerType = window.AppState?.get('sellerType') || 'nonstar';
        const categoryGroup = window.AppState?.get('category.group') || 'A';

        if (window.AppConstants && typeof window.AppConstants.getAdminFeeRate === 'function') {
            detectedFee = window.AppConstants.getAdminFeeRate(platform, sellerType, categoryGroup);
            
            // Add service fees if applicable
            const config = window.AppConstants.getMarketplace(platform);
            const freeShipEnabled = window.AppState?.get('features.freeShipEnabled') || false;
            if (freeShipEnabled && config.serviceFees?.freeShip?.rate) {
                detectedFee += config.serviceFees.freeShip.rate;
            }
        } else {
            // Fallback default
            detectedFee = 8.0;
        }

        feeInput.value = detectedFee.toFixed(1);
        customAdminFee = detectedFee;
    }

    function setTargetMode(mode) {
        if (mode !== 'margin' && mode !== 'profit') return;
        targetMode = mode;

        const btnMargin = document.getElementById('recipe-btn-margin');
        const btnProfit = document.getElementById('recipe-btn-profit');
        const marginSec = document.getElementById('recipe-margin-section');
        const profitSec = document.getElementById('recipe-profit-section');

        const activeClass = 'flex-1 py-1 text-xs font-bold rounded-md bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-sm border border-slate-200 dark:border-slate-700 transition-all';
        const inactiveClass = 'flex-1 py-1 text-xs font-bold text-slate-400 rounded-md transition-all hover:bg-slate-100 dark:hover:bg-slate-700/50';

        if (mode === 'margin') {
            if (btnMargin) btnMargin.className = activeClass;
            if (btnProfit) btnProfit.className = inactiveClass;
            if (marginSec) marginSec.classList.remove('hidden');
            if (profitSec) profitSec.classList.add('hidden');
        } else {
            if (btnProfit) btnProfit.className = activeClass;
            if (btnMargin) btnMargin.className = inactiveClass;
            if (profitSec) profitSec.classList.remove('hidden');
            if (marginSec) marginSec.classList.add('hidden');
        }

        calculateAndRenderSummary();
    }

    function setProfitType(type) {
        if (type !== 'rupiah' && type !== 'percent') return;
        profitType = type;

        const btnRp = document.getElementById('recipe-profit-type-rp');
        const btnPct = document.getElementById('recipe-profit-type-pct');
        const prefix = document.getElementById('recipe-profit-prefix');
        const input = document.getElementById('recipe-target-profit');

        const activeClass = 'flex-1 py-1 text-[10px] font-bold rounded bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm border border-slate-200 dark:border-slate-600 transition-all';
        const inactiveClass = 'flex-1 py-1 text-[10px] font-bold text-slate-400 rounded transition-all hover:bg-slate-100 dark:hover:bg-slate-700/50';

        if (type === 'rupiah') {
            if (btnRp) btnRp.className = activeClass;
            if (btnPct) btnPct.className = inactiveClass;
            if (prefix) prefix.textContent = 'Rp';
            if (input) {
                const val = parseQty(input.value);
                input.value = (val > 100 ? val : 5000).toLocaleString('id-ID');
            }
        } else {
            if (btnPct) btnPct.className = activeClass;
            if (btnRp) btnRp.className = inactiveClass;
            if (prefix) prefix.textContent = '%';
            if (input) {
                const val = parseCurrency(input.value);
                input.value = val <= 100 ? val : 35;
            }
        }

        calculateAndRenderSummary();
    }

    function applyRecommendation() {
        const recPriceEl = document.getElementById('sim-rec-price');
        if (!recPriceEl) return;
        const price = parseCurrency(recPriceEl.textContent);
        if (price > 0) {
            sellingPrice = price;
            const sellingPriceInput = document.getElementById('recipe-selling-price');
            if (sellingPriceInput) {
                sellingPriceInput.value = price.toLocaleString('id-ID');
            }
            calculateAndRenderSummary();
            if (typeof window.showToast === 'function') {
                window.showToast('Rekomendasi harga diterapkan', 'success');
            }
        }
    }

    function init() {
        if (isInitialized) return;

        // Initial loading of storage
        loadSavedRecipesList();

        // Initialize table structures and template fields
        resetForm();

        // Setup event listener on saved recipe select change
        const selector = document.getElementById('recipe-selector');
        if (selector) {
            selector.addEventListener('change', (e) => loadRecipe(e.target.value));
        }

        isInitialized = true;
    }

    // ==================== PUBLIC API ====================
    return {
        init,
        isInitialized: () => isInitialized,
        getProductCount: () => ingredients.length,
        getProfitType: () => profitType,
        getTargetMode: () => targetMode,

        // Handlers called from inline elements
        updateIngredientField,
        updateOverheadField,
        addIngredient: () => addIngredient('', 0, 1000, 'gram', 100, 'gram'),
        removeIngredient,
        addOverhead: () => addOverhead('', 'per_unit', 0),
        removeOverhead,
        
        // Dynamic controls
        switchChannel,
        calculateAndRender: calculateAndRenderSummary,
        applyRecommendation,

        // Target mode controls
        setTargetMode,
        setProfitType,

        // CRUD persist
        saveRecipe,
        deleteRecipe,
        resetForm,
        onRecipeSelect: loadRecipe
    };
})();

// Global registration
if (typeof window !== 'undefined') {
    window.RecipeCalculator = RecipeCalculator;
}
