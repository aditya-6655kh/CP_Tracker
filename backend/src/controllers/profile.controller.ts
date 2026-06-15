import { Response } from "express";
import { AuthRequest } from "../middlewares/auth.middleware";
import prisma from "../lib/prisma";

const HANDLE_PATTERNS: Record<string, RegExp> = {
  cfHandle: /^[a-zA-Z0-9_-]{3,24}$/,
  leetcodeHandle: /^[a-zA-Z0-9_-]{3,25}$/,
  gfgHandle: /^[a-zA-Z0-9_.-]{3,30}$/,
};

function validateHandles(field: string, value: string): string | null {
  const pattern = HANDLE_PATTERNS[field];
  if (!pattern) return null;

  if (!pattern.test(value)) {
    return `Invalid format for ${field}. Only letters, numbers, underscores, and hyphens are allowed.`;
  }

  return null;
}

export const getProfile = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const profile = await prisma.profile.findUnique({
      where: { userId: userId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            createdAt: true,
          },
        },
      },
    });

    if (!profile) {
      res.status(404).json({ success: false, message: "Profile not found" });
      return;
    }

    res.status(200).json({ success: true, data: profile });
  } catch (err) {
    console.error("error in getProfile : ", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const upsertProfile = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const { cfHandle, leetcodeHandle, gfgHandle } = req.body;
    const allowedFields = { cfHandle, leetcodeHandle, gfgHandle };
    const userId = req.userId;

    if (!userId) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    const hasAtLeastOneField = Object.values(allowedFields).some(
      (value) => value !== undefined && value !== null,
    );
    if (!hasAtLeastOneField) {
      res
        .status(400)
        .json({
          success: false,
          message: "At least one handle must be provided",
        });
      return;
    }

    const validationErrors: string[] = [];

    for (const [field, value] of Object.entries(allowedFields)) {
      if (value !== undefined && value !== null && value !== "") {
        const error = validateHandles(field, value);
        if (error) validationErrors.push(error);
      }
    }

    if (validationErrors.length > 0) {
      res
        .status(400)
        .json({
          success: false,
          message: "validation failed ",
          data: validationErrors,
        });
      return;
    }

    const updateData: {
      cfHandle?: string | null;
      leetcodeHandle?: string | null;
      gfgHandle?: string | null;
    } = {};

    if (cfHandle !== undefined) updateData.cfHandle = cfHandle || null;
    if (leetcodeHandle !== undefined)
      updateData.leetcodeHandle = leetcodeHandle || null;
    if (gfgHandle !== undefined) updateData.gfgHandle = gfgHandle || null;

    const profile = await prisma.profile.upsert({
      where: { userId: userId },
      update: updateData,
      create: {
        userId: userId,
        ...updateData,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            createdAt: true,
          },
        },
      },
    });

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: profile,
    });
  } catch (err) {
    console.error("Error in upsertProfile: ", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};


