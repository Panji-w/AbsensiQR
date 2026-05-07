-- DropForeignKey
ALTER TABLE `Attendance` DROP FOREIGN KEY `Attendance_instansiId_fkey`;

-- AlterTable
ALTER TABLE `Attendance` 
  DROP COLUMN `instansiId`,
  ADD COLUMN `instansi` VARCHAR(191) NOT NULL DEFAULT 'Unknown',
  ADD COLUMN `gender` ENUM('LAKI_LAKI', 'PEREMPUAN') NOT NULL DEFAULT 'LAKI_LAKI',
  ADD COLUMN `phone` VARCHAR(191) NOT NULL DEFAULT '0',
  ADD COLUMN `position` VARCHAR(191) NOT NULL DEFAULT 'Unknown',
  ADD COLUMN `signature` TEXT NOT NULL;

-- Update existing rows with dummy signature
UPDATE `Attendance` SET `signature` = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';