# Specification

## Summary
**Goal:** Menampilkan riwayat transaksi penjualan pada submenu **Reports (Laporan) > Laporan Penjualan** dalam aplikasi, lengkap dengan filter tanggal, aksi edit/hapus, dan ekspor Excel.

**Planned changes:**
- Tambah view/page baru **Laporan Penjualan (SalesReportPage)** yang terbuka saat klik Navbar > Reports > "Laporan Penjualan" melalui mekanisme view-switching di `App.tsx` (tanpa React Router).
- Buat UI tabel riwayat transaksi penjualan (read/write) dengan kolom: ID Transaksi, Tanggal & Jam, Metode Pembayaran, Produk, Kuantitas, HPP, Harga Jual, Harga Total (Kuantitas × Harga Jual), termasuk perhitungan total per baris.
- Tambahkan filter rentang tanggal (from/to) untuk memfilter transaksi berdasarkan timestamp, dengan opsi clear untuk kembali menampilkan semua data.
- Tambahkan aksi per transaksi: **Edit** dan **Delete**, terhubung ke backend, menampilkan pesan error bila gagal, dan refresh data setelah sukses.
- Tambahkan dukungan backend (API & penyimpanan data) untuk memuat, memfilter (date range), mengubah, dan menghapus riwayat transaksi penjualan.
- Pastikan data transaksi yang tersimpan memuat field historis yang diperlukan (timestamp, metode pembayaran, produk/nama, kuantitas, HPP, harga jual saat transaksi) agar laporan tidak bergantung pada data Produk saat ini.
- Tambahkan aksi **Export to Excel (.xls)** yang mengunduh data laporan sesuai hasil filter yang sedang aktif.

**User-visible outcome:** Pengguna dapat membuka halaman **Laporan Penjualan** dari navbar untuk melihat riwayat transaksi penjualan dalam tabel, memfilter berdasarkan rentang tanggal, mengedit/menghapus transaksi, serta mengekspor laporan yang sedang ditampilkan ke file **.xls**.
