import express from "express";
import {
  loginUserHandler,
  logoutHandler,
  refreshAccessTokenHandler,
  registerUserHandler,
  resetPassword,
  sendOtp,
  verifyEmailHandler,
  verifyOtp,
  verifyUserByEmailHandler,
} from "../controllers/auth.controller";
import { deserializeUser } from "../middleware/deserializeUser";
import { requireUser } from "../middleware/requireUser";
import { validate } from "../middleware/validate";
import {
  createUserSchema,
  loginUserSchema,
  verifyEmailSchema,
} from "../schemas/user.schema";

const router = express.Router();

// Register a new user
router.post("/register", validate(createUserSchema), registerUserHandler);

// Authenticate user and return access token
router.post("/login", validate(loginUserSchema), loginUserHandler);

// Send OTP to user's email or phone
router.post("/sendOTP", sendOtp);

// Verify OTP for authentication or password reset
router.post("/verifyOTP", verifyOtp);

// Reset user password using verified OTP
router.post("/resetPassword", resetPassword);

// Verify user by email (Development only)
router.post("/verifyByEmail", verifyUserByEmailHandler);

// Verify user email using verification code
router.get(
  "/verifyEmail/:verificationCode",
  validate(verifyEmailSchema),
  verifyEmailHandler
);

// Refresh access token
router.get("/refresh", refreshAccessTokenHandler);

// Logout authenticated user
router.get("/logout", deserializeUser, requireUser, logoutHandler);

export default router;
