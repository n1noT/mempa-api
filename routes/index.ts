import { Router, Request, Response } from "express";
const router = Router();

router.head("/healthcheck", function (req: Request, res: Response, next: Function) {
  res.status(200).end();
});

export default router;
