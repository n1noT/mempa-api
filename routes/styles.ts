import { Router } from 'express';
import prisma from '../prisma/client';

const router = Router();

router.get('/', async (req, res) => {
  const styles = await prisma.musicStyle.findMany();
  res.json(styles);
});

router.get('/:id', async (req, res) => {
  const { id } = req.params;
  const style = await prisma.musicStyle.findUnique({
    where: { id: parseInt(id) },
  });
  if (!style) {
    return res.status(404).json({ message: 'Style inconnu' });
  }
  res.json(style);
});

router.post('/', async (req, res) => {
  const { name } = req.body;
  if (!name) {
    return res.status(400).json({ message: 'Le nom du style est requis' });
  }
  const newStyle = await prisma.musicStyle.create({
    data: { name },
  });
  res.status(201).json(newStyle);
});

router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { name } = req.body;
  if (!name) {
    return res.status(400).json({ message: 'Le nom du style est requis' });
  }
  try {
    const updatedStyle = await prisma.musicStyle.update({
      where: { id: parseInt(id) },
      data: { name },
    });
    res.json(updatedStyle);
  } catch (error) {
    res.status(404).json({ message: 'Style inconnu' });
  }
});

router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.musicStyle.delete({
      where: { id: parseInt(id) },
    });
    res.status(204).send();
  } catch (error) {
    res.status(404).json({ message: 'Style inconnu' });
  }
});

export default router;