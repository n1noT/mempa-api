import { Router, Request, Response } from "express";
const router = Router();

/** 
 * Route pour vérifier si le serveur tourne.
 */
router.head("/healthcheck", function (req: Request, res: Response, next: Function) {
  res.status(200).end();
});

export default router;
