import { Router } from "express";
import {
  getAllNotices,
  getCourseNotices,
  getNoticeDetails,
  createNotice,
  addResponse,
  markNoticeAsViewed,
  getInstructorNoticeBoards,
  getUnreadNoticesCount,
} from "../controllers/notice.controller";
import {
  authenticateToken,
  authorizeRoles,
} from "../middlewares/auth.middleware";
import { User_role } from "@prisma/client";

const router = Router();

// Admin routes
router.get(
  "/admin",
  authenticateToken,
  authorizeRoles(User_role.ADMIN),
  getAllNotices
);

router.post(
  "/admin/:courseId/new",
  authenticateToken,
  authorizeRoles(User_role.ADMIN),
  createNotice
);

router.get(
  "/instructor/noticeboards",
  authenticateToken,
  authorizeRoles(User_role.INSTRUCTOR),
  getInstructorNoticeBoards
);

router.get("/unread-count", authenticateToken, getUnreadNoticesCount);

router.get("/:courseId", authenticateToken, getCourseNotices);
router.get("/:courseId/:noticeId", authenticateToken, getNoticeDetails);
router.post("/:noticeId/reply", authenticateToken, addResponse);
router.post("/:noticeId/view", authenticateToken, markNoticeAsViewed);

export default router;
