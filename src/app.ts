import express, { Application, Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import { config } from "./config/index";
import { logger } from "./utils/logger";
import { errorHandler } from "./middlewares/error.middleware";
import routes from "./routes/index";

const app: Application = express();

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(helmet());
app.use(express.json());

app.use("/api", routes);

app.get("/health", (req: Request, res: Response) => {
  res.status(200).json({ status: "OK" });
});

app.use(errorHandler);

app.use((req: Request, res: Response) => {
  res.status(404).json({ message: "Not Found" });
});

const PORT = config.port || 5000;

app.listen(PORT, () => {
  logger.info(`Server is running on port ${PORT}`);
});

export default app;
