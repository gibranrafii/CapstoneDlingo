SET FOREIGN_KEY_CHECKS=0;
CREATE TABLE `detail_pesanan` (
  `id_produk` int(11) NOT NULL,
  `id_pesanan` int(11) NOT NULL,
  `jumlah` int(11) NOT NULL,
  `harga_satuan` decimal(12,2) NOT NULL,
  `subtotal` decimal(12,2) NOT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id_pesanan`,`id_produk`),
  KEY `fk_detail_produk` (`id_produk`),
  CONSTRAINT `fk_detail_pesanan` FOREIGN KEY (`id_pesanan`) REFERENCES `pesanan` (`id_pesanan`) ON DELETE CASCADE,
  CONSTRAINT `fk_detail_produk` FOREIGN KEY (`id_produk`) REFERENCES `product` (`id_produk`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE `pembeli` (
  `id_pembeli` int(11) NOT NULL AUTO_INCREMENT,
  `id_user` int(11) NOT NULL,
  `nama_pembeli` varchar(255) NOT NULL,
  `alamat_pembeli` varchar(255) DEFAULT NULL,
  `no_telepon_pembeli` varchar(255) DEFAULT NULL,
  `email_pembeli` varchar(255) DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id_pembeli`),
  KEY `fk_pembeli_user` (`id_user`),
  CONSTRAINT `fk_pembeli_user` FOREIGN KEY (`id_user`) REFERENCES `user` (`id_user`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE `pengurus` (
  `id_pengurus` int(11) NOT NULL AUTO_INCREMENT,
  `id_user` int(11) NOT NULL,
  `nama_pengurus` varchar(255) NOT NULL,
  `no_telepon_pengurus` varchar(255) DEFAULT NULL,
  `email_pengurus` varchar(255) DEFAULT NULL,
  `alamat_pengurus` varchar(255) DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id_pengurus`),
  KEY `fk_pengurus_user` (`id_user`),
  CONSTRAINT `fk_pengurus_user` FOREIGN KEY (`id_user`) REFERENCES `user` (`id_user`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE `pengurus_ternak` (
  `id_pengurus` int(11) NOT NULL,
  `id_ternak` int(11) NOT NULL,
  `waktu_kontrak_awal` datetime NOT NULL,
  `waktu_kontrak_akhir` datetime DEFAULT NULL,
  `status_kontrak` varchar(255) DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id_pengurus`,`id_ternak`,`waktu_kontrak_awal`),
  KEY `fk_pt_ternak` (`id_ternak`),
  CONSTRAINT `fk_pt_pengurus` FOREIGN KEY (`id_pengurus`) REFERENCES `pengurus` (`id_pengurus`) ON DELETE CASCADE,
  CONSTRAINT `fk_pt_ternak` FOREIGN KEY (`id_ternak`) REFERENCES `ternak` (`id_ternak`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE `pesanan` (
  `id_pesanan` int(11) NOT NULL AUTO_INCREMENT,
  `id_pembeli` int(11) NOT NULL,
  `tanggal_pesan` datetime DEFAULT current_timestamp(),
  `total_harga` decimal(12,2) NOT NULL DEFAULT 0.00,
  `alamat_kirim` varchar(255) DEFAULT NULL,
  `catatan` varchar(255) DEFAULT NULL,
  `status` varchar(255) NOT NULL DEFAULT 'menunggu',
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id_pesanan`),
  KEY `fk_pesanan_pembeli` (`id_pembeli`),
  CONSTRAINT `fk_pesanan_pembeli` FOREIGN KEY (`id_pembeli`) REFERENCES `pembeli` (`id_pembeli`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE `product` (
  `id_produk` int(11) NOT NULL AUTO_INCREMENT,
  `id_user` int(11) NOT NULL,
  `nama_produk` varchar(255) NOT NULL,
  `deskripsi` varchar(255) DEFAULT NULL,
  `harga` decimal(12,2) NOT NULL,
  `satuan` varchar(255) DEFAULT NULL,
  `kategori` varchar(255) DEFAULT NULL,
  `stok` int(11) NOT NULL DEFAULT 0,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id_produk`),
  KEY `fk_product_user` (`id_user`),
  CONSTRAINT `fk_product_user` FOREIGN KEY (`id_user`) REFERENCES `user` (`id_user`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE `ternak` (
  `id_ternak` int(11) NOT NULL AUTO_INCREMENT,
  `id_user` int(11) NOT NULL,
  `nama_ternak` varchar(255) NOT NULL,
  `nomor_ternak` varchar(255) DEFAULT NULL,
  `kategori_ternak` varchar(255) DEFAULT NULL,
  `usia_ternak` int(11) DEFAULT NULL,
  `berat_ternak` float DEFAULT NULL,
  `harga_ternak` decimal(14,2) DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id_ternak`),
  KEY `fk_ternak_user` (`id_user`),
  CONSTRAINT `fk_ternak_user` FOREIGN KEY (`id_user`) REFERENCES `user` (`id_user`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE `user` (
  `id_user` int(11) NOT NULL AUTO_INCREMENT,
  `username` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `nama` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `no_telepon` varchar(255) DEFAULT NULL,
  `role` varchar(255) NOT NULL DEFAULT 'pembeli',
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id_user`),
  UNIQUE KEY `username` (`username`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
SET FOREIGN_KEY_CHECKS=1;
