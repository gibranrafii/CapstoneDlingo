-- Skema mengikuti /CAPSTONE/schema.sql (RAT pada dokumen proposal).
-- Ekstensi di luar skema: user.no_rekening, user.nama_bank, product.gambar.
-- Sistem Penjualan Jamur Lingzhi & Pengelolaan Data Ternak - Desa Dlingo Imogiri
CREATE DATABASE IF NOT EXISTS dlingo_jamur CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE dlingo_jamur;

CREATE TABLE IF NOT EXISTS `user` (
  id_user INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  nama VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  no_telepon VARCHAR(255),
  role VARCHAR(255) NOT NULL DEFAULT 'pembeli',  -- petani / pembeli / admin
  no_rekening VARCHAR(50),   -- ekstensi FR-07: rekening petani untuk transfer langsung
  nama_bank VARCHAR(100),    -- ekstensi FR-07
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS pembeli (
  id_pembeli INT AUTO_INCREMENT PRIMARY KEY,
  id_user INT NOT NULL,
  nama_pembeli VARCHAR(255) NOT NULL,
  alamat_pembeli VARCHAR(255),
  no_telepon_pembeli VARCHAR(255),
  email_pembeli VARCHAR(255),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_pembeli_user FOREIGN KEY (id_user) REFERENCES `user`(id_user) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS product (
  id_produk INT AUTO_INCREMENT PRIMARY KEY,
  id_user INT NOT NULL,
  nama_produk VARCHAR(255) NOT NULL,
  deskripsi VARCHAR(255),
  harga DECIMAL(12,2) NOT NULL,
  satuan VARCHAR(255),
  kategori VARCHAR(255),
  stok INT NOT NULL DEFAULT 0,
  gambar VARCHAR(255),       -- ekstensi: foto produk (upload)
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_product_user FOREIGN KEY (id_user) REFERENCES `user`(id_user) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS pesanan (
  id_pesanan INT AUTO_INCREMENT PRIMARY KEY,
  id_pembeli INT NOT NULL,
  tanggal_pesan DATETIME DEFAULT CURRENT_TIMESTAMP,
  total_harga DECIMAL(12,2) NOT NULL DEFAULT 0,
  alamat_kirim VARCHAR(255),
  catatan VARCHAR(255),
  status VARCHAR(255) NOT NULL DEFAULT 'menunggu',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_pesanan_pembeli FOREIGN KEY (id_pembeli) REFERENCES pembeli(id_pembeli)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS detail_pesanan (
  id_produk INT NOT NULL,
  id_pesanan INT NOT NULL,
  jumlah INT NOT NULL,
  harga_satuan DECIMAL(12,2) NOT NULL,
  subtotal DECIMAL(12,2) NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id_pesanan, id_produk),
  CONSTRAINT fk_detail_produk FOREIGN KEY (id_produk) REFERENCES product(id_produk),
  CONSTRAINT fk_detail_pesanan FOREIGN KEY (id_pesanan) REFERENCES pesanan(id_pesanan) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS pengurus (
  id_pengurus INT AUTO_INCREMENT PRIMARY KEY,
  id_user INT NOT NULL,
  nama_pengurus VARCHAR(255) NOT NULL,
  no_telepon_pengurus VARCHAR(255),
  email_pengurus VARCHAR(255),
  alamat_pengurus VARCHAR(255),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_pengurus_user FOREIGN KEY (id_user) REFERENCES `user`(id_user) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS ternak (
  id_ternak INT AUTO_INCREMENT PRIMARY KEY,
  id_user INT NOT NULL,
  nama_ternak VARCHAR(255) NOT NULL,
  nomor_ternak VARCHAR(255),
  kategori_ternak VARCHAR(255),  -- sapi / kambing
  usia_ternak INT,
  berat_ternak FLOAT,
  harga_ternak DECIMAL(14,2),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_ternak_user FOREIGN KEY (id_user) REFERENCES `user`(id_user) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS pengurus_ternak (
  id_pengurus INT NOT NULL,
  id_ternak INT NOT NULL,
  waktu_kontrak_awal DATETIME NOT NULL,
  waktu_kontrak_akhir DATETIME,
  status_kontrak VARCHAR(255),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id_pengurus, id_ternak, waktu_kontrak_awal),
  CONSTRAINT fk_pt_pengurus FOREIGN KEY (id_pengurus) REFERENCES pengurus(id_pengurus) ON DELETE CASCADE,
  CONSTRAINT fk_pt_ternak FOREIGN KEY (id_ternak) REFERENCES ternak(id_ternak) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================================
-- SEED DATA (password semua akun: admin123)
-- ============================================================
INSERT INTO `user` (username, password, nama, email, no_telepon, role, no_rekening, nama_bank) VALUES
('admin', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lh.i', 'Administrator', 'admin@dlingo.com', '081234567890', 'admin', NULL, NULL),
('budi_petani', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lh.i', 'Budi Santoso', 'budi@petani.com', '081234567891', 'petani', '1234567890', 'BRI'),
('sari_petani', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lh.i', 'Sari Dewi', 'sari@petani.com', '081234567892', 'petani', '0987654321', 'BNI'),
('andi_pembeli', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lh.i', 'Andi Pratama', 'andi@pembeli.com', '081234567893', 'pembeli', NULL, NULL);

INSERT INTO pembeli (id_user, nama_pembeli, alamat_pembeli, no_telepon_pembeli, email_pembeli) VALUES
(4, 'Andi Pratama', 'Jl. Imogiri Timur No. 10, Bantul', '081234567893', 'andi@pembeli.com');

INSERT INTO product (id_user, nama_produk, deskripsi, harga, satuan, kategori, stok) VALUES
(2, 'Jamur Lingzhi Segar', 'Jamur lingzhi segar dari kebun Desa Dlingo.', 150000, 'kg', 'Jamur Lingzhi', 20),
(2, 'Jamur Lingzhi Kering', 'Irisan lingzhi kering, tahan lama.', 450000, 'kg', 'Jamur Lingzhi', 15),
(3, 'Bubuk Jamur Lingzhi', 'Bubuk lingzhi siap seduh.', 120000, 'pack', 'Olahan', 40),
(3, 'Bibit Jamur Lingzhi', 'Bibit lingzhi dalam baglog.', 25000, 'baglog', 'Bibit', 100);

INSERT INTO ternak (id_user, nama_ternak, nomor_ternak, kategori_ternak, usia_ternak, berat_ternak, harga_ternak) VALUES
(2, 'Kambing Jawa', 'KBG-001', 'kambing', 18, 35.5, 2500000),
(2, 'Sapi Limosin', 'SPI-001', 'sapi', 36, 350.0, 18000000),
(3, 'Kambing PE', 'KBG-002', 'kambing', 12, 28.0, 1800000);

INSERT INTO pengurus (id_user, nama_pengurus, no_telepon_pengurus, email_pengurus, alamat_pengurus) VALUES
(2, 'Slamet Riyadi', '081300000001', 'slamet@dlingo.com', 'Dlingo, Imogiri, Bantul'),
(3, 'Joko Widodo', '081300000002', 'joko@dlingo.com', 'Dlingo, Imogiri, Bantul');

INSERT INTO pengurus_ternak (id_pengurus, id_ternak, waktu_kontrak_awal, waktu_kontrak_akhir, status_kontrak) VALUES
(1, 1, '2026-01-01 08:00:00', '2026-12-31 17:00:00', 'aktif'),
(1, 2, '2026-01-01 08:00:00', '2026-12-31 17:00:00', 'aktif'),
(2, 3, '2026-02-01 08:00:00', NULL, 'aktif');
