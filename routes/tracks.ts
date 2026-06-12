import { Router } from "express";
import fs from "node:fs";
import path from "node:path";
import multer from "multer";
import prisma from "../prisma/client";
import { requireAdmin } from "../middlewares/requireAdmin";

const router = Router();

const uploadsDir = path.join(process.cwd(), "public", "uploads", "tracks");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const extension = path.extname(file.originalname) || ".mp3";
    const safeBase = file.originalname
      .replace(extension, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "")
      .slice(0, 48);
    cb(null, `${Date.now()}-${safeBase || "track"}${extension}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith("audio/")) {
      return cb(new Error("Le fichier audio doit etre un fichier MP3."));
    }
    cb(null, true);
  },
});

type TrackSortBy = "recent" | "title" | "artist";

const parseOptionalInt = (value: unknown): number | null => {
  if (typeof value !== "string" || value.trim().length === 0) return null;
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? null : parsed;
};

router.get("/", async (req, res) => {
  const searchTerm =
    typeof req.query.search === "string" ? req.query.search.trim() : "";
  const sortByParam =
    typeof req.query.sortBy === "string" ? req.query.sortBy : "";
  const sortBy: TrackSortBy =
    sortByParam === "title" ||
    sortByParam === "artist" ||
    sortByParam === "recent"
      ? sortByParam
      : "recent";
  const order = req.query.order === "asc" ? "asc" : "desc";
  const styleId = parseOptionalInt(req.query.styleId);

  let orderBy: {
    title?: typeof order;
    artist?: typeof order;
    addedAt?: "desc";
  };
  if (sortBy === "title") {
    orderBy = { title: order };
  } else if (sortBy === "artist") {
    orderBy = { artist: order };
  } else {
    orderBy = { addedAt: "desc" };
  }

  try {
    const tracks = await prisma.track.findMany({
      where: {
        ...(styleId ? { styleId } : {}),
        ...(searchTerm.length > 0
          ? {
              OR: [
                { title: { contains: searchTerm, mode: "insensitive" } },
                { artist: { contains: searchTerm, mode: "insensitive" } },
                { album: { contains: searchTerm, mode: "insensitive" } },
                { genre: { contains: searchTerm, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      include: { style: true },
      orderBy,
    });
    res.json(tracks);
  } catch (error) {
    console.error("Failed to load tracks", error);
    res.status(500).json({ message: "Impossible de charger les titres." });
  }
});

router.get("/style/:styleId", async (req, res) => {
  const { styleId } = req.params;
  const searchTerm =
    typeof req.query.search === "string" ? req.query.search.trim() : "";

  try {
    const tracks = await prisma.track.findMany({
      where: {
        styleId: Number.parseInt(styleId, 10),
        ...(searchTerm.length > 0
          ? {
              OR: [
                { title: { contains: searchTerm, mode: "insensitive" } },
                { artist: { contains: searchTerm, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      include: { style: true },
      take: 10,
    });
    res.json(tracks);
  } catch (error) {
    console.error("Failed to load tracks by style", error);
    res.status(500).json({ message: "Impossible de charger les pistes." });
  }
});

router.get("/:id", async (req, res) => {
  const { id } = req.params;
  const track = await prisma.track.findUnique({
    where: { id: Number.parseInt(id, 10) },
    include: { style: true },
  });
  if (!track) {
    return res.status(404).json({ message: "Piste inconnue" });
  }
  res.json(track);
});

router.post("/", requireAdmin, upload.single("audio"), async (req, res) => {
  const { title, artist, album, genre, durationSeconds, coverUrl, styleId } =
    req.body;
  if (!title || !artist || !styleId) {
    return res
      .status(400)
      .json({ message: "Le titre, l'artiste et le style sont requis" });
  }
  const parsedStyleId = Number.parseInt(styleId, 10);
  const parsedDuration = parseOptionalInt(durationSeconds);
  const audioUrl = req.file ? `/uploads/tracks/${req.file.filename}` : null;

  const newTrack = await prisma.track.create({
    data: {
      title,
      artist,
      album: album || null,
      genre: genre || null,
      durationSeconds: parsedDuration,
      coverUrl: coverUrl || null,
      audioUrl,
      styleId: parsedStyleId,
    },
    include: { style: true },
  });
  res.status(201).json(newTrack);
});

router.put("/:id", requireAdmin, upload.single("audio"), async (req, res) => {
  const { id } = req.params;
  const { title, artist, album, genre, durationSeconds, coverUrl, styleId } =
    req.body;
  if (!title || !artist || !styleId) {
    return res
      .status(400)
      .json({ message: "Le titre, l'artiste et le style sont requis" });
  }
  try {
    const existingTrack = await prisma.track.findUnique({
      where: { id: Number.parseInt(id as string, 10) },
    });
    if (!existingTrack) {
      return res.status(404).json({ message: "Piste inconnue" });
    }
    if (req.file && existingTrack.audioUrl?.startsWith("/uploads/tracks/")) {
      const existingPath = path.join(
        process.cwd(),
        "public",
        existingTrack.audioUrl.replace("/uploads/", "uploads/"),
      );
      if (fs.existsSync(existingPath)) {
        fs.unlinkSync(existingPath);
      }
    }

    const parsedStyleId = Number.parseInt(styleId, 10);
    const parsedDuration = parseOptionalInt(durationSeconds);
    const audioUrl = req.file
      ? `/uploads/tracks/${req.file.filename}`
      : existingTrack.audioUrl;
    const updatedTrack = await prisma.track.update({
      where: { id: Number.parseInt(id as string, 10) },
      data: {
        title,
        artist,
        album: album || null,
        genre: genre || null,
        durationSeconds: parsedDuration,
        coverUrl: coverUrl || null,
        audioUrl,
        styleId: parsedStyleId,
      },
      include: { style: true },
    });
    res.json(updatedTrack);
  } catch (error) {
    console.error("Failed to update track", error);
    res.status(404).json({ message: "Piste inconnue" });
  }
});

router.delete("/:id", requireAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    const existingTrack = await prisma.track.findUnique({
      where: { id: Number.parseInt(id as string, 10) },
    });
    if (!existingTrack) {
      return res.status(404).json({ message: "Piste inconnue" });
    }
    if (existingTrack.audioUrl?.startsWith("/uploads/tracks/")) {
      const existingPath = path.join(
        process.cwd(),
        "public",
        existingTrack.audioUrl.replace("/uploads/", "uploads/"),
      );
      if (fs.existsSync(existingPath)) {
        fs.unlinkSync(existingPath);
      }
    }
    await prisma.track.delete({
      where: { id: Number.parseInt(id as string, 10) },
    });
    res.status(204).send();
  } catch (error) {
    console.error("Failed to delete track", error);
    res.status(404).json({ message: "Piste inconnue" });
  }
});

export default router;
