import { AppDataSource } from "../utils/data-source";
import { LeadTypes } from "../entities/lead-type.entity";
import AppError from "../utils/appError";
import { Not } from "typeorm";

interface LeadTypeInput {
  name: string;
}

interface GetLeadTypesQuery {
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: "id" | "name" | "created_at" | "updated_at";
  sortOrder?: "ASC" | "DESC";
}

const leadTypeRepo = AppDataSource.getRepository(LeadTypes);

export const LeadTypeService = () => {
  // Create Lead Type
  const createLeadType = async (data: LeadTypeInput) => {
    const { name } = data;

    const existingLeadType = await leadTypeRepo.findOne({
      where: { name, deleted: false },
    });
    if (existingLeadType)
      throw new AppError(409, `${existingLeadType.name} source already exists`);

    const leadType = leadTypeRepo.create({ name });
    return await leadTypeRepo.save(leadType);
  };

  // Get All Lead Types
  const getAllLeadTypes = async (filters: any = {}) => {
    const page = Number(filters.page) > 0 ? Number(filters.page) : 1;
    const limit = Number(filters.limit) > 0 ? Number(filters.limit) : 10;
    const skip = (page - 1) * limit;

    const query = leadTypeRepo.createQueryBuilder("leadType")
      .where("leadType.deleted = false")
      .orderBy("leadType.created_at", "DESC");

    query.skip(skip).take(limit);

    const [data, total] = await query.getManyAndCount();

    return {
      data,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  };

  // Get Lead Type by ID
  const getLeadTypeById = async (id: string) => {
    const leadType = await leadTypeRepo.findOne({
      where: { id, deleted: false },
    });
    if (!leadType) throw new AppError(404, "Lead Type not found");
    return leadType;
  };

  // Update Lead Type
  const updateLeadType = async (
    id: string,
    data: Partial<LeadTypeInput>
  ) => {
    const leadType = await leadTypeRepo.findOne({
      where: { id, deleted: false },
    });
    if (!leadType) throw new AppError(404, "Lead Type not found");

    const existingLeadType = await leadTypeRepo.findOne({
      where: { name: data.name, id: Not(id) },
    });
    
    if (existingLeadType)
      throw new AppError(400, `${existingLeadType.name} source already exists`);

    const { name } = data;

    if (name !== undefined) leadType.name = name;

    return await leadTypeRepo.save(leadType);
  };

  // Soft Delete Lead Type
  const softDeleteLeadType = async (id: string) => {
    const leadType = await leadTypeRepo.findOne({
      where: { id, deleted: false },
    });
    if (!leadType) throw new AppError(404, "Lead Type not found");

    leadType.deleted = true;
    leadType.deleted_at = new Date();

    return await leadTypeRepo.save(leadType);
  };

  // Return all methods
  return {
    createLeadType,
    getAllLeadTypes,
    getLeadTypeById,
    updateLeadType,
    softDeleteLeadType,
  };
};
