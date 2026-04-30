import { Router } from "express";
import prisma from "../prisma/client";

const router = Router();

type PlaylistSortBy = "name" | "popularity" | "recent";

// Création d'une playlist (Attributs obligatoires)
router.post("/", async (req, res) => {
  const { name, creator, style, contributors } = req.body;
  const playlist = await prisma.playlist.create({
    data: {
      name,
      creator,
      style,
      contributors,
      clicks: 0, // Initialisé à 0 par défaut
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
    req.query.sortBy === "recent"
      ? (req.query.sortBy as PlaylistSortBy)
      : "name";

  try {
    const playlists = await prisma.playlist.findMany({
      where:
        searchTerm.length > 0
          ? {
              OR: [
                { name: { contains: searchTerm, mode: "insensitive" } },
                { creator: { contains: searchTerm, mode: "insensitive" } },
                { style: { contains: searchTerm, mode: "insensitive" } },
              ],
            }
          : undefined,
      orderBy:
        sortBy === "popularity"
          ? { clicks: "desc" }
          : sortBy === "recent"
            ? { createdAt: "desc" }
            : { name: "asc" },
      select: {
        id: true,
        name: true,
        creator: true,
        style: true,
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
    include: { tracks: { orderBy: { addedAt: "asc" } } },
  });
  res.json(playlist);
});

export default router;
