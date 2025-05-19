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
import { RoleEnumType, User } from "../entities/user.entity";
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

// Register email
export const registerUserHandler = async (
  req: Request<{}, {}, CreateUserInput>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, name, password, role } = req.body;

    // Check if user already exists
    const existingUser = await findUserByEmail({ email });
    if (existingUser) {
      return res.status(409).json({
        status: "fail",
        message: "User with that email already exists",
      });
    }

    
    // Generate verification code
    const rawCode = crypto.randomBytes(32).toString("hex");
    const hashedCode = crypto.createHash("sha256").update(rawCode).digest("hex");

    // Hash the password before saving
    const hashedPassword = await bcrypt.hash(password, 12);

    // Prepare user data based on role
    let userData: Partial<CreateUserInput>;
    if (role === RoleEnumType.DEVELOPER) {
      userData = { email, name, password: hashedPassword, role: RoleEnumType.DEVELOPER };
    } else if (role === RoleEnumType.ADMIN) {
      userData = { email, name, password: hashedPassword, role: RoleEnumType.ADMIN };
    } else {
      return res.status(400).json({
        status: "fail",
        message: "Invalid role specified",
      });
    }

    // Create the user
    const newUser = await createUser(userData);

    // Send response without tokens
    res.status(201).json({
      status: "success",
      message: "User created successfully!",
      data: newUser,
    });

    // Optional: add your email verification logic here

  } catch (err: any) {
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
      access_token,
      refresh_token,
      message:"Logged in successfully",
      user
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

    // Check if user exists
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return next(new AppError(404, "User with this email does not exist."));
    }

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    user.otp = otp;
    user.otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    const templateId = 5;
    const params = { otp, userName: user.name };

    // Send email with OTP
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
export const verifyOtp = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, otp } = req.body;

    if (!email) {
      return next(new AppError(400, "Email is required."));
    }

    if (!otp) {
      return next(new AppError(400, "Otp is required."));
    }

    // Find user
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return next(new AppError(404, "User with this email does not exist."));
    }

    // Check if OTP matches
    if (user.otp !== otp) {
      return next(new AppError(400, "Invalid OTP."));
    }

    // Check if OTP is expired
    if (user.otpExpiresAt && new Date(user.otpExpiresAt) < new Date()) {
      return next(
        new AppError(400, "OTP has expired. Please request a new one.")
      );
    }

    // OTP verified, clear OTP and expiration fields
    user.otp = null;
    user.otpExpiresAt = null;
    user.isOtpVerified = true;
    await user.save();

    res.status(200).json({
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
    const { email, newPassword } = req.body;

    if (!email) {
      return next(new AppError(400, "Email is required."));
    }

    if (!newPassword) {
      return next(new AppError(400, "New password is required."));
    }

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return next(new AppError(404, "User with this email does not exist."));
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




