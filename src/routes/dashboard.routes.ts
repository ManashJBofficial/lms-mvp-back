import { Router } from "express";
import { getAdminDashboardStats } from "../controllers/dashboard.controller";
import {
  authenticateToken,
  authorizeRoles,
} from "../middlewares/auth.middleware";
import { User_role } from "@prisma/client";

const router = Router();

router.get(
  "/admin/stats",
  authenticateToken,
  authorizeRoles(User_role.ADMIN),
  getAdminDashboardStats
);

export default router;
