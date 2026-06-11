import { Router, Request, Response } from "express";
import prisma from "../prisma/client";
import { requireAdmin } from "../middlewares/requireAdmin";

const router = Router();

router.get("/", async (req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
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

router.patch("/:id/role", requireAdmin, async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.id, 10);
    const { role } = req.body; // 'USER' ou 'ADMIN'

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { role },
      select: { id: true, role: true },
    });

    return res.status(200).json(updatedUser);
  } catch (error: any) {
    console.error("Erreur mise à jour rôle :", error);
    return res.status(500).json({ error: "Erreur serveur" });
  }
});

router.delete("/:id", requireAdmin, async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.id, 10);
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
