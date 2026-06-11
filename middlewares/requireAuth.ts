import { Request, Response, NextFunction } from "express";

/**
 * Middleware pour vérifier que l'utilisateur est connecté (via la session).
 */
export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  if (!req.session || !req.session.user) {
    return res.status(401).json({ message: "Non autorisé. Vous devez être connecté." });
  }
  
  next();
};