import type { Response } from "express";
import type { AuthRequest } from "../middlewares/auth.middleware";
import * as goals from "../services/goals.service";

function handler(action: (req: AuthRequest, userId: string, res: Response) => Promise<void>) {
  return async (req: AuthRequest, res: Response): Promise<void> => {
    if (!req.userId) { res.status(401).json({ success: false, message: "Unauthorized" }); return; }
    res.setHeader("Cache-Control", "no-store");
    try { await action(req, req.userId, res); }
    catch (error) {
      if (error instanceof goals.GoalError) {
        res.status(error.statusCode).json({ success: false, message: error.message });
      } else {
        console.error("[goals]", error);
        res.status(500).json({ success: false, message: "Could not update or load goals. Please try again." });
      }
    }
  };
}

export const fetchGoals = handler(async (req, userId, res) => {
  res.json({ success: true, data: await goals.listGoals(userId, req.query.refresh === "true") });
});
export const createGoal = handler(async (req, userId, res) => {
  res.status(201).json({ success: true, data: await goals.createGoal(userId, req.body) });
});
export const updateGoal = handler(async (req, userId, res) => {
  res.json({ success: true, data: await goals.updateGoal(userId, String(req.params.id), req.body) });
});
export const deleteGoal = handler(async (req, userId, res) => {
  await goals.deleteGoal(userId, String(req.params.id));
  res.status(204).end();
});
