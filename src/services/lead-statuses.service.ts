import { AppDataSource } from "../utils/data-source";
import { LeadStatuses } from "../entities/lead-statuses.entity";
import AppError from "../utils/appError";
import { Not } from "typeorm";
import { Leads } from "../entities/leads.entity";

interface LeadStatusInput {
  name: string;
  color?: string | null;
}

export interface GetLeadStatusesQuery {
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: "id" | "name" | "created_at" | "updated_at";
  sortOrder?: "ASC" | "DESC";
}

const leadStatusRepo = AppDataSource.getRepository(LeadStatuses);
const leadRepo = AppDataSource.getRepository(Leads);

export const LeadStatusService = () => {
  // Create Lead Status
  const createLeadStatus = async (data: LeadStatusInput) => {
    const { name, color } = data;

    const existingLeadStatus = await leadStatusRepo.findOne({
      where: { name, deleted: false },
    });
    if (existingLeadStatus)
      throw new AppError(409, `${existingLeadStatus.name} status already exists`);

    // Check for duplicate color if color is provided
    if (color) {
      const existingColorStatus = await leadStatusRepo.findOne({
        where: { color, deleted: false },
      });
      if (existingColorStatus)
        throw new AppError(400, `Color "${color}" is already used by another status`);
    }
    
    const leadStatus = leadStatusRepo.create({ name, color });
    return await leadStatusRepo.save(leadStatus);
  };

  // Get All Lead Statuses
  const getAllLeadStatuses = async (filters: any = {}) => {
    const page = Number(filters.page) > 0 ? Number(filters.page) : 1;
    const limit = Number(filters.limit) > 0 ? Number(filters.limit) : 10;
    const skip = (page - 1) * limit;

    const query = leadStatusRepo.createQueryBuilder("leadStatus")
      .where("leadStatus.deleted = false")
      .orderBy("leadStatus.created_at", "DESC");

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

  // Get Lead Status by ID
  const getLeadStatusById = async (id: string) => {
    const leadStatus = await leadStatusRepo.findOne({
      where: { id, deleted: false },
    });
    if (!leadStatus) throw new AppError(404, "Lead Status not found");
    return leadStatus;
  };

  // Update Lead Status
  const updateLeadStatus = async (
    id: string,
    data: Partial<LeadStatusInput>
  ) => {
    const leadStatus = await leadStatusRepo.findOne({
      where: { id, deleted: false },
    });
    if (!leadStatus) throw new AppError(404, "Lead Status not found");

    const existingLeadStatus = await leadStatusRepo.findOne({
      where: { name: data.name, id: Not(id) },
    });
    if (existingLeadStatus)
      throw new AppError(400, `"${existingLeadStatus.name} status already exists`);

    // Check for duplicate color if color is being updated
    if (data.color) {
      const existingColorStatus = await leadStatusRepo.findOne({
        where: { color: data.color, id: Not(id), deleted: false },
      });
      if (existingColorStatus)
        throw new AppError(400, `Color "${data.color}" is already used by another status`);
    }

    const { name, color } = data;

    if (name !== undefined) leadStatus.name = name;
    if (color !== undefined) leadStatus.color = color;

    return await leadStatusRepo.save(leadStatus);
  };

  // Soft Delete Lead Status
  const softDeleteLeadStatus = async (id: string) => {

      const exist = await leadRepo.findOne({
          where: {
            status:{id: id},
            deleted: false,
          }
        });
        if(exist){
          throw new AppError(400, "This lead status is in use cannot delete.");
        }

    const leadStatus = await leadStatusRepo.findOne({
      where: { id, deleted: false },
    });
    if (!leadStatus) throw new AppError(404, "Lead Status not found");

    leadStatus.deleted = true;
    leadStatus.deleted_at = new Date();

    return await leadStatusRepo.save(leadStatus);
  };

  // Return all methods
  return {
    createLeadStatus,
    getAllLeadStatuses,
    getLeadStatusById,
    updateLeadStatus,
    softDeleteLeadStatus,
  };
};
