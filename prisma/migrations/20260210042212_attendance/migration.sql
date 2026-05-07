/*
  Warnings:

  - You are about to drop the `instansi` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterTable
ALTER TABLE `attendance` ALTER COLUMN `instansi` DROP DEFAULT,
    ALTER COLUMN `gender` DROP DEFAULT,
    ALTER COLUMN `phone` DROP DEFAULT,
    ALTER COLUMN `position` DROP DEFAULT;

-- DropTable
DROP TABLE `instansi`;
