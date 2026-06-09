/*
  Warnings:

  - You are about to drop the `PlaylistContributor` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "PlaylistContributor" DROP CONSTRAINT "PlaylistContributor_playlistId_fkey";

-- DropForeignKey
ALTER TABLE "PlaylistContributor" DROP CONSTRAINT "PlaylistContributor_userId_fkey";

-- DropTable
DROP TABLE "PlaylistContributor";
