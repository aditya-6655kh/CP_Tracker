"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchLeetcodeStats = void 0;
const prisma_1 = __importDefault(require("../lib/prisma"));
const leetcode_services_1 = require("../services/leetcode.services");
const fetchLeetcodeStats = async (req, res) => {
    try {
        const profile = await prisma_1.default.profile.findUnique({
            where: { userId: req.userId },
            select: { leetcodeHandle: true },
        });
        if (!profile?.leetcodeHandle) {
            res.status(400).json({
                success: false,
                message: "Leetcode handle not found in profile",
            });
            return;
        }
        const skipCache = req.query.refresh === "true";
        const { stats, cacheHit } = await (0, leetcode_services_1.getLeetcodeStats)(profile.leetcodeHandle, skipCache);
        res.setHeader("Cache-Control", "no-store");
        res.setHeader("X-Cache", cacheHit ? "HIT" : "MISS");
        res.status(200).json({
            success: true,
            data: stats,
        });
    }
    catch (err) {
        if (err instanceof leetcode_services_1.LeetcodeApiError) {
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
exports.fetchLeetcodeStats = fetchLeetcodeStats;
//# sourceMappingURL=leetcode.controller.js.map