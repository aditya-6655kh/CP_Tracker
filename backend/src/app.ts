import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import morgan from "morgan";
import prisma from "./lib/prisma"
import authRoutes from './routes/auth.routes'


dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

app.use('/api/auth', authRoutes);

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "backend running" });
});
app.get("/api/test", async (req, res) => {
    const users = await prisma.user.findMany();
    res.json(users);
});

export default app;