-- AlterTable
ALTER TABLE `comment` ADD COLUMN `rating` INTEGER NULL,
    MODIFY `text` VARCHAR(191) NULL;
