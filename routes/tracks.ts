import { Router } from "express";
import prisma from "../prisma/client";

const router = Router();

router.get("/style/:styleId", async (req, res) => {
  const { styleId } = req.params;
  const tracks = await prisma.track.findMany({
    where: {
      styleId: parseInt(styleId),
    },
  });
  res.json(tracks);
});

router.get("/:id", async (req, res) => {
  const { id } = req.params;
  const track = await prisma.track.findUnique({
    where: { id: parseInt(id) },
  });
  if (!track) {
    return res.status(404).json({ message: "Piste inconnue" });
  }
  res.json(track);
});

router.post("/", async (req, res) => {
  const { title, artist, styleId } = req.body;
  if (!title || !artist || !styleId) {
    return res
      .status(400)
      .json({ message: "Le titre, l'artiste et le style sont requis" });
  }
  const newTrack = await prisma.track.create({
    data: {
      title,
      artist,
      styleId
    },
  });
  res.status(201).json(newTrack);
});

router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { title, artist, styleId } = req.body;
  if (!title || !artist || !styleId) {
    return res
      .status(400)
      .json({ message: "Le titre, l'artiste et le style sont requis" });
  }
  try {
    const updatedTrack = await prisma.track.update({
      where: { id: parseInt(id) },
      data: { title, artist, styleId },
    });
    res.json(updatedTrack);
  } catch (error) {
    res.status(404).json({ message: "Piste inconnue" });
  }
});

router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.track.delete({
      where: { id: parseInt(id) },
    });
    res.status(204).send();
  } catch (error) {
    res.status(404).json({ message: "Piste inconnue" });
  }
});

export default router;
