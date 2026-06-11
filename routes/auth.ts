import { Router, Request, Response } from "express";
import bcrypt from "bcrypt";
import prisma from "../prisma/client";

const router = Router();

/**
 * Route pour l'inscription d'un nouvel utilisateur.
 * En cas de succès, la fonction crée une session pour l'utilisateur
 * et retourne les informations de l'utilisateur (sans le mot de passe) dans la réponse.
 */
router.post("/register", async (req: Request, res: Response) => {
  try {
    const { email, username, password } = req.body;

    // Validation de la présence des champs requis
    if (!email || !username || !password) {
      return res
        .status(400)
        .json({ message: "Email, nom d'utilisateur et mot de passe requis" });
    }

    // Vérification que l'email n'est pas déjà utilisé
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ message: "Email déjà utilisé" });
    }

    // Hash du mot de passe avant de le stocker par sécurité
    const hashedPassword = await bcrypt.hash(password, 10);

    // Création de l'utilisateur dans la base de données
    const user = await prisma.user.create({
      data: { email, username, password: hashedPassword },
    });

    // Initialisation de la session pour l'utilisateur inscrit
    req.session.user = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
    };

    // Retour des informations de l'utilisateur (sans le mot de passe) dans la réponse
    return res.status(201).json({
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
    });
  } catch (error: any) {
    console.log("ERREUR AUTHENTIFICATION :", error);
    return res.status(500).json({ error: error.message });
  }
});

/** 
 * Route pour la connexion d'un utilisateur existant.
 * En cas de succès, la fonction crée une session pour l'utilisateur
 * et retourne les informations de l'utilisateur (sans le mot de passe) dans la réponse.
 */
router.post("/login", async (req: Request, res: Response) => {
  const { email, password } = req.body;

  // Validation de la présence des champs requis
  if (!email || !password) {
    return res.status(400).json({ message: "Email et mot de passe requis" });
  }

  // Vérification que l'utilisateur existe et que le mot de passe est correct
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return res.status(401).json({ message: "Identifiants invalides" });
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return res.status(401).json({ message: "Identifiants invalides" });
  }

  // Initialisation de la session pour l'utilisateur connecté
  req.session.user = {
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
  };

  // Retour des informations de l'utilisateur (sans le mot de passe) dans la réponse
  return res.status(200).json({
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
  });
});

/** 
 * Route pour la déconnexion d'un utilisateur.
 * La fonction détruit la session de l'utilisateur et retourne un message de succès dans la réponse.
 */
router.post("/logout", async (req: Request, res: Response) => {
  req.session.destroy((err) => {
    if (err)
      return res.status(500).json({ message: "Erreur lors de la déconnexion" });
    res.clearCookie("sessionId");
    return res.status(200).json({ message: "Déconnecté" });
  });
});

/**
 * Route pour récupérer les informations de l'utilisateur actuellement connecté.
 * La fonction vérifie que l'utilisateur est authentifié via la session,
 * puis retourne les informations de l'utilisateur (sans le mot de passe) dans la réponse.
 */
router.get("/me", async (req: Request, res: Response) => {
  if (!req.session.user) {
    return res.status(401).json({ message: "Non authentifié" });
  }
  const user = await prisma.user.findUnique({
    where: { id: req.session.user.id },
    // Sélection des champs à retourner (sans le mot de passe)
    select: { id: true, username: true, email: true, role: true },
  });
  if (!user) {
    return res.status(401).json({ message: "Non authentifié" });
  }
  return res.status(200).json(user);
});

export default router;
