# Spesifikasi Desain: Redesain Navigasi Drawer & Tampilan Profit Calculator Android

## 1. Pendahuluan
Dokumen ini mendefinisikan perubahan desain dan tata letak untuk aplikasi Android **CekBiayaJualan** guna menyelaraskan tampilan modul **Profit Calculator** dengan versi web-nya, serta meningkatkan fungsionalitas navigasi menggunakan **Navigation Drawer** (sidebar).

## 2. Perubahan Navigasi Utama (`MainDashboardScreen.kt`)
Navigasi utama yang saat ini menggunakan baris tab (`ScrollableTabRow`) di bagian atas layar akan digantikan oleh navigasi laci samping (**Navigation Drawer**).

### A. Komponen UI
*   **ModalNavigationDrawer**: Pembungkus utama untuk menyajikan Drawer.
*   **ModalDrawerSheet**: Wadah untuk konten laci navigasi dengan lebar responsif.
*   **NavigationDrawerItem**: Elemen menu untuk setiap modul kalkulator.
*   **TopAppBar**:
    *   Menggunakan Material 3 `TopAppBar` dengan latar belakang `primaryContainer`.
    *   Memiliki tombol aksi menu (ikon hamburger) di sebelah kiri untuk membuka laci samping.
    *   Menampilkan judul aplikasi "CekBiayaJualan" dan sub-judul "Super Calculator & Analytics".

### B. Daftar Menu Drawer
1.  **Kalkulator Profit** (Ikon: `ShoppingCart`)
2.  **Price Finder** (Ikon: `Star`)
3.  **Kalkulator ROAS** (Ikon: `Info`)
4.  **Bundling** (Ikon: `Build`)
5.  **Kalkulator Resep** (Ikon: `List`)

---

## 3. Pembaruan Halaman Profit Calculator (`ProfitCalculatorTab.kt`)
Halaman kalkulator profit akan didekorasi ulang dengan palet warna dan komponen kartu yang setara dengan estetika premium versi web.

### A. Pilihan Marketplace (Platform Selector)
*   Tombol pilihan untuk **Shopee**, **Tokopedia**, **TikTok**, dan **Lazada**.
*   Masing-masing tombol memiliki ikon khusus dan aksen warna merek saat terpilih:
    *   **Shopee**: Warna utama oranye (`#EE4D2D`) dengan teks kontras tinggi.
    *   **Tokopedia**: Warna utama hijau (`#03AC0E`).
    *   **TikTok**: Warna hitam (`#000000`) atau putih kontras pada mode gelap.
    *   **Lazada**: Warna biru tua (`#10156F`).

### B. Konfigurasi Toko & Layanan
*   **Tipe Penjual**: Pilihan dinamis sesuai platform (Shopee: Regular, Star, Mall; Tokopedia: Regular, Power, Mall).
*   **Grup Kategori**: Tombol lingkaran cepat untuk memilih grup tarif admin fee (A - F).
*   **Program & Layanan**: Toggle switch untuk mengaktifkan **Gratis Ongkir Xtra** dan **Cashback Xtra** dengan deskripsi nilai persentase tarifnya.

### C. Strategi Harga & Input Biaya
*   Menyediakan kolom input terstruktur: Nama Produk, HPP Modal, Harga Jual (Harga Tampil), Diskon Toko (%), Voucher Toko (Rp), Affiliate (%), Biaya Proses (Rp), Operasional (Rp), Biaya Iklan (Rp).
*   Menampilkan label **Harga Final** setelah potongan diskon toko secara realtime di bawah input diskon.
*   Menambahkan kolom simulasi **Target Penjualan Bulanan (Pcs)** untuk proyeksi penjualan.

### D. Sticky Bottom Summary Bar
*   Sebuah bar horizontal tetap melayang di bawah layar.
*   Menampilkan **Laba Bersih / Order** dan **Margin Profit (%)** secara instan.
*   Warna latar belakang dan teks berubah secara dinamis berdasarkan kesehatan profit:
    *   `Excellent` (Margin >= 25%): Hijau gelap
    *   `Good` (Margin >= 15%): Hijau
    *   `Fair` / `Low` (Margin 0-15%): Oranye
    *   `Negative` (Margin < 0%): Merah
*   Mendukung gestur klik untuk melakukan auto-scroll langsung ke bagian rincian lengkap di bawah.

### E. Grafik Alokasi Biaya (Pie Chart)
*   Komponen grafik pai kustom yang digambar menggunakan `Canvas` di Compose.
*   Membagi porsi penjualan menjadi 4 sektor warna:
    *   **HPP (Modal)**: Warna Merah / Coral.
    *   **Biaya Marketplace (Admin + Layanan)**: Warna Ungu.
    *   **Biaya Lainnya (Affiliate, Proses, Iklan, Ops)**: Warna Oranye / Kuning.
    *   **Laba Bersih**: Warna Hijau.

### F. Rincian Potongan & Proyeksi Simulasi
*   **Rincian Potongan**: Menyajikan list rapi yang menampilkan biaya admin, rincian biaya layanan (gratis ongkir & cashback), biaya proses pesanan, biaya tetap, affiliate, dan total potongan marketplace.
*   **Net Cash Box**: Kotak berwarna hijau/merah tebal yang menyajikan "Net Cash Diterima" (Uang bersih yang masuk ke saldo penjual).
*   **Simulasi Penjualan & ROAS**:
    *   **Mode ROAS**: Menampilkan ROAS Break Even, ACOS Break Even, dan Max CPC.
    *   **Mode Sales**: Menampilkan proyeksi Omzet bulanan, total Profit bulanan, dan Laba Bersih harian berdasarkan target pcs penjualan.

---

## 4. Rencana Verifikasi
*   **Verifikasi Visual**: Memastikan tata letak Drawer berfungsi dan tombol hamburger dapat membuka laci samping dengan mulus.
*   **Akurasi Perhitungan**: Memastikan hasil perhitungan laba bersih, margin, dan simulasi di Android sama persis dengan hasil kalkulator web untuk skenario pengujian yang sama.
