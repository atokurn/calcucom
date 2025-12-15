/**
 * TikTok Shop Category Data - Fee Rates from October 2025
 * Based on official TikTok Shop & Tokopedia fee documentation
 * Note: TikTok Shop uses combined fee structure (Platform + Dynamic Commission)
 */

// TikTok Shop Admin Fee Rates by Seller Type
const tiktokRates = {
    regular: {
        'A': 7.5,   // Fashion, Beauty
        'B': 6.5,   // FMCG, Lifestyle
        'C': 5.5,   // Home, Sports
        'D': 4.5,   // Electronics
        'E': 2.5,   // Fresh, Large Items
        'F': 3.5    // Books, Others
    },
    mall: {   // TikTok Shop Mall
        'A': 9.5,
        'B': 8.5,
        'C': 7.5,
        'D': 6.5,
        'E': 4.0,
        'F': 5.0
    }
};

// TikTok Dynamic Commission Rates (Voucher Pengiriman Xtra included)
const tiktokDynamicRates = {
    'elektronik': 4.0,      // Phone, Electronics, Computers
    'fashion': 5.5,         // Clothing, Bags, Shoes
    'fmcg': 4.0,           // Food, Baby, Health, Beauty
    'lifestyle': 5.5,       // Home, Sports, Hobbies
    'others': 5.0,         // Default
    cap: 40000             // Max Rp40.000 per item
};

