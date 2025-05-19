import express from "express";
import {
  loginUserHandler,
  registerUserHandler,
  resetPassword,
  sendOtp,
  verifyOtp,
} from "../controllers/auth.controller";
import { validate } from "../middleware/validate";
import {
  createUserSchema,
  loginUserSchema,
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

export default router;
