-- Create extension for case-insensitive text
CREATE EXTENSION IF NOT EXISTS citext;

-- AlterTable
ALTER TABLE "MusicStyle" ALTER COLUMN "name" SET DATA TYPE CITEXT;

-- AlterTable
ALTER TABLE "Playlist" ALTER COLUMN "name" SET DATA TYPE CITEXT;
