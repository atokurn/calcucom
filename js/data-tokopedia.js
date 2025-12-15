/**
 * Tokopedia Category Data - Fee Rates from October 2025
 * Based on official TikTok Shop & Tokopedia fee documentation
 */

// Tokopedia Admin Fee Rates by Seller Type
const tokopediaRates = {
    regular: {
        'A': 7.5,   // Fashion, Beauty, Lifestyle
        'B': 6.5,   // FMCG, Baby, Health
        'C': 5.5,   // Home, Office, Sports
        'D': 4.5,   // Electronics, Gadgets
        'E': 2.5,   // Fresh Food, Large Appliances
        'F': 3.5    // Books, Collectibles
    },
    power: {  // Power Merchant
        'A': 7.0,
        'B': 6.0,
        'C': 5.0,
        'D': 4.0,
        'E': 2.0,
        'F': 3.0
    },
    mall: {   // Tokopedia Official Store
        'A': 9.5,
        'B': 8.5,
        'C': 7.5,
        'D': 6.5,
        'E': 4.0,
        'F': 5.0
    }
};

// Tokopedia Dynamic Commission Rates (additional fee on top of admin)
const tokopediaDynamicRates = {
    'elektronik': 4.0,      // Phone, Electronics, Computers
    'fashion': 5.5,         // Clothing, Bags, Accessories
    'fmcg': 4.0,           // Food, Baby, Health, Beauty
    'lifestyle': 5.5,       // Home, Sports, Hobbies
    'others': 5.0          // Default
};

