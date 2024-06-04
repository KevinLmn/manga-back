/*
  Warnings:

  - A unique constraint covering the columns `[number,mangaId]` on the table `Chapter` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Chapter_url_mangaId_key";

-- CreateIndex
CREATE UNIQUE INDEX "Chapter_number_mangaId_key" ON "Chapter"("number", "mangaId");
