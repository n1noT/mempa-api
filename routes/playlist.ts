import { Router } from "express";
import prisma from "../prisma/client";
import { requireAuth } from "../middlewares/requireAuth";

const router = Router();

type PlaylistSortBy = "name" | "popularity" | "recent" | "style";
type SortOrder = "asc" | "desc";
type trackToAdd = {
  trackId: number;
  addedById: number;
  order: number;
};

type TrackInput = {
  trackId: number;
  order: number;
};

// Création d'une playlist (Attributs obligatoires)
router.post("/", requireAuth, async (req, res) => {
  const { name, styleId, tracks } = req.body;
  const creatorId = req.session?.user?.id;

  if (!name || !styleId || !creatorId) {
    return res
      .status(400)
      .json({ message: "name, styleId et creator sont requis" });
  }

  let tracksIdsToAdd: trackToAdd[] = [];
  if (Array.isArray(tracks) && tracks.length > 0) {
    try {
      tracksIdsToAdd = await getTracksIdsToAdd(
        tracks.map((t: any) => ({ trackId: t.trackId, order: t.order })),
        styleId,
        creatorId,
      );
    } catch (error) {
      return res.status(400).json({ message: (error as Error).message });
    }
  }

  const playlist = await prisma.playlist.create({
    data: {
      name,
      creatorId,
      styleId,
      tracks: {
        create: tracksIdsToAdd,
      },
    },
    include: {
      creator: {
        select: {
          id: true,
          username: true,
        },
      },
      style: true,
      tracks: { include: { track: true }, orderBy: { order: "asc" } },
    },
  });
  res.status(201).json(playlist);
});

router.get("/", async (req, res) => {
  const searchTerm =
    typeof req.query.searchTerm === "string" ? req.query.searchTerm.trim() : "";
  const sortBy =
    req.query.sortBy === "name" ||
    req.query.sortBy === "popularity" ||
    req.query.sortBy === "recent" ||
    req.query.sortBy === "style"
      ? (req.query.sortBy as PlaylistSortBy)
      : "name";

  const sortOrder: SortOrder = req.query.sortOrder === "desc" ? "desc" : "asc";

  const orderBy = (() => {
    switch (sortBy) {
      case "popularity":
        return { clicks: sortOrder };
      case "recent":
        return { createdAt: sortOrder };
      case "style":
        return { style: { name: sortOrder } };
      default:
        return { name: sortOrder };
    }
  })();

  try {
    const playlists = await prisma.playlist.findMany({
      where:
        searchTerm.length > 0
          ? {
              OR: [
                { name: { contains: searchTerm, mode: "insensitive" } },
                {
                  creator: {
                    username: { contains: searchTerm, mode: "insensitive" },
                  },
                },
                {
                  style: {
                    name: { contains: searchTerm, mode: "insensitive" },
                  },
                },
              ],
            }
          : undefined,
      orderBy: orderBy,
      select: {
        id: true,
        name: true,
        creator: {
          select: {
            id: true,
            username: true,
          },
        },
        style: {
          select: {
            id: true,
            name: true,
          },
        },
        clicks: true,
        createdAt: true,
        _count: { select: { tracks: true } },
      },
    });

    res.json(
      playlists.map((playlist) => ({
        id: playlist.id,
        name: playlist.name,
        creator: playlist.creator.username,
        style: playlist.style,
        clicks: playlist.clicks,
        trackCount: playlist._count.tracks,
        createdAt: playlist.createdAt.toISOString(),
      })),
    );
  } catch (error) {
    res.status(500).json({ message: "Failed to load playlists." });
  }
});

router.get("/:id", async (req, res) => {
  const id = parseInt(req.params.id as string, 10);
  const playlist = await prisma.playlist.update({
    where: { id },
    data: { clicks: { increment: 1 } },
    include: {
      creator: {
        select: {
          id: true,
          username: true,
        },
      },
      style: true,
      tracks: {
        include: {
          addedBy: {
            select: {
              id: true,
              username: true,
            },
          },
          track: true,
        },
        orderBy: { order: "asc" },
      },
    },
  });
  if (!playlist) return res.status(404).json({ message: "Playlist inconnue" });
  res.json(playlist);
});

