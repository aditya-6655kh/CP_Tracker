import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export interface AuthRequest extends Request {
    userId?: string;
}

export const protect = (req: AuthRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ message: "Authorization header is missing" });
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
        return res.status(401).json({ message: "Invalid token" });
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
        console.error("JWT_SECRET environment variable is not configured.");
        return res.status(500).json({ message: "Internal server error" });
    }

    try {
        const decoded = jwt.verify(token, secret, { algorithms: ["HS256"] }) as { userId: string };
        req.userId = decoded.userId;
        next();
    } catch (err) {
        console.error("JWT verification failed:", err);
        return res.status(401).json({ message: "Invalid token" });
    }
};