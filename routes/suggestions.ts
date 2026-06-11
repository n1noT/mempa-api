import { Router, Request, Response } from "express";
import prisma from "../prisma/client";
import { requireAdmin } from "../middlewares/requireAdmin";

const router = Router();

/**
 * Ensemble des routes pour la gestion des suggestions de pistes :
 * - soumission par un utilisateur connecté
 * - consultation des suggestions en attente (admin)
 * - validation ou rejet par un administrateur
 */

/**
 * Route pour soumettre une suggestion de track.
 * Un utilisateur connecté peut proposer une track qui sera examinée
 * par un administrateur avant d'être intégrée au catalogue.
 *
 * La suggestion est créée avec le statut PENDING par défaut (défini au niveau du schéma Prisma).
 */
router.post("/", async (req: Request, res: Response) => {
  try {
    const { title, artist, styleId, link, comment } = req.body;
    const userId = req.session.user?.id;

    // On vérifie manuellement la session car cette route n'utilise pas requireAuth
    if (!userId) return res.status(401).json({ message: "Non autorisé" });

    const suggestion = await prisma.trackSuggestion.create({
      data: { title, artist, styleId, link, comment, submittedById: userId },
    });
    return res.status(201).json(suggestion);
  } catch (error) {
    return res.status(500).json({ error: "Erreur serveur" });
  }
});

/**
 * Route pour récupérer toutes les suggestions en attente de validation.
 * Retourne les suggestions triées par date de création décroissante
 * pour que les plus récentes apparaissent en premier dans l'interface d'administration.
 */
router.get("/pending", async (req: Request, res: Response) => {
  try {
    const suggestions = await prisma.trackSuggestion.findMany({
      where: { status: "PENDING" },
      // On inclut le style et le nom du soumetteur pour éviter des requêtes supplémentaires côté admin
      include: { style: true, submittedBy: { select: { username: true } } },
      orderBy: { createdAt: "desc" },
    });
    return res.status(200).json(suggestions);
  } catch (error) {
    return res.status(500).json({ error: "Erreur serveur" });
  }
});

/**
 * Route pour valider une suggestion et l'intégrer au catalogue.
 * Réservée aux administrateurs.
 *
 * La validation s'effectue dans une transaction Prisma pour garantir la cohérence des données :
 * la piste est créée et la suggestion est APPROVED en une seule opération,
 * ce qui évite un état incohérent si l'une des deux échoue.
 *
 * La durée est initialisée à 0 car elle n'est pas fournie dans la suggestion
 * et devra être renseignée via la route de modification des tracks par l'admin.
 */
router.post("/:id/validate", requireAdmin, async (req: Request, res: Response) => {
  try {
    const suggestionId = parseInt(req.params.id as string, 10);

    const suggestion = await prisma.trackSuggestion.findUnique({
      where: { id: suggestionId },
    });
    if (!suggestion) return res.status(404).json({ message: "Introuvable" });

    const result = await prisma.$transaction(async (tx) => {
      // Création de la piste à partir des données de la suggestion
      const newTrack = await tx.track.create({
        data: {
          title: suggestion.title,
          artist: suggestion.artist,
          styleId: suggestion.styleId,
          durationSeconds: 0,
        },
      });

      // Mise à jour du statut de la suggestion pour garder une trace de la décision
      await tx.trackSuggestion.update({
        where: { id: suggestionId },
        data: { status: "APPROVED" },
      });

      return newTrack;
    });

    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({ error: "Erreur serveur" });
  }
});

/**
 * Route pour rejeter une suggestion.
 * Réservée aux administrateurs.
 *
 * Le rejet ne supprime pas la suggestion mais la marque REJECTED pour conserver
 * un historique et éviter de retraiter une suggestion déjà examinée.
 */
router.delete("/:id/reject", requireAdmin, async (req: Request, res: Response) => {
  try {
    const suggestionId = Number.parseInt(req.params.id as string, 10);
    // On met à jour le statut plutôt que de supprimer pour conserver l'historique
    await prisma.trackSuggestion.update({
      where: { id: suggestionId },
      data: { status: "REJECTED" },
    });
    return res.status(200).json({ message: "Suggestion rejetée" });
  } catch (error) {
    return res.status(500).json({ error: "Erreur serveur" });
  }
});

export default router;