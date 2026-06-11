import { Router } from "express";
import prisma from "../prisma/client";
import { requireAuth } from "../middlewares/requireAuth";

const router = Router();

/**
 * Ensemble des routes pour la gestion des playlists : 
 * - création
 * - modification
 * - suppression
 * - consultation
 * - contribution
 */

// Types utilisés dans ce fichier pour une meilleure lisibilité et maintenabilité du code
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
type PlaylistOrderBy =
  | { clicks: SortOrder }
  | { createdAt: SortOrder }
  | { style: { name: SortOrder } }
  | { name: SortOrder };

type SearchFilter = {
  OR: (
    | { name: { contains: string; mode: "insensitive" } }
    | { creator: { username: { contains: string; mode: "insensitive" } } }
    | { style: { name: { contains: string; mode: "insensitive" } } }
  )[];
};

type PlaylistSummary = {
  id: number;
  name: string;
  creator: string | null;
  style: { id: number; name: string } | null;
  clicks: number;
  trackCount: number;
  createdAt: string;
};

// Création d'une playlist (Attributs obligatoires)
router.post("/", requireAuth, async (req, res) => {
  const { name, styleId, tracks } = req.body;
  const creatorId = req.session?.user?.id;

  // Validation de la présence des champs requis
  if (!name || !styleId || !creatorId) {
    return res
      .status(400)
      .json({ message: "name, styleId et creator sont requis" });
  }

  let tracksIdsToAdd: trackToAdd[] = [];
  // On vérifie si des tracks sont fournis
  if (Array.isArray(tracks) && tracks.length > 0) {
    try {
      tracksIdsToAdd = await getTracksIdsToAdd(
        // Formattage des données d'entrée pour la fonction getTracksIdsToAdd
        tracks.map((t: any) => ({ trackId: t.trackId, order: t.order })),
        styleId,
        creatorId,
      );
    } catch (error) {
      return res.status(400).json({ message: (error as Error).message });
    }
  }

  // Création de la playlist avec les pistes associées (si fournies)
  const playlist = await prisma.playlist.create({
    data: {
      name,
      creatorId,
      styleId,
      tracks: {
        // Création des entrées dans la table de relation PlaylistTrack pour associer les pistes à la playlist
        create: tracksIdsToAdd,
      },
    },
    // Inclusion des données associées dans la réponse pour éviter des requêtes supplémentaires
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

/**
 * Fonction utilitaire pour parser les paramètres de requête d'une liste de playlists 
 * Ex: /playlists?searchTerm=rock&sortBy=popularity&sortOrder=desc
 * Puis, construire l'objet de tri/recherche correspondant pour la requête Prisma.
 */
function parseListQueryParams(query: Record<string, unknown>): {
  orderBy: PlaylistOrderBy;
  searchFilter: SearchFilter | undefined;
} {
  // Extraction des paramètres dans l'URL (?searchTerm=...) via query 
  const searchTerm =
    typeof query.searchTerm === "string" ? query.searchTerm.trim() : "";
  const sortBy: PlaylistSortBy =
    query.sortBy === "name" ||
    query.sortBy === "popularity" ||
    query.sortBy === "recent" ||
    query.sortBy === "style"
      ? (query.sortBy as PlaylistSortBy)
      : "name"; // Valeur par défaut : tri par nom
  const sortOrder: SortOrder = query.sortOrder === "desc" ? "desc" : "asc"; // Ascendant par défaut

  const orderBy: PlaylistOrderBy = (() => {
    switch (sortBy) {
      case "popularity":
        return { clicks: sortOrder };
      case "recent":
        return { createdAt: sortOrder };
      case "style":
        return { style: { name: sortOrder } };
      default:
        return { name: sortOrder }; // Tri par nom par défaut (URL vide)
    }
  })();

  // Si searchTerm est présent et non vide, on construit un filtre de recherche pour les champs name, creator.username et style.name
  const searchFilter: SearchFilter | undefined =
    searchTerm.length > 0
      ? {
          OR: [
            // Le mode "insensitive" permet une recherche insensible à la casse, ce qui améliore l'expérience utilisateur
            { name: { contains: searchTerm, mode: "insensitive" } },
            { creator: { username: { contains: searchTerm, mode: "insensitive" } } },
            { style: { name: { contains: searchTerm, mode: "insensitive" } } },
          ],
        }
      : undefined;

  // Retourne l'objet préparé pour la requête Prisma
  return { orderBy, searchFilter };
}

/**
 * Fonction utilitaire pour récupérer les playlists selon des critères de recherche et de tri.
 */
async function fetchPlaylists(
  where: object,
  orderBy: PlaylistOrderBy,
): Promise<PlaylistSummary[]> {
  const playlists = await prisma.playlist.findMany({
    where,
    orderBy,
    select: {
      id: true,
      name: true,
      // On sélectionne uniquement les champs nécessaires 
      // pour éviter de traiter des données inutiles et améliorer les performances
      creator: { select: { id: true, username: true } },
      style: { select: { id: true, name: true } },
      clicks: true,
      createdAt: true,
      _count: { select: { tracks: true } },
    },
  });

  // Formatage des données pour la réponse de l'API
  return playlists.map((playlist) => ({
    id: playlist.id,
    name: playlist.name,
    creator: playlist.creator.username,
    style: playlist.style,
    clicks: playlist.clicks,
    trackCount: playlist._count.tracks,
    createdAt: playlist.createdAt.toISOString(),
  }));
}

/**
 * Route pour récupérer la liste des playlists avec des critères de recherche et de tri.
 */
router.get("/", async (req, res) => {
  // On parse les paramètres de la requête pour construire les critères de recherche et de tri
  const { orderBy, searchFilter } = parseListQueryParams(req.query);
  try {
    // On récupère les playlists selon les critères construits et on retourne la réponse
    res.json(await fetchPlaylists(searchFilter ?? {}, orderBy));
  } catch {
    res.status(500).json({ message: "Failed to load playlists." });
  }
});

/**
 * Route pour récupérer la liste des playlists créées par l'utilisateur actuellement connecté.
 * La fonction utilise le middleware requireAuth pour s'assurer que l'utilisateur est authentifié,
 * puis récupère les playlists dont le creatorId correspond à l'ID de l'utilisateur dans la session.
 * 
 * Cette route utilise la mêle logique que la route GET principale 
 * d'où la factorisation du parsing et de la récupération des playlists dans des fonctions utilitaires 
 * pour éviter la duplication de code et faciliter la maintenance.
 */
router.get("/my", requireAuth, async (req, res) => {
  const userId = req.session?.user?.id;
  const { orderBy, searchFilter } = parseListQueryParams(req.query);
  try {
    res.json(
      // On ajoute le critère creatorId à l'objet de recherche pour ne récupérer que les playlists de l'utilisateur connecté
      await fetchPlaylists({ creatorId: userId, ...searchFilter }, orderBy),
    );
  } catch {
    res.status(500).json({ message: "Failed to load playlists." });
  }
});

/**
 * Route pour récupérer les détails d'une playlist via son ID.
 */
router.get("/:id", async (req, res) => {
  const id = parseInt(req.params.id as string, 10);
  const playlist = await prisma.playlist.update({
    where: { id },
    data: { clicks: { increment: 1 } }, // Incrémente le nombre de clics à chaque consultation de la playlist
    include: {
      creator: {
        // Retourne uniquement les champs nécessaires par sécurité et performance
        select: {
          id: true,
          username: true,
        },
      },
      style: true,
      tracks: {
        include: {
          // On inclut les contributeurs
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

/**
 * Route pour modifier une playlist existante. Seul le créateur de la playlist peut la modifier.
 * La fonction vérifie que l'utilisateur est authentifié et est le créateur de la playlist,
 * puis met à jour les champs modifiables (name, styleId) et gère les pistes associées (ajout/suppression).
 * 
 * La gestion des pistes est un peu complexe car il faut différencier les pistes à conserver (avec entryId), 
 * les nouvelles pistes à ajouter (sans entryId) et les pistes à supprimer (présentes en base mais absentes de la requête).
 * La fonction getTracksIdsToAdd est utilisée pour valider les pistes à ajouter et formater les données pour la création des entrées dans la table de relation PlaylistTrack.
 * 
 * Cette route permet au créateur de la playlist de faire une mise à jour complète de sa playlist, 
 * y compris le changement du style et la modification de l'ensemble des pistes, 
 * ce qui offre une grande flexibilité pour la gestion de ses playlists.
 */
router.put("/:id", requireAuth, async (req, res) => {
  const id = parseInt(req.params.id as string, 10);
  const { name, styleId, tracks } = req.body;
  const creatorId = req.session?.user?.id;

  // Validation des paramètres requis
  if (!name || !styleId || !Array.isArray(tracks)) {
    return res
      .status(400)
      .json({ message: "name, styleId et tracks sont requis" });
  }

  const playlist = await prisma.playlist.findUnique({ where: { id } });
  if (!playlist) return res.status(404).json({ message: "Playlist inconnue" });

  // Seul le créateur peut modifier sa playlist
  if (!creatorId || playlist.creatorId !== creatorId) {
    return res
      .status(403)
      .json({ message: "Vous n'êtes pas le créateur de cette playlist" });
  }

  // On différencie les pistes à conserver (avec entryId), 
  // les nouvelles pistes à ajouter (sans entryId) 
  // et les pistes à supprimer (présentes en base mais absentes de la requête)

  // Liste des tracks à conserver (présents dans la requête avec un entryId, donc déjà en base)
  const keptEntryIds = tracks
    .filter((t: any) => t.entryId !== null)
    .map((t: any) => t.entryId as number);

  // Liste des tracks à ajouter (présents dans la requête sans entryId, donc pas encore en base)
  const newTracks = tracks.filter((t: any) => t.entryId === null);

  // On réutilise la logique de tracks to add
  let newTracksToCreate: trackToAdd[] = [];
  if (newTracks.length > 0) {
    try {
      newTracksToCreate = await getTracksIdsToAdd(
        // Formattage des données d'entrée pour la fonction getTracksIdsToAdd
        newTracks.map((t: any) => ({ trackId: t.trackId, order: t.order })),
        styleId,
        creatorId,
      );
    } catch (error) {
      return res.status(400).json({ message: (error as Error).message });
    }
  }

  // Mise à jour de l'entité
  const updatedPlaylist = await prisma.playlist.update({
    where: { id },
    data: {
      name,
      styleId,
      tracks: {
        // On supprime les entités non retenues (pas dans le tableau des entrées gardées)
        deleteMany: { id: { notIn: keptEntryIds } },
        // Mise à jour des tracks (ceux présent en base) pour conserver l'ordre
        update: tracks
          .filter((t: any) => t.entryId !== null)
          .map((t: any) => ({
            where: { id: t.entryId as number },
            data: { order: t.order as number }, // MAJ de l'ordre
          })),
        // Ajout des nouveaux tracks
        create: newTracksToCreate,
      },
    },
    // Ajout des données supplémentaires pour la réponse de l'API
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

/**
 * Route permettant à un utilisateur authentifié de contribuer à une playlist existante.
 * Un contributeur peut ajouter ou retirer ses propres pistes sur n'importe quelle playlist,
 * sans avoir à en être le créateur.
 *
 * Contrairement à la route PUT, cette route n'autorise un contributeur qu'à supprimer
 * les pistes qu'il a lui-même ajoutées (addedById = contributorId),
 * ce qui protège les contributions des autres membres.
 *
 * La réponse retourne uniquement la liste des pistes de la playlist mise à jour,
 * avec les informations essentielles (titre, artiste, contributeur).
 */
router.patch("/:id/contribute", requireAuth, async (req, res) => {
  const id = parseInt(req.params.id as string, 10);
  const { tracksIdsAdded, tracksIdsRemoved } = req.body;
  const contributorId = req.session?.user?.id;

  // Validation : au moins l'un des deux tableaux doit être présent
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

  // Validation et formatage des pistes à ajouter (style de la playlist respecté)
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

  // Suppression uniquement des pistes ajoutées par ce contributeur pour éviter les suppressions non autorisées
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

  // On retourne uniquement les champs pertinents pour le front plutôt que l'entité complète
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

/**
 * Route pour supprimer une playlist existante.
 * Seul le créateur de la playlist ou un administrateur peut effectuer cette suppression.
 *
 * La suppression de la playlist entraîne la suppression en cascade des entrées
 * dans la table de relation PlaylistTrack (pistes associées), conformément à la configuration Prisma.
 *
 * Un code 204 (No Content) est retourné en cas de succès car il n'y a rien à renvoyer
 * suite à une suppression.
 */
router.delete("/:id", requireAuth, async (req, res) => {
  const id = parseInt(req.params.id as string, 10);
  const { id: userId, role } = req.session.user!;

  const playlist = await prisma.playlist.findUnique({ where: { id } });
  if (!playlist) return res.status(404).json({ message: "Playlist inconnue" });

  // Seul le créateur ou un admin peut supprimer la playlist
  if (playlist.creatorId !== userId && role !== "ADMIN") {
    return res
      .status(403)
      .json({ message: "Vous n'êtes pas autorisé à supprimer cette playlist" });
  }

  await prisma.playlist.delete({ where: { id } });
  return res.status(204).send();
});

async function validateTracks(
  tracksIds: number[],
  styleId: number,
): Promise<string | null> {
  // Suppression des doublons pour éviter des incohérences à la vérification de la taille des tableaux
  const uniqueTracksIds = Array.from(new Set(tracksIds));
  // Récupération des pistes correspondantes aux IDs fournis et au style de la playlist
  const tracks = await prisma.track.findMany({
    where: { id: { in: uniqueTracksIds }, styleId },
  });

  // Si le nombre de pistes récupérées est différent du nombre d'IDs uniques fournis,
  // cela signifie que certains IDs sont invalides ou que certaines pistes ne correspondent pas au style de la playlist
  if (tracks.length !== uniqueTracksIds.length) {
    return "Certaines pistes sont invalides ou hors style";
  }

  return null;
}

/**
 * Récupère les IDs des pistes à ajouter à la playlist selon les données d'entrée.
 * La fonction valide d'abord que les pistes existent et appartiennent au style de la playlist,
 * puis formate les données pour la création des entrées dans la table de relation PlaylistTrack.
 * 
 * Cette fonction est utilisée à la fois lors de la création d'une playlist (pour les pistes initiales)
 * et lors de la contribution à une playlist existante (pour les pistes ajoutées par les contributeurs).
 * 
 * @param inputs tracks en provenance de du front
 * @param styleId id du style de la playlist pour valider que les pistes appartiennent au même style
 * @param addedById contributeur qui a ajouté les pistes
 * @returns 
 */
async function getTracksIdsToAdd(
  inputs: TrackInput[],
  styleId: number,
  addedById: number,
): Promise<trackToAdd[]> {
  const validationError = await validateTracks(
    inputs.map((t) => t.trackId), // Formattage des données d'entrée pour la validation (id)
    styleId,
  );
  // Si une erreur de validation est retournée, on lève une exception pour interrompre le processus
  if (validationError) {
    throw new Error(validationError);
  }
  // Formattage des données d'entrée pour la création des entrées dans la table de relation PlaylistTrack
  return inputs.map(({ trackId, order }) => ({ trackId, addedById, order }));
}

export default router;
