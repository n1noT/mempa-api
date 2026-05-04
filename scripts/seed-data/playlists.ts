import type { PrismaClient } from "@prisma/client";

type SeedPlaylist = {
  title: string;
  curator: string;
  genre: string;
  likes: number;
  trackCount: number;
  publishedAt: string;
};

const SEED_PLAYLISTS: readonly SeedPlaylist[] = [
  {
    title: "Synthica Archive",
    curator: "System_Zero",
    genre: "Electronic",
    likes: 12400,
    trackCount: 18,
    publishedAt: "2026-04-20T14:35:00.000Z",
  },
  {
    title: "Nocturne Driver",
    curator: "NeonPilot",
    genre: "Synthwave",
    likes: 9600,
    trackCount: 14,
    publishedAt: "2026-04-17T10:22:00.000Z",
  },
  {
    title: "Pulse Horizon",
    curator: "Aurore.K",
    genre: "Tech House",
    likes: 15100,
    trackCount: 22,
    publishedAt: "2026-04-24T21:12:00.000Z",
  },
  {
    title: "Velvet BPM",
    curator: "Mika_R",
    genre: "Deep House",
    likes: 7900,
    trackCount: 12,
    publishedAt: "2026-03-29T18:40:00.000Z",
  },
  {
    title: "Analog Rain",
    curator: "CassetteWave",
    genre: "Lo-fi",
    likes: 11300,
    trackCount: 27,
    publishedAt: "2026-04-10T09:18:00.000Z",
  },
  {
    title: "Orbit Session",
    curator: "DJ Atlas",
    genre: "Progressive",
    likes: 6800,
    trackCount: 10,
    publishedAt: "2026-04-01T11:08:00.000Z",
  },
  {
    title: "Skyline Frequencies",
    curator: "Lina Volt",
    genre: "Electro Pop",
    likes: 4200,
    trackCount: 16,
    publishedAt: "2026-02-19T07:41:00.000Z",
  },
  {
    title: "Night Metro",
    curator: "Binary Echo",
    genre: "Minimal",
    likes: 5300,
    trackCount: 11,
    publishedAt: "2026-04-26T13:55:00.000Z",
  },
  {
    title: "Crimson Skyline",
    curator: "Astra Nova",
    genre: "Synthwave",
    likes: 8700,
    trackCount: 15,
    publishedAt: "2026-04-14T19:31:00.000Z",
  },
  {
    title: "Pulse District",
    curator: "Metroline",
    genre: "Electronic",
    likes: 10200,
    trackCount: 19,
    publishedAt: "2026-04-22T08:12:00.000Z",
  },
  {
    title: "Neon Atlas",
    curator: "Luma Grid",
    genre: "Electro Pop",
    likes: 6100,
    trackCount: 13,
    publishedAt: "2026-03-30T22:05:00.000Z",
  },
  {
    title: "Afterglow Circuit",
    curator: "Helio Beat",
    genre: "Progressive",
    likes: 7400,
    trackCount: 17,
    publishedAt: "2026-04-02T16:09:00.000Z",
  },
  {
    title: "Midnight Riviera",
    curator: "Kairo",
    genre: "Deep House",
    likes: 13300,
    trackCount: 24,
    publishedAt: "2026-04-25T20:18:00.000Z",
  },
  {
    title: "Retro Transit",
    curator: "Nova Lane",
    genre: "Synthwave",
    likes: 6900,
    trackCount: 12,
    publishedAt: "2026-03-18T11:27:00.000Z",
  },
  {
    title: "Wired Solstice",
    curator: "Aris Flux",
    genre: "Minimal",
    likes: 5100,
    trackCount: 9,
    publishedAt: "2026-02-27T09:52:00.000Z",
  },
  {
    title: "Aurora Warehouse",
    curator: "Delta V",
    genre: "Tech House",
    likes: 15800,
    trackCount: 26,
    publishedAt: "2026-04-27T10:10:00.000Z",
  },
  {
    title: "Cassette Horizon",
    curator: "Tape Runner",
    genre: "Lo-fi",
    likes: 7800,
    trackCount: 20,
    publishedAt: "2026-04-08T06:35:00.000Z",
  },
  {
    title: "Echo Marathon",
    curator: "RunLoop",
    genre: "Electronic",
    likes: 9400,
    trackCount: 21,
    publishedAt: "2026-04-11T15:44:00.000Z",
  },
  {
    title: "Solar Drift",
    curator: "Cosmo Vale",
    genre: "Progressive",
    likes: 11800,
    trackCount: 23,
    publishedAt: "2026-04-23T12:49:00.000Z",
  },
  {
    title: "Noir Frequencies",
    curator: "M. Quartz",
    genre: "Deep House",
    likes: 8300,
    trackCount: 14,
    publishedAt: "2026-03-12T13:16:00.000Z",
  },
  {
    title: "Gridline Sunset",
    curator: "Pixel Tide",
    genre: "Synthwave",
    likes: 7200,
    trackCount: 16,
    publishedAt: "2026-04-06T17:05:00.000Z",
  },
  {
    title: "Oceanic Drive",
    curator: "Blue Module",
    genre: "Electro Pop",
    likes: 4800,
    trackCount: 11,
    publishedAt: "2026-01-29T20:02:00.000Z",
  },
  {
    title: "Hyperlane",
    curator: "DJ Meridian",
    genre: "Tech House",
    likes: 14600,
    trackCount: 25,
    publishedAt: "2026-04-21T23:09:00.000Z",
  },
  {
    title: "Granular Bloom",
    curator: "Iris Bloom",
    genre: "Minimal",
    likes: 3900,
    trackCount: 8,
    publishedAt: "2026-02-11T08:21:00.000Z",
  },
  {
    title: "Parallel Nights",
    curator: "Neon Harbor",
    genre: "Electronic",
    likes: 10900,
    trackCount: 18,
    publishedAt: "2026-04-15T05:58:00.000Z",
  },
  {
    title: "Monochrome Club",
    curator: "Yori Static",
    genre: "Deep House",
    likes: 7700,
    trackCount: 15,
    publishedAt: "2026-03-22T14:46:00.000Z",
  },
  {
    title: "Stereo Garden",
    curator: "Leaf Tone",
    genre: "Lo-fi",
    likes: 6500,
    trackCount: 13,
    publishedAt: "2026-04-04T11:11:00.000Z",
  },
  {
    title: "Terminal Echoes",
    curator: "Vector Prime",
    genre: "Progressive",
    likes: 9800,
    trackCount: 19,
    publishedAt: "2026-04-19T18:01:00.000Z",
  },
];

