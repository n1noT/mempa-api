/*
  Warnings:

  - You are about to drop the column `style` on the `Playlist` table. All the data in the column will be lost.
  - Added the required column `styleId` to the `Playlist` table without a default value. This is not possible if the table is not empty.
  - Added the required column `styleId` to the `Track` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Playlist" DROP COLUMN "style",
ADD COLUMN     "styleId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "Track" ADD COLUMN     "styleId" INTEGER NOT NULL;

-- CreateTable
CREATE TABLE "MusicStyle" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "MusicStyle_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Playlist" ADD CONSTRAINT "Playlist_styleId_fkey" FOREIGN KEY ("styleId") REFERENCES "MusicStyle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Track" ADD CONSTRAINT "Track_styleId_fkey" FOREIGN KEY ("styleId") REFERENCES "MusicStyle"("id") ON DELETE CASCADE ON UPDATE CASCADE;
