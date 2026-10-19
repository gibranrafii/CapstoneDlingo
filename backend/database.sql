-- ============================================================
-- Capstone: Sistem Manajemen Pertanian & Peternakan
-- Database Schema & Seed Data
-- ============================================================

CREATE DATABASE IF NOT EXISTS capstone_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE capstone_db;

-- ============================================================
-- TABLE: users
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id_user INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  nama VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  no_telepon VARCHAR(20),
  role ENUM('admin', 'petani', 'pembeli') NOT NULL DEFAULT 'pembeli',
  no_rekening VARCHAR(50),
  nama_bank VARCHAR(100),
  foto_profil VARCHAR(255) DEFAULT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ============================================================
-- TABLE: pembeli
-- ============================================================
CREATE TABLE IF NOT EXISTS pembeli (
  id_pembeli INT AUTO_INCREMENT PRIMARY KEY,
  id_user INT NOT NULL,
  nama_pembeli VARCHAR(255) NOT NULL,
  alamat_pembeli TEXT,
  no_telepon_pembeli VARCHAR(20),
  email_pembeli VARCHAR(255),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (id_user) REFERENCES users(id_user) ON DELETE CASCADE
);

-- ============================================================
-- TABLE: pengurus (staff/manager for livestock)
-- ============================================================
CREATE TABLE IF NOT EXISTS pengurus (
  id_pengurus INT AUTO_INCREMENT PRIMARY KEY,
  id_user INT NOT NULL,
  nama_pengurus VARCHAR(255) NOT NULL,
  no_telepon_pengurus VARCHAR(20),
  email_pengurus VARCHAR(255),
  alamat_pengurus TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (id_user) REFERENCES users(id_user) ON DELETE CASCADE
);

-- ============================================================
-- TABLE: product (mushroom products)
-- ============================================================
CREATE TABLE IF NOT EXISTS product (
  id_produk INT AUTO_INCREMENT PRIMARY KEY,
  id_user INT NOT NULL,
  nama_produk VARCHAR(255) NOT NULL,
  deskripsi TEXT,
  harga DECIMAL(15, 2) NOT NULL DEFAULT 0,
  satuan VARCHAR(50) DEFAULT 'kg',
  kategori VARCHAR(100),
  stok INT NOT NULL DEFAULT 0,
  gambar VARCHAR(255) DEFAULT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (id_user) REFERENCES users(id_user) ON DELETE CASCADE
);

-- ============================================================
-- TABLE: ternak (livestock: kambing, sapi)
-- ============================================================
CREATE TABLE IF NOT EXISTS ternak (
  id_ternak INT AUTO_INCREMENT PRIMARY KEY,
  id_user INT NOT NULL,
  nama_ternak VARCHAR(255) NOT NULL,
  nomor_ternak VARCHAR(100),
  kategori_ternak ENUM('kambing', 'sapi', 'lainnya') NOT NULL DEFAULT 'kambing',
  usia_ternak INT COMMENT 'In months',
  berat_ternak FLOAT COMMENT 'In kg',
  harga_ternak DECIMAL(15, 2),
  keterangan TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (id_user) REFERENCES users(id_user) ON DELETE CASCADE
);

-- ============================================================
-- TABLE: pengurus_ternak (junction: staff manages livestock)
-- ============================================================
CREATE TABLE IF NOT EXISTS pengurus_ternak (
  id INT AUTO_INCREMENT PRIMARY KEY,
  id_pengurus INT NOT NULL,
  id_ternak INT NOT NULL,
  waktu_kontrol DATETIME,
  waktu_kontrol_berikutnya DATETIME,
  status_kontrol VARCHAR(100) DEFAULT 'Sehat',
  catatan TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (id_pengurus) REFERENCES pengurus(id_pengurus) ON DELETE CASCADE,
  FOREIGN KEY (id_ternak) REFERENCES ternak(id_ternak) ON DELETE CASCADE
);

-- ============================================================
-- TABLE: pesanan (orders)
-- ============================================================
CREATE TABLE IF NOT EXISTS pesanan (
  id_pesanan INT AUTO_INCREMENT PRIMARY KEY,
  id_pembeli INT NOT NULL,
  tanggal_pesanan DATETIME DEFAULT CURRENT_TIMESTAMP,
  total_harga DECIMAL(15, 2) NOT NULL DEFAULT 0,
  alamat_pengiriman TEXT,
  catatan TEXT,
  status ENUM('pending', 'dikonfirmasi', 'diproses', 'dikirim', 'selesai', 'dibatalkan') DEFAULT 'pending',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (id_pembeli) REFERENCES pembeli(id_pembeli) ON DELETE CASCADE
);

