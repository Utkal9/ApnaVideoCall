import { Router } from "express";
import {
    addToHistory,
    getUserHistory,
    login,
    register,
} from "../controllers/user.controller.js";
// 1. Import your middleware
import { authMiddleware } from "../middlewares/auth.middleware.js";

const router = Router();

// These routes are public
router.route("/login").post(login);
router.route("/register").post(register);

// 2. Apply the middleware to these routes
// This runs authMiddleware *before* the controller
router.route("/add_to_activity").post(authMiddleware, addToHistory);
router.route("/get_all_activity").get(authMiddleware, getUserHistory);

export default router;
