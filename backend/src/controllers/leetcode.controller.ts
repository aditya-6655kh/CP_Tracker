import { Response } from "express";
import { AuthRequest } from "../middlewares/auth.middleware";
import prisma from "../lib/prisma";
import {
  getLeetcodeStats,
  LeetcodeApiError,
} from "../services/leetcode.services";

export const fetchLeetcodeStats = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const profile = await prisma.profile.findUnique({
      where: { userId: req.userId! },
      select: { leetcodeHandle: true },
    });

    if (!profile?.leetcodeHandle) {
      res.status(400).json({
        success: false,
        message: "Leetcode handle not found in profile",
      });
      return;
    }

    const stats = await getLeetcodeStats(profile.leetcodeHandle);

    res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (err: any) {
    if (err instanceof LeetcodeApiError) {
      res.status(err.statusCode).json({
        success: false,
        message: err.message,
      });
      return;
    }

    console.error("fetchLeetcodeStats: ", err);
    res.status(500).json({
      success: false,
      message: "internal server error fetching leetcode stats",
    });
  }
};
