"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const index_1 = require("./config/index");
const logger_1 = require("./utils/logger");
const error_middleware_1 = require("./middlewares/error.middleware");
const index_2 = __importDefault(require("./routes/index"));
const app = (0, express_1.default)();
// Middleware
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Routes
app.use("/api", index_2.default);
// Health check
app.get("/health", (req, res) => {
    res.status(200).json({ status: "OK" });
});
// Error handling
app.use(error_middleware_1.errorHandler);
// Handle 404
app.use((req, res) => {
    res.status(404).json({ message: "Not Found" });
});
const PORT = index_1.config.port || 5000;
app.listen(PORT, () => {
    logger_1.logger.info(`Server is running on port ${PORT}`);
});
exports.default = app;
