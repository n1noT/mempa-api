import { Router, Request, Response } from "express";
import bcrypt from "bcrypt";
import prisma from "../prisma/client";
import { requireAuth } from "../middlewares/requireAuth";

const router = Router();

router.patch("/", requireAuth, async (req: Request, res: Response) => {
  const userId = req.session.user!.id;
  const { username, currentPassword, newPassword } = req.body;

  if (!username && !newPassword) {
    return res.status(400).json({ message: "Aucune modification fournie" });
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    return res.status(404).json({ message: "Utilisateur introuvable" });
  }

  const updateData: { username?: string; password?: string } = {};

  if (username) {
    updateData.username = username;
  }

  if (newPassword) {
    if (!currentPassword) {
      return res.status(400).json({ message: "Le mot de passe actuel est requis" });
    }
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Mot de passe actuel incorrect" });
    }
    updateData.password = await bcrypt.hash(newPassword, 10);
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: updateData,
    select: { id: true, username: true, email: true, role: true },
  });

  if (username) {
    req.session.user!.username = updated.username;
  }

  return res.status(200).json(updated);
});

export default router;
