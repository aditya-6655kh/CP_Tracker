"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.upsertProfile = exports.getProfile = void 0;
const prisma_1 = __importDefault(require("../lib/prisma"));
const HANDLE_PATTERNS = {
    cfHandle: /^[a-zA-Z0-9_-]{3,24}$/,
    leetcodeHandle: /^[a-zA-Z0-9_-]{3,25}$/,
    gfgHandle: /^[a-zA-Z0-9_.-]{3,30}$/,
};
function validateHandles(field, value) {
    const pattern = HANDLE_PATTERNS[field];
    if (!pattern)
        return null;
    if (!pattern.test(value)) {
        return `Invalid format for ${field}. Only letters, numbers, underscores, and hyphens are allowed.`;
    }
    return null;
}
const getProfile = async (req, res) => {
    try {
        const userId = req.userId;
        if (!userId) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }
        const profile = await prisma_1.default.profile.findUnique({
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
    }
    catch (err) {
        console.error("error in getProfile : ", err);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};
exports.getProfile = getProfile;
const upsertProfile = async (req, res) => {
    try {
        const { cfHandle, leetcodeHandle, gfgHandle } = req.body;
        const allowedFields = { cfHandle, leetcodeHandle, gfgHandle };
        const userId = req.userId;
        if (!userId) {
            res.status(401).json({ success: false, message: "Unauthorized" });
            return;
        }
        const hasAtLeastOneField = Object.values(allowedFields).some((value) => value !== undefined && value !== null);
        if (!hasAtLeastOneField) {
            res
                .status(400)
                .json({
                success: false,
                message: "At least one handle must be provided",
            });
            return;
        }
        const validationErrors = [];
        for (const [field, value] of Object.entries(allowedFields)) {
            if (value !== undefined && value !== null && value !== "") {
                const error = validateHandles(field, value);
                if (error)
                    validationErrors.push(error);
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
        const updateData = {};
        if (cfHandle !== undefined)
            updateData.cfHandle = cfHandle || null;
        if (leetcodeHandle !== undefined)
            updateData.leetcodeHandle = leetcodeHandle || null;
        if (gfgHandle !== undefined)
            updateData.gfgHandle = gfgHandle || null;
        const profile = await prisma_1.default.profile.upsert({
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
    }
    catch (err) {
        console.error("Error in upsertProfile: ", err);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};
exports.upsertProfile = upsertProfile;
//# sourceMappingURL=profile.controller.js.map