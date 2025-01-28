"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../lib/auth");
const router = (0, express_1.Router)();
// Debug middleware
router.use((req, res, next) => {
    console.log("Auth routes middleware:", {
        method: req.method,
        url: req.url,
        path: req.path,
        body: req.body,
    });
    next();
});
// The route will be accessible at /api/auth/register
router.post("/register", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log("Register endpoint hit with body:", req.body);
    try {
        const { name, email, password } = req.body;
        if (!email || !password || !name) {
            return res.status(400).json({
                message: "Missing required fields",
            });
        }
        const user = yield auth_1.auth.api.signUpEmail({
            body: {
                name: name,
                email: email,
                password: password,
            },
            metadata: {
                role: "INSTRUCTOR",
            },
        });
        res.status(201).json({
            message: "User registered successfully",
            user: {
                id: user.user.id,
                email: user.user.email,
            },
        });
    }
    catch (error) {
        console.error("Registration error:", error);
        if (error.code === "P2002") {
            return res.status(400).json({
                message: "Email already exists",
            });
        }
        return res.status(500).json({
            message: "Something went wrong during registration",
        });
    }
}));
// Add other auth routes as needed
// router.post("/login", ...);
// router.post("/logout", ...);
exports.default = router;