-- ============================================================
-- TABLE: detail_pesanan (order items)
-- ============================================================
CREATE TABLE IF NOT EXISTS detail_pesanan (
  id INT AUTO_INCREMENT PRIMARY KEY,
  id_pesanan INT NOT NULL,
  id_produk INT NOT NULL,
  jumlah INT NOT NULL DEFAULT 1,
  harga_satuan DECIMAL(15, 2) NOT NULL,
  subtotal DECIMAL(15, 2) NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (id_pesanan) REFERENCES pesanan(id_pesanan) ON DELETE CASCADE,
  FOREIGN KEY (id_produk) REFERENCES product(id_produk) ON DELETE CASCADE
);

-- ============================================================
-- SEED DATA
-- ============================================================

-- Password: admin123 (bcrypt hashed)
INSERT INTO users (username, password, nama, email, no_telepon, role, no_rekening, nama_bank) VALUES
('admin', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lh.i', 'Administrator', 'admin@capstone.com', '081234567890', 'admin', NULL, NULL),
('budi_petani', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lh.i', 'Budi Santoso', 'budi@petani.com', '081234567891', 'petani', '1234567890', 'BRI'),
('sari_petani', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lh.i', 'Sari Dewi', 'sari@petani.com', '081234567892', 'petani', '0987654321', 'BNI'),
('andi_pembeli', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lh.i', 'Andi Pratama', 'andi@pembeli.com', '081234567893', 'pembeli', NULL, NULL);

-- Pembeli data
INSERT INTO pembeli (id_user, nama_pembeli, alamat_pembeli, no_telepon_pembeli, email_pembeli) VALUES
(4, 'Andi Pratama', 'Jl. Merdeka No. 10, Jakarta', '081234567893', 'andi@pembeli.com');

-- Products
INSERT INTO product (id_user, nama_produk, deskripsi, harga, satuan, kategori, stok) VALUES
(2, 'Jamur Tiram Segar', 'Jamur tiram segar berkualitas tinggi, dipanen langsung dari kebun. Cocok untuk berbagai masakan.', 25000, 'kg', 'Jamur Tiram', 50),
(2, 'Jamur Shiitake Kering', 'Jamur shiitake kering premium, kaya nutrisi dan aroma. Tahan lama hingga 6 bulan.', 85000, 'kg', 'Jamur Shiitake', 30),
(3, 'Jamur Merang Segar', 'Jamur merang segar pilihan, tekstur lembut dan rasa gurih. Dipanen setiap pagi.', 35000, 'kg', 'Jamur Merang', 40),
(3, 'Jamur Enoki Segar', 'Jamur enoki segar import quality, cocok untuk hotpot dan sup.', 45000, 'pack', 'Jamur Enoki', 25),
(2, 'Bibit Jamur Tiram', 'Bibit jamur tiram siap tanam dalam baglog, cocok untuk pemula.', 15000, 'baglog', 'Bibit', 100),
(3, 'Jamur Kuping Kering', 'Jamur kuping kering, siap konsumsi setelah direndam. Berkhasiat tinggi.', 55000, 'kg', 'Jamur Kuping', 20);

-- Ternak
INSERT INTO ternak (id_user, nama_ternak, nomor_ternak, kategori_ternak, usia_ternak, berat_ternak, harga_ternak, keterangan) VALUES
(2, 'Kambing Jawa', 'KBG-001', 'kambing', 18, 35.5, 2500000, 'Kambing betina, sehat dan produktif'),
(2, 'Kambing Etawa', 'KBG-002', 'kambing', 24, 45.0, 3500000, 'Kambing jantan unggul, cocok untuk pengembangbiakan'),
(2, 'Sapi Limosin', 'SPI-001', 'sapi', 36, 350.0, 18000000, 'Sapi jantan premium kualitas A'),
(3, 'Kambing PE', 'KBG-003', 'kambing', 12, 28.0, 1800000, 'Kambing betina muda, produktif'),
(3, 'Sapi Brahman', 'SPI-002', 'sapi', 48, 420.0, 22000000, 'Sapi betina unggul, sudah beranak 2x');

-- Pengurus
INSERT INTO pengurus (id_user, nama_pengurus, no_telepon_pengurus, email_pengurus, alamat_pengurus) VALUES
(2, 'Budi Santoso', '081234567891', 'budi@petani.com', 'Jl. Tani No. 5, Bogor'),
(3, 'Sari Dewi', '081234567892', 'sari@petani.com', 'Jl. Kebun No. 8, Bandung');
