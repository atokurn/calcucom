        // --- DATA ---
        const shopeeRates = {
            star: { 'A': 8.0, 'B': 7.5, 'C': 5.75, 'D': 4.25, 'E': 2.5, 'F': 3.2 },
            nonstar: { 'A': 8.0, 'B': 7.5, 'C': 5.75, 'D': 4.25, 'E': 2.5, 'F': 3.2 },
            mall: { 'A': 10.2, 'B': 9.7, 'C': 7.2, 'D': 6.2, 'E': 5.2, 'F': 3.2 }
        };

        // DATABASE KATEGORI LENGKAP 2025 (Sesuai Dokumen)
        const categoryData = [
            {
                name: "Pakaian Pria", group: "A",
                subs: [
                    { name: "Atasan", group: "A", subs: [{ name: "Kaos" }, { name: "Kemeja" }, { name: "Polo Shirt" }, { name: "Jaket & Mantel" }, { name: "Sweater & Cardigan" }, { name: "Hoodie" }] },
                    { name: "Bawahan", group: "A", subs: [{ name: "Celana Panjang" }, { name: "Celana Pendek" }, { name: "Jeans" }, { name: "Chino" }, { name: "Jogger" }] },
                    { name: "Pakaian Dalam", group: "A", subs: [{ name: "Boxer" }, { name: "Celana Dalam" }, { name: "Kaos Dalam" }] },
                    { name: "Pakaian Tradisional", group: "A", subs: [{ name: "Batik Pria" }, { name: "Pakaian Adat" }] },
                    { name: "Lainnya", group: "A", subs: [{ name: "Kostum" }, { name: "Pakaian Kerja" }, { name: "Set Pakaian Pria" }] }
                ]
            },
            {
                name: "Pakaian Wanita", group: "A",
                subs: [
                    { name: "Atasan", group: "A", subs: [{ name: "Blouse" }, { name: "Kemeja" }, { name: "Crop Top" }, { name: "Kaos" }, { name: "Tanktop & Kamisol" }] },
                    { name: "Dress", group: "A", subs: [{ name: "Maxi Dress" }, { name: "Midi Dress" }, { name: "Mini Dress" }, { name: "Jumpsuit" }, { name: "Wedding Dress" }] },
                    { name: "Bawahan", group: "A", subs: [{ name: "Rok" }, { name: "Celana Panjang" }, { name: "Celana Pendek" }, { name: "Legging" }, { name: "Jeans Wanita" }] },
                    { name: "Pakaian Dalam & Tidur", group: "A", subs: [{ name: "Bra" }, { name: "Celana Dalam" }, { name: "Lingerie" }, { name: "Piyama" }, { name: "Daster" }] },
                    { name: "Baju Hamil", group: "A", subs: [{ name: "Dress Hamil" }, { name: "Celana Hamil" }, { name: "Bra Menyusui" }] }
                ]
            },
            {
                name: "Fashion Muslim", group: "A",
                subs: [
                    { name: "Hijab", group: "A", subs: [{ name: "Hijab Instan" }, { name: "Segi Empat" }, { name: "Pashmina" }, { name: "Khimar" }] },
                    { name: "Pakaian Wanita", group: "A", subs: [{ name: "Gamis" }, { name: "Tunik" }, { name: "Abaya" }, { name: "Kaos Kaki Muslim" }, { name: "Manset" }] },
                    { name: "Pakaian Pria", group: "A", subs: [{ name: "Baju Koko" }, { name: "Gamis Pria" }, { name: "Sarung" }, { name: "Peci/Kopiah" }] },
                    { name: "Perlengkapan Sholat", group: "A", subs: [{ name: "Mukena" }, { name: "Sajadah" }, { name: "Tasbih" }] }
                ]
            },
            {
                name: "Handphone & Aksesoris", group: "A",
                subs: [
                    { name: "Handphone", group: "D", subs: [{ name: "Handphone Android", group: "D" }, { name: "iPhone", group: "D" }, { name: "Feature Phone", group: "D" }] },
                    { name: "Tablet", group: "D", subs: [{ name: "Tablet Android", group: "D" }, { name: "iPad", group: "D" }, { name: "E-reader", group: "D" }] },
                    { name: "Aksesoris HP", group: "A", subs: [{ name: "Casing & Cover" }, { name: "Pelindung Layar" }, { name: "Charger & Kabel" }, { name: "Powerbank" }, { name: "Holder HP" }, { name: "Tongsis & Stabilizer" }] },
                    { name: "Wearable", group: "A", subs: [{ name: "Smartwatch" }, { name: "Smartband" }, { name: "Aksesoris Wearable" }] },
                    { name: "Komponen", group: "A", subs: [{ name: "Baterai HP" }, { name: "Sparepart HP" }, { name: "Kartu Perdana", group: "A" }] },
                    { name: "Perangkat Lain", group: "B", subs: [{ name: "Walkie Talkie", group: "B" }] }
                ]
            },
            {
                name: "Komputer & Laptop", group: "C",
                subs: [
                    { name: "Komputer", group: "D", subs: [{ name: "Laptop", group: "D" }, { name: "PC Desktop", group: "D" }, { name: "PC Gaming", group: "D" }, { name: "Mini PC", group: "D" }] },
                    { name: "Komponen Komputer", group: "D", subs: [{ name: "Processor", group: "D" }, { name: "Motherboard", group: "D" }, { name: "VGA Card", group: "D" }, { name: "RAM", group: "D" }, { name: "Harddisk & SSD", group: "D" }, { name: "Power Supply", group: "D" }, { name: "Casing Komputer", group: "D" }] },
                    { name: "Aksesoris Komputer", group: "C", subs: [{ name: "Keyboard" }, { name: "Mouse" }, { name: "Mousepad" }, { name: "Webcam" }, { name: "Cooling Pad" }, { name: "Flashdisk" }] },
                    { name: "Printer & Scanner", group: "D", subs: [{ name: "Printer", group: "D" }, { name: "Scanner", group: "D" }, { name: "Tinta Printer", group: "C" }] },
                    { name: "Networking", group: "C", subs: [{ name: "Router & Modem" }, { name: "WiFi Adapter" }, { name: "Kabel LAN" }] }
                ]
            },
            {
                name: "Elektronik", group: "A",
                subs: [
                    { name: "Elektronik Rumah Besar", group: "E", subs: [{ name: "Kulkas", group: "E" }, { name: "Mesin Cuci", group: "E" }, { name: "AC", group: "E" }, { name: "TV", group: "E" }, { name: "Dispenser Galon Bawah", group: "E" }] },
                    { name: "Elektronik Dapur", group: "C", subs: [{ name: "Rice Cooker" }, { name: "Blender & Juicer" }, { name: "Mixer" }, { name: "Oven & Microwave" }, { name: "Kompor Gas" }, { name: "Air Fryer" }] },
                    { name: "Elektronik Rumah Kecil", group: "C", subs: [{ name: "Setrika" }, { name: "Vacuum Cleaner" }, { name: "Kipas Angin" }, { name: "Hair Dryer", group: "A" }, { name: "Humidifier" }] },
                    { name: "Audio", group: "B", subs: [{ name: "Speaker Bluetooth", group: "B" }, { name: "Earphone & Headset", group: "B" }, { name: "Microphone", group: "B" }, { name: "Soundbar", group: "B" }] },
                    { name: "Kelistrikan", group: "A", subs: [{ name: "Stop Kontak" }, { name: "Saklar" }, { name: "Lampu & Bohlam" }, { name: "Baterai", group: "B" }] }
                ]
            },
            {
                name: "Kamera & Drone", group: "B",
                subs: [
                    { name: "Kamera", group: "E", subs: [{ name: "Kamera DSLR", group: "E" }, { name: "Kamera Mirrorless", group: "E" }, { name: "Action Cam", group: "E" }, { name: "Kamera Analog", group: "E" }] },
                    { name: "Lensa & Aksesoris", group: "B", subs: [{ name: "Lensa Kamera", group: "E" }, { name: "Tripod & Monopod" }, { name: "Tas Kamera" }, { name: "Lighting Studio" }] },
                    { name: "Drone", group: "E", subs: [{ name: "Drone Kamera", group: "E" }, { name: "Aksesoris Drone", group: "B" }] },
                    { name: "Keamanan", group: "B", subs: [{ name: "CCTV / IP Camera", group: "B" }] }
                ]
            },
            {
                name: "Kecantikan", group: "A",
                subs: [
                    { name: "Perawatan Wajah", group: "A", subs: [{ name: "Pembersih Wajah" }, { name: "Serum & Essence" }, { name: "Toner" }, { name: "Krim Wajah" }, { name: "Masker Wajah" }, { name: "Sunscreen" }] },
                    { name: "Makeup", group: "A", subs: [{ name: "Lipstik & Lip Cream" }, { name: "Bedak Wajah" }, { name: "Foundation & Cushion" }, { name: "Mascara" }, { name: "Eyeliner" }, { name: "Pensil Alis" }] },
                    { name: "Parfum", group: "A", subs: [{ name: "Parfum Wanita" }, { name: "Parfum Pria" }, { name: "Body Mist" }] },
                    { name: "Alat Kecantikan", group: "A", subs: [{ name: "Brush Makeup" }, { name: "Spons Makeup" }, { name: "Pinset & Gunting Alis" }, { name: "Cermin" }] }
                ]
            },
            {
                name: "Kesehatan", group: "A",
                subs: [
                    { name: "Suplemen & Vitamin", group: "C", subs: [{ name: "Vitamin C", group: "C" }, { name: "Multivitamin", group: "C" }, { name: "Suplemen Diet", group: "C" }, { name: "Suplemen Kulit", group: "C" }] },
                    { name: "Alat Medis", group: "C", subs: [{ name: "Masker Medis", group: "C" }, { name: "Termometer", group: "C" }, { name: "Oximeter", group: "C" }, { name: "Alat Cek Gula Darah", group: "C" }, { name: "Tensi Meter", group: "C" }, { name: "Kursi Roda", group: "C" }] },
                    { name: "Perawatan Diri", group: "A", subs: [{ name: "Hand Sanitizer" }, { name: "Perawatan Mata (Softlens)" }, { name: "Kesehatan Mulut" }] },
                    { name: "Obat-obatan", group: "C", subs: [{ name: "Obat Bebas", group: "C" }, { name: "Obat Tradisional", group: "C" }] }
                ]
            },
            {
                name: "Ibu & Bayi", group: "A",
                subs: [
                    { name: "Pakaian Bayi", group: "A", subs: [{ name: "Baju Bayi" }, { name: "Celana Bayi" }, { name: "Sepatu Bayi" }, { name: "Topi & Kaos Kaki Bayi" }] },
                    { name: "Perlengkapan Makan", group: "A", subs: [{ name: "Botol Susu" }, { name: "Dot" }, { name: "Peralatan Makan Bayi" }, { name: "Sterilizer Botol" }] },
                    { name: "Popok & Tisu", group: "C", subs: [{ name: "Popok Sekali Pakai", group: "C" }, { name: "Popok Kain", group: "C" }, { name: "Tisu Basah", group: "A" }] },
                    { name: "Susu Formula", group: "C", subs: [{ name: "Susu Bayi (0-6 Bulan)", group: "C" }, { name: "Susu Pertumbuhan (1+ Tahun)", group: "C" }, { name: "Susu Ibu Hamil", group: "C" }] },
                    { name: "Perlengkapan Tidur & Mandi", group: "A", subs: [{ name: "Kasur Bayi" }, { name: "Bak Mandi Bayi" }, { name: "Sabun & Sampo Bayi" }] },
                    { name: "Mainan Bayi", group: "A", subs: [{ name: "Mainan Edukasi" }, { name: "Rattle & Teether" }, { name: "Boneka" }] }
                ]
            },
            {
                name: "Makanan & Minuman", group: "D",
                subs: [
                    { name: "Makanan Ringan", group: "A", subs: [{ name: "Keripik & Kerupuk", group: "A" }, { name: "Biskuit & Kue", group: "A" }, { name: "Cokelat & Permen", group: "A" }, { name: "Kacang", group: "A" }] },
                    { name: "Bahan Pokok", group: "C", subs: [{ name: "Beras", group: "C" }, { name: "Minyak Goreng", group: "C" }, { name: "Gula & Garam", group: "C" }, { name: "Tepung", group: "C" }, { name: "Bumbu Masak", group: "C" }] },
                    { name: "Minuman", group: "B", subs: [{ name: "Kopi", group: "B" }, { name: "Teh", group: "B" }, { name: "Susu UHT/Bubuk", group: "B" }, { name: "Sirup", group: "B" }, { name: "Air Mineral", group: "B" }] },
                    { name: "Makanan Instan", group: "B", subs: [{ name: "Mie Instan", group: "B" }, { name: "Pasta", group: "B" }, { name: "Makanan Kaleng", group: "B" }] },
                    { name: "Makanan Segar", group: "E", subs: [{ name: "Buah-buahan", group: "E" }, { name: "Sayuran", group: "E" }, { name: "Daging & Seafood", group: "E" }, { name: "Telur", group: "E" }] },
                    { name: "Makanan Beku", group: "E", subs: [{ name: "Nugget & Sosis", group: "E" }, { name: "Dimsum Beku", group: "E" }, { name: "Es Krim", group: "E" }] }
                ]
            },
            {
                name: "Perlengkapan Rumah", group: "A",
                subs: [
                    { name: "Kamar Tidur", group: "A", subs: [{ name: "Sprei & Bedcover" }, { name: "Bantal & Guling" }, { name: "Selimut" }, { name: "Kasur" }] },
                    { name: "Kamar Mandi", group: "A", subs: [{ name: "Handuk" }, { name: "Rak Kamar Mandi" }, { name: "Peralatan Mandi" }] },
                    { name: "Dapur & Ruang Makan", group: "A", subs: [{ name: "Peralatan Masak" }, { name: "Peralatan Makan" }, { name: "Pisau & Talenan" }, { name: "Wadah Penyimpanan" }] },
                    { name: "Dekorasi", group: "A", subs: [{ name: "Wallpaper Dinding" }, { name: "Jam Dinding" }, { name: "Bunga Artificial" }, { name: "Lilin Aromaterapi" }] },
                    { name: "Kebersihan & Laundry", group: "A", subs: [{ name: "Sapu & Pel" }, { name: "Tempat Sampah" }, { name: "Deterjen & Pewangi", group: "A" }] },
                    { name: "Furniture", group: "E", subs: [{ name: "Meja & Kursi", group: "E" }, { name: "Lemari Pakaian", group: "E" }, { name: "Rak & Penyimpanan", group: "E" }, { name: "Sofa", group: "E" }] }
                ]
            },
            {
                name: "Otomotif", group: "A",
                subs: [
                    { name: "Aksesoris Motor", group: "A", subs: [{ name: "Helm" }, { name: "Jas Hujan" }, { name: "Sarung Tangan" }, { name: "Lampu Motor" }] },
                    { name: "Suku Cadang Motor", group: "B", subs: [{ name: "Ban Motor", group: "B" }, { name: "Oli & Pelumas", group: "B" }, { name: "Aki Motor", group: "B" }, { name: "Kampas Rem", group: "B" }] },
                    { name: "Aksesoris Mobil", group: "A", subs: [{ name: "Parfum Mobil" }, { name: "Karpet Mobil" }, { name: "Cover Mobil" }, { name: "Holder HP Mobil" }] },
                    { name: "Perawatan Kendaraan", group: "A", subs: [{ name: "Shampo Mobil/Motor" }, { name: "Pengkilap Bodi" }, { name: "Lap Microfiber" }] },
                    { name: "Unit Kendaraan", group: "E", subs: [{ name: "Sepeda Motor", group: "E" }, { name: "Mobil", group: "E" }] }
                ]
            },
            {
                name: "Hobi & Koleksi", group: "C",
                subs: [
                    { name: "Mainan & Games", group: "C", subs: [{ name: "Action Figure" }, { name: "Board Game" }, { name: "Puzzle" }, { name: "Lego/Brick" }] },
                    { name: "Gaming", group: "B", subs: [{ name: "Video Game (Kaset/CD)", group: "B" }, { name: "Aksesoris Console", group: "B" }, { name: "Console Game (PS/Nintendo)", group: "B" }] },
                    { name: "Alat Musik", group: "C", subs: [{ name: "Gitar & Bass" }, { name: "Keyboard & Piano" }, { name: "Aksesoris Musik" }] },
                    { name: "Koleksi", group: "C", subs: [{ name: "Uang Kuno" }, { name: "Perangko" }, { name: "Merchandise K-Pop" }] }
                ]
            },
            {
                name: "Buku & Alat Tulis", group: "A",
                subs: [
                    { name: "Buku", group: "B", subs: [{ name: "Buku Pelajaran", group: "B" }, { name: "Novel", group: "B" }, { name: "Komik", group: "B" }, { name: "Buku Agama", group: "B" }, { name: "Majalah", group: "B" }] },
                    { name: "Alat Tulis", group: "A", subs: [{ name: "Pulpen & Pensil" }, { name: "Buku Tulis" }, { name: "Spidol & Stabilo" }, { name: "Tempat Pensil" }] },
                    { name: "Perlengkapan Kantor", group: "A", subs: [{ name: "Kalkulator" }, { name: "Kertas HVS" }, { name: "Amplop" }, { name: "Lakban & Lem" }] },
                    { name: "Alat Lukis", group: "A", subs: [{ name: "Cat Air/Minyak" }, { name: "Kanvas" }, { name: "Kuas" }] }
                ]
            }
        ];

        const translations = {
            id: {
                selectMarketplace: "Pilih Marketplace",
                pricingStrategy: "Strategi Harga",
                single: "Satuan",
                bulk: "Bulk (Banyak)",
                modal: "Modal",
                targetProfit: "Target Profit",
                productSKU: "Nama Produk / SKU",
                hppProduct: "HPP (Modal Produk)",
                displayPrice: "Harga Tampil (Sebelum Diskon)",
                storeDiscount: "Diskon Toko (%)",
                sellerVoucher: "Voucher Toko Ditanggung Penjual (Opsional)",
                voucherDesc: "*Mengurangi dasar perhitungan Biaya Admin & Layanan.",
                calcProfit: "Hitung Profit",
                findSellingPrice: "Cari Harga Jual",
                prodName: "Produk",
                category: "Kategori",
                hpp: "HPP",
                sellingPrice: "Harga Tayang",
                discount: "Diskon",
                voucher: "Voucher",
                estProfit: "Est. Profit",
                addRow: "Tambah Baris",
                products: "Produk",
                totalEstProfit: "Total Profit Estimasi",
                feeConfig: "Konfigurasi Potongan",
                sellerType: "Tipe Penjual",
                nonstar: "Non-Star (Regular)",
                star: "Star Seller / Star+",
                mall: "Shopee Mall",
                productCategory: "1. Kategori Produk",
                clickToSelectCategory: "Klik untuk pilih Kategori",
                adminFeeDeterminer: "Menentukan Biaya Admin",
                bulkCategoryInfo: "Dalam Mode Bulk, kategori diatur pada <strong>setiap baris produk</strong> di tabel sebelah kiri.",
                programsAndServices: "2. Program & Layanan (Biaya Layanan)",
                freeShipXtra: "Gratis Ongkir Xtra",
                freeShipDesc: "Biaya Layanan ~4.0% (Cap 40rb)",
                cashbackXtra: "Cashback Xtra (Promo)",
                cashbackDesc: "Biaya Layanan 4.5% (Cap 60rb)",
                adminFee: "BIAYA ADMIN",
                serviceFee: "BIAYA LAYANAN",
                affiliate: "AFFILIATE",
                maxServiceFee: "Maks. Biaya Layanan (Cap Ongkir)",
                otherCosts: "Biaya Lainnya",
                add: "Tambah",
                orderProcessFee: "Biaya Proses Pesanan (Wajib)",
                fixedFee: "Biaya Transaksi/Tetap",
                packingFee: "Biaya Packing/Lain",
                profitSummary: "Ringkasan Profit",
                export: "Export",
                netProfitPerOrder: "Laba Bersih / Pesanan",
                finalSellingPrice: "Harga Jual Akhir",
                sellerVoucherDeduction: "Voucher Ditanggung Penjual",
                totalModalPacking: "Total Modal + Packing + Lainnya",
                operationalModalDetails: "Rincian Modal Operasional",
                deductionDetails: "RINCIAN POTONGAN",
                adminFeeFormula: "Rumus: (Harga Jual - Diskon - Voucher) x % Admin",
                totalServiceFee: "Total Biaya Layanan",
                serviceFeeDetails: "Rincian Biaya Layanan",
                totalMarketplaceDeductions: "Total Potongan Marketplace",
                netCashReceived: "Net Cash Diterima",
                netCashDesc: "Uang cair ke Saldo Penjual.",
                adsHealthAnalysis: "Analisa Kesehatan Iklan",
                perUnit: "Per Unit",
                dashboard: "Dashboard",
                targetProfitAfterAds: "Target Profit (Setelah Iklan)",
                margin: "Margin",
                targetROASSafe: "Target ROAS (Batas Aman):",
                cpc: "CPC (Biaya/Klik)",
                conversionRate: "Conversion Rate",
                totalAdSpend: "Total Biaya Iklan",
                totalAdSales: "Total Omzet Iklan",
                totalClicks: "Jumlah Klik (Opsional)",
                adsCostPerSales: "Biaya Iklan/Sales (CPO)",
                organicProfitPerUnit: "Profit Organik/Unit",
                actualROAS: "ROAS Aktual",
                breakEvenROAS: "ROAS Break-even",
                noData: "BELUM ADA DATA",
                enterAdsData: "Masukkan data iklan untuk melihat analisa profitabilitas.",
                scenarioComparison: "Perbandingan Skenario",
                scenarioASaved: "SKENARIO A (Disimpan)",
                initialScenario: "Skenario Awal",
                scenarioBCurrent: "SKENARIO B (Saat Ini)",
                currentCondition: "Kondisi Sekarang",
                selectProductCategory: "Pilih Kategori Produk",
                selected: "Dipilih",
                cancel: "Batal",
                confirm: "Konfirmasi",
                // Add more as needed
            },
            en: {
                selectMarketplace: "Select Marketplace",
                pricingStrategy: "Pricing Strategy",
                single: "Single",
                bulk: "Bulk",
                modal: "Capital",
                targetProfit: "Target Profit",
                productSKU: "Product Name / SKU",
                hppProduct: "COGS (Product Cost)",
                displayPrice: "Display Price (Before Discount)",
                storeDiscount: "Store Discount (%)",
                sellerVoucher: "Seller-borne Voucher (Optional)",
                voucherDesc: "*Reduces the base for Admin & Service Fee calculation.",
                calcProfit: "Calculate Profit",
                findSellingPrice: "Find Selling Price",
                prodName: "Product",
                category: "Category",
                hpp: "COGS",
                sellingPrice: "Selling Price",
                discount: "Discount",
                voucher: "Voucher",
                estProfit: "Est. Profit",
                addRow: "Add Row",
                products: "Products",
                totalEstProfit: "Total Est. Profit",
                feeConfig: "Fee Configuration",
                sellerType: "Seller Type",
                nonstar: "Non-Star (Regular)",
                star: "Star Seller / Star+",
                mall: "Shopee Mall",
                productCategory: "1. Product Category",
                clickToSelectCategory: "Click to select Category",
                adminFeeDeterminer: "Determines Admin Fee",
                bulkCategoryInfo: "In Bulk Mode, categories are set for <strong>each product row</strong> in the table on the left.",
                programsAndServices: "2. Programs & Services (Service Fees)",
                freeShipXtra: "Free Shipping Xtra",
                freeShipDesc: "Service Fee ~4.0% (Cap 40k)",
                cashbackXtra: "Cashback Xtra (Promo)",
                cashbackDesc: "Service Fee 4.5% (Cap 60k)",
                adminFee: "ADMIN FEE",
                serviceFee: "SERVICE FEE",
                affiliate: "AFFILIATE",
                maxServiceFee: "Max Service Fee (Shipping Cap)",
                otherCosts: "Other Costs",
                add: "Add",
                orderProcessFee: "Order Processing Fee (Mandatory)",
                fixedFee: "Transaction/Fixed Fee",
                packingFee: "Packing/Other Fee",
                profitSummary: "Profit Summary",
                export: "Export",
                netProfitPerOrder: "Net Profit / Order",
                finalSellingPrice: "Final Selling Price",
                sellerVoucherDeduction: "Seller-borne Voucher",
                totalModalPacking: "Total Capital + Packing + Others",
                operationalModalDetails: "Operational Capital Details",
                deductionDetails: "DEDUCTION DETAILS",
                adminFeeFormula: "Formula: (Selling Price - Discount - Voucher) x % Admin",
                totalServiceFee: "Total Service Fee",
                serviceFeeDetails: "Service Fee Details",
                totalMarketplaceDeductions: "Total Marketplace Deductions",
                netCashReceived: "Net Cash Received",
                netCashDesc: "Funds disbursed to Seller Balance.",
                adsHealthAnalysis: "Ads Health Analysis",
                perUnit: "Per Unit",
                dashboard: "Dashboard",
                targetProfitAfterAds: "Target Profit (After Ads)",
                margin: "Margin",
                targetROASSafe: "Target ROAS (Safe Limit):",
                cpc: "CPC (Cost/Click)",
                conversionRate: "Conversion Rate",
                totalAdSpend: "Total Ad Spend",
                totalAdSales: "Total Ad Sales",
                totalClicks: "Total Clicks (Optional)",
                adsCostPerSales: "Ads Cost/Sale (CPO)",
                organicProfitPerUnit: "Organic Profit/Unit",
                actualROAS: "Actual ROAS",
                breakEvenROAS: "Break-even ROAS",
                noData: "NO DATA YET",
                enterAdsData: "Enter ad data to see profitability analysis.",
                scenarioComparison: "Scenario Comparison",
                scenarioASaved: "SCENARIO A (Saved)",
                initialScenario: "Initial Scenario",
                scenarioBCurrent: "SCENARIO B (Current)",
                currentCondition: "Current Condition",
                selectProductCategory: "Select Product Category",
                selected: "Selected",
                cancel: "Cancel",
                confirm: "Confirm",
                // Add more as needed
            }
        };
