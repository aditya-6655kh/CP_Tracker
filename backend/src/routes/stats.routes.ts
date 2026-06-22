import { Router } from "express";
import { fetchCodeForcesStats } from "../controllers/codeforces.controller";
import { protect } from "../middlewares/auth.middleware";
import { fetchLeetcodeStats } from "../controllers/leetcode.controller";

const router = Router();

router.use(protect);

router.get("/codeforces", fetchCodeForcesStats);
router.get("/leetcode", fetchLeetcodeStats);

export default router;
