import { Router, Request, Response } from "express";
import bcrypt from "bcrypt";
import prisma from "../prisma/client";

const router = Router();

router.post("/register", async (req: Request, res: Response) => {
  try {
    const { email, username, password } = req.body;

    if (!email || !username || !password) {
      return res
        .status(400)
        .json({ message: "Email, nom d'utilisateur et mot de passe requis" });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ message: "Email déjà utilisé" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: { email, username, password: hashedPassword },
    });

    req.session.user = {
      id: user.id,
      username: user.username,
      role: user.role,
    };

    return res.status(201).json({
      id: user.id,
      username: user.username,
      role: user.role,
    });
  } catch (error: any) {
    console.log("ERREUR AUTHENTIFICATION :", error);
    return res.status(500).json({ error: error.message });
  }
});

router.post("/login", async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email et mot de passe requis" });
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return res.status(401).json({ message: "Identifiants invalides" });
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return res.status(401).json({ message: "Identifiants invalides" });
  }

  req.session.user = {
    id: user.id,
    username: user.username,
    role: user.role,
  };

  return res.status(200).json({
    id: user.id,
    username: user.username,
    role: user.role,
  });
});

router.post("/logout", async (req: Request, res: Response) => {
  req.session.destroy((err) => {
    if (err)
      return res.status(500).json({ message: "Erreur lors de la déconnexion" });
    res.clearCookie("sessionId");
    return res.status(200).json({ message: "Déconnecté" });
  });
});

router.get("/me", async (req: Request, res: Response) => {
  if (req.session.user) {
    return res.status(200).json(req.session.user);
  }
  return res.status(401).json({ message: "Non authentifié" });
});

export default router;
