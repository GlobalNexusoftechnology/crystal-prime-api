import { AppDataSource } from "../utils/data-source";
import { LeadSources } from "../entities/lead-sources.entity";
import AppError from "../utils/appError";
import { Not } from "typeorm";
import { Leads } from "../entities/leads.entity";

interface LeadSourceInput {
  name: string;
}

interface GetLeadSourcesQuery {
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: "id" | "name" | "created_at" | "updated_at";
  sortOrder?: "ASC" | "DESC";
}

const leadSourceRepo = AppDataSource.getRepository(LeadSources);
const leadRepo = AppDataSource.getRepository(Leads);


export const LeadSourceService = () => {
  // Create Lead Source
  const createLeadSource = async (data: LeadSourceInput) => {
    const { name } = data;

    const existingLeadSource = await leadSourceRepo.findOne({
      where: { name, deleted: false },
    });
    if (existingLeadSource)
      throw new AppError(409, `${existingLeadSource.name} source already exists`);

    const leadSource = leadSourceRepo.create({ name });
    return await leadSourceRepo.save(leadSource);
  };

  // Get All Lead Sources
  const getAllLeadSources = async (filters: any = {}) => {
    const page = Number(filters.page) > 0 ? Number(filters.page) : 1;
    const limit = Number(filters.limit) > 0 ? Number(filters.limit) : 10;
    const skip = (page - 1) * limit;

    const query = leadSourceRepo.createQueryBuilder("leadSource")
      .where("leadSource.deleted = false")
      .orderBy("leadSource.created_at", "DESC");

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

  // Get Lead Source by ID
  const getLeadSourceById = async (id: string) => {
    const leadSource = await leadSourceRepo.findOne({
      where: { id, deleted: false },
    });
    if (!leadSource) throw new AppError(404, "Lead Source not found");
    return leadSource;
  };

  // Update Lead Source
  const updateLeadSource = async (
    id: string,
    data: Partial<LeadSourceInput>
  ) => {
    const leadSource = await leadSourceRepo.findOne({
      where: { id, deleted: false },
    });
    if (!leadSource) throw new AppError(404, "Lead Source not found");

    const existingLeadSource = await leadSourceRepo.findOne({
      where: { name: data.name, id: Not(id) },
    });
    
    if (existingLeadSource)
      throw new AppError(400, `${existingLeadSource.name} source already exists`);

    const { name } = data;

    if (name !== undefined) leadSource.name = name;

    return await leadSourceRepo.save(leadSource);
  };

  // Soft Delete Lead Source
  const softDeleteLeadSource = async (id: string) => {
    const exist = await leadRepo.findOne({
      where: {
        source:{id: id},
        deleted: false,
      }
    });
    if(exist){
      throw new AppError(400, "This lead source is in use cannot delete.");
    }
    const leadSource = await leadSourceRepo.findOne({
      where: { id, deleted: false },
    });
    if (!leadSource) throw new AppError(404, "Lead Source not found");

    leadSource.deleted = true;
    leadSource.deleted_at = new Date();

    return await leadSourceRepo.save(leadSource);
  };

  // Return all methods
  return {
    createLeadSource,
    getAllLeadSources,
    getLeadSourceById,
    updateLeadSource,
    softDeleteLeadSource,
  };
};
