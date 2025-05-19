import config from "config";
import { User } from "../entities/user.entity";
import { AppDataSource } from "../utils/data-source";
import { signJwt } from "../utils/jwt";
import { createSession } from "../services/session.service";
import AppError from "../utils/appError";

const userRepository = AppDataSource.getRepository(User);

// Create user
export const createUser = async (input: Partial<User>) => {
  return await userRepository.save(input);
};

// Find user email by Id
export const findUserByEmail = async ({ email }: { email: string }) => {
  return await userRepository.findOneBy({ email });
};

// Find user by Id
export const findUserById = async (userId: string) => {
  const user = await userRepository.findOne({
    where: { id: userId },
  });

  if (!user) {
    throw new AppError(404, "User not found.");
  }
  return user;
};

// Sign Tokens
export const signTokens = async (
  user: User,
  ipAddress: string,
  userAgent: string
) => {
  // 1. Create Session
  const session = await createSession(user.id, ipAddress, userAgent);

  // 2. Create Access and Refresh Tokens
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