// Tokopedia Category Database
const tokopediaCategoryData = [
    {
        name: "Fashion Pria", group: "A", cluster: "fashion",
        subs: [
            { name: "Atasan", group: "A", subs: [{ name: "Kaos" }, { name: "Kemeja" }, { name: "Polo" }, { name: "Jaket" }, { name: "Sweater" }, { name: "Hoodie" }] },
            { name: "Bawahan", group: "A", subs: [{ name: "Celana Panjang" }, { name: "Celana Pendek" }, { name: "Jeans" }, { name: "Jogger" }] },
            { name: "Pakaian Dalam", group: "A", subs: [{ name: "Boxer" }, { name: "Kaos Dalam" }, { name: "Celana Dalam" }] },
            { name: "Pakaian Formal", group: "A", subs: [{ name: "Jas" }, { name: "Celana Formal" }, { name: "Kemeja Formal" }] }
        ]
    },
    {
        name: "Fashion Wanita", group: "A", cluster: "fashion",
        subs: [
            { name: "Atasan", group: "A", subs: [{ name: "Blouse" }, { name: "Kemeja" }, { name: "Kaos" }, { name: "Tank Top" }, { name: "Crop Top" }] },
            { name: "Dress", group: "A", subs: [{ name: "Mini Dress" }, { name: "Midi Dress" }, { name: "Maxi Dress" }, { name: "Jumpsuit" }] },
            { name: "Bawahan", group: "A", subs: [{ name: "Rok" }, { name: "Celana" }, { name: "Jeans" }, { name: "Legging" }] },
            { name: "Pakaian Dalam & Tidur", group: "A", subs: [{ name: "Bra" }, { name: "Celana Dalam" }, { name: "Lingerie" }, { name: "Piyama" }] }
        ]
    },
    {
        name: "Fashion Muslim", group: "A", cluster: "fashion",
        subs: [
            { name: "Hijab", group: "A", subs: [{ name: "Hijab Instan" }, { name: "Pashmina" }, { name: "Segi Empat" }, { name: "Bergo" }] },
            { name: "Gamis & Abaya", group: "A", subs: [{ name: "Gamis Wanita" }, { name: "Gamis Pria" }, { name: "Abaya" }] },
            { name: "Baju Koko", group: "A", subs: [{ name: "Koko Dewasa" }, { name: "Koko Anak" }] },
            { name: "Perlengkapan Sholat", group: "A", subs: [{ name: "Mukena" }, { name: "Sajadah" }, { name: "Sarung" }] }
        ]
    },
    {
        name: "Handphone & Tablet", group: "D", cluster: "elektronik",
        subs: [
            { name: "Handphone", group: "D", subs: [{ name: "Smartphone Android", group: "D" }, { name: "iPhone", group: "D" }, { name: "Feature Phone", group: "D" }] },
            { name: "Tablet", group: "D", subs: [{ name: "Tablet Android", group: "D" }, { name: "iPad", group: "D" }] },
            { name: "Aksesoris HP", group: "A", subs: [{ name: "Case & Cover" }, { name: "Screen Protector" }, { name: "Charger" }, { name: "Kabel Data" }, { name: "Powerbank" }] },
            { name: "Wearable", group: "A", subs: [{ name: "Smartwatch" }, { name: "Smartband" }, { name: "TWS Earbuds" }] }
        ]
    },
    {
        name: "Komputer & Laptop", group: "D", cluster: "elektronik",
        subs: [
            { name: "Laptop", group: "D", subs: [{ name: "Laptop Gaming", group: "D" }, { name: "Laptop Bisnis", group: "D" }, { name: "Ultrabook", group: "D" }] },
            { name: "Komputer Desktop", group: "D", subs: [{ name: "PC Gaming", group: "D" }, { name: "PC All-in-One", group: "D" }, { name: "Mini PC", group: "D" }] },
            { name: "Komponen", group: "D", subs: [{ name: "Processor", group: "D" }, { name: "VGA Card", group: "D" }, { name: "RAM", group: "D" }, { name: "SSD/HDD", group: "D" }, { name: "Motherboard", group: "D" }] },
            { name: "Aksesoris", group: "C", subs: [{ name: "Keyboard" }, { name: "Mouse" }, { name: "Monitor" }, { name: "Webcam" }, { name: "Speaker" }] }
        ]
    },
    {
        name: "Elektronik Rumah", group: "C", cluster: "elektronik",
        subs: [
            { name: "TV & Aksesoris", group: "E", subs: [{ name: "Smart TV", group: "E" }, { name: "LED TV", group: "E" }, { name: "Bracket TV" }] },
            { name: "Peralatan Dapur", group: "C", subs: [{ name: "Rice Cooker" }, { name: "Blender" }, { name: "Air Fryer" }, { name: "Microwave" }, { name: "Dispenser" }] },
            { name: "Pendingin & Pemanas", group: "E", subs: [{ name: "AC", group: "E" }, { name: "Kulkas", group: "E" }, { name: "Kipas Angin" }, { name: "Heater" }] },
            { name: "Mesin Cuci", group: "E", subs: [{ name: "Mesin Cuci Top Load", group: "E" }, { name: "Mesin Cuci Front Load", group: "E" }] },
            { name: "Audio", group: "B", subs: [{ name: "Speaker Bluetooth", group: "B" }, { name: "Soundbar", group: "B" }, { name: "Headphone", group: "B" }] }
        ]
    },
    {
        name: "Kecantikan", group: "A", cluster: "fmcg",
        subs: [
            { name: "Perawatan Wajah", group: "A", subs: [{ name: "Cleanser" }, { name: "Toner" }, { name: "Serum" }, { name: "Moisturizer" }, { name: "Sunscreen" }, { name: "Masker Wajah" }] },
            { name: "Makeup", group: "A", subs: [{ name: "Lipstik" }, { name: "Foundation" }, { name: "Cushion" }, { name: "Mascara" }, { name: "Eyeliner" }, { name: "Eyeshadow" }] },
            { name: "Perawatan Tubuh", group: "A", subs: [{ name: "Body Lotion" }, { name: "Sabun Mandi" }, { name: "Deodorant" }, { name: "Hand Cream" }] },
            { name: "Parfum", group: "A", subs: [{ name: "Parfum Wanita" }, { name: "Parfum Pria" }, { name: "Body Mist" }] }
        ]
    },
    {
        name: "Kesehatan", group: "B", cluster: "fmcg",
        subs: [
            { name: "Suplemen", group: "B", subs: [{ name: "Vitamin", group: "B" }, { name: "Suplemen Fitness", group: "B" }, { name: "Suplemen Kesehatan", group: "B" }] },
            { name: "Alat Kesehatan", group: "C", subs: [{ name: "Tensimeter", group: "C" }, { name: "Termometer", group: "C" }, { name: "Oximeter", group: "C" }, { name: "Nebulizer", group: "C" }] },
            { name: "P3K", group: "B", subs: [{ name: "Kotak P3K" }, { name: "Plester" }, { name: "Antiseptik" }] },
            { name: "Alat Bantu", group: "C", subs: [{ name: "Kacamata", group: "C" }, { name: "Kursi Roda", group: "C" }, { name: "Tongkat", group: "C" }] }
        ]
    },
    {
        name: "Ibu & Bayi", group: "B", cluster: "fmcg",
        subs: [
            { name: "Susu & Makanan Bayi", group: "C", subs: [{ name: "Susu Formula", group: "C" }, { name: "Bubur Bayi", group: "C" }, { name: "Snack Bayi", group: "C" }] },
            { name: "Popok & Perlengkapan", group: "B", subs: [{ name: "Popok Bayi", group: "B" }, { name: "Tisu Basah" }, { name: "Bedak Bayi" }] },
            { name: "Pakaian Bayi", group: "A", subs: [{ name: "Baju Bayi" }, { name: "Sepatu Bayi" }, { name: "Topi Bayi" }] },
            { name: "Perlengkapan Menyusui", group: "B", subs: [{ name: "Breast Pump", group: "B" }, { name: "Botol Susu", group: "B" }, { name: "Sterilizer", group: "B" }] }
        ]
    },
    {
        name: "Makanan & Minuman", group: "B", cluster: "fmcg",
        subs: [
            { name: "Makanan Ringan", group: "A", subs: [{ name: "Keripik" }, { name: "Biskuit" }, { name: "Cokelat" }, { name: "Permen" }] },
            { name: "Minuman", group: "B", subs: [{ name: "Kopi", group: "B" }, { name: "Teh", group: "B" }, { name: "Susu", group: "B" }, { name: "Jus", group: "B" }] },
            { name: "Bahan Pokok", group: "C", subs: [{ name: "Beras", group: "C" }, { name: "Minyak Goreng", group: "C" }, { name: "Gula", group: "C" }, { name: "Bumbu", group: "C" }] },
            { name: "Makanan Instan", group: "B", subs: [{ name: "Mie Instan", group: "B" }, { name: "Makanan Kaleng", group: "B" }] },
            { name: "Makanan Segar", group: "E", subs: [{ name: "Daging", group: "E" }, { name: "Sayuran", group: "E" }, { name: "Buah", group: "E" }] }
        ]
    },
    {
        name: "Rumah Tangga", group: "C", cluster: "lifestyle",
        subs: [
            { name: "Furniture", group: "E", subs: [{ name: "Meja", group: "E" }, { name: "Kursi", group: "E" }, { name: "Lemari", group: "E" }, { name: "Rak", group: "E" }] },
            { name: "Kamar Tidur", group: "C", subs: [{ name: "Sprei" }, { name: "Bantal" }, { name: "Selimut" }, { name: "Bed Cover" }] },
            { name: "Dapur", group: "C", subs: [{ name: "Panci" }, { name: "Wajan" }, { name: "Pisau" }, { name: "Talenan" }, { name: "Wadah Makanan" }] },
            { name: "Kebersihan", group: "C", subs: [{ name: "Sapu" }, { name: "Pel" }, { name: "Vacuum" }, { name: "Deterjen" }] },
            { name: "Dekorasi", group: "C", subs: [{ name: "Jam Dinding" }, { name: "Wallpaper" }, { name: "Tanaman Hias" }, { name: "Lilin Aromaterapi" }] }
        ]
    },
    {
        name: "Olahraga & Outdoor", group: "C", cluster: "lifestyle",
        subs: [
            { name: "Pakaian Olahraga", group: "A", subs: [{ name: "Jersey" }, { name: "Celana Olahraga" }, { name: "Sports Bra" }] },
            { name: "Sepatu Olahraga", group: "A", subs: [{ name: "Running Shoes" }, { name: "Training Shoes" }, { name: "Futsal" }] },
            { name: "Alat Fitness", group: "C", subs: [{ name: "Dumbbell" }, { name: "Treadmill", group: "E" }, { name: "Yoga Mat" }, { name: "Resistance Band" }] },
            { name: "Outdoor", group: "C", subs: [{ name: "Tenda" }, { name: "Sleeping Bag" }, { name: "Tas Gunung" }, { name: "Senter" }] }
        ]
    },
    {
        name: "Otomotif", group: "B", cluster: "lifestyle",
        subs: [
            { name: "Aksesoris Motor", group: "B", subs: [{ name: "Helm", group: "B" }, { name: "Jaket Motor" }, { name: "Sarung Tangan" }, { name: "Jas Hujan" }] },
            { name: "Sparepart Motor", group: "B", subs: [{ name: "Ban Motor", group: "B" }, { name: "Aki" }, { name: "Oli", group: "B" }, { name: "Kampas Rem" }] },
            { name: "Aksesoris Mobil", group: "B", subs: [{ name: "Parfum Mobil" }, { name: "Karpet Mobil" }, { name: "Cover Mobil" }] },
            { name: "Perawatan Kendaraan", group: "B", subs: [{ name: "Shampo Mobil" }, { name: "Wax" }, { name: "Lap Microfiber" }] }
        ]
    },
    {
        name: "Hobi & Koleksi", group: "C", cluster: "lifestyle",
        subs: [
            { name: "Mainan", group: "C", subs: [{ name: "Action Figure" }, { name: "Lego" }, { name: "Puzzle" }, { name: "Board Game" }] },
            { name: "Gaming", group: "B", subs: [{ name: "Console", group: "B" }, { name: "Aksesoris Gaming", group: "B" }, { name: "Game CD/Digital", group: "B" }] },
            { name: "Alat Musik", group: "C", subs: [{ name: "Gitar" }, { name: "Keyboard" }, { name: "Drum" }, { name: "Aksesoris Musik" }] },
            { name: "Kamera", group: "E", subs: [{ name: "DSLR", group: "E" }, { name: "Mirrorless", group: "E" }, { name: "Action Cam", group: "E" }, { name: "Aksesoris Kamera" }] }
        ]
    },
    {
        name: "Buku & Alat Tulis", group: "F", cluster: "others",
        subs: [
            { name: "Buku", group: "F", subs: [{ name: "Novel", group: "F" }, { name: "Buku Pelajaran", group: "F" }, { name: "Komik", group: "F" }, { name: "Majalah", group: "F" }] },
            { name: "Alat Tulis", group: "F", subs: [{ name: "Pulpen" }, { name: "Pensil" }, { name: "Buku Tulis" }, { name: "Penghapus" }] },
            { name: "Perlengkapan Kantor", group: "F", subs: [{ name: "Map & Binder" }, { name: "Lakban" }, { name: "Gunting" }, { name: "Stapler" }] }
        ]
    },
    {
        name: "Tas & Koper", group: "A", cluster: "fashion",
        subs: [
            { name: "Tas Wanita", group: "A", subs: [{ name: "Handbag" }, { name: "Sling Bag" }, { name: "Tote Bag" }, { name: "Clutch" }] },
            { name: "Tas Pria", group: "A", subs: [{ name: "Backpack" }, { name: "Messenger Bag" }, { name: "Waist Bag" }] },
            { name: "Koper & Travel", group: "A", subs: [{ name: "Koper" }, { name: "Travel Bag" }, { name: "Pouch" }] }
        ]
    },
    {
        name: "Sepatu", group: "A", cluster: "fashion",
        subs: [
            { name: "Sepatu Pria", group: "A", subs: [{ name: "Sneakers" }, { name: "Formal" }, { name: "Slip On" }, { name: "Sandal Pria" }] },
            { name: "Sepatu Wanita", group: "A", subs: [{ name: "Heels" }, { name: "Flats" }, { name: "Sneakers Wanita" }, { name: "Sandal Wanita" }] },
            { name: "Sepatu Anak", group: "A", subs: [{ name: "Sepatu Anak Laki" }, { name: "Sepatu Anak Perempuan" }, { name: "Sandal Anak" }] }
        ]
    },
    {
        name: "Aksesoris Fashion", group: "A", cluster: "fashion",
        subs: [
            { name: "Jam Tangan", group: "A", subs: [{ name: "Jam Pria" }, { name: "Jam Wanita" }, { name: "Smartwatch" }] },
            { name: "Perhiasan", group: "A", subs: [{ name: "Kalung" }, { name: "Gelang" }, { name: "Cincin" }, { name: "Anting" }] },
            { name: "Kacamata", group: "A", subs: [{ name: "Sunglasses" }, { name: "Kacamata Anti Radiasi" }] },
            { name: "Aksesoris Lain", group: "A", subs: [{ name: "Topi" }, { name: "Ikat Pinggang" }, { name: "Dompet" }, { name: "Syal" }] }
        ]
    }
];

// Export for browser
if (typeof window !== 'undefined') {
    window.tokopediaRates = tokopediaRates;
    window.tokopediaDynamicRates = tokopediaDynamicRates;
    window.tokopediaCategoryData = tokopediaCategoryData;
}
