/**
 * DataExporter - Data export and import functionality
 * Handles CSV, JSON export and database backup/restore
 */
const DataExporter = (function () {
    'use strict';

    // ==================== CSV EXPORT ====================

    /**
     * Export calculation data to CSV
     */
    function exportToCSV() {
        const inputMode = typeof window.inputMode !== 'undefined' ? window.inputMode : 'single';
        const products = typeof window.products !== 'undefined' ? window.products : [];

        let dataToExport = [];
        const headers = [
            "Nama Produk",
            "Kategori",
            "Grup",
            "Harga Jual",
            "Diskon(%)",
            "Voucher",
            "HPP",
            "Biaya Admin",
            "Biaya Layanan",
            "Biaya Affiliate",
            "Biaya Lain",
            "Total Potongan",
            "Total Modal",
            "Profit",
            "Margin(%)"
        ];

        dataToExport.push(headers);

        if (inputMode === 'single') {
            const name = document.getElementById('singleName')?.value || 'Produk Satuan';
            const cat = document.getElementById('selectedCategoryText')?.innerText || '';
            const grp = document.getElementById('currentCategoryGroup')?.value || 'A';
            const price = document.getElementById('originalPrice')?.value || '0';
            const disc = document.getElementById('discountPercent')?.value || '0';
            const voucher = document.getElementById('voucherAmount')?.value || '0';
            const hpp = document.getElementById('hpp')?.value || '0';

            // Retrieve calculated values from UI
            const parseRupiahFn = typeof parseRupiah === 'function'
                ? parseRupiah
                : (s) => parseFloat(String(s).replace(/[^\d,-]/g, '')) || 0;

            const admin = parseRupiahFn(document.getElementById('valAdminFee')?.innerText || '0');
            const service = parseRupiahFn(document.getElementById('valServiceFee')?.innerText || '0');
            const aff = parseRupiahFn(document.getElementById('valAffiliate')?.innerText || '0');
            const ded = parseRupiahFn(document.getElementById('valTotalDeductions')?.innerText || '0');
            const cost = parseRupiahFn(document.getElementById('sumCost')?.innerText || '0');
            const profit = parseRupiahFn(document.getElementById('finalProfit')?.innerText || '0');
            const margin = (document.getElementById('finalMarginBadge')?.innerText || '0%')
                .replace('Margin: ', '')
                .replace('%', '');

            dataToExport.push([name, cat, grp, price, disc, voucher, hpp, admin, service, aff, '', ded, cost, profit, margin]);
        } else {
            products.forEach(p => {
                const c = p.calculated || {};
                const margin = c.finalPrice > 0 ? (p.profit / c.finalPrice * 100).toFixed(2) : 0;
                dataToExport.push([
                    p.name,
                    p.categoryName,
                    p.categoryGroup,
                    p.price,
                    p.discount,
                    p.voucher,
                    p.hpp,
                    c.adminFee || 0,
                    c.serviceFee || 0,
                    c.affiliateFee || 0,
                    '',
                    c.totalDed || 0,
                    c.totalCost || 0,
                    p.profit,
                    margin
                ]);
            });
        }

        downloadCSV(dataToExport, 'laporan_profit_marketplace.csv');

        if (typeof showToast === 'function') {
            showToast('Berhasil export ke CSV', 'success');
        }
    }

    /**
     * Download data as CSV file
     * @param {Array} data - 2D array of data
     * @param {string} filename - Output filename
     */
    function downloadCSV(data, filename) {
        let csvContent = "data:text/csv;charset=utf-8,";
        data.forEach(row => {
            csvContent += row.map(val => `"${val}"`).join(",") + "\r\n";
        });

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    // ==================== JSON EXPORT/IMPORT ====================

    /**
     * Export all data to JSON file (backup)
     */
    function exportDatabaseJSON() {
        try {
            const productDB = typeof window.productDB !== 'undefined' ? window.productDB : [];
            const getHistoryFn = typeof getHistory === 'function'
                ? getHistory
                : () => JSON.parse(localStorage.getItem('calcHistory') || '[]');

            const exportData = {
                version: '2.0',
                exportedAt: new Date().toISOString(),
                productDB: productDB,
                calcHistory: getHistoryFn(),
                settings: {
                    theme: localStorage.getItem('theme'),
                    language: localStorage.getItem('language') || 'id'
                }
            };

            const dataStr = JSON.stringify(exportData, null, 2);
            const blob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(blob);

            const link = document.createElement('a');
            link.href = url;
            link.download = `cekbiaya_backup_${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            if (typeof showToast === 'function') {
                showToast('Backup berhasil didownload', 'success');
            }
        } catch (error) {
            console.error('Export error:', error);
            if (typeof showToast === 'function') {
                showToast('Gagal export data', 'error');
            }
        }
    }

    /**
     * Import data from JSON file (restore)
     * @param {File} file - JSON file to import
     */
    function importDatabaseJSON(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = function (e) {
                try {
                    const data = JSON.parse(e.target.result);

                    // Validate structure
                    if (!data.version || !data.productDB) {
                        throw new Error('Format file tidak valid');
                    }

                    // Restore productDB
                    if (data.productDB && Array.isArray(data.productDB)) {
                        window.productDB = data.productDB;
                        localStorage.setItem('productDB', JSON.stringify(data.productDB));
                    }

                    // Restore history
                    if (data.calcHistory && Array.isArray(data.calcHistory)) {
                        localStorage.setItem('calcHistory', JSON.stringify(data.calcHistory));
                    }

                    // Restore settings
                    if (data.settings) {
                        if (data.settings.theme) {
                            localStorage.setItem('theme', data.settings.theme);
                        }
                        if (data.settings.language) {
                            localStorage.setItem('language', data.settings.language);
                        }
                    }

                    if (typeof showToast === 'function') {
                        showToast(`Berhasil import ${data.productDB.length} produk`, 'success');
                    }

                    // Refresh UI
                    if (typeof renderHistory === 'function') {
                        renderHistory();
                    }

                    resolve(data);
                } catch (error) {
                    console.error('Import error:', error);
                    if (typeof showToast === 'function') {
                        showToast('Gagal import: ' + error.message, 'error');
                    }
                    reject(error);
                }
            };

            reader.onerror = function () {
                const error = new Error('Gagal membaca file');
                if (typeof showToast === 'function') {
                    showToast(error.message, 'error');
                }
                reject(error);
            };

            reader.readAsText(file);
        });
    }

    /**
     * Trigger file input for import
     */
    function triggerImport() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';

        input.onchange = async (e) => {
            const file = e.target.files[0];
            if (file) {
                await importDatabaseJSON(file);
            }
        };

        input.click();
    }

    // ==================== PRINT ====================

    /**
     * Print calculation results
     */
    function printResults() {
        // Prepare print-friendly content
        const profit = document.getElementById('finalProfit')?.innerText || '0';
        const margin = document.getElementById('finalMarginBadge')?.innerText || '';
        const net = document.getElementById('netIncome')?.innerText || '0';
        const platform = typeof currentPlatform !== 'undefined' ? currentPlatform : 'shopee';

        const printContent = `
            <html>
            <head>
                <title>Laporan Profit - CekBiayaJualan</title>
                <style>
                    body { font-family: Arial, sans-serif; padding: 20px; }
                    h1 { color: #f97316; }
                    .row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
                    .label { color: #666; }
                    .value { font-weight: bold; }
                    .profit { color: #10b981; font-size: 24px; }
                    .loss { color: #ef4444; }
                </style>
            </head>
            <body>
                <h1>📊 Laporan Profit CekBiayaJualan</h1>
                <p>Platform: ${platform.toUpperCase()}</p>
                <p>Tanggal: ${new Date().toLocaleDateString('id-ID')}</p>
                <hr>
                <div class="row">
                    <span class="label">Profit:</span>
                    <span class="value profit">${profit}</span>
                </div>
                <div class="row">
                    <span class="label">${margin}</span>
                </div>
                <div class="row">
                    <span class="label">Net Income:</span>
                    <span class="value">${net}</span>
                </div>
            </body>
            </html>
        `;

        const printWindow = window.open('', '_blank');
        printWindow.document.write(printContent);
        printWindow.document.close();
        printWindow.print();
    }

    // ==================== PUBLIC API ====================

    return {
        // CSV
        exportToCSV,
        downloadCSV,

        // JSON
        exportDatabaseJSON,
        importDatabaseJSON,
        triggerImport,

        // Print
        printResults
    };
})();

// ==================== BACKWARD COMPATIBILITY ====================

if (typeof window !== 'undefined') {
    window.DataExporter = DataExporter;

    // Legacy function mappings
    window.exportData = DataExporter.exportToCSV;
    window.exportDatabaseJSON = DataExporter.exportDatabaseJSON;
    window.importDatabaseJSON = DataExporter.triggerImport;
}
