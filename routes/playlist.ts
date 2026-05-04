import { Router, Request, Response } from 'express';
import prisma from '../prisma/client';

const router = Router();

type PlaylistSortBy = "name" | "popularity" | "recent";
type trackToAdd = {
  trackId: number;
  order: number;
};

// Création d'une playlist (Attributs obligatoires - Compatible SCRUM-61/63)
router.post("/", async (req: Request, res: Response) => {
  try {
    const { name, styleId, trackIds, creator } = req.body;

    if (!name || !styleId || !creator) {
      return res
        .status(400)
        .json({ message: "name, styleId et creator sont requis" });
    }

    let trackIdsToAdd: trackToAdd[] = [];
    if (Array.isArray(trackIds) && trackIds.length > 0) {
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
        clicks: 0,
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
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Liste des playlists avec recherche et tri pour SCRUM-11 page d'accueil
router.get("/", async (req: Request, res: Response) => {
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
                {
                  style: {
                    name: { contains: searchTerm, mode: "insensitive" },
                  },
                },
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

// SCRUM-13 : Récupération et incrémentation des clics
router.get("/:id", async (req: Request, res: Response) => {
  try {
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
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// SCRUM-15 : Bloquage des modifications 
router.put('/:id', (req: Request, res: Response) => {
  res.status(405).json({ message: "Méthode non autorisée : Les playlists sont en lecture seule." });
});

// SCRUM-15 : Bloquage des suppressions 
router.delete('/:id', (req: Request, res: Response) => {
  res.status(405).json({ message: "Méthode non autorisée : Les playlists ne peuvent pas être supprimées." });
});

export default router;