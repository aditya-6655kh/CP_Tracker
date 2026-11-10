"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchCodeForcesStats = void 0;
const prisma_1 = __importDefault(require("../lib/prisma"));
const codeforces_services_1 = require("../services/codeforces.services");
const fetchCodeForcesStats = async (req, res) => {
    try {
        if (!req.userId) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }
        const profile = await prisma_1.default.profile.findUnique({
            where: { userId: req.userId },
            select: { cfHandle: true },
        });
        if (!profile?.cfHandle) {
            res.status(400).json({ success: false, message: "No CF handle linked." });
            return;
        }
        const skipCache = req.query.refresh === "true";
        const { stats, cacheHit } = await (0, codeforces_services_1.getCodeForcesStats)(profile.cfHandle, skipCache);
        res.setHeader("Cache-Control", "no-store");
        res.setHeader("X-Cache", cacheHit ? "HIT" : "MISS");
        res.status(200).json({ success: true, data: stats });
    }
    catch (error) {
        if (error instanceof codeforces_services_1.CodeforcesApiError) {
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
exports.fetchCodeForcesStats = fetchCodeForcesStats;
//# sourceMappingURL=codeforces.controller.js.map