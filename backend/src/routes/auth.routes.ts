import { AuthRequest, protect } from "../middlewares/auth.middleware";
import { Response, Router } from "express";
import prisma from "../lib/prisma";
import { Register, Login } from "../controllers/auth.controller";

export const getMe = async (req: AuthRequest, res: Response) => {
    const user = await prisma.user.findUnique({where: {id: req.userId!}});
    res.json({
        id: user?.id,
        email: user?.email,
        name: user?.name,
        
    });
};

const router = Router();
router.post("/register", Register);
router.post("/login", Login);
router.get("/me", protect, getMe);

export default router;