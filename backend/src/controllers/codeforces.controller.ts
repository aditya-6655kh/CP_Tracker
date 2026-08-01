import { Response } from "express";
import { AuthRequest } from "../middlewares/auth.middleware";
import prisma from "../lib/prisma";
import {
  getCodeForcesStats,
  CodeforcesApiError,
} from "../services/codeforces.services";
import axios from "axios";

export const fetchCodeForcesStats = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const profile = await prisma.profile.findUnique({
      where: { userId: req.userId },
      select: { cfHandle: true },
    });

    if (!profile?.cfHandle) {
      res.status(400).json({ success: false, message: "No CF handle linked." });
      return;
    }

    const skipCache = req.query.refresh === "true";
    const { stats, cacheHit } = await getCodeForcesStats(profile.cfHandle, skipCache);
    res.setHeader("X-Cache", cacheHit ? "HIT" : "MISS");
    res.status(200).json({ success: true, data: stats });
  } catch (error) {
    if (error instanceof CodeforcesApiError) {
      res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
      return;
    }

    console.error("[fetchCodeforcesStats]", error);
    res.status(500).json({
      success: false,
      message: "Something went wrong. Please try again.",
    });
  }
};
