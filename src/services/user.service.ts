import config from "config";
import { User } from "../entities/user.entity";
import { AppDataSource } from "../utils/data-source";
import { signJwt } from "../utils/jwt";
import { createSession } from "../services/session.service";
import AppError from "../utils/appError";
import ExcelJS from "exceljs";
import { Role } from "../entities/roles.entity";
import { ChangePasswordInput, CreateClientCredentialsInput } from "../schemas/user.schema";
import bcrypt from "bcryptjs";
import { Clients } from "../entities/clients.entity";
import { email } from "envalid";

const userRepository = AppDataSource.getRepository(User);
const roleRepository = AppDataSource.getRepository(Role);
const clientRepository = AppDataSource.getRepository(Clients);


// Create user
export const createUser = async (input: Partial<User> & { role_id?: string }) => {
  const role = await roleRepository.findOne({
    where: { id: input.role_id, deleted: false },
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
  return await userRepository.findOne({
    where: { email, deleted: false },
    relations: ["role"]
  });
};

// Find user by ID
export const findUserById = async (userId: string) => {
  const user = await userRepository.findOne({
    where: { id: userId, deleted: false },
    relations: ["role"]
  });

  if (!user) {
    throw new AppError(404, "User not found.");
  }

  return user;
};

export const findUserByPhoneNumber = async ({ phone_number }: { phone_number: string }) => {
  return AppDataSource.getRepository(User).findOne({ where: { phone_number, deleted: false } });
};

// Find All user 
export const findAllUsers = async (filters: any = {}) => {
  const page = Number(filters.page) > 0 ? Number(filters.page) : 1;
  const limit = Number(filters.limit) > 0 ? Number(filters.limit) : 10;
  const skip = (page - 1) * limit;

  const { searchText } = filters;

  const query = userRepository.createQueryBuilder("user")
    .leftJoinAndSelect("user.role", "role")
    .where("user.deleted = false")
    .andWhere("LOWER(role.role) != LOWER(:clientRole)", { clientRole: "client" });

  if (searchText && searchText.trim() !== "") {
    const search = `%${searchText.trim().toLowerCase()}%`;
    query.andWhere(
      `LOWER(user.first_name) LIKE :search OR LOWER(user.last_name) LIKE :search OR LOWER(user.email) LIKE :search OR LOWER(user.phone_number) LIKE :search OR LOWER(role.role) LIKE :search`,
      { search }
    );
  }

  query.orderBy("user.created_at", "DESC");
  query.skip(skip).take(limit);

  const [users, total] = await query.getManyAndCount();

  return {
    data: users,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
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
      where: { id: payload.role_id, deleted: false },
    });

    if (!role) {
      throw new AppError(404, "Role not found.");
    }

    user.role = role;
  }

  // Check for unique email before updating
  if (payload.email && payload.email !== user.email) {
    const existing = await userRepository.findOne({ where: { email: payload.email, deleted: false } });
    if (existing && existing.id !== user.id) {
      throw new AppError(400, "Email already in use.");
    }
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
export const exportUsersToExcel = async (searchText?: string): Promise<ExcelJS.Workbook> => {
  const query = userRepository.createQueryBuilder("user")
    .leftJoinAndSelect("user.role", "role")
    .where("user.deleted = false");

  if (searchText && searchText.trim() !== "") {
    const search = `%${searchText.trim().toLowerCase()}%`;
    query.andWhere(
      `LOWER(user.first_name) LIKE :search OR LOWER(user.last_name) LIKE :search OR LOWER(user.email) LIKE :search OR LOWER(user.phone_number) LIKE :search OR LOWER(role.role) LIKE :search`,
      { search }
    );
  }

  query.orderBy("user.created_at", "DESC");
  const userList = await query.getMany();

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
      role: user.role.role ?? "",
      created_at: user.created_at?.toLocaleString() ?? "",
      updated_at: user.updated_at?.toLocaleString() ?? "",
    });
  });

  return workbook;
};

//change password service
export const changePassword = async (
  userId: string,
  data: ChangePasswordInput
): Promise<string> => {
  const user = await userRepository.findOne({ where: { id: userId } });
  if (!user) {
    throw new AppError(404, "User not found");
  }

  //verify the old password
  const isMatch = await bcrypt.compare(data.oldPassword, user.password);
  if (!isMatch) {
    throw new AppError(401, "Old password is incorrect");
  }

  //ensure the new password meets minimum length requirements
  if (data.newPassword.length < 6) {
    throw new AppError(400, "New password must be at least 6 characters long.");
  }

  //hash the new password
  const hashedPassword = await bcrypt.hash(data.newPassword, 12);

  //update the user's password in the database
  user.password = hashedPassword;
  await User.save(user);

  return "Password changed successfully!";
};

//change password service
export const changeClientPassword = async (
  data: any
) => {
  const Fetcheduser = await userRepository.findOne({ where: { id: data.userId } });
  if (!Fetcheduser) {
    throw new AppError(404, "User not found");
  }

  //hash the new password
  const hashedPassword = await bcrypt.hash(data.password, 12);

  //update the user's password in the database
  Fetcheduser.password = hashedPassword;
  await User.save(Fetcheduser);

  return "Password changed successfully!";
};

//change password service
export const createClientCredentials = async (
  data: CreateClientCredentialsInput
) => {
  let client_role = await roleRepository.findOne({
    where: { role: "client", deleted: false },
  });

  if(!client_role){
    const response = roleRepository.create({
      role: "client",
      permissions: []
    });
    client_role = await roleRepository.save(response);
  }

  const existingEmail = await userRepository.findOne({
    where: { email: data.email, deleted: false },
  });

  if(existingEmail){
    throw new AppError(409, "User with this email already exist.");
  }
  
  const client = await clientRepository.findOne({
    where: {
      id: data.clientId,
      deleted: false,
    }
  });

  if(!client){
    throw new AppError(404, "Client not found.");
  }

  if(client?.isCredential){
    throw new AppError(400, "Credentials for this client already created.")
  }
  const name = client?.name;
  let first_name = "";
  let last_name = "";

  if (name) {
    const temp = name?.trim()?.split(" ");
    if (Array.isArray(temp)) {
      first_name = temp[0];
      last_name = temp[1];
    }
  }

  const user = userRepository.create({
    email: data.email,
    password: data.password,
    role: client_role,
    client: client,
    first_name,
    last_name,
  });
  const savedUser = await userRepository.save(user);

  // Set isCredential to true when credentials are created
  client.isCredential = true;
  await clientRepository.save(client);

  const { password, ...isolated} = savedUser;
  return isolated;
};