import config from "config";
import { RoleEnumType, User } from "../entities/user.entity";
import { AppDataSource } from "../utils/data-source";
import { signJwt } from "../utils/jwt";
import { createSession } from "../services/session.service";
import AppError from "../utils/appError";

const userRepository = AppDataSource.getRepository(User);

// Create user
export const createUser = async (input: Partial<User>) => {
  return await userRepository.save(input);
};

// Find user by email
export const findUserByEmail = async ({ email }: { email: string }) => {
  return await userRepository.findOneBy({ email });
};

// Find user by ID
export const findUserById = async (userId: string) => {
  const user = await userRepository.findOne({
    where: { id: userId },
  });

  if (!user) {
    throw new AppError(404, "User not found.");
  }

  return user;
};

// Find All user 
export const findAllUsers = async () => {
  return await userRepository.find({
    where: { deleted: false },
    order: { created_at: "DESC" },
  });
};

// Sign access and refresh tokens
export const signTokens = async (
  user: User,
  ipAddress: string,
  userAgent: string
) => {
  const session = await createSession(user.id, ipAddress, userAgent);

  const access_token = signJwt({ sub: user.id }, "accessTokenPrivateKey", {
    expiresIn: `${config.get<number>("accessTokenExpiresIn")}m`,
  });

  const refresh_token = signJwt(
    { sub: user.id, sessionId: session.id },
    "refreshTokenPrivateKey",
    {
      expiresIn: `${config.get<number>("refreshTokenExpiresIn")}m`,
    }
  );

  return { access_token, refresh_token };
};

// Update user
export const updateUser = async (
  userId: string,
  role: string,
  payload: Partial<User>
): Promise<User | null> => {
  const user = await userRepository.findOne({
    where: { id: userId },
  });

  if (!user) {
    throw new AppError(404, "User not found.");
  }

  // Update fields based on role
  if (role === RoleEnumType.DEVELOPER || role === RoleEnumType.ADMIN) {
    user.first_name = payload.first_name ?? user.first_name;
    user.last_name = payload.last_name ?? user.last_name;
    user.email = payload.email ?? user.email;
    user.number = payload.number ?? user.number;
    user.role = payload.role ?? user.role;
    user.dob = payload.dob ?? user.dob;
    user.verificationCode = payload.verificationCode ?? user.verificationCode;
    user.authToken = payload.authToken ?? user.authToken;
    user.refreshToken = payload.refreshToken ?? user.refreshToken;
    user.otp = payload.otp ?? user.otp;
    user.otpExpiresAt = payload.otpExpiresAt ?? user.otpExpiresAt;
    user.isOtpVerified =
      payload.isOtpVerified !== undefined
        ? payload.isOtpVerified
        : user.isOtpVerified;
    user.role_id = payload.role_id ?? user.role_id;
  }

  await userRepository.save(user);
  return user;
};

// Soft Delete User
export const softDeleteUser = async (id: string) => {
  const user = await userRepository.findOne({
    where: { id, deleted: false },
  });

  if (!user) throw new AppError(404, "User not found");

  user.deleted = true;
  user.deleted_at = new Date();

  return await userRepository.save(user);
};


