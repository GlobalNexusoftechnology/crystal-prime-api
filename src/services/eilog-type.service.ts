import { AppDataSource } from '../utils/data-source';
import AppError from '../utils/appError';
import { EILog, EILogType } from '../entities';

const eilogTypeRepository = AppDataSource.getRepository(EILogType);
const eilogRepository = AppDataSource.getRepository(EILog);
// Create a new EILogType
export const createEILogType = async (payload: { name: string }) => {
  const existEilogType = await eilogTypeRepository.findOne({
    where: {
      name: payload.name,
      deleted: false,
    }
  });

  if(existEilogType){
    throw new AppError(409, "EI log type with this name already exist.");
  }
  
  const eilogType = eilogTypeRepository.create(payload);
  const saved = await eilogTypeRepository.save(eilogType);
  const { deleted, deleted_at, ...sanitized } = saved;
  return sanitized;
};

// Get all EILogTypes (not deleted)
export const getAllEILogTypes = async (filters: any = {}) => {
  const page = Number(filters.page) > 0 ? Number(filters.page) : 1;
  const limit = Number(filters.limit) > 0 ? Number(filters.limit) : 10;
  const skip = (page - 1) * limit;

  const query = eilogTypeRepository
    .createQueryBuilder("eilogType")
    .select([
      "eilogType.id",
      "eilogType.name",
      "eilogType.created_at",
      "eilogType.updated_at"
    ])
    .where("eilogType.deleted = :deleted", { deleted: false })
    .orderBy("eilogType.created_at", "DESC");

  query.skip(skip).take(limit);

  const [eilogTypes, total] = await query.getManyAndCount();

  return {
    data: eilogTypes,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

// Get a single EILogType by ID
export const getEILogTypeById = async (eiId: string) => {
  const eilogType = await eilogTypeRepository.findOneBy({ id: eiId });
  if (!eilogType || eilogType.deleted) throw new AppError(404, 'EILogType not found');
  const { id, name, created_at, updated_at } = eilogType;
  return { id, name, created_at, updated_at };
};

// Update an existing EILogType by ID
export const updateEILogTypeById = async (eiId: string, payload: { name: string }) => {
  const eilogTypeEntity = await eilogTypeRepository.findOneBy({ id: eiId });
  if (!eilogTypeEntity || eilogTypeEntity.deleted) throw new AppError(404, 'EILogType not found');
  eilogTypeEntity.name = payload.name;
  const updated = await eilogTypeRepository.save(eilogTypeEntity);
  const { id, name, created_at, updated_at } = updated;
  return { id, name, created_at, updated_at };
};

// Soft delete an EILogType by ID
export const deleteEILogTypeById = async (id: string) => {

    const exist = await eilogRepository.findOne({
      where: {
        eilogType: {
          id: id,
        },
        deleted: false,
      },
    });
  
    if(exist){
      throw new AppError(400, "This EI log type is in use cannot delete.");
    }
    const eilogTypeEntity = await eilogTypeRepository.findOneBy({ id });
    if (!eilogTypeEntity || eilogTypeEntity.deleted) throw new AppError(404, 'EILogType not found');
    eilogTypeEntity.deleted = true;
    eilogTypeEntity.deleted_at = new Date();
    return await eilogTypeRepository.save(eilogTypeEntity);
}; 