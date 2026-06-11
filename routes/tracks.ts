import { Router } from "express";
import fs from "node:fs";
import path from "node:path";
import multer from "multer";
import prisma from "../prisma/client";
import { requireAdmin } from "../middlewares/requireAdmin";

const router = Router();

/**
 * Ensemble des routes pour la gestion des pistes musicales :
 * - consultation et recherche (publique)
 * - création, modification, suppression (admin uniquement)
 *
 * Les routes d'écriture acceptent un fichier audio via multipart/form-data
 * grâce au middleware multer configuré ci-dessous.
 */

// Création du répertoire de stockage des fichiers audio si absent au démarrage
const uploadsDir = path.join(process.cwd(), "public", "uploads", "tracks");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

/**
 * Configuration de multer pour le stockage des fichiers audio sur disque.
 * Le nom de fichier est normalisé (minuscules, tirets, sans accents) et préfixé
 * par un timestamp pour éviter les collisions entre fichiers de même nom.
 */
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
  limits: { fileSize: 20 * 1024 * 1024 }, // Limite à 20 Mo par fichier
  fileFilter: (_req, file, cb) => {
    // On rejette tout fichier dont le MIME type n'est pas audio
    if (!file.mimetype.startsWith("audio/")) {
      return cb(new Error("Le fichier audio doit etre un fichier MP3."));
    }
    cb(null, true);
  },
});

// Types locaux
type TrackSortBy = "recent" | "title" | "artist";

// Retourne null si la valeur n'est pas un entier valide, pour éviter des NaN dans les requêtes Prisma
const parseOptionalInt = (value: unknown): number | null => {
  if (typeof value !== "string" || value.trim().length === 0) return null;
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? null : parsed;
};

/**
 * Route pour récupérer la liste des trakcs avec recherche, tri et filtre par style.
 * Supporte les paramètres de requête suivants :
 * - search : terme de recherche sur le titre, l'artiste, l'album ou le genre
 * - sortBy : critère de tri (recent | title | artist), "recent" par défaut
 * - order : ordre de tri (asc | desc), "desc" par défaut
 * - styleId : filtre sur le style musical
 */
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
      : "recent"; // Tri par date d'ajout par défaut
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
    // Pour le tri par date, on force "desc" pour afficher les ajouts récents en premier
    orderBy = { addedAt: "desc" };
  }

  try {
    const tracks = await prisma.track.findMany({
      where: {
        // Le filtre styleId n'est appliqué que s'il est fourni dans la requête
        ...(styleId ? { styleId } : {}),
        ...(searchTerm.length > 0
          ? {
              OR: [
                // Le mode "insensitive" permet une recherche insensible à la casse, ce qui améliore l'expérience utilisateur
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

/**
 * Route pour récupérer les pistes appartenant à un style musical.
 * Limitée à 10 résultats car elle est principalement utilisée pour les listes
 * déroulantes de sélection lors de la création ou modification d'une playlist.
 * On évite donc de surcharger le front et la BDD.
 */
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
      take: 10, // Limite volontaire pour la performance des listes déroulantes
    });
    res.json(tracks);
  } catch (error) {
    console.error("Failed to load tracks by style", error);
    res.status(500).json({ message: "Impossible de charger les pistes." });
  }
});

/**
 * Route pour récupérer les détails d'une piste par son ID.
 */
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

/**
 * Route pour créer une nouvelle piste, avec upload optionnel d'un fichier audio.
 * Réservée aux administrateurs.
 *
 * Le fichier audio est traité par multer avant d'atteindre le handler :
 * si un fichier est présent, son chemin relatif est stocké en base (audioUrl).
 * Si aucun fichier n'est fourni, audioUrl reste null et pourra être renseigné plus tard.
 */
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
  // On construit le chemin relatif pour que l'URL soit indépendante de l'environnement
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

/**
 * Route pour modifier une piste existante, avec remplacement optionnel du fichier audio.
 * Réservée aux administrateurs.
 *
 * Si un nouveau fichier audio est fourni, l'ancien fichier est supprimé du disque
 * avant d'enregistrer le nouveau, pour éviter l'accumulation de fichiers orphelins.
 * On vérifie que le fichier existant est bien dans le dossier uploads avant de le supprimer,
 * pour ne pas tenter d'effacer une URL externe.
 */
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

    // Suppression de l'ancien fichier uniquement s'il est hébergé localement
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
    // On conserve l'ancien audioUrl si aucun nouveau fichier n'est uploadé
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

/**
 * Route pour supprimer une piste.
 * Réservée aux administrateurs.
 *
 * Comme pour la modification, le fichier audio local est supprimé du disque
 * si la piste en possède un, pour ne pas laisser de fichiers orphelins dans uploads.
 */
router.delete("/:id", requireAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    const existingTrack = await prisma.track.findUnique({
      where: { id: Number.parseInt(id as string, 10) },
    });
    if (!existingTrack) {
      return res.status(404).json({ message: "Piste inconnue" });
    }

    // Nettoyage du fichier audio local avant la suppression en base
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
