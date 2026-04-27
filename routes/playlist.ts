import { Router } from 'express';
import prisma from '../prisma/client';

const router = Router();

// Création d'une playlist (Attributs obligatoires)
router.post('/', async (req, res) => {
  const { name, creator, style, contributors } = req.body;
  const playlist = await prisma.playlist.create({
    data: { 
      name, 
      creator, 
      style, 
      contributors,
      clicks: 0 // Initialisé à 0 par défaut
    }
  });
  res.status(201).json(playlist);
});

// Récupération simple
router.get('/:id', async (req, res) => {
  const id = parseInt(req.params.id as string, 10);
  const playlist = await prisma.playlist.findUnique({ 
    where: { id },
    include: { tracks: { orderBy: { addedAt: 'asc' } } } // Liste triée
  });
  res.json(playlist);
});

export default router;