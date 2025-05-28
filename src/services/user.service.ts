import config from "config";
import { User } from "../entities/user.entity";
import { AppDataSource } from "../utils/data-source";
import { signJwt } from "../utils/jwt";
import { createSession } from "../services/session.service";
import AppError from "../utils/appError";
import ExcelJS from "exceljs";
import { Role } from "../entities/roles.entity";

const userRepository = AppDataSource.getRepository(User);
const roleRepository = AppDataSource.getRepository(Role);

// Create user
export const createUser = async (input: Partial<User> & { role_id?: string }) => {
  const role = await roleRepository.findOne({
    where: { id: input.role_id },
  });

  if (!role) {
    throw new AppError(404, "Role not found.");
  }

  delete input.role_id;

  input.role = role;

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
    relations: ["role"]
  });

  if (!user) {
    throw new AppError(404, "User not found.");
  }

  return user;
};

export const findUserByPhoneNumber = async ({ phone_number }: { phone_number: string }) => {
  return AppDataSource.getRepository(User).findOne({ where: { phone_number } });
};

// Find All user 
export const findAllUsers = async () => {
  return await userRepository.find({
    where: { deleted: false },
    order: { created_at: "DESC" },
    relations: ["role"]
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
  payload: Partial<User> & { role_id?: string }
): Promise<User | null> => {
  const user = await userRepository.findOne({
    where: { id: userId },
    relations: ['role'], // optional, but useful if you want to update role properly
  });

  if (!user) {
    throw new AppError(404, "User not found.");
  }

  // If payload includes a roleId, fetch and assign the role
  if (payload.role_id) {
    const role = await roleRepository.findOne({
      where: { id: payload.role_id },
    });

    if (!role) {
      throw new AppError(404, "Role not found.");
    }

    user.role = role;
  }

  // Remove roleId from payload to avoid conflict with entity
  const { role_id, ...restPayload } = payload;

  Object.assign(user, restPayload);

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


// Export all users to Excel
export const exportUsersToExcel = async (): Promise<ExcelJS.Workbook> => {
  const userList = await userRepository.find({
    where: { deleted: false },
    order: { created_at: "DESC" },
  });

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("User List");

  worksheet.columns = [
    { header: "ID", key: "id", width: 36 },
    { header: "First Name", key: "first_name", width: 20 },
    { header: "Last Name", key: "last_name", width: 20 },
    { header: "Contact", key: "number", width: 20 },
    { header: "DOB", key: "dob", width: 20 },
    { header: "Email", key: "email", width: 30 },
    { header: "Role", key: "role", width: 20 },
    { header: "Created At", key: "created_at", width: 25 },
    { header: "Updated At", key: "updated_at", width: 25 },
  ];

  userList.forEach((user) => {
    worksheet.addRow({
      id: user.id,
      first_name: user.first_name ?? "",
      last_name: user.last_name ?? "",
      number: user.phone_number ?? "",
      dob: user.dob ?? "",
      email: user.email ?? "",
      role: user.role ?? "",
      created_at: user.created_at?.toLocaleString() ?? "",
      updated_at: user.updated_at?.toLocaleString() ?? "",
    });
  });

  return workbook;
};





