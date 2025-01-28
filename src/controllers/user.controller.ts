import { Request, Response } from "express";
import { User_role } from "@prisma/client";
import { prisma } from "../config/db";

// Get all users except admins (Admin only)
export const getNonAdminUsers = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const users = await prisma.user.findMany({
      where: {
        NOT: {
          role: User_role.ADMIN,
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        gender: true,
        role: true,
        emailVerified: true,
        createdAt: true,
        CourseInstructor: {
          select: {
            Course: {
              select: {
                id: true,
                name: true,
                code: true,
              },
            },
          },
        },
      },
    });

    res.json({ users });
  } catch (error: any) {
    res.status(500).json({ message: "Error fetching users" });
  }
};
