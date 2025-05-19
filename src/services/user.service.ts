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

  if (role === RoleEnumType.DEVELOPER) {
    user.image = payload.name ?? user.image;
    user.name = payload.name ?? user.name;
    user.email = payload.email ?? user.email;
    user.number = payload.number ?? user.number;
    user.city = payload.city ?? user.city;
    user.country = payload.country ?? user.country;
    user.address = payload.address ?? user.address;
  } else if (role === RoleEnumType.ADMIN) {
    user.image = payload.image ?? user.image;
    user.number = payload.number ?? user.number;
    user.city = payload.city ?? user.city;
    user.state = payload.state ?? user.state;
    user.country = payload.country ?? user.country;
  }

  await userRepository.save(user);
  return user;
};
