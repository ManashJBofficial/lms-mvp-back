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
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Middleware
app.use(helmet());
app.use(express.json());

// Routes
app.use("/api", routes);

// Health check
app.get("/health", (req: Request, res: Response) => {
  res.status(200).json({ status: "OK" });
});

// Error handling
app.use(errorHandler);

// Handle 404
app.use((req: Request, res: Response) => {
  res.status(404).json({ message: "Not Found" });
});

const PORT = config.port || 5000;

app.listen(PORT, () => {
  logger.info(`Server is running on port ${PORT}`);
});

export default app;
