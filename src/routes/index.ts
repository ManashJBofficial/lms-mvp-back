import { Router } from "express";
import authRoutes from "./auth.routes";
import courseRoutes from "./course.routes";
import userRoutes from "./user.routes";
import noticeRoutes from "./notice.routes";
import dashboardRoutes from "./dashboard.routes";

const router = Router();

router.get("/", (req, res) => {
  res.send("Hello World");
});

router.use("/auth", authRoutes);
router.use("/courses", courseRoutes);
router.use("/users", userRoutes);
router.use("/notices", noticeRoutes);
router.use("/dashboard", dashboardRoutes);

export default router;
