import { Router, Request, Response } from "express";
import bcrypt from "bcrypt";
import prisma from "../prisma/client";

const router = Router();

router.post("/register", async (req: Request, res: Response) => {
  const { email, username, password } = req.body;

  if (!email || !username || !password) {
    return res.status(400).json({ message: "Email, nom d'utilisateur et mot de passe requis" });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return res.status(409).json({ message: "Email déjà utilisé" });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: { email, username, password: hashedPassword },
  });

  return res.status(201).json({ message: "Compte créé", userId: user.id });
});

export default router;
