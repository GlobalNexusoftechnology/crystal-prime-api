import { AppDataSource } from "../utils/data-source";
import { Role } from "../entities/roles.entity";
import { User } from "../entities/user.entity";
import AppError from "../utils/appError";

const roleRepo = AppDataSource.getRepository(Role);
const userRepo = AppDataSource.getRepository(User);

interface RoleInput {
  role: string; // use the enum here
  permissions: string[];
}

export interface GetRolesQuery {
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: 'id' | 'name' | 'created_at' | 'updated_at';
  sortOrder?: 'ASC' | 'DESC';
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
 const getAllRoles = async (params: GetRolesQuery) => {
  const {
    search = '',
    page = 1,
    limit = 10,
    sortBy = 'created_at',
    sortOrder = 'DESC',
  } = params;

  const query = roleRepo
    .createQueryBuilder('role')
    .where('role.deleted = false' , { deleted: false });

  if (search) {
    query.andWhere('role.name ILIKE :search', { search: `%${search}%` });
  }

  query.orderBy(`role.${sortBy}`, sortOrder);
  query.skip((page - 1) * limit).take(limit);

  const [data, total] = await query.getManyAndCount();

  return {
    data,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
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
    // Check if any users are using this role
    const exist = await userRepo.findOne({
      where: {
        role: { id: id },
        deleted: false,
      }
    });
    if (exist) {
      throw new AppError(400, "This role is in use cannot delete.");
    }

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

