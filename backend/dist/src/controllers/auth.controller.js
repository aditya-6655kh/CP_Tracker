"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Login = exports.Register = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma_1 = __importDefault(require("../lib/prisma"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const EMAIL_REGEX = /^\S+@\S+\.\S+$/;
const Register = async (req, res) => {
    try {
        const { name, email, password } = req.body;
        // Input validation
        if (!name || typeof name !== "string" || name.trim().length < 2) {
            return res.status(400).json({ message: "Name must be at least 2 characters long." });
        }
        if (!email || typeof email !== "string" || !EMAIL_REGEX.test(email)) {
            return res.status(400).json({ message: "A valid email address is required." });
        }
        if (!password || typeof password !== "string" || password.length < 8) {
            return res.status(400).json({ message: "Password must be at least 8 characters long." });
        }
        const existingUser = await prisma_1.default.user.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ message: "User already exists." });
        }
        const hashedPassword = await bcryptjs_1.default.hash(password, 10);
        const user = await prisma_1.default.user.create({
            data: {
                name: name.trim(),
                email: email.toLowerCase().trim(),
                password: hashedPassword,
            }
        });
        return res.status(201).json({
            id: user.id,
            email: user.email,
            name: user.name,
            message: "User registered successfully"
        });
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Internal server error" });
    }
};
exports.Register = Register;
const Login = async (req, res) => {
    try {
        const { email, password } = req.body;
        // Input validation
        if (!email || typeof email !== "string" || !EMAIL_REGEX.test(email)) {
            return res.status(400).json({ message: "A valid email address is required." });
        }
        if (!password || typeof password !== "string" || !password) {
            return res.status(400).json({ message: "Password is required." });
        }
        const user = await prisma_1.default.user.findUnique({ where: { email: email.toLowerCase().trim() } });
        if (!user) {
            return res.status(401).json({ message: "Invalid credentials" }); // generic error for security
        }
        const isPasswordValid = await bcryptjs_1.default.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: "Invalid credentials" });
        }
        const secret = process.env.JWT_SECRET;
        if (!secret) {
            console.error("JWT_SECRET environment variable is missing.");
            return res.status(500).json({ message: "Internal server error" });
        }
        const token = jsonwebtoken_1.default.sign({ userId: user.id }, secret, {
            expiresIn: "7d",
            algorithm: "HS256"
        });
        return res.status(200).json({
            id: user.id,
            email: user.email,
            name: user.name,
            token,
            message: "Login successful",
        });
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Internal server error" });
    }
};
exports.Login = Login;
//# sourceMappingURL=auth.controller.js.map