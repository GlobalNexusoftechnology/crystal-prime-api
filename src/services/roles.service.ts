import { AppDataSource } from "../utils/data-source";
import { Role, RoleName } from "../entities/roles.entity";
import AppError from "../utils/appError";

const roleRepo = AppDataSource.getRepository(Role);

interface RoleInput {
  role: RoleName; // use the enum here
  permissions: string[];
}

export const roleService = () => {

  // Create Role
  const createRole = async (data: RoleInput) => {
    const { role, permissions } = data;

    const existing = await roleRepo.findOne({ where: { role, deleted: false } });
    if (existing) throw new AppError(409, "Role with this name already exists");

    const newRole = roleRepo.create({ role, permissions });
    return await roleRepo.save(newRole);
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
    const roleEntity = await roleRepo.findOne({ where: { id, deleted: false } });
    if (!roleEntity) throw new AppError(404, "Role not found");

    if (data.role !== undefined) roleEntity.role = data.role;
    if (data.permissions !== undefined) roleEntity.permissions = data.permissions;

    return await roleRepo.save(roleEntity);
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