router.put("/:id", requireAuth, async (req, res) => {
  const id = parseInt(req.params.id as string, 10);
  const { name, styleId, tracks } = req.body;
  const creatorId = req.session?.user?.id;

  if (!name || !styleId || !Array.isArray(tracks)) {
    return res
      .status(400)
      .json({ message: "name, styleId et tracks sont requis" });
  }

  const playlist = await prisma.playlist.findUnique({ where: { id } });
  if (!playlist) return res.status(404).json({ message: "Playlist inconnue" });

  if (playlist.creatorId !== creatorId) {
    return res
      .status(403)
      .json({ message: "Vous n'êtes pas le créateur de cette playlist" });
  }

  const keptEntryIds = tracks
    .filter((t: any) => t.entryId !== null)
    .map((t: any) => t.entryId as number);

  const newTracks = tracks.filter((t: any) => t.entryId === null);

  let newTracksToCreate: trackToAdd[] = [];
  if (newTracks.length > 0) {
    try {
      newTracksToCreate = await getTracksIdsToAdd(
        newTracks.map((t: any) => ({ trackId: t.trackId, order: t.order })),
        styleId,
        creatorId,
      );
    } catch (error) {
      return res.status(400).json({ message: (error as Error).message });
    }
  }

  const updatedPlaylist = await prisma.playlist.update({
    where: { id },
    data: {
      name,
      styleId,
      tracks: {
        deleteMany: { id: { notIn: keptEntryIds } },
        update: tracks
          .filter((t: any) => t.entryId !== null)
          .map((t: any) => ({
            where: { id: t.entryId as number },
            data: { order: t.order as number },
          })),
        create: newTracksToCreate,
      },
    },
    include: {
      creator: {
        select: {
          id: true,
          username: true,
        },
      },
      style: true,
      tracks: {
        include: { addedBy: true, track: true },
        orderBy: { order: "asc" },
      },
    },
  });

  res.json(updatedPlaylist);
});

router.patch("/:id/contribute", requireAuth, async (req, res) => {
  const id = parseInt(req.params.id as string, 10);
  const { tracksIdsAdded, tracksIdsRemoved } = req.body;
  const contributorId = req.session?.user?.id;

  if (!Array.isArray(tracksIdsAdded) && !Array.isArray(tracksIdsRemoved)) {
    return res
      .status(400)
      .json({ message: "tracksIdsAdded et tracksIdsRemoved sont requis" });
  }

  if (!contributorId) {
    return res.status(401).json({ message: "Authentification requise" });
  }

  const playlist = await prisma.playlist.findUnique({ where: { id } });
  if (!playlist) return res.status(404).json({ message: "Playlist inconnue" });

  let tracksIdsToAdd: trackToAdd[] = [];
  if (tracksIdsAdded.length > 0) {
    try {
      tracksIdsToAdd = await getTracksIdsToAdd(
        tracksIdsAdded,
        playlist.styleId,
        contributorId,
      );
    } catch (error) {
      return res.status(400).json({ message: (error as Error).message });
    }
  }
  if (tracksIdsRemoved.length > 0) {
    await prisma.playlistTrack.deleteMany({
      where: {
        playlistId: id,
        addedById: contributorId,
        id: { in: tracksIdsRemoved },
      },
    });
  }

  const updatedPlaylist = await prisma.playlist.update({
    where: { id },
    data: {
      tracks: {
        create: tracksIdsToAdd,
      },
    },
    include: {
      style: true,
      tracks: {
        include: { addedBy: true, track: true },
        orderBy: { order: "asc" },
      },
    },
  });

  res.json(
    updatedPlaylist.tracks.map((pt) => ({
      id: pt.id,
      trackId: pt.trackId,
      title: pt.track.title,
      artist: pt.track.artist,
      addedBy: pt.addedBy.username,
    })),
  );
});

// SCRUM-21 : Suppression avec contrôle créateur / Admin
router.delete("/:id", requireAuth, async (req, res) => {
  const id = parseInt(req.params.id as string, 10);
  const { id: userId, role } = req.session.user!;

  const playlist = await prisma.playlist.findUnique({ where: { id } });
  if (!playlist) return res.status(404).json({ message: "Playlist inconnue" });

  if (playlist.creatorId !== userId && role !== "ADMIN") {
    return res.status(403).json({ message: "Vous n'êtes pas autorisé à supprimer cette playlist" });
  }

  await prisma.playlist.delete({ where: { id } });
  return res.status(204).send();
});

async function validateTracks(
  tracksIds: number[],
  styleId: number,
): Promise<string | null> {
  const uniqueTracksIds = Array.from(new Set(tracksIds));
  const tracks = await prisma.track.findMany({
    where: { id: { in: uniqueTracksIds }, styleId },
  });

  if (tracks.length !== uniqueTracksIds.length) {
    return "Certaines pistes sont invalides ou hors style";
  }

  return null;
}

async function getTracksIdsToAdd(
  inputs: TrackInput[],
  styleId: number,
  addedById: number,
): Promise<trackToAdd[]> {
  const validationError = await validateTracks(
    inputs.map((t) => t.trackId),
    styleId,
  );
  if (validationError) {
    throw new Error(validationError);
  }
  return inputs.map(({ trackId, order }) => ({ trackId, addedById, order }));
}

export default router;
