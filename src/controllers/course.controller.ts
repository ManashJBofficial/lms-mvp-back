import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { AuthRequest } from "../middlewares/auth.middleware";

const prisma = new PrismaClient();

// Create a new course (Admin only)
export const createCourse = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { name, description } = req.body;

    const code = `COURSE-${Math.random()
      .toString(36)
      .substr(2, 6)
      .toUpperCase()}`;

    const course = await prisma.course.create({
      data: {
        name,
        code,
        description,
      },
    });

    res.status(201).json({ course });
  } catch (error: any) {
    res.status(500).json({ message: "Error creating course" });
  }
};

// Get all courses
export const getCourses = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const courses = await prisma.course.findMany({
      where: { isDeleted: false },
      include: {
        CourseInstructor: {
          include: {
            User: {
              select: {
                id: true,
                name: true,
                email: true,
                gender: true,
              },
            },
          },
        },
        Notice: true,
      },
    });

    res.json({ courses });
  } catch (error: any) {
    res.status(500).json({ message: "Error fetching courses" });
  }
};

// Get course by ID
export const getCourseById = async (
  req: Request<{ id: string }>,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const course = await prisma.course.findUnique({
      where: { id, isDeleted: false },
      include: {
        CourseInstructor: {
          include: {
            User: {
              select: {
                id: true,
                name: true,
                email: true,
                gender: true,
              },
            },
          },
        },
        Notice: true,
      },
    });

    if (!course) {
      res.status(404).json({ message: "Course not found" });
      return;
    }

    res.json({ course });
  } catch (error: any) {
    res.status(500).json({ message: "Error fetching course" });
  }
};

// Update course (Admin only)
export const updateCourse = async (
  req: Request<{ id: string }, {}, { name: string; description: string }>,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    const course = await prisma.course.update({
      where: { id },
      data: { name, description },
    });

    res.json({ course });
  } catch (error: any) {
    res.status(500).json({ message: "Error updating course" });
  }
};

// Delete course (Admin only)
export const deleteCourse = async (
  req: Request<{ id: string }>,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    await prisma.course.update({
      where: { id },
      data: { isDeleted: true },
    });
    res.status(204).send();
  } catch (error: any) {
    res.status(500).json({ message: "Error deleting course" });
  }
};

// Add multiple instructors to course
export const addInstructor = async (
  req: Request<{}, {}, { courseId: string; userIds: string[] }>,
  res: Response
): Promise<void> => {
  try {
    const { courseId, userIds } = req.body;

    // Get current instructor assignments
    const currentInstructors = await prisma.courseInstructor.findMany({
      where: { courseId },
      select: { userId: true },
    });
    const currentInstructorIds = currentInstructors.map((i) => i.userId);

    // Calculate instructors to add and remove
    const instructorsToAdd = userIds.filter(
      (id) => !currentInstructorIds.includes(id)
    );
    const instructorsToRemove = currentInstructorIds.filter(
      (id) => !userIds.includes(id)
    );

    // Perform all database operations in a transaction
    await prisma.$transaction(async (tx) => {
      // Remove instructors that are no longer in the list
      if (instructorsToRemove.length > 0) {
        await tx.courseInstructor.deleteMany({
          where: {
            courseId,
            userId: { in: instructorsToRemove },
          },
        });
      }

      // Add new instructors
      if (instructorsToAdd.length > 0) {
        await tx.courseInstructor.createMany({
          data: instructorsToAdd.map((userId) => ({
            courseId,
            userId,
          })),
          skipDuplicates: true,
        });
      }
    });

    res.status(200).json({
      message: "Course instructors updated successfully",
    });
  } catch (error: any) {
    console.error("Error updating course instructors:", error);
    res.status(500).json({ message: "Error updating course instructors" });
  }
};

// Remove instructor from course
export const removeInstructor = async (
  req: Request<{}, {}, { courseId: string; userIds: string[] }>,
  res: Response
): Promise<void> => {
  try {
    const { courseId, userIds } = req.body;

    // Delete all instructor assignments in a single transaction
    await prisma.$transaction(
      userIds.map((userId: string) =>
        prisma.courseInstructor.delete({
          where: {
            courseId_userId: {
              courseId,
              userId,
            },
          },
        })
      )
    );

    res.status(204).send();
  } catch (error: any) {
    if (error.code === "P2025") {
      res.status(404).json({
        message: "One or more instructor assignments not found",
      });
      return;
    }
    res.status(500).json({ message: "Error removing instructors from course" });
  }
};

// Add instructor to course by course code
export const addInstructorByCode = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { code } = req.body;
    const userId = req.user?.id;

    if (!code) {
      res.status(400).json({ message: "Course code is required" });
      return;
    }

    if (!userId) {
      res.status(401).json({ message: "User not authenticated" });
      return;
    }

    // Find course by code
    const course = await prisma.course.findFirst({
      where: {
        code: code,
        isDeleted: false,
      },
    });

    if (!course) {
      res.status(404).json({ message: "Course not found" });
      return;
    }

    // Check if instructor is already assigned to the course
    const existingAssignment = await prisma.courseInstructor.findFirst({
      where: {
        courseId: course.id,
        userId: userId,
      },
    });

    if (existingAssignment) {
      res
        .status(400)
        .json({ message: "Instructor already assigned to this course" });
      return;
    }

    // Add instructor to course
    await prisma.courseInstructor.create({
      data: {
        courseId: course.id,
        userId: userId,
      },
    });

    res.status(200).json({
      message: "Successfully added as instructor to the course",
    });
  } catch (error: any) {
    console.error("Error adding instructor to course:", error);
    res.status(500).json({ message: "Error adding instructor to course" });
  }
};
