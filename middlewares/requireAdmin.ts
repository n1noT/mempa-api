import { Request, Response, NextFunction } from "express";

export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.session?.user) {
    return res.status(401).json({ message: "Non autorisé. Vous devez être connecté." });
  }
  if (req.session.user.role !== "ADMIN") {
    return res.status(403).json({ message: "Accès refusé. Droits administrateur requis." });
  }
  next();
};
