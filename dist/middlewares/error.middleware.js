"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
const logger_1 = require("../utils/logger");
const errorHandler = (error, req, res, next) => {
    logger_1.logger.error(error.message);
    res.status(500).json(Object.assign({ message: "Internal Server Error" }, (process.env.NODE_ENV === "development" && { error: error.message })));
};
exports.errorHandler = errorHandler;
