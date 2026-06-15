import { AuthRequest, protect } from "../middlewares/auth.middleware";
import { Response, Router } from "express";
import prisma from "../lib/prisma";
import { Register, Login } from "../controllers/auth.controller";

export const getMe = async (req: AuthRequest, res: Response) => {
    try {
        if (!req.userId) {
            return res.status(401).json({ message: "Unauthorized access" });
        }

        const user = await prisma.user.findUnique({ where: { id: req.userId } });
        if (!user) {
            return res.status(401).json({ message: "User not found or unauthorized" });
        }

        return res.json({
            id: user.id,
            email: user.email,
            name: user.name,
        });
    } catch (err) {
        console.error("Error in getMe endpoint:", err);
        return res.status(500).json({ message: "Internal server error" });
    }
};

const router = Router();
router.post("/register", Register);
router.post("/login", Login);
router.get("/me", protect, getMe);

export default router;