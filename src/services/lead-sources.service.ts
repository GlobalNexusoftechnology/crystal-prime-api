import { AppDataSource } from "../utils/data-source";
import { LeadSources } from "../entities/lead-sources.entity";
import AppError from "../utils/appError";

interface LeadSourceInput {
    name: string;
}

interface GetLeadSourcesQuery {
    search?: string;
    page?: number;
    limit?: number;
    sortBy?: 'id' | 'name' | 'created_at' | 'updated_at';
    sortOrder?: 'ASC' | 'DESC';
}

const leadSourceRepo = AppDataSource.getRepository(LeadSources);

export const LeadSourceService = () => {

    // Create Lead Source
    const createLeadSource = async (data: LeadSourceInput) => {
        const { name } = data;

        const existingLeadSource = await leadSourceRepo.findOne({ where: { name } });
        if (existingLeadSource) throw new AppError(400, "Lead Source already exists");

        const leadSource = leadSourceRepo.create({ name });
        return await leadSourceRepo.save(leadSource);
    };

    // Get All Lead Sources
    const getAllLeadSources = async (params: GetLeadSourcesQuery) => {
        const {
            search = '',
            page = 1,
            limit = 10,
            sortBy = 'created_at',
            sortOrder = 'DESC',
        } = params;

        const query = leadSourceRepo
            .createQueryBuilder('leadSource')
            .where('leadSource.deleted = :deleted', { deleted: false });

        if (search) {
            query.andWhere('leadSource.name ILIKE :search', { search: `%${search}%` });
        }

        // Sorting
        query.orderBy(`leadSource.${sortBy}`, sortOrder);

        // Pagination
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


    // Get Lead Source by ID
    const getLeadSourceById = async (id: string) => {
        const leadSource = await leadSourceRepo.findOne({ where: { id, deleted: false } });
        if (!leadSource) throw new AppError(404, "Lead Source not found");
        return leadSource;
    };

    // Update Lead Source
    const updateLeadSource = async (id: string, data: Partial<LeadSourceInput>) => {
        const leadSource = await leadSourceRepo.findOne({ where: { id, deleted: false } });
        if (!leadSource) throw new AppError(404, "Lead Source not found");

        const { name } = data;

        if (name !== undefined) leadSource.name = name;

        return await leadSourceRepo.save(leadSource);
    };

    // Soft Delete Lead Source
    const softDeleteLeadSource = async (id: string) => {
        const leadSource = await leadSourceRepo.findOne({ where: { id, deleted: false } });
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
