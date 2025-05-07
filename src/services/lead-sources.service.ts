import { LeadSources } from "../entities/lead-sources.entity";
import { AppDataSource } from "../utils/data-source";
import AppError from "../utils/appError";

const leadSourceRepo = AppDataSource.getRepository(LeadSources);

// create LeadSource
export const createLeadSourceService = async (name: string) => {
    console.log(name,"name########")
    const existingName = await leadSourceRepo.findOne({ where: { name } });
    if (existingName) {
        throw new Error("Lead source with this name already exists");
    }

    const leadSource = leadSourceRepo.create({ name, deleted: false });
    return await leadSourceRepo.save(leadSource);
};

// Get LeadSource By Id
export const getLeadSourceByIdService = async (id: string) => {
    const leadSource = await leadSourceRepo.findOne({
        where: { id, deleted: false },
    });

    if (!leadSource) {
        throw new Error("Lead source not found");
    }

    return leadSource;
};

// Get All LeadSource
export const getAllLeadSourceService = async () => {
    const leadSource = await leadSourceRepo.find({
        where: { deleted: false },
    });
    return leadSource;
};

// Update LeadSource By Id
export const updateLeadSourceService = async (id: string, data: Partial<LeadSources>) => {
    // Find the LeadSource by ID
    const leadSource = await leadSourceRepo.findOne({ where: { id, deleted: false } });

    // If the LeadSource is not found, throw an error
    if (!leadSource) {
        throw new AppError(404, 'LeadSource not found');
    }

    // Update the LeadSource record
    await leadSourceRepo.update(id, data);

    // Return the updated LeadSource
    return await leadSourceRepo.findOne({ where: { id } });
};

// Soft delete LeadSource by ID
export const softDeleteLeadSourceService = async (id: string) => {
    // Find the LeadSource entity by ID
    const leadSource = await leadSourceRepo.findOne({ where: { id } });

    if (!leadSource) {
        throw new AppError(404, 'LeadSource not found');
    }

    // Soft delete: Update the deleted flag to true
    leadSource.deleted = true;
    leadSource.deleted_at = new Date();
    await leadSourceRepo.save(leadSource);

    return leadSource; // Return the updated LeadSource entity
};