import express from "express";
import "dotenv/config";
import cors from "cors";
import winston from "winston";
import router from "./routes/index.js";

const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: "combined.log" }),
  ],
});
export function start() {
  logger.info("Starting server...");
  const app = express();
  app.use(cors());
  app.use(express.json());
  app.get("/", (req, res) => {
    res.send("API is running....");
    logger.info("Root endpoint hit.");
  });
  app.use("/api", router);

  // Error handling middleware
  app.use((err, req, res, next) => {
    logger.error(`Error: ${err.message}`, { stack: err.stack });
    res.status(500).send("Internal Server Error");
  });
  app.listen(process.env.PORT, () => {
    logger.info(`Server started with worker ${process.pid}`);
  });
}
