"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.protect = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const protect = (req, res, next) => {
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
        const decoded = jsonwebtoken_1.default.verify(token, secret, { algorithms: ["HS256"] });
        req.userId = decoded.userId;
        next();
    }
    catch (err) {
        console.error("JWT verification failed:", err);
        return res.status(401).json({ message: "Invalid token" });
    }
};
exports.protect = protect;
//# sourceMappingURL=auth.middleware.js.map