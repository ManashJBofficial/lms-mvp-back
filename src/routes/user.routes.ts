import { Router } from "express";
import { getNonAdminUsers } from "../controllers/user.controller";
import {
  authenticateToken,
  authorizeRoles,
} from "../middlewares/auth.middleware";
import { User_role } from "@prisma/client";

const router = Router();

// Protected route - only accessible by admin
router.get(
  "/",
  authenticateToken,
  authorizeRoles(User_role.ADMIN),
  getNonAdminUsers
);

export default router;
