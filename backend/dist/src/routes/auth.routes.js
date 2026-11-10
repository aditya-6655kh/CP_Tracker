"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMe = void 0;
const auth_middleware_1 = require("../middlewares/auth.middleware");
const express_1 = require("express");
const prisma_1 = __importDefault(require("../lib/prisma"));
const auth_controller_1 = require("../controllers/auth.controller");
const getMe = async (req, res) => {
    try {
        if (!req.userId) {
            return res.status(401).json({ message: "Unauthorized access" });
        }
        const user = await prisma_1.default.user.findUnique({ where: { id: req.userId } });
        if (!user) {
            return res.status(401).json({ message: "User not found or unauthorized" });
        }
        return res.json({
            id: user.id,
            email: user.email,
            name: user.name,
        });
    }
    catch (err) {
        console.error("Error in getMe endpoint:", err);
        return res.status(500).json({ message: "Internal server error" });
    }
};
exports.getMe = getMe;
const router = (0, express_1.Router)();
router.post("/register", auth_controller_1.Register);
router.post("/login", auth_controller_1.Login);
router.get("/me", auth_middleware_1.protect, exports.getMe);
exports.default = router;
//# sourceMappingURL=auth.routes.js.map