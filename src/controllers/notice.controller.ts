import { Request, Response } from "express";
import { prisma } from "../config/db";
import { AuthRequest } from "../middlewares/auth.middleware";

// Get all notices for admin
export const getAllNotices = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const notices = await prisma.notice.findMany({
      include: {
        Course: true,
        User: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        Response: {
          include: {
            User: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        _count: {
          select: {
            NoticeView: true,
          },
        },
      },
    });

    res.json({ notices });
  } catch (error) {
    res.status(500).json({ message: "Error fetching notices" });
  }
};

// Get notices for a specific course
export const getCourseNotices = async (
  req: Request<{ courseId: string }>,
  res: Response
): Promise<void> => {
  try {
    const { courseId } = req.params;

    const notices = await prisma.notice.findMany({
      where: { courseId },
      include: {
        User: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        Response: {
          include: {
            User: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        NoticeView: {
          select: {
            userId: true,
          },
        },
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
    });

    const formattedNotices = notices.map((notice) => ({
      ...notice,
      viewCount: notice._count.NoticeView,
      responseCount: notice._count.Response,
    }));

    res.json({ notices: formattedNotices });
  } catch (error) {
    res.status(500).json({ message: "Error fetching course notices" });
  }
};

// Get specific notice with responses
export const getNoticeDetails = async (
  req: Request<{ courseId: string; noticeId: string }>,
  res: Response
): Promise<void> => {
  try {
    const { noticeId } = req.params;

    const notice = await prisma.notice.findUnique({
      where: { id: noticeId },
      include: {
        User: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        Response: {
          include: {
            User: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
          orderBy: {
            createdAt: "asc",
          },
        },
        NoticeView: {
          select: {
            userId: true,
          },
        },
        _count: {
          select: {
            NoticeView: true,
            Response: true,
          },
        },
      },
    });

    if (!notice) {
      res.status(404).json({ message: "Notice not found" });
      return;
    }

    const formattedNotice = {
      ...notice,
      viewCount: notice._count.NoticeView,
      responseCount: notice._count.Response,
      NoticeView: undefined,
    };

    res.json({ notice: formattedNotice });
  } catch (error) {
    res.status(500).json({ message: "Error fetching notice details" });
  }
};

// Create new notice (Admin only)
export const createNotice = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { courseId } = req.params;
    const { title, content } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const notice = await prisma.notice.create({
      data: {
        title,
        content,
        courseId,
        postedById: userId,
      },
      include: {
        User: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    res.status(201).json({ notice });
  } catch (error) {
    res.status(500).json({ message: "Error creating notice" });
  }
};

// Add response to notice
export const addResponse = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { noticeId } = req.params;
    const { content } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const notice = await prisma.notice.findUnique({
      where: { id: noticeId },
      include: {
        Course: {
          include: {
            CourseInstructor: true,
          },
        },
      },
    });

    if (!notice) {
      res.status(404).json({ message: "Notice not found" });
      return;
    }

    const isInstructor = notice.Course.CourseInstructor.some(
      (instructor) => instructor.userId === userId
    );
    const isAdmin = req.user?.role === "ADMIN";

    if (!isInstructor && !isAdmin) {
      res.status(403).json({ message: "Not authorized to respond" });
      return;
    }

    const response = await prisma.response.create({
      data: {
        content,
        noticeId,
        userId,
      },
      include: {
        User: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    res.status(201).json({ response });
  } catch (error) {
    res.status(500).json({ message: "Error adding response" });
  }
};

// Get notices for instructor's courses
export const getInstructorCourseNotices = async (
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
      select: {
        courseId: true,
      },
    });

    const courseIds = instructorCourses.map((course) => course.courseId);

    const notices = await prisma.notice.findMany({
      where: {
        courseId: {
          in: courseIds,
        },
      },
      include: {
        Course: {
          select: {
            id: true,
            name: true,
            code: true,
            CourseInstructor: {
              select: {
                userId: true,
              },
            },
          },
        },
        User: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        Response: {
          include: {
            User: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        },
        NoticeView: {
          select: {
            userId: true,
          },
        },
        _count: {
          select: {
            Response: true,
            NoticeView: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const noticesByCourse = notices.reduce((acc, notice) => {
      const courseId = notice.Course.id;
      const instructorIds = notice.Course.CourseInstructor.map(
        (instructor) => instructor.userId
      );

      const instructorViews = notice.NoticeView.filter((view) =>
        instructorIds.includes(view.userId)
      ).length;

      if (!acc[courseId]) {
        acc[courseId] = {
          courseInfo: {
            id: notice.Course.id,
            name: notice.Course.name,
            code: notice.Course.code,
            viewCount: instructorViews,
          },
          notices: [],
        };
      }

      acc[courseId].notices.push({
        ...notice,
        isViewed: notice.NoticeView.some((view) => view.userId === userId),
        responseCount: notice._count.Response,
        viewCount: notice._count.NoticeView,
      });
      return acc;
    }, {} as Record<string, { courseInfo: any; notices: any[] }>);

    res.json({ courses: Object.values(noticesByCourse) });
  } catch (error) {
    console.error("Error fetching instructor notices:", error);
    res.status(500).json({ message: "Error fetching instructor notices" });
  }
};

// Track notice views
export const markNoticeAsViewed = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { noticeId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    await prisma.noticeView.upsert({
      where: {
        userId_noticeId: {
          userId,
          noticeId,
        },
      },
      update: {},
      create: {
        userId,
        noticeId,
      },
    });

    res.status(200).json({ message: "Notice marked as viewed" });
  } catch (error) {
    console.error("Error marking notice as viewed:", error);
    res.status(500).json({ message: "Error marking notice as viewed" });
  }
};

// Get instructor's course notice boards with all replies
export const getInstructorNoticeBoards = async (
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
          include: {
            Notice: {
              include: {
                User: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                  },
                },
                Response: {
                  include: {
                    User: {
                      select: {
                        id: true,
                        name: true,
                        email: true,
                        role: true,
                      },
                    },
                  },
                  orderBy: {
                    createdAt: "asc",
                  },
                },
                NoticeView: {
                  include: {
                    User: {
                      select: {
                        role: true,
                      },
                    },
                  },
                },
                _count: {
                  select: {
                    Response: true,
                    NoticeView: true,
                  },
                },
              },
              orderBy: {
                createdAt: "desc",
              },
            },
            CourseInstructor: {
              include: {
                User: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    const noticeBoards = instructorCourses.map(({ Course }) => ({
      courseId: Course.id,
      courseName: Course.name,
      courseCode: Course.code,
      instructors: Course.CourseInstructor.map(({ User }) => ({
        id: User.id,
        name: User.name,
        email: User.email,
      })),
      notices: Course.Notice.map((notice) => ({
        id: notice.id,
        title: notice.title,
        content: notice.content,
        createdAt: notice.createdAt,
        postedBy: notice.User,
        isViewed: notice.NoticeView.length > 0,
        responseCount: notice._count.Response,
        responses: notice.Response.map((response) => ({
          id: response.id,
          content: response.content,
          createdAt: response.createdAt,
          user: response.User,
        })),
        viewCount: notice.NoticeView.filter(
          (view) => view.User.role !== "ADMIN"
        ).length,
      })),
    }));

    res.json({ noticeBoards });
  } catch (error) {
    console.error("Error fetching instructor notice boards:", error);
    res.status(500).json({ message: "Error fetching notice boards" });
  }
};

// Get unread notices count for instructor
export const getUnreadNoticesCount = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ unreadCount: 0 });
      return;
    }

    // Get instructor's courses
    const instructorCourses = await prisma.courseInstructor.findMany({
      where: {
        userId: userId,
        Course: {
          isDeleted: false,
        },
      },
      select: {
        courseId: true,
      },
    });

    if (instructorCourses.length === 0) {
      res.json({ unreadCount: 0 });
      return;
    }

    const courseIds = instructorCourses.map((course) => course.courseId);

    const unreadCount = await prisma.notice.count({
      where: {
        AND: [
          {
            courseId: {
              in: courseIds,
            },
          },
          {
            NoticeView: {
              none: {
                userId: userId,
              },
            },
          },
        ],
      },
    });

    res.json({ unreadCount });
  } catch (error) {
    console.error("Error in getUnreadNoticesCount:", error);
    res.status(500).json({ unreadCount: 0 });
  }
};
