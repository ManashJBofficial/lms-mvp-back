import { Router } from "express";
import {
  createCourse,
  getCourses,
  getCourseById,
  updateCourse,
  deleteCourse,
  addInstructor,
  removeInstructor,
  addInstructorByCode,
  getInstructorCourseDetails,
  addTeachersFromFile,
} from "../controllers/course.controller";
import {
  authenticateToken,
  authorizeRoles,
} from "../middlewares/auth.middleware";
import { User_role } from "@prisma/client";

const router = Router();

// Public routes
router.get("/", getCourses);
router.get("/:id", getCourseById);

// Admin only routes
router.post(
  "/",
  authenticateToken,
  authorizeRoles(User_role.ADMIN),
  createCourse
);
router.put(
  "/:id",
  authenticateToken,
  authorizeRoles(User_role.ADMIN),
  updateCourse
);
router.delete(
  "/:id",
  authenticateToken,
  authorizeRoles(User_role.ADMIN),
  deleteCourse
);

router.get(
  "/instructor/details",
  authenticateToken,
  authorizeRoles(User_role.INSTRUCTOR),
  getInstructorCourseDetails
);

// Instructor management routes (Admin only)
router.post(
  "/instructor",
  authenticateToken,
  authorizeRoles(User_role.ADMIN),
  addInstructor
);
router.delete(
  "/instructor",
  authenticateToken,
  authorizeRoles(User_role.ADMIN),
  removeInstructor
);

router.post(
  "/join",
  authenticateToken,
  authorizeRoles(User_role.INSTRUCTOR),
  addInstructorByCode
);

router.post(
  "/upload-teachers",
  authenticateToken,
  authorizeRoles(User_role.ADMIN),
  addTeachersFromFile
);

export default router;
