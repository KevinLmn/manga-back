/*
  Warnings:

  - A unique constraint covering the columns `[url,mangaId]` on the table `Chapter` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Chapter_url_mangaId_key" ON "Chapter"("url", "mangaId");
