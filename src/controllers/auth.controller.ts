import { CookieOptions, NextFunction, Request, Response } from "express";
import config from "config";
import crypto from "crypto";
import {
  CreateUserInput,
  LoginUserInput,
} from "../schemas/user.schema";
import {
  createUser,
  findUserByEmail,
  signTokens,
} from "../services/user.service";
import AppError from "../utils/appError";
import { User } from "../entities/user.entity";
import bcrypt from "bcryptjs";
import { sendForgotPasswordMail } from "../utils/email";

const cookiesOptions: CookieOptions = {
  httpOnly: true,
  sameSite: "lax",
};

if (process.env.NODE_ENV === "production") cookiesOptions.secure = true;

const accessTokenCookieOptions: CookieOptions = {
  ...cookiesOptions,
  expires: new Date(
    Date.now() + config.get<number>("accessTokenExpiresIn") * 60 * 1000
  ),
  maxAge: config.get<number>("accessTokenExpiresIn") * 60 * 1000,
};

const refreshTokenCookieOptions: CookieOptions = {
  ...cookiesOptions,
  expires: new Date(
    Date.now() + config.get<number>("refreshTokenExpiresIn") * 60 * 1000
  ),
  maxAge: config.get<number>("refreshTokenExpiresIn") * 60 * 1000,
};

// register User
export const registerUserHandler = async (
  req: Request<{}, {}, CreateUserInput>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, first_name, last_name, password, role_id } = req.body;

    // Check if user already exists
    const existingUser = await findUserByEmail({ email });
    if (existingUser) {
      return res.status(409).json({
        status: "fail",
        message: "User with that email already exists",
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Generate email verification code
    const rawCode = crypto.randomBytes(32).toString("hex");
    const hashedVerificationCode = crypto.createHash("sha256").update(rawCode).digest("hex");

    // Prepare user data
    const userData = {
      email,
      first_name,
      last_name,
      password: hashedPassword,
      role_id,
      verificationCode: hashedVerificationCode,
      verified: false,
    };

    // Create user
    const newUser = await createUser(userData);

    // Optionally send verification email using rawCode here

    res.status(201).json({
      status: "success",
      message: "User registered successfully. Please verify your email.",
      data: newUser,
    });
  } catch (err) {
    next(err);
  }
};


// Login user
export const loginUserHandler = async (
  req: Request<{}, {}, LoginUserInput>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, password } = req.body;
    const ipAddress = req.ip || "unknown";
    const userAgent = req.headers["user-agent"] || "unknown";

    // 1. Find user by email
    const user = await findUserByEmail({ email });
    if (!user) {
      return next(new AppError(400, "Invalid email or password"));
    }

    // 2. Compare passwords
    const isValidPassword = await User.comparePasswords(password, user.password);
    if (!isValidPassword) {
      return next(new AppError(400, "Invalid email or password"));
    }

    // 3. Sign Access and Refresh Tokens
    const { access_token, refresh_token } = await signTokens(user, ipAddress, userAgent);

    // 4. Set tokens in cookies
    res.cookie("access_token", access_token, accessTokenCookieOptions);
    res.cookie("refresh_token", refresh_token, refreshTokenCookieOptions);
    res.cookie("logged_in", true, {
      ...accessTokenCookieOptions,
      httpOnly: false,
    });

    // 5. Send Response
    res.status(200).json({
      status: "success",
      message: "Logged in successfully",
      data: {
        user,
        refresh_token,
        access_token
      }
    });
  } catch (err) {
    next(err);
  }
};

// Forgot Password
export const forgotPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required." });
    }

    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

    user.otp = otp;
    user.otpExpiresAt = otpExpiresAt;
    user.isOtpVerified = false;

    await User.save(user);

    await sendForgotPasswordMail(email, otp); //  Send OTP mail

    res.status(200).json({
      status: "success",
      message: "OTP sent to your email."
    });
  }
  catch (error) {
    next(error);
  }
};


// Verify OTP
export const verifyOtp = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: "Email and OTP are required." });
    }

    const user = await User.findOne({ where: { email } });

    if (!user || user.otp !== otp) {
      return res.status(400).json({ message: "Invalid OTP or Email." });
    }

    if (!user.otpExpiresAt || user.otpExpiresAt < new Date()) {
      return res.status(400).json({ message: "OTP has expired." });
    }

    user.isOtpVerified = true;
    await User.save(user);

    res.status(200).json({
      status: "success",
      message: "OTP verified. You can now reset your password."
    });
  } catch (error) {
    next(error);
  }
};


// Reset Password
export const resetPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, newPassword } = req.body;

    if (!email || !newPassword) {
      return res.status(400).json({ message: "Email and New Password are required." });
    }

    const user = await User.findOne({ where: { email } });

    if (!user || !user.isOtpVerified) {
      return res.status(400).json({ message: "OTP verification required before resetting password." });
    }

  

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    user.password = hashedPassword;
    user.otp = null;
    user.otpExpiresAt = null;
    user.isOtpVerified = false;

    await User.save(user);

    res.status(200).json({
      status: "success",
      message: "Password reset successful."
    });
  } catch (error) {
    next(error);
  }
};






