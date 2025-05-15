import { AppDataSource } from "../utils/data-source";
import { Role } from "../entities/roles.entity";
import AppError from "../utils/appError";

const roleRepo = AppDataSource.getRepository(Role);

interface RoleInput {
  name: string;
  permissions: string[];
}

export const roleService = () => {

  // Create Role
  const createRole = async (data: RoleInput) => {
    const { name, permissions } = data;

    const existing = await roleRepo.findOne({ where: { name, deleted: false } });
    if (existing) throw new AppError(409, "Role with this name already exists");

    const role = roleRepo.create({ name, permissions });
    return await roleRepo.save(role);
  };

  // Get All Roles
  const getAllRoles = async () => {
    return await roleRepo.find({
      where: { deleted: false },
      order: { created_at: "DESC" },
    });
  };

  // Get Role by ID
  const getRoleById = async (id: string) => {
    const role = await roleRepo.findOne({ where: { id, deleted: false } });
    if (!role) throw new AppError(404, "Role not found");
    return role;
  };

  // Update Role
  const updateRole = async (id: string, data: Partial<RoleInput>) => {
    const role = await roleRepo.findOne({ where: { id, deleted: false } });
    if (!role) throw new AppError(404, "Role not found");

    if (data.name !== undefined) role.name = data.name;
    if (data.permissions !== undefined) role.permissions = data.permissions;

    return await roleRepo.save(role);
  };

  // Soft Delete Role
  const softDeleteRole = async (id: string) => {
    const role = await roleRepo.findOne({ where: { id, deleted: false } });
    if (!role) throw new AppError(404, "Role not found");

    role.deleted = true;
    role.deleted_at = new Date();

    return await roleRepo.save(role);
  };

  return {
    createRole,
    getAllRoles,
    getRoleById,
    updateRole,
    softDeleteRole,
  };
};
