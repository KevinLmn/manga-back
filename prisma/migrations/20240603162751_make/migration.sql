-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Manga" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "mangaDexId" TEXT NOT NULL,
    "title" TEXT
);
INSERT INTO "new_Manga" ("createdAt", "id", "mangaDexId", "title", "updatedAt") SELECT "createdAt", "id", "mangaDexId", "title", "updatedAt" FROM "Manga";
DROP TABLE "Manga";
ALTER TABLE "new_Manga" RENAME TO "Manga";
CREATE UNIQUE INDEX "Manga_mangaDexId_key" ON "Manga"("mangaDexId");
CREATE TABLE "new_Chapter" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "number" INTEGER NOT NULL,
    "url" TEXT NOT NULL,
    "mangaId" TEXT NOT NULL,
    CONSTRAINT "Chapter_mangaId_fkey" FOREIGN KEY ("mangaId") REFERENCES "Manga" ("mangaDexId") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Chapter" ("createdAt", "id", "mangaId", "number", "updatedAt", "url") SELECT "createdAt", "id", "mangaId", "number", "updatedAt", "url" FROM "Chapter";
DROP TABLE "Chapter";
ALTER TABLE "new_Chapter" RENAME TO "Chapter";
PRAGMA foreign_key_check("Manga");
PRAGMA foreign_key_check("Chapter");
PRAGMA foreign_keys=ON;
