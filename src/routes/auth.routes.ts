import express from "express";
import {
  forgotPassword,
  loginUserHandler,
  registerUserHandler,
  resetPassword,
  verifyOtp,
} from "../controllers/auth.controller";
import { validate } from "../middleware/validate";
import {
  createUserSchema,
  loginUserSchema,
} from "../schemas/user.schema";
import { requireUser } from "../middleware";

const router = express.Router();

// Register a new user
router.post("/register", validate(createUserSchema), registerUserHandler);

// Authenticate user and return access token
router.post("/login", validate(loginUserSchema), loginUserHandler);

// Send OTP to user's email or phone
router.post("/forgot-password", forgotPassword);

// Verify OTP for authentication or password reset
router.post("/verify-otp", verifyOtp);

// Reset user password using verified OTP
router.post("/reset-password", resetPassword);

export default router;
