import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import prisma from "../lib/prisma";

export interface AuthRequest extends Request {
    userId?: string;
}

export const protect = (req: AuthRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if(!authHeader){
        return res.status(401).json({message: "Authorization header is missing"});
    }

    const token = authHeader.split(" ")[1];
    if(!token){
        return res.status(401).json({message: "Invalid token"});
    }

    try{
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {userId : string};
        req.userId = decoded.userId;
        next();
    }catch(err){
        console.log(err);
        return res.status(401).json({message: "Invalid token"});
    }
};