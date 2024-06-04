-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Manga" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "mangaDexId" INTEGER NOT NULL,
    "title" TEXT
);
INSERT INTO "new_Manga" ("createdAt", "id", "mangaDexId", "title", "updatedAt") SELECT "createdAt", "id", "mangaDexId", "title", "updatedAt" FROM "Manga";
DROP TABLE "Manga";
ALTER TABLE "new_Manga" RENAME TO "Manga";
PRAGMA foreign_key_check("Manga");
PRAGMA foreign_keys=ON;