// TikTok Shop Category Database
const tiktokCategoryData = [
    {
        name: "Pakaian Wanita & Pakaian Dalam", group: "A", cluster: "fashion",
        subs: [
            { name: "Atasan Wanita", group: "A", subs: [{ name: "Blouse" }, { name: "Kaos" }, { name: "Kemeja" }, { name: "Cardigan" }, { name: "Sweater" }] },
            { name: "Bawahan Wanita", group: "A", subs: [{ name: "Rok" }, { name: "Celana Panjang" }, { name: "Celana Pendek" }, { name: "Jeans" }] },
            { name: "Dress", group: "A", subs: [{ name: "Mini Dress" }, { name: "Midi Dress" }, { name: "Maxi Dress" }, { name: "Jumpsuit" }] },
            { name: "Pakaian Dalam Wanita", group: "A", subs: [{ name: "Bra" }, { name: "Celana Dalam" }, { name: "Korset" }, { name: "Bra Set" }] },
            { name: "Pakaian Tidur", group: "A", subs: [{ name: "Piyama" }, { name: "Daster" }, { name: "Lingerie" }] },
            { name: "Jaket & Outer", group: "A", subs: [{ name: "Jaket" }, { name: "Blazer" }, { name: "Coat" }, { name: "Hoodie" }] }
        ]
    },
    {
        name: "Pakaian Pria & Pakaian Dalam Pria", group: "A", cluster: "fashion",
        subs: [
            { name: "Atasan Pria", group: "A", subs: [{ name: "Kaos" }, { name: "Kemeja" }, { name: "Polo" }, { name: "Hoodie" }] },
            { name: "Bawahan Pria", group: "A", subs: [{ name: "Celana Panjang" }, { name: "Celana Pendek" }, { name: "Jeans" }, { name: "Jogger" }] },
            { name: "Pakaian Dalam Pria", group: "A", subs: [{ name: "Boxer" }, { name: "Celana Dalam" }, { name: "Singlet" }] },
            { name: "Jaket Pria", group: "A", subs: [{ name: "Jaket Jeans" }, { name: "Jaket Kulit" }, { name: "Parka" }, { name: "Bomber" }] }
        ]
    },
    {
        name: "Fashion Muslim", group: "A", cluster: "fashion",
        subs: [
            { name: "Hijab & Aksesoris", group: "A", subs: [{ name: "Hijab Instan" }, { name: "Pashmina" }, { name: "Ciput" }, { name: "Bros Hijab" }] },
            { name: "Gamis", group: "A", subs: [{ name: "Gamis Syari" }, { name: "Gamis Casual" }, { name: "Gamis Pesta" }] },
            { name: "Tunik & Atasan Muslim", group: "A", subs: [{ name: "Tunik" }, { name: "Blouse Muslim" }, { name: "Outer Muslim" }] },
            { name: "Baju Koko & Sarung", group: "A", subs: [{ name: "Baju Koko" }, { name: "Sarung" }, { name: "Peci" }] }
        ]
    },
    {
        name: "Sepatu", group: "A", cluster: "fashion",
        subs: [
            { name: "Sepatu Pria", group: "A", subs: [{ name: "Sneakers Pria" }, { name: "Sepatu Formal" }, { name: "Sandal Pria" }, { name: "Slip On" }] },
            { name: "Sepatu Wanita", group: "A", subs: [{ name: "Heels" }, { name: "Flatshoes" }, { name: "Sneakers Wanita" }, { name: "Sandal Wanita" }] },
            { name: "Sepatu Anak", group: "A", subs: [{ name: "Sepatu Anak" }, { name: "Sandal Anak" }] },
            { name: "Sepatu Olahraga", group: "A", subs: [{ name: "Running Shoes" }, { name: "Training Shoes" }, { name: "Sepatu Futsal" }] }
        ]
    },
    {
        name: "Tas & Koper", group: "A", cluster: "fashion",
        subs: [
            { name: "Tas Wanita", group: "A", subs: [{ name: "Sling Bag" }, { name: "Tote Bag" }, { name: "Handbag" }, { name: "Ransel Wanita" }] },
            { name: "Tas Pria", group: "A", subs: [{ name: "Backpack" }, { name: "Waist Bag" }, { name: "Messenger Bag" }] },
            { name: "Dompet", group: "A", subs: [{ name: "Dompet Pria" }, { name: "Dompet Wanita" }, { name: "Pouch" }] },
            { name: "Koper", group: "A", subs: [{ name: "Koper Kabin" }, { name: "Koper Besar" }, { name: "Travel Bag" }] }
        ]
    },
    {
        name: "Aksesoris Fashion", group: "A", cluster: "fashion",
        subs: [
            { name: "Jam Tangan", group: "A", subs: [{ name: "Jam Analog" }, { name: "Jam Digital" }, { name: "Smartwatch Fashion" }] },
            { name: "Perhiasan", group: "A", subs: [{ name: "Kalung" }, { name: "Gelang" }, { name: "Cincin" }, { name: "Anting" }] },
            { name: "Kacamata", group: "A", subs: [{ name: "Sunglasses" }, { name: "Kacamata Fashion" }] },
            { name: "Aksesoris Lain", group: "A", subs: [{ name: "Topi" }, { name: "Scraft" }, { name: "Ikat Pinggang" }] }
        ]
    },
    {
        name: "Kecantikan & Perawatan Pribadi", group: "A", cluster: "fmcg",
        subs: [
            { name: "Skincare", group: "A", subs: [{ name: "Cleanser" }, { name: "Toner" }, { name: "Serum" }, { name: "Moisturizer" }, { name: "Sunscreen" }] },
            { name: "Makeup Wajah", group: "A", subs: [{ name: "Foundation" }, { name: "Cushion" }, { name: "Concealer" }, { name: "Bedak" }, { name: "Blush On" }] },
            { name: "Makeup Mata", group: "A", subs: [{ name: "Eyeshadow" }, { name: "Eyeliner" }, { name: "Mascara" }, { name: "Alis" }] },
            { name: "Makeup Bibir", group: "A", subs: [{ name: "Lipstik" }, { name: "Lip Tint" }, { name: "Lip Gloss" }, { name: "Lip Balm" }] },
            { name: "Perawatan Rambut", group: "A", subs: [{ name: "Shampoo" }, { name: "Conditioner" }, { name: "Hair Mask" }, { name: "Hair Oil" }] },
            { name: "Alat Kecantikan", group: "A", subs: [{ name: "Brush Set" }, { name: "Beauty Blender" }, { name: "Pinset" }, { name: "Cermin" }] }
        ]
    },
    {
        name: "Telepon & Elektronik", group: "D", cluster: "elektronik",
        subs: [
            { name: "Handphone", group: "D", subs: [{ name: "Smartphone Android", group: "D" }, { name: "iPhone", group: "D" }] },
            { name: "Tablet", group: "D", subs: [{ name: "Android Tablet", group: "D" }, { name: "iPad", group: "D" }] },
            { name: "Aksesoris HP", group: "A", subs: [{ name: "Case HP" }, { name: "Tempered Glass" }, { name: "Charger" }, { name: "Kabel Data" }] },
            { name: "Earphone & Headphone", group: "B", subs: [{ name: "TWS", group: "B" }, { name: "Headphone", group: "B" }, { name: "Earphone Kabel", group: "B" }] },
            { name: "Powerbank", group: "A", subs: [{ name: "Powerbank 10000mAh" }, { name: "Powerbank 20000mAh" }] }
        ]
    },
    {
        name: "Komputer & Peralatan Kantor", group: "D", cluster: "elektronik",
        subs: [
            { name: "Laptop", group: "D", subs: [{ name: "Laptop Gaming", group: "D" }, { name: "Laptop Bisnis", group: "D" }] },
            { name: "Aksesoris Komputer", group: "C", subs: [{ name: "Keyboard" }, { name: "Mouse" }, { name: "Mousepad" }, { name: "Webcam" }] },
            { name: "Storage", group: "D", subs: [{ name: "SSD", group: "D" }, { name: "Hard Disk", group: "D" }, { name: "Flashdisk" }] },
            { name: "Printer & Scanner", group: "D", subs: [{ name: "Printer", group: "D" }, { name: "Scanner", group: "D" }, { name: "Tinta Printer" }] }
        ]
    },
    {
        name: "Peralatan Rumah Tangga", group: "C", cluster: "elektronik",
        subs: [
            { name: "Elektronik Dapur", group: "C", subs: [{ name: "Rice Cooker" }, { name: "Blender" }, { name: "Air Fryer" }, { name: "Microwave" }] },
            { name: "Elektronik Rumah", group: "C", subs: [{ name: "Setrika" }, { name: "Vacuum Cleaner" }, { name: "Kipas Angin" }] },
            { name: "TV & Audio", group: "E", subs: [{ name: "Smart TV", group: "E" }, { name: "Speaker", group: "B" }, { name: "Soundbar", group: "B" }] },
            { name: "AC & Pendingin", group: "E", subs: [{ name: "AC", group: "E" }, { name: "Air Cooler" }] }
        ]
    },
    {
        name: "Makanan & Minuman", group: "B", cluster: "fmcg",
        subs: [
            { name: "Makanan Ringan", group: "A", subs: [{ name: "Keripik" }, { name: "Kue & Biskuit" }, { name: "Cokelat" }, { name: "Permen" }] },
            { name: "Minuman", group: "B", subs: [{ name: "Kopi", group: "B" }, { name: "Teh", group: "B" }, { name: "Minuman Bubuk", group: "B" }] },
            { name: "Makanan Instan", group: "B", subs: [{ name: "Mie Instan", group: "B" }, { name: "Bumbu Masak", group: "B" }] },
            { name: "Makanan Sehat", group: "B", subs: [{ name: "Granola" }, { name: "Madu" }, { name: "Susu" }] }
        ]
    },
    {
        name: "Kesehatan", group: "B", cluster: "fmcg",
        subs: [
            { name: "Vitamin & Suplemen", group: "B", subs: [{ name: "Vitamin C", group: "B" }, { name: "Multivitamin", group: "B" }, { name: "Suplemen Fitness", group: "B" }] },
            { name: "Alat Kesehatan", group: "C", subs: [{ name: "Masker", group: "C" }, { name: "Tensimeter", group: "C" }, { name: "Termometer", group: "C" }] },
            { name: "Obat-obatan", group: "B", subs: [{ name: "Obat Flu", group: "B" }, { name: "Obat Sakit Kepala", group: "B" }] },
            { name: "Perawatan Tubuh", group: "A", subs: [{ name: "Sabun" }, { name: "Lotion" }, { name: "Deodorant" }] }
        ]
    },
    {
        name: "Bayi & Ibu Hamil", group: "B", cluster: "fmcg",
        subs: [
            { name: "Popok & Perawatan Bayi", group: "B", subs: [{ name: "Popok", group: "B" }, { name: "Tisu Basah" }, { name: "Bedak Bayi" }] },
            { name: "Susu Bayi & Anak", group: "C", subs: [{ name: "Susu Formula", group: "C" }, { name: "Susu Pertumbuhan", group: "C" }] },
            { name: "Pakaian Bayi", group: "A", subs: [{ name: "Baju Bayi" }, { name: "Celana Bayi" }, { name: "Topi Bayi" }] },
            { name: "Perlengkapan Menyusui", group: "B", subs: [{ name: "Breast Pump", group: "B" }, { name: "Botol Susu", group: "B" }] }
        ]
    },
    {
        name: "Fashion Anak", group: "B", cluster: "fmcg",
        subs: [
            { name: "Pakaian Anak Perempuan", group: "A", subs: [{ name: "Dress Anak" }, { name: "Rok Anak" }, { name: "Atasan Anak" }] },
            { name: "Pakaian Anak Laki-laki", group: "A", subs: [{ name: "Kaos Anak" }, { name: "Celana Anak" }, { name: "Kemeja Anak" }] },
            { name: "Sepatu & Sandal Anak", group: "A", subs: [{ name: "Sepatu Anak" }, { name: "Sandal Anak" }] }
        ]
    },
    {
        name: "Olahraga & Luar Ruangan", group: "C", cluster: "lifestyle",
        subs: [
            { name: "Pakaian Olahraga", group: "A", subs: [{ name: "Jersey" }, { name: "Celana Sport" }, { name: "Sports Bra" }] },
            { name: "Alat Olahraga", group: "C", subs: [{ name: "Yoga Mat" }, { name: "Dumbbell" }, { name: "Resistance Band" }] },
            { name: "Outdoor", group: "C", subs: [{ name: "Tenda" }, { name: "Sleeping Bag" }, { name: "Matras" }] },
            { name: "Sepeda & Aksesoris", group: "B", subs: [{ name: "Helm Sepeda" }, { name: "Sarung Tangan" }, { name: "Lampu Sepeda" }] }
        ]
    },
    {
        name: "Mainan & Hobi", group: "C", cluster: "lifestyle",
        subs: [
            { name: "Mainan Anak", group: "C", subs: [{ name: "Mainan Edukasi" }, { name: "Boneka" }, { name: "Mobil-mobilan" }] },
            { name: "Action Figure", group: "C", subs: [{ name: "Figure Anime" }, { name: "Figure Superhero" }] },
            { name: "Gaming", group: "B", subs: [{ name: "Aksesoris Gaming", group: "B" }, { name: "Mouse Gaming", group: "B" }] },
            { name: "Alat Musik", group: "C", subs: [{ name: "Gitar" }, { name: "Ukulele" }, { name: "Keyboard" }] }
        ]
    },
    {
        name: "Rumah & Kehidupan", group: "C", cluster: "lifestyle",
        subs: [
            { name: "Kamar Tidur", group: "C", subs: [{ name: "Sprei" }, { name: "Bantal" }, { name: "Selimut" }, { name: "Bed Cover" }] },
            { name: "Kamar Mandi", group: "C", subs: [{ name: "Handuk" }, { name: "Rak Kamar Mandi" }, { name: "Shower" }] },
            { name: "Dapur", group: "C", subs: [{ name: "Panci" }, { name: "Wajan" }, { name: "Pisau" }, { name: "Wadah Makanan" }] },
            { name: "Dekorasi", group: "C", subs: [{ name: "Jam Dinding" }, { name: "Tanaman Artificial" }, { name: "Lilin Aromaterapi" }] },
            { name: "Kebersihan", group: "C", subs: [{ name: "Sapu" }, { name: "Pel" }, { name: "Deterjen" }, { name: "Pengharum" }] }
        ]
    },
    {
        name: "Otomotif & Sepeda Motor", group: "B", cluster: "lifestyle",
        subs: [
            { name: "Aksesoris Motor", group: "B", subs: [{ name: "Helm", group: "B" }, { name: "Jaket Motor" }, { name: "Sarung Tangan" }] },
            { name: "Sparepart Motor", group: "B", subs: [{ name: "Oli", group: "B" }, { name: "Ban Motor", group: "B" }, { name: "Aki", group: "B" }] },
            { name: "Aksesoris Mobil", group: "B", subs: [{ name: "Parfum Mobil" }, { name: "Holder HP" }, { name: "Karpet" }] },
            { name: "Perawatan Kendaraan", group: "B", subs: [{ name: "Shampo Kendaraan" }, { name: "Lap Microfiber" }] }
        ]
    },
    {
        name: "Perlengkapan Hewan Peliharaan", group: "C", cluster: "lifestyle",
        subs: [
            { name: "Makanan Hewan", group: "C", subs: [{ name: "Makanan Kucing" }, { name: "Makanan Anjing" }] },
            { name: "Aksesoris Hewan", group: "C", subs: [{ name: "Kalung Hewan" }, { name: "Kandang" }, { name: "Tempat Makan" }] },
            { name: "Perawatan Hewan", group: "C", subs: [{ name: "Shampoo Hewan" }, { name: "Vitamin Hewan" }] }
        ]
    },
    {
        name: "Buku, Majalah & Audio", group: "F", cluster: "others",
        subs: [
            { name: "Buku", group: "F", subs: [{ name: "Novel", group: "F" }, { name: "Buku Edukasi", group: "F" }, { name: "Komik", group: "F" }] },
            { name: "Alat Tulis", group: "F", subs: [{ name: "Pulpen" }, { name: "Pensil" }, { name: "Buku Tulis" }] }
        ]
    }
];

// Export for browser
if (typeof window !== 'undefined') {
    window.tiktokRates = tiktokRates;
    window.tiktokDynamicRates = tiktokDynamicRates;
    window.tiktokCategoryData = tiktokCategoryData;
}
