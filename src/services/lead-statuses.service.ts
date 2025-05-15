import { AppDataSource } from "../utils/data-source";
import { LeadStatuses } from "../entities/lead-statuses.entity";
import AppError from "../utils/appError";

interface LeadStatusInput {
    name: string;
}

const leadStatusRepo = AppDataSource.getRepository(LeadStatuses);

export const LeadStatusService = () => {

    // Create Lead Status
    const createLeadStatus = async (data: LeadStatusInput) => {
        const { name } = data;

        const existingLeadStatus = await leadStatusRepo.findOne({ where: { name } });
        if (existingLeadStatus) throw new AppError(400, "Lead Status already exists");

        const leadStatus = leadStatusRepo.create({ name });
        return await leadStatusRepo.save(leadStatus);
    };

    // Get All Lead Statuses
    const getAllLeadStatuses = async () => {
        return await leadStatusRepo.find({
            where: { deleted: false },
            order: { created_at: "DESC" },
        });
    };

    // Get Lead Status by ID
    const getLeadStatusById = async (id: string) => {
        const leadStatus = await leadStatusRepo.findOne({ where: { id, deleted: false } });
        if (!leadStatus) throw new AppError(404, "Lead Status not found");
        return leadStatus;
    };

    // Update Lead Status
    const updateLeadStatus = async (id: string, data: Partial<LeadStatusInput>) => {
        const leadStatus = await leadStatusRepo.findOne({ where: { id, deleted: false } });
        if (!leadStatus) throw new AppError(404, "Lead Status not found");

        const { name } = data;

        if (name !== undefined) leadStatus.name = name;

        return await leadStatusRepo.save(leadStatus);
    };

    // Soft Delete Lead Status
    const softDeleteLeadStatus = async (id: string) => {
        const leadStatus = await leadStatusRepo.findOne({ where: { id, deleted: false } });
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
