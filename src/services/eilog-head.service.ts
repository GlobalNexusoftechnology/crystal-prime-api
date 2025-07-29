import { AppDataSource } from '../utils/data-source';
import AppError from '../utils/appError';
import { EILogHead } from '../entities';

const eilogHeadRepository = AppDataSource.getRepository(EILogHead);

// Create a new EILogHead
export const createEILogHead = async (payload: { name: string }) => {
  const ExisteilogHead = await eilogHeadRepository.findOne({
    where: {
      name: payload.name,
      deleted: false,
    }
  });

  if(ExisteilogHead){
    throw new AppError(409, "EI log head with this name already exist.");
  }

  const eilogHead = eilogHeadRepository.create(payload);
  const saved = await eilogHeadRepository.save(eilogHead);
  const { deleted, deleted_at, ...sanitized } = saved;
  return sanitized;
};

// Get all EILogHeads (not deleted)
export const getAllEILogHeads = async (filters: any = {}) => {
  const page = Number(filters.page) > 0 ? Number(filters.page) : 1;
  const limit = Number(filters.limit) > 0 ? Number(filters.limit) : 10;
  const skip = (page - 1) * limit;

  const query = eilogHeadRepository
    .createQueryBuilder("eilogHead")
    .select([
      "eilogHead.id",
      "eilogHead.name",
      "eilogHead.created_at",
      "eilogHead.updated_at"
    ])
    .where("eilogHead.deleted = :deleted", { deleted: false })
    .orderBy("eilogHead.created_at", "DESC");

  query.skip(skip).take(limit);

  const [eilogHeads, total] = await query.getManyAndCount();

  return {
    data: eilogHeads,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
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