import { Router } from "express";
import { getProfile, upsertProfile } from "../controllers/profile.controller";
import { protect } from "../middlewares/auth.middleware";

const router = Router();
router.use(protect);

router.get("/", getProfile);
router.patch("/", upsertProfile);

export default router;