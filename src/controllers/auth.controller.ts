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
import { sendEmail } from "../utils";

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
        access_token,
        refresh_token,
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Sends a one-time password (OTP) to the user's email for verification.
 */
export const sendOtp = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email } = req.body;

    if (!email) {
      return next(new AppError(400, "Email is required."));
    }

    // Find user by email
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return next(new AppError(404, "User with this email does not exist."));
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Store OTP and expiry on the user
    user.otp = otp;
    user.otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 mins
    await user.save();

    // Combine first and last name
    const fullName = `${user.first_name} ${user.last_name}`.trim();

    // Send OTP via email
    const templateId = 5;
    const params = { otp, userName: fullName };

    await sendEmail(email, templateId, params);

    res.status(200).json({
      status: "success",
      message: "OTP sent to email successfully",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Verifies the OTP entered by the user for authentication or password reset.
 */
export const verifyOtp = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return next(new AppError(400, "Email and OTP are required."));
    }

    const user = await User.findOne({ where: { email } });

    if (!user) {
      return next(new AppError(404, "User not found."));
    }

    if (user.otp !== otp) {
      return next(new AppError(400, "Invalid OTP."));
    }

    if (user.otpExpiresAt && new Date(user.otpExpiresAt) < new Date()) {
      return next(new AppError(400, "OTP has expired."));
    }

    user.otp = null;
    user.otpExpiresAt = null;
    user.isOtpVerified = true;
    await user.save();

    return res.status(200).json({
      status: "success",
      message: "OTP verified successfully",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Resets the user's password after OTP verification.
 */
export const resetPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { userId, email, newPassword } = req.body;

    if (!userId) {
      return next(new AppError(400, "User ID is required."));
    }

    if (!email) {
      return next(new AppError(400, "Email is required."));
    }

    if (!newPassword) {
      return next(new AppError(400, "New password is required."));
    }

    const user = await User.findOne({ where: { id: userId, email } });
    if (!user) {
      return next(new AppError(404, "User with this ID and email does not exist."));
    }

    if (!user.isOtpVerified) {
      return next(
        new AppError(403, "OTP verification is required to reset password.")
      );
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    user.password = hashedPassword;
    user.isOtpVerified = false;
    await user.save();

    res.status(200).json({
      status: "success",
      message: "Password reset successfully",
    });
  } catch (error) {
    next(error);
  }
};





