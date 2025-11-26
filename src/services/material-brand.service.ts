import { AppDataSource } from "../utils/data-source";
import AppError from "../utils/appError";
import { MaterialBrand, Material } from "../entities";

const brandRepo = AppDataSource.getRepository(MaterialBrand);
const materialRepo = AppDataSource.getRepository(Material);

export const createMaterialBrand = async (payload: { name: string }) => {
  const exists = await brandRepo.findOne({
    where: { name: payload.name, deleted: false },
  });
  if (exists) {
    throw new AppError(409, "Material brand already exists.");
  }
  const brand = brandRepo.create(payload);
  const saved = await brandRepo.save(brand);
  const { deleted, deleted_at, ...sanitized } = saved;
  return sanitized;
};

export const getAllMaterialBrands = async (filters: any = {}) => {
  const page = Number(filters.page) > 0 ? Number(filters.page) : 1;
  const limit = Number(filters.limit) > 0 ? Number(filters.limit) : 10;
  const skip = (page - 1) * limit;

  const query = brandRepo
    .createQueryBuilder("brand")
    .select(["brand.id", "brand.name", "brand.created_at", "brand.updated_at"])
    .where("brand.deleted = :deleted", { deleted: false })
    .orderBy("brand.created_at", "DESC")
    .skip(skip)
    .take(limit);

  const [brands, total] = await query.getManyAndCount();

  return {
    data: brands,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const getMaterialBrandById = async (id: string) => {
  const brand = await brandRepo.findOneBy({ id });
  if (!brand || brand.deleted)
    throw new AppError(404, "Material brand not found");
  const { name, created_at, updated_at } = brand;
  return { id, name, created_at, updated_at };
};

export const updateMaterialBrandById = async (
  id: string,
  payload: { name: string }
) => {
  const brand = await brandRepo.findOneBy({ id });
  if (!brand || brand.deleted)
    throw new AppError(404, "Material brand not found");
  brand.name = payload.name;
  const updated = await brandRepo.save(brand);
  const { name, created_at, updated_at } = updated;
  return { id, name, created_at, updated_at };
};

export const deleteMaterialBrandById = async (id: string) => {
  const exists = await materialRepo.findOne({
    where: { materialBrand: { id }, deleted: false },
  });
  if (exists) {
    throw new AppError(400, "Material brand is in use and cannot be deleted.");
  }
  const brand = await brandRepo.findOneBy({ id });
  if (!brand || brand.deleted)
    throw new AppError(404, "Material brand not found");
  brand.deleted = true;
  brand.deleted_at = new Date();
  return await brandRepo.save(brand);
};
