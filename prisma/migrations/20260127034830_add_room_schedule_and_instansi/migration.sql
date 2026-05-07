-- CreateTable Instansi
CREATE TABLE `Instansi` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `Instansi_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Insert default Instansi
INSERT INTO `Instansi` (`name`) VALUES ('Belum Ditentukan');

-- AlterTable Room: Tambah kolom satu per satu
ALTER TABLE `Room` ADD COLUMN `startTime` DATETIME(3) NULL;
ALTER TABLE `Room` ADD COLUMN `endTime` DATETIME(3) NULL;
ALTER TABLE `Room` ADD COLUMN `status` ENUM('ACTIVE', 'FINISHED') NOT NULL DEFAULT 'ACTIVE';
ALTER TABLE `Room` ADD COLUMN `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3);

-- Update existing rows dengan default values
UPDATE `Room` SET `startTime` = CURRENT_TIMESTAMP(3) WHERE `startTime` IS NULL;
UPDATE `Room` SET `endTime` = DATE_ADD(CURRENT_TIMESTAMP(3), INTERVAL 2 HOUR) WHERE `endTime` IS NULL;

-- Ubah kolom menjadi NOT NULL setelah diisi
ALTER TABLE `Room` MODIFY COLUMN `startTime` DATETIME(3) NOT NULL;
ALTER TABLE `Room` MODIFY COLUMN `endTime` DATETIME(3) NOT NULL;

-- AlterTable Attendance: Tambah instansiId
ALTER TABLE `Attendance` ADD COLUMN `instansiId` INTEGER NULL;

-- Update existing rows dengan default instansi
UPDATE `Attendance` SET `instansiId` = 1 WHERE `instansiId` IS NULL;

-- Ubah kolom menjadi NOT NULL
ALTER TABLE `Attendance` MODIFY COLUMN `instansiId` INTEGER NOT NULL;

-- Hapus kolom email
ALTER TABLE `Attendance` DROP COLUMN `email`;

-- AddForeignKey untuk instansi
ALTER TABLE `Attendance` ADD CONSTRAINT `Attendance_instansiId_fkey` 
FOREIGN KEY (`instansiId`) REFERENCES `Instansi`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- Update foreign key untuk room dengan CASCADE
ALTER TABLE `Attendance` DROP FOREIGN KEY `Attendance_roomId_fkey`;
ALTER TABLE `Attendance` ADD CONSTRAINT `Attendance_roomId_fkey` 
FOREIGN KEY (`roomId`) REFERENCES `Room`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;