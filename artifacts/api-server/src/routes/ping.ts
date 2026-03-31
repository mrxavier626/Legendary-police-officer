import { Router, type IRouter } from "express";

const router: IRouter = Router();

router.get("/ping", (_req, res) => {
  res.json({ status: "alive", timestamp: new Date().toISOString() });
});

export default router;
