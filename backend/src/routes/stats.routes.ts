import { Router } from "express";
import { fetchCodeForcesStats } from "../controllers/codeforces.controller";
import { protect } from "../middlewares/auth.middleware";

const router = Router();

router.use(protect);

router.get("/codeforces", fetchCodeForcesStats);

export default router;
