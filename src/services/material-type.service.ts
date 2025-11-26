import { AppDataSource } from "../utils/data-source";
import AppError from "../utils/appError";
import { MaterialType, Material } from "../entities";

const typeRepo = AppDataSource.getRepository(MaterialType);
const materialRepo = AppDataSource.getRepository(Material);

export const createMaterialType = async (payload: { name: string }) => {
  const exists = await typeRepo.findOne({
    where: { name: payload.name, deleted: false },
  });
  if (exists) throw new AppError(409, "Material type already exists.");
  const saved = await typeRepo.save(typeRepo.create(payload));
  const { deleted, deleted_at, ...sanitized } = saved;
  return sanitized;
};

export const getAllMaterialTypes = async (filters: any = {}) => {
  const page = Number(filters.page) || 1;
  const limit = Number(filters.limit) || 10;
  const skip = (page - 1) * limit;

  const query = typeRepo
    .createQueryBuilder("type")
    .select(["type.id", "type.name", "type.created_at", "type.updated_at"])
    .where("type.deleted = :deleted", { deleted: false })
    .orderBy("type.created_at", "DESC")
    .skip(skip)
    .take(limit);

  const [list, total] = await query.getManyAndCount();
  return {
    data: list,
    pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
  };
};

export const getMaterialTypeById = async (id: string) => {
  const type = await typeRepo.findOneBy({ id });
  if (!type || type.deleted) throw new AppError(404, "Material type not found");
  const { name, created_at, updated_at } = type;
  return { id, name, created_at, updated_at };
};

export const updateMaterialTypeById = async (
  id: string,
  payload: { name: string }
) => {
  const type = await typeRepo.findOneBy({ id });
  if (!type || type.deleted) throw new AppError(404, "Material type not found");
  type.name = payload.name;
  const updated = await typeRepo.save(type);
  const { name, created_at, updated_at } = updated;
  return { id, name, created_at, updated_at };
};

export const deleteMaterialTypeById = async (id: string) => {
  const exists = await materialRepo.findOne({
    where: { materialType: { id }, deleted: false },
  });
  if (exists)
    throw new AppError(400, "Material type is in use and cannot be deleted.");
  const type = await typeRepo.findOneBy({ id });
  if (!type || type.deleted) throw new AppError(404, "Material type not found");
  type.deleted = true;
  type.deleted_at = new Date();
  return await typeRepo.save(type);
};
