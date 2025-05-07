import { LeadStatuses } from "../entities/lead-statuses.entity";
import { AppDataSource } from "../utils/data-source";
import AppError from "../utils/appError";

const leadStatusRepo = AppDataSource.getRepository(LeadStatuses);

// create LeadStatus
export const createLeadStatusService = async (name: string) => {
    const existingName = await leadStatusRepo.findOne({ where: { name } });

    if (existingName) {
        throw new Error("Lead status with this name already exists");
    }

    const leadSource = leadStatusRepo.create({ name, deleted: false });
    return await leadStatusRepo.save(leadSource);
};

// Get LeadStatus By Id
export const getLeadStatusByIdService = async (id: string) => {
    const leadSource = await leadStatusRepo.findOne({
        where: { id, deleted: false },
    });

    if (!leadSource) {
        throw new Error("Lead status not found");
    }

    return leadSource;
};

// Get All LeadStatus
export const getAllLeadStatusService = async () => {
    const leadSource = await leadStatusRepo.find({
        where: { deleted: false },
    });
    return leadSource;
};

// Update LeadStatus By Id
export const updateLeadStatusService = async (id: string, data: Partial<LeadStatuses>) => {
    // Find the LeadStatus by ID
    const leadStatus = await leadStatusRepo.findOne({ where: { id, deleted: false } });

    // If the LeadStatus is not found, throw an error
    if (!leadStatus) {
        throw new AppError(404, 'Lead status not found');
    }

    // Update the LeadStatus record
    await leadStatusRepo.update(id, data);

    // Return the updated LeadStatus
    return await leadStatusRepo.findOne({ where: { id } });
};

// Soft delete LeadStatus by ID
export const softDeleteLeadStatusService = async (id: string) => {
    // Find the LeadStatus entity by ID
    const leadStatus = await leadStatusRepo.findOne({ where: { id } });

    if (!leadStatus) {
        throw new AppError(404, 'Lead status not found');
    }

    // Soft delete: Update the deleted flag to true
    leadStatus.deleted = true;
    leadStatus.deleted_at = new Date();
    await leadStatusRepo.save(leadStatus);

    return leadStatus; 
};