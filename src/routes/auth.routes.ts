import { Router } from "express";
import { login, register, getProfile } from "../controllers/auth.controller";
import {
  authenticateToken,
  authorizeRoles,
} from "../middlewares/auth.middleware";
import { User_role } from "@prisma/client";

const router = Router();

// Public routes
router.post("/register", register);
router.post("/login", login);

// Protected routes
router.get("/profile", authenticateToken, getProfile);
router.get(
  "/admin-only",
  authenticateToken,
  authorizeRoles(User_role.ADMIN),
  (req, res) => {
    res.json({ message: "Admin access granted" });
  }
);

export default router;
