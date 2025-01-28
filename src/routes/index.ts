import { Router } from "express";
import authRoutes from "./auth.routes";
import courseRoutes from "./course.routes";
import userRoutes from "./user.routes";

const router = Router();

router.get("/", (req, res) => {
  res.send("Hello World");
});

router.use("/auth", authRoutes);
router.use("/courses", courseRoutes);
router.use("/users", userRoutes);

export default router;
