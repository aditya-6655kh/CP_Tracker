import { Request, Response } from "express";
import bcrypt from "bcryptjs"
import prisma from "../lib/prisma";
import jwt from "jsonwebtoken";

export const Register = async (req: Request, res:Response) => {
    try{
        const {name, email, password} = req.body;
        
        const existingUser = await prisma.user.findUnique({where: {email}});
        if(existingUser) {
            return res.status(400).json({message: "User already exists. "});
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await prisma.user.create({
            data:{
                name,
                email,
                password: hashedPassword,
                
            }
        });

        res.status(201).json({
            id: user.id,
            email: user.email, 
            name: user.name,
            message: "user registered successfully"
        });
    }catch(err){
        console.log(err);
        return res.status(500).json({message: "Internal server error"});
    }
};

export const Login = async (req: Request, res: Response) => {
    try{
        const {email, password} = req.body;

        const user = await prisma.user.findUnique({where: {email}});
        if (!user) {
            return res.status(404).json({message: "User not found"});
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({message: "Invalid credentials"});
        }

        const token = jwt.sign({userId: user.id}, process.env.JWT_SECRET!, {expiresIn: "7d"});

        return res.status(200).json({
            id: user.id,
            email: user.email,
            name: user.name,
            token,
            message: "Login successful",
        });
    }catch(err){
        console.log(err);
        return res.status(500).json({message: "Internal server error"});
    }
};