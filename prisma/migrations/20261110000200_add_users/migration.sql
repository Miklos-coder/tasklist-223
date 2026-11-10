-- Erst nullable erweitern, bestehende Aufgaben zuordnen, dann NOT NULL setzen.
CREATE TABLE `User` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `email` VARCHAR(191) NOT NULL,
  `password` VARCHAR(255) NOT NULL,
  `profileImage` VARCHAR(2048) NULL,
  `role` ENUM('admin', 'user') NOT NULL DEFAULT 'user',
  UNIQUE INDEX `User_email_key` (`email`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE `Task` ADD COLUMN `creatorId` INTEGER NULL, ADD COLUMN `assigneeId` INTEGER NULL;
-- Technischer Admin für bestehende v2-Aufgaben; nur ein zufälliger scrypt-Hash, kein Klartextpasswort.
INSERT INTO `User` (`email`, `password`, `role`)
SELECT 'admin@tasklist.local', 'scrypt$685847f8d82fe35ed99212da6fad0271$d6ebfa829ea54741dd73c4bfa7a462280c5af515f3d079161aa00b20a9c2cf09a24ccff24eb3a31c79f8ea92ba1c718da326755486b8f47cad5ea957aa74aa16', 'admin'
WHERE EXISTS (SELECT 1 FROM `Task`);
UPDATE `Task` SET `creatorId` = (SELECT `id` FROM `User` WHERE `email` = 'admin@tasklist.local') WHERE `creatorId` IS NULL;
ALTER TABLE `Task` MODIFY `creatorId` INTEGER NOT NULL;
CREATE INDEX `Task_creatorId_idx` ON `Task` (`creatorId`);
CREATE INDEX `Task_assigneeId_idx` ON `Task` (`assigneeId`);
ALTER TABLE `Task` ADD CONSTRAINT `Task_creatorId_fkey` FOREIGN KEY (`creatorId`) REFERENCES `User` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `Task` ADD CONSTRAINT `Task_assigneeId_fkey` FOREIGN KEY (`assigneeId`) REFERENCES `User` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;
