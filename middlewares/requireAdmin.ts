import { Request, Response, NextFunction } from "express";
/**
 * Middleware pour vérifier que l'utilisateur est connecté et a le rôle d'administrateur (via la session).
 */
export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.session?.user) {
    return res.status(401).json({ message: "Non autorisé. Vous devez être connecté." });
  }
  if (req.session.user.role !== "ADMIN") {
    return res.status(403).json({ message: "Accès refusé. Droits administrateur requis." });
  }
  next();
};
