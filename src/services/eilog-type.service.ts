import { AppDataSource } from '../utils/data-source';
import AppError from '../utils/appError';
import { EILogType } from '../entities';

const eilogTypeRepository = AppDataSource.getRepository(EILogType);

// Create a new EILogType
export const createEILogType = async (payload: { EIType: string }) => {
  const eilogType = eilogTypeRepository.create(payload);
  const saved = await eilogTypeRepository.save(eilogType);
  const { deleted, deleted_at, ...sanitized } = saved;
  return sanitized;
};

// Get all EILogTypes (not deleted)
export const getAllEILogTypes = async () => {
  return await eilogTypeRepository
    .createQueryBuilder("eilogType")
    .select([
      "eilogType.id",
      "eilogType.EIType",
      "eilogType.created_at"
    ])
    .where("eilogType.deleted = :deleted", { deleted: false })
    .orderBy("eilogType.created_at", "DESC")
    .getMany();
};

// Get a single EILogType by ID
export const getEILogTypeById = async (eiId: string) => {
  const eilogType = await eilogTypeRepository.findOneBy({ id: eiId });
  if (!eilogType || eilogType.deleted) throw new AppError(404, 'EILogType not found');
  const { id, EIType, created_at, updated_at } = eilogType;
  return { id, EIType, created_at, updated_at };
};

// Update an existing EILogType by ID
export const updateEILogTypeById = async (eiId: string, payload: { EIType: string }) => {
  const eilogTypeEntity = await eilogTypeRepository.findOneBy({ id: eiId });
  if (!eilogTypeEntity || eilogTypeEntity.deleted) throw new AppError(404, 'EILogType not found');
  eilogTypeEntity.EIType = payload.EIType;
  const updated = await eilogTypeRepository.save(eilogTypeEntity);
  const { id, EIType, created_at, updated_at } = updated;
  return { id, EIType, created_at, updated_at };
};

// Soft delete an EILogType by ID
export const deleteEILogTypeById = async (id: string) => {
    const eilogTypeEntity = await eilogTypeRepository.findOneBy({ id });
    if (!eilogTypeEntity || eilogTypeEntity.deleted) throw new AppError(404, 'EILogType not found');
    eilogTypeEntity.deleted = true;
    eilogTypeEntity.deleted_at = new Date();
    return await eilogTypeRepository.save(eilogTypeEntity);
}; 