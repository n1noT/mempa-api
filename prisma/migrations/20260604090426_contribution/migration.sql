/*
  Warnings:

  - You are about to drop the column `contributors` on the `Playlist` table. All the data in the column will be lost.
  - You are about to drop the column `creator` on the `Playlist` table. All the data in the column will be lost.
  - Added the required column `creatorId` to the `Playlist` table without a default value. This is not possible if the table is not empty.
  - Added the required column `addedById` to the `PlaylistTrack` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Playlist" DROP COLUMN "contributors",
DROP COLUMN "creator",
ADD COLUMN     "creatorId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "PlaylistTrack" ADD COLUMN     "addedById" INTEGER NOT NULL;

-- CreateTable
CREATE TABLE "PlaylistContributor" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "playlistId" INTEGER NOT NULL,

    CONSTRAINT "PlaylistContributor_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Playlist" ADD CONSTRAINT "Playlist_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlaylistContributor" ADD CONSTRAINT "PlaylistContributor_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlaylistContributor" ADD CONSTRAINT "PlaylistContributor_playlistId_fkey" FOREIGN KEY ("playlistId") REFERENCES "Playlist"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlaylistTrack" ADD CONSTRAINT "PlaylistTrack_addedById_fkey" FOREIGN KEY ("addedById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
