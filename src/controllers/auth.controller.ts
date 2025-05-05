import { CookieOptions, NextFunction, Request, Response } from "express";
import config from "config";
import crypto from "crypto";
import {
  CreateUserInput,
  LoginUserInput,
  VerifyEmailInput,
} from "../schemas/user.schema";
import {
  createUser,
  findUser,
  findUserByEmail,
  signTokens,
} from "../services/user.service";
import AppError from "../utils/appError";
import { signJwt, verifyJwt } from "../utils/jwt";
import { RoleEnumType, User } from "../entities/user.entity";
import bcrypt from "bcryptjs";

import { deleteSessionByUserId, findSessionByUserId } from "../services";
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

export const registerUserHandler = async (
  req: Request<{}, {}, CreateUserInput>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, name, password, role } = req.body;

    // Prepare user data based on role
    let userData: Partial<CreateUserInput>;

    if (role === RoleEnumType.CUSTOMER) {
      userData = { email, name, password, role };
    } else {
      userData = {
        name,
        email,
        password,
        role: RoleEnumType.ADMIN,
      };
    }

    // Create the user
    const newUser = await createUser(userData);

    res.status(201).json({
      status: "success",
      message: "An email with a verification code has been sent to your email",
    });

    try {
      // Add logic to send verification email here
    } catch (error) {
      newUser.verificationCode = null;
      await newUser.save();

      return res.status(500).json({
        status: "error",
        message: "There was an error sending email, please try again",
      });
    }
  } catch (err: any) {
    if (err.code === "23505") {
      return res.status(409).json({
        status: "fail",
        message: "User with that email or username already exists",
      });
    }
    next(err);
  }
};

export const loginUserHandler = async (
  req: Request<LoginUserInput>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, password } = req.body;
    const ipAddress = req.ip || "unknown";
    const userAgent = req.headers["user-agent"] || "unknown";

    const user = await findUserByEmail({ email });

    // 1. Check if user exists
    if (!user) {
      return next(new AppError(400, "Invalid email or password"));
    }

    // 2. Check if password is valid
    if (!(await User.comparePasswords(password, user.password))) {
      return next(new AppError(400, "Invalid email or password"));
    }

    // 3. Sign Access and Refresh Tokens
    const { access_token, refresh_token } = await signTokens(
      user,
      ipAddress,
      userAgent
    );

    // 4. Add Cookies
    res.cookie("access_token", access_token, accessTokenCookieOptions);
    res.cookie("refresh_token", refresh_token, refreshTokenCookieOptions);
    res.cookie("logged_in", true, {
      ...accessTokenCookieOptions,
      httpOnly: false,
    });

    // 7. Send response
    res.status(200).json({
      status: "success",
      access_token,
      refresh_token,
    });
  } catch (err: any) {
    console.log(err);
    next(err);
  }
};

export const verifyEmailHandler = async (
  req: Request<VerifyEmailInput>,
  res: Response,
  next: NextFunction
) => {
  try {
    const verificationCode = crypto
      .createHash("sha256")
      .update(req.params.verificationCode)
      .digest("hex");

    const user = await findUser({ verificationCode });

    if (!user) {
      return next(new AppError(401, "Could not verify email"));
    }

    user.verificationCode = null;
    await user.save();

    res.status(200).json({
      status: "success",
      message: "Email verified successfully",
    });
  } catch (err: any) {
    next(err);
  }
};

export const refreshAccessTokenHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const refresh_token = req.cookies.refresh_token;

    if (!refresh_token) {
      return next(new AppError(403, "Could not refresh access token"));
    }

    const decoded = verifyJwt<{ sub: string; sessionId: string }>(
      refresh_token,
      "refreshTokenPublicKey"
    );

    if (!decoded) {
      return next(new AppError(403, "Could not refresh access token"));
    }

    const session = await findSessionByUserId(decoded.sub);

    if (!session || session.isExpired) {
      return next(new AppError(403, "Invalid or expired session"));
    }

    const access_token = signJwt(
      { sub: decoded.sub },
      "accessTokenPrivateKey",
      {
        expiresIn: `${config.get<number>("accessTokenExpiresIn")}m`,
      }
    );

    res.cookie("access_token", access_token, accessTokenCookieOptions);
    res.cookie("logged_in", true, {
      ...accessTokenCookieOptions,
      httpOnly: false,
    });

    res.status(200).json({
      status: "success",
      access_token,
    });
  } catch (err: any) {
    next(err);
  }
};

// Development only - verify user by email
export const verifyUserByEmailHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email } = req.body;

    const user = await findUserByEmail({ email });

    if (!user) {
      return next(new AppError(404, "User not found"));
    }

    user.verificationCode = null;
    await user.save();

    res.status(200).json({
      status: "success",
      message: "User verified successfully",
    });
  } catch (err) {
    next(err);
  }
};

const logout = (res: Response) => {
  res.cookie("access_token", "", { maxAge: 1 });
  res.cookie("refresh_token", "", { maxAge: 1 });
  res.cookie("logged_in", "", { maxAge: 1 });
};

/**
 * Logs out the authenticated user by deleting their session and clearing cookies.
 */
export const logoutHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = res.locals.user;

    // Delete the user's session from the database
    await deleteSessionByUserId(user.id);

    logout(res);

    // Respond with a success message
    res.status(200).json({
      status: "success",
      message: "Logged out successfully",
    });
  } catch (err: any) {
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
