import { Router } from "express";
import prisma from "../prisma/client";
import { requireAuth } from "../middlewares/requireAuth";

const router = Router();

type PlaylistSortBy = "name" | "popularity" | "recent" | "style";
type SortOrder = "asc" | "desc";
type trackToAdd = {
  trackId: number;
  order: number;
};

// Création d'une playlist (Attributs obligatoires)
router.post("/", requireAuth, async (req, res) => {
  const { name, styleId, trackIds } = req.body;
  const creator = req.session?.user?.username;

  if (!name || !styleId || !creator) {
    return res
      .status(400)
      .json({ message: "name, styleId et creator sont requis" });
  }

  let trackIdsToAdd: trackToAdd[] = [];
  if (Array.isArray(trackIds) && trackIds.length > 0) {
    // On élimine les doublons éviter des erreurs quand on ajoute les mêmes pistes plusieurs fois
    const uniqueTrackIds = Array.from(new Set(trackIds));
    const tracks = await prisma.track.findMany({
      where: { id: { in: uniqueTrackIds }, styleId },
    });

    if (tracks.length !== uniqueTrackIds.length) {
      return res
        .status(400)
        .json({ message: "Certaines pistes sont invalides ou hors style" });
    }

    trackIdsToAdd = trackIds.map((id: number, index: number) => ({
      trackId: id,
      order: index,
    }));
  }

  const playlist = await prisma.playlist.create({
    data: {
      name,
      creator,
      styleId,
      tracks: {
        create: trackIdsToAdd,
      },
    },
    include: {
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

  const sortOrder: SortOrder =
    req.query.sortOrder === "desc" ? "desc" : "asc";

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
                { creator: { contains: searchTerm, mode: "insensitive" } },
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
        creator: true,
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
        creator: playlist.creator,
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
      style: true,
      tracks: { include: { track: true }, orderBy: { order: "asc" } },
    },
  });
  if (!playlist) return res.status(404).json({ message: "Playlist inconnue" });
  res.json(playlist);
});

export default router;
