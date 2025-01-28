import { Request, Response } from "express";
import { prisma } from "../config/db";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { config } from "../config";
import { AuthRequest } from "../middlewares/auth.middleware";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, gender, email, password, role } = req.body;

    if (!name || !email || !password) {
      res.status(400).json({ message: "Missing required fields" });
      return;
    }

    if (role && !["ADMIN", "INSTRUCTOR"].includes(role)) {
      res.status(400).json({ message: "Invalid role" });
      return;
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      res.status(400).json({ message: "Email already registered" });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        name: name,
        gender: gender,
        email: email,
        password: hashedPassword,
        role: role || "INSTRUCTOR",
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });
    res.status(201).json({ user });
    return;
  } catch (error) {
    if (error instanceof PrismaClientKnownRequestError) {
      switch (error.code) {
        case "P2002":
          res.status(400).json({
            message: "A user with this email already exists",
            code: error.code,
          });
          break;
        case "P2000":
          res.status(400).json({
            message: "Input data is invalid",
            code: error.code,
          });
          break;
        default:
          res.status(500).json({
            message: "Database error",
            code: error.code,
          });
      }
      return;
    }
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  let statusCode = 200;
  let responseData: any = {};

  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      statusCode = 401;
      responseData = { message: "Invalid credentials" };
    } else {
      const isPasswordValid = await bcrypt.compare(password, user.password);

      if (!isPasswordValid) {
        statusCode = 401;
        responseData = { message: "Invalid credentials" };
      } else {
        const token = jwt.sign(
          { id: user.id, email: user.email, role: user.role },
          config.jwtSecret as string,
          { expiresIn: "1d" }
        );

        responseData = {
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
          },
          token,
        };
      }
    }

    res.status(statusCode).json(responseData);
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ message: "Error logging in" });
  }
};

export const getProfile = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user?.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        emailVerified: true,
        CourseInstructor: true,
      },
    });

    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    res.json({ user });
  } catch (error) {
    res.status(500).json({ message: "Error fetching profile" });
  }
};
