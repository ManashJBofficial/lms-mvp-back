import { Request, Response } from "express";
import { prisma } from "../config/db";
import { AuthRequest } from "../middlewares/auth.middleware";

export const getAdminDashboardStats = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const totalCourses = await prisma.course.count({
      where: { isDeleted: false },
    });

    const courseInstructors = await prisma.courseInstructor.groupBy({
      by: ["courseId"],
      _count: {
        userId: true,
      },
    });

    const avgTeachersPerCourse =
      courseInstructors.length > 0
        ? courseInstructors.reduce((acc, curr) => acc + curr._count.userId, 0) /
          courseInstructors.length
        : 0;

    const teacherGenderSplit = await prisma.user.groupBy({
      by: ["gender"],
      where: {
        role: "INSTRUCTOR",
      },
      _count: {
        id: true,
      },
    });

    const noticeStats = await prisma.$transaction([
      prisma.notice.count(),
      prisma.noticeView.count(),
      prisma.response.count(),
    ]);

    const [totalNotices, totalViews, totalResponses] = noticeStats;

    const viewershipPercentage =
      totalNotices > 0 ? (totalViews / totalNotices) * 100 : 0;

    const responsePercentage =
      totalNotices > 0 ? (totalResponses / totalNotices) * 100 : 0;

    const genderSplit = {
      male: teacherGenderSplit.find((g) => g.gender === "MALE")?._count.id || 0,
      female:
        teacherGenderSplit.find((g) => g.gender === "FEMALE")?._count.id || 0,
    };

    const courseNoticeStats = await prisma.course.findMany({
      where: { isDeleted: false },
      select: {
        id: true,
        name: true,
        code: true,
        Notice: {
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
          take: 5,
        },
        CourseInstructor: {
          select: {
            User: {
              select: {
                gender: true,
              },
            },
          },
        },
      },
    });

    const formattedCourseStats = courseNoticeStats.map((course) => ({
      courseId: course.id,
      courseName: course.name,
      courseCode: course.code,
      instructorCount: course.CourseInstructor.length,
      genderSplit: {
        male: course.CourseInstructor.filter((i) => i.User.gender === "MALE")
          .length,
        female: course.CourseInstructor.filter(
          (i) => i.User.gender === "FEMALE"
        ).length,
      },
      recentNotices: course.Notice.map((notice) => ({
        id: notice.id,
        title: notice.title,
        createdAt: notice.createdAt,
        viewCount: notice._count.NoticeView,
        responseCount: notice._count.Response,
      })),
    }));

    res.json({
      statistics: {
        totalCourses,
        avgTeachersPerCourse: Number(avgTeachersPerCourse.toFixed(2)),
        teacherGenderSplit: genderSplit,
        noticeboardStats: {
          totalNotices,
          viewershipPercentage: Number(viewershipPercentage.toFixed(2)),
          responsePercentage: Number(responsePercentage.toFixed(2)),
        },
      },
      courseWiseStats: formattedCourseStats,
    });
  } catch (error) {
    console.error("Error fetching admin dashboard stats:", error);
    res.status(500).json({ message: "Error fetching dashboard statistics" });
  }
};