const makeTracks = (
  playlistId: number,
  title: string,
  curator: string,
  trackCount: number,
  publishedAt: string,
) => {
  const baseDate = new Date(publishedAt);
  return Array.from({ length: trackCount }, (_, index) => ({
    title: `${title} Track ${index + 1}`,
    artist: curator,
    playlistId,
    addedAt: new Date(baseDate.getTime() + index * 60_000),
  }));
};

export const seedPlaylists = async (prisma: PrismaClient) => {
  let createdPlaylists = 0;
  let createdTracks = 0;

  for (const playlist of SEED_PLAYLISTS) {
    const existing = await prisma.playlist.findFirst({
      where: {
        name: playlist.title,
        creator: playlist.curator,
      },
    });

    const playlistRecord = existing
      ? existing
      : await prisma.playlist.create({
          data: {
            name: playlist.title,
            creator: playlist.curator,
            style: playlist.genre,
            clicks: playlist.likes,
            contributors: [playlist.curator],
            createdAt: new Date(playlist.publishedAt),
          },
        });

    if (!existing) {
      createdPlaylists += 1;
    }

    const trackCount = await prisma.track.count({
      where: { playlistId: playlistRecord.id },
    });

    if (trackCount === 0 && playlist.trackCount > 0) {
      const tracks = makeTracks(
        playlistRecord.id,
        playlist.title,
        playlist.curator,
        playlist.trackCount,
        playlist.publishedAt,
      );
      const result = await prisma.track.createMany({ data: tracks });
      createdTracks += result.count;
    }
  }

  return { createdPlaylists, createdTracks };
};

export const seedPlaylistsData = SEED_PLAYLISTS;
