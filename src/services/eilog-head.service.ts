import { AppDataSource } from '../utils/data-source';
import AppError from '../utils/appError';
import { EILogHead } from '../entities';

const eilogHeadRepository = AppDataSource.getRepository(EILogHead);

// Create a new EILogHead
export const createEILogHead = async (payload: { name: string }) => {
  const eilogHead = eilogHeadRepository.create(payload);
  const saved = await eilogHeadRepository.save(eilogHead);
  const { deleted, deleted_at, ...sanitized } = saved;
  return sanitized;
};

// Get all EILogHeads (not deleted)
export const getAllEILogHeads = async () => {
  return await eilogHeadRepository
    .createQueryBuilder("eilogHead")
    .select([
      "eilogHead.id",
      "eilogHead.name",
      "eilogHead.created_at",
      "eilogHead.updated_at"
    ])
    .where("eilogHead.deleted = :deleted", { deleted: false })
    .orderBy("eilogHead.created_at", "DESC")
    .getMany();
};

// Get a single EILogHead by ID
export const getEILogHeadById = async (eiId: string) => {
  const eilogHead = await eilogHeadRepository.findOneBy({ id: eiId });
  if (!eilogHead || eilogHead.deleted) throw new AppError(404, 'EI Log Head not found');
  const { id, name, created_at, updated_at } = eilogHead;
  return { id, name, created_at, updated_at };
};

// Update an existing EILogHead by ID
export const updateEILogHeadById = async (eiId: string, payload: { name: string }) => {
  const eilogHeadEntity = await eilogHeadRepository.findOneBy({ id: eiId });
  if (!eilogHeadEntity || eilogHeadEntity.deleted) throw new AppError(404, 'EI Log Head not found');
  eilogHeadEntity.name = payload.name;
  const updated = await eilogHeadRepository.save(eilogHeadEntity);
  const { id, name, created_at, updated_at } = updated;
  return { id, name, created_at, updated_at };
};

// Soft delete an EILogHead by ID
export const deleteEILogHeadById = async (id: string) => {
    const eilogHeadEntity = await eilogHeadRepository.findOneBy({ id });
    if (!eilogHeadEntity || eilogHeadEntity.deleted) throw new AppError(404, 'EI Log Head not found');
    eilogHeadEntity.deleted = true;
    eilogHeadEntity.deleted_at = new Date();
    return await eilogHeadRepository.save(eilogHeadEntity);
}; 