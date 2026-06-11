import { Router } from 'express';
import prisma from '../prisma/client';
import { requireAdmin } from '../middlewares/requireAdmin';

const router = Router();

/**
 * Ensemble des routes pour la gestion des styles musicaux :
 * - consultation (publique)
 * - création, modification, suppression (admin uniquement)
 */

/**
 * Route pour récupérer la liste de tous les styles musicaux disponibles.
 * Cette route est publique car les styles sont nécessaires pour afficher
 * les playlists et les pistes sans authentification.
 */
router.get('/', async (req, res) => {
  const styles = await prisma.musicStyle.findMany();
  res.json(styles);
});

/**
 * Route pour récupérer un style musical par son ID.
 */
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  const style = await prisma.musicStyle.findUnique({
    where: { id: parseInt(id as string, 10) },
  });
  if (!style) {
    return res.status(404).json({ message: 'Style inconnu' });
  }
  res.json(style);
});

/**
 * Route pour créer un nouveau style musical.
 * Réservée aux administrateurs car les styles définissent les catégories
 * de l'ensemble du catalogue musical de l'application.
 */
router.post('/', requireAdmin, async (req, res) => {
  const { name } = req.body;
  if (!name) {
    return res.status(400).json({ message: 'Le nom du style est requis' });
  }
  const newStyle = await prisma.musicStyle.create({
    data: { name },
  });
  res.status(201).json(newStyle);
});

/**
 * Route pour modifier le nom d'un style existant.
 * Réservée aux administrateurs. La modification d'un style se répercute
 * automatiquement sur toutes les playlists et pistes qui y sont associées
 * via la relation en base de données.
 */
router.put('/:id', requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { name } = req.body;
  if (!name) {
    return res.status(400).json({ message: 'Le nom du style est requis' });
  }
  try {
    const updatedStyle = await prisma.musicStyle.update({
      where: { id: parseInt(id as string, 10) },
      data: { name },
    });
    res.json(updatedStyle);
  } catch (error) {
    // Prisma lève une erreur si l'enregistrement à mettre à jour n'existe pas
    res.status(404).json({ message: 'Style inconnu' });
  }
});

/**
 * Route pour supprimer un style musical.
 * Réservée aux administrateurs. La suppression peut échouer si des pistes
 * ou des playlists sont encore rattachées à ce style (contrainte de clé étrangère).
 */
router.delete('/:id', requireAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.musicStyle.delete({
      where: { id: parseInt(id as string, 10) },
    });
    res.status(204).send();
  } catch (error) {
    // Prisma lève une erreur si l'enregistrement à supprimer n'existe pas
    res.status(404).json({ message: 'Style inconnu' });
  }
});

export default router;
