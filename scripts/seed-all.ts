import prisma from "../prisma/client";
import { seedPlaylists } from "./seed-data/playlists";

const run = async () => {
  const playlistResult = await seedPlaylists(prisma);

  console.log(
    `Seed complete: ${playlistResult.createdPlaylists} playlists, ${playlistResult.createdTracks} tracks added.`,
  );
};

run()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
