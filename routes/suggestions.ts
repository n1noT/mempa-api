import { Router, Request, Response } from "express";
import prisma from "../prisma/client";

const router = Router();

router.post("/", async (req: Request, res: Response) => {
  try {
    const { title, artist, styleId, link, comment } = req.body;
    const userId = req.session.user?.id;

    if (!userId) return res.status(401).json({ message: "Non autorisé" });

    const suggestion = await prisma.trackSuggestion.create({
      data: { title, artist, styleId, link, comment, submittedById: userId },
    });
    return res.status(201).json(suggestion);
  } catch (error) {
    return res.status(500).json({ error: "Erreur serveur" });
  }
});

router.get("/pending", async (req: Request, res: Response) => {
  try {
    const suggestions = await prisma.trackSuggestion.findMany({
      where: { status: "PENDING" },
      include: { style: true, submittedBy: { select: { username: true } } },
      orderBy: { createdAt: "desc" },
    });
    return res.status(200).json(suggestions);
  } catch (error) {
    return res.status(500).json({ error: "Erreur serveur" });
  }
});

router.post("/:id/validate", async (req: Request, res: Response) => {
  try {
    const suggestionId = parseInt(req.params.id as string, 10);

    const suggestion = await prisma.trackSuggestion.findUnique({
      where: { id: suggestionId },
    });
    if (!suggestion) return res.status(404).json({ message: "Introuvable" });

    const result = await prisma.$transaction(async (tx) => {
      const newTrack = await tx.track.create({
        data: {
          title: suggestion.title,
          artist: suggestion.artist,
          styleId: suggestion.styleId,
          durationSeconds: 0,
        },
      });

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

router.delete("/:id/reject", async (req: Request, res: Response) => {
  try {
    const suggestionId = Number.parseInt(req.params.id as string, 10);
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
