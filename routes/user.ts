import { Router, Request, Response } from "express";
import prisma from "../prisma/client";
import { requireAdmin } from "../middlewares/requireAdmin";

const router = Router();

/**
 * Ensemble des routes pour la gestion des utilisateurs par les administrateurs :
 * - consultation de la liste des comptes
 * - modification du rôle d'un utilisateur
 * - suppression d'un compte
 */

/**
 * Route pour récupérer la liste de tous les utilisateurs.
 * Réservée aux administrateurs pour la gestion des comptes depuis le back-office.
 * Les utilisateurs sont triés du plus récent au plus ancien pour faciliter
 * la modération des nouveaux inscrits.
 */
router.get("/", requireAdmin, async (_req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      // On ne retourne jamais le mot de passe hashé dans les réponses API
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });
    return res.status(200).json(users);
  } catch (error: any) {
    console.error("Erreur récupération utilisateurs :", error);
    return res.status(500).json({ error: "Erreur serveur" });
  }
});

/**
 * Route pour modifier le rôle d'un utilisateur (USER ou ADMIN).
 * Réservée aux administrateurs.
 *
 * Cette route permet de promouvoir un utilisateur en administrateur
 * ou de lui retirer ce rôle sans avoir à modifier directement la base de données.
 */
router.patch("/:id/role", requireAdmin, async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.id as string, 10);
    const { role } = req.body; // Valeurs attendues : 'USER' ou 'ADMIN'

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { role },
      // On ne retourne que l'id et le rôle pour confirmer la modification sans exposer de données inutiles
      select: { id: true, role: true },
    });

    return res.status(200).json(updatedUser);
  } catch (error: any) {
    console.error("Erreur mise à jour rôle :", error);
    return res.status(500).json({ error: "Erreur serveur" });
  }
});

/**
 * Route pour supprimer un compte utilisateur.
 * Réservée aux administrateurs.
 *
 * La suppression entraîne la suppression en cascade des données associées
 * (playlists créées, contributions) selon la configuration du schéma Prisma.
 */
router.delete("/:id", requireAdmin, async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.id as string, 10);
    await prisma.user.delete({
      where: { id: userId },
    });
    return res.status(200).json({ message: "Utilisateur supprimé" });
  } catch (error: any) {
    console.error("Erreur suppression utilisateur :", error);
    return res.status(500).json({ error: "Erreur serveur" });
  }
});

export default router;