import { Request, Response } from "express";
import { AuthRequest } from "../middlewares/auth.middleware";
import multer from "multer";
import * as XLSX from "xlsx";
import { prisma } from "../config/db";
import bcrypt from "bcryptjs";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (
      file.mimetype === "application/vnd.ms-excel" ||
      file.mimetype ===
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
      file.mimetype === "text/csv"
    ) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type. Only Excel and CSV files are allowed."));
    }
  },
}).single("file");

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
      orderBy: {
        createdAt: "desc",
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

export const addInstructor = async (
  req: Request<{}, {}, { courseId: string; userIds: string[] }>,
  res: Response
): Promise<void> => {
  try {
    const { courseId, userIds } = req.body;

    const currentInstructors = await prisma.courseInstructor.findMany({
      where: { courseId },
      select: { userId: true },
    });
    const currentInstructorIds = currentInstructors.map((i) => i.userId);

    const instructorsToAdd = userIds.filter(
      (id) => !currentInstructorIds.includes(id)
    );
    const instructorsToRemove = currentInstructorIds.filter(
      (id) => !userIds.includes(id)
    );

    await prisma.$transaction(async (tx) => {
      if (instructorsToRemove.length > 0) {
        await tx.courseInstructor.deleteMany({
          where: {
            courseId,
            userId: { in: instructorsToRemove },
          },
        });
      }

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

export const getInstructorCourseDetails = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const instructorCourses = await prisma.courseInstructor.findMany({
      where: {
        userId: userId,
        Course: {
          isDeleted: false,
        },
      },
      include: {
        Course: {
          select: {
            id: true,
            name: true,
            code: true,
            Notice: {
              where: {
                NoticeView: {
                  none: {
                    userId: userId,
                  },
                },
              },
              select: {
                id: true,
                title: true,
                createdAt: true,
                _count: {
                  select: {
                    NoticeView: true,
                    Response: true,
                  },
                },
              },
              orderBy: {
                createdAt: "desc",
              },
            },
          },
        },
      },
    });

    const courseDetails = instructorCourses.map(({ Course }) => ({
      id: Course.id,
      name: Course.name,
      code: Course.code,
      activeNotices: Course.Notice.map((notice) => ({
        id: notice.id,
        title: notice.title,
        createdAt: notice.createdAt,
        viewCount: notice._count.NoticeView,
        responseCount: notice._count.Response,
      })),
    }));

    res.json({ courses: courseDetails });
  } catch (error) {
    console.error("Error fetching instructor course details:", error);
    res.status(500).json({ message: "Error fetching course details" });
  }
};

// Add teachers from Excel/CSV file
export const addTeachersFromFile = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    if (!process.env.DEFAULT_PASSWORD) {
      throw new Error("DEFAULT_PASSWORD environment variable is not set");
    }

    const hashedPassword = await bcrypt.hash(process.env.DEFAULT_PASSWORD, 10);

    upload(req, res, async (err) => {
      if (err) {
        res.status(400).json({ message: err.message });
        return;
      }

      if (!req.file) {
        res.status(400).json({ message: "No file uploaded" });
        return;
      }

      try {
        const workbook = XLSX.read(req.file.buffer);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(worksheet);

        const results = {
          success: 0,
          failed: 0,
          errors: [] as string[],
        };

        for (const row of data) {
          const email = (row as any).email || (row as any).Email;
          const name = (row as any).name || (row as any).Name;
          const courseCode = (row as any).courseCode || (row as any).CourseCode;

          if (!email || !courseCode) {
            results.failed++;
            results.errors.push(
              `Missing email or course code for row: ${JSON.stringify(row)}`
            );
            continue;
          }

          try {
            const course = await prisma.course.findUnique({
              where: { code: courseCode, isDeleted: false },
            });

            if (!course) {
              results.failed++;
              results.errors.push(`Course not found with code: ${courseCode}`);
              continue;
            }

            const user = await prisma.user.upsert({
              where: { email },
              update: {},
              create: {
                email,
                name: name || email.split("@")[0],
                password: hashedPassword,
                gender: "MALE",
                role: "INSTRUCTOR",
              },
            });

            await prisma.courseInstructor.upsert({
              where: {
                courseId_userId: {
                  courseId: course.id,
                  userId: user.id,
                },
              },
              update: {},
              create: {
                courseId: course.id,
                userId: user.id,
              },
            });

            results.success++;
          } catch (error) {
            results.failed++;
            results.errors.push(
              `Error processing ${email}: ${(error as Error).message}`
            );
          }
        }

        res.json({
          message: "File processed successfully",
          results,
        });
      } catch (error) {
        res.status(500).json({
          message: "Error processing file",
          error: (error as Error).message,
        });
      }
    });
  } catch (error) {
    res.status(500).json({ message: "Error processing request" });
  }
};
