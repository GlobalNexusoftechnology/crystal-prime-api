import { LeadSources } from "../entities/lead_sources.entity";
import { AppDataSource } from "../utils/data-source";
import AppError from "../utils/appError";

const leadsourceRepo = AppDataSource.getRepository(LeadSources);

// create LeadSource
export const createLeadSource = async (name: string) => {
    const existingName = await leadsourceRepo.findOne({ where: { name } });
    if (existingName) {
        throw new Error("Lead source with this name already exists");
    }

    const leadSource = leadsourceRepo.create({ name, deleted: false });
    return await leadsourceRepo.save(leadSource);
};

// Get LeadSource By Id
export const getLeadSourceById = async (id: string) => {
    const leadSource = await leadsourceRepo.findOne({
        where: { id, deleted: false },
    });

    if (!leadSource) {
        throw new Error("Lead source not found");
    }

    return leadSource;
};

// Get All LeadSource
export const getAllLeadSource = async () => {
    const leadSource = await leadsourceRepo.find({
        where: { deleted: false },
    });
    return leadSource;
};

// Update LeadSource By Id
export const updateLeadSource = async (id: string, data: Partial<LeadSources>) => {
    // Find the LeadSource by ID
    const leadSource = await leadsourceRepo.findOne({ where: { id, deleted: false } });

    // If the LeadSource is not found, throw an error
    if (!leadSource) {
        throw new AppError(404, 'LeadSource not found');
    }

    // Update the LeadSource record
    await leadsourceRepo.update(id, data);

    // Return the updated LeadSource
    return await leadsourceRepo.findOne({ where: { id } });
};

// Soft delete LeadSource by ID
export const softDeleteLeadSource = async (id: string) => {
    // Find the LeadSource entity by ID
    const leadSource = await leadsourceRepo.findOne({ where: { id } });

    if (!leadSource) {
        throw new AppError(404, 'LeadSource not found');
    }

    // Soft delete: Update the deleted flag to true
    leadSource.deleted = true;
    leadSource.deleted_at = new Date();
    await leadsourceRepo.save(leadSource);

    return leadSource; // Return the updated LeadSource entity
};