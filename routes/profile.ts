import { Router, Request, Response } from "express";
import bcrypt from "bcrypt";
import prisma from "../prisma/client";
import { requireAuth } from "../middlewares/requireAuth";

const router = Router();

/**
 * Ensemble des routes pour la gestion du profil de l'utilisateur connecté :
 * - modification du nom d'utilisateur
 * - modification du mot de passe
 */

/**
 * Route pour mettre à jour le profil de l'utilisateur connecté.
 * L'utilisateur peut modifier son nom d'utilisateur et/ou son mot de passe en une seule requête.
 *
 * La modification du mot de passe nécessite la saisie du mot de passe actuel pour des raisons
 * de sécurité, afin d'empêcher un attaquant ayant accès à une session active de changer le mot de passe.
 *
 * La session est mise à jour en cas de changement de nom d'utilisateur pour maintenir la cohérence
 * entre la base de données et les données de session sans forcer une reconnexion.
 */
router.patch("/", requireAuth, async (req: Request, res: Response) => {
  const userId = req.session.user!.id;
  const { username, currentPassword, newPassword } = req.body;

  // Au moins un des deux champs doit être fourni
  if (!username && !newPassword) {
    return res.status(400).json({ message: "Aucune modification fournie" });
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    return res.status(404).json({ message: "Utilisateur introuvable" });
  }

  // On construit dynamiquement l'objet de mise à jour selon les champs fournis
  const updateData: { username?: string; password?: string } = {};

  if (username) {
    updateData.username = username;
  }

  if (newPassword) {
    // Le mot de passe actuel est obligatoire pour changer le mot de passe
    if (!currentPassword) {
      return res.status(400).json({ message: "Le mot de passe actuel est requis" });
    }
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Mot de passe actuel incorrect" });
    }
    // Hash du nouveau mot de passe avant de le stocker
    updateData.password = await bcrypt.hash(newPassword, 10);
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: updateData,
    // On ne retourne jamais le mot de passe hashé dans la réponse
    select: { id: true, username: true, email: true, role: true },
  });

  // Synchronisation de la session pour éviter un décalage entre la session et la BDD
  if (username) {
    req.session.user!.username = updated.username;
  }

  return res.status(200).json(updated);
});

export default router;
