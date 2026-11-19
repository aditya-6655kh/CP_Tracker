import { Router } from "express";
import { protect } from "../middlewares/auth.middleware";
import { fetchGoals, createGoal, updateGoal, deleteGoal } from "../controllers/goals.controller";

const router = Router();
router.use(protect);
router.get("/", fetchGoals);
router.post("/", createGoal);
router.patch("/:id", updateGoal);
router.delete("/:id", deleteGoal);
export default router;
