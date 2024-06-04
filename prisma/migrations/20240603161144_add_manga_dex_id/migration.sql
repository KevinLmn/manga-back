/*
  Warnings:

  - Added the required column `mangaDexId` to the `Mangas` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Mangas" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "mangaDexId" INTEGER NOT NULL,
    "title" TEXT NOT NULL
);
INSERT INTO "new_Mangas" ("createdAt", "id", "title", "updatedAt") SELECT "createdAt", "id", "title", "updatedAt" FROM "Mangas";
DROP TABLE "Mangas";
ALTER TABLE "new_Mangas" RENAME TO "Mangas";
PRAGMA foreign_key_check("Mangas");
PRAGMA foreign_keys=ON;
