import { AppDataSource } from "../utils/data-source";
import { Leads } from "../entities/leads.entity";
import { LeadSources } from "../entities/lead-sources.entity";
import { LeadStatuses } from "../entities/lead-statuses.entity";
import { User } from "../entities/user.entity";
import AppError from "../utils/appError";

const leadRepo = AppDataSource.getRepository(Leads);
const userRepo = AppDataSource.getRepository(User);
const leadSourceRepo = AppDataSource.getRepository(LeadSources);
const leadStatusRepo = AppDataSource.getRepository(LeadStatuses);

// Create Lead
export const createLeadService = async (data: any) => {
  const {
    first_name,
    last_name,
    company,
    phone,
    email,
    location,
    budget,
    requirement,
    source_id,
    status_id,
    assigned_to,
  } = data;

  const existingEmail = email
    ? await leadRepo.findOne({ where: { email, deleted: false } })
    : null;

  if (existingEmail) {
    throw new AppError(400, "Lead with this email already exists");
  }

  const lead = new Leads();
  lead.first_name = first_name;
  lead.last_name = last_name;
  lead.company = company ?? "";
  lead.phone = phone ?? "";
  lead.email = email ?? "";
  lead.location = location ?? "";
  lead.budget = budget ?? 0;
  lead.requirement = requirement ?? "";

  if (source_id) {
    const source = await leadSourceRepo.findOne({ where: { id: source_id } });
    if (!source) throw new AppError(404, "Invalid Lead Source");
    lead.source = source;
  }

  if (status_id) {
    const status = await leadStatusRepo.findOne({ where: { id: status_id } });
    if (!status) throw new AppError(404, "Invalid Lead Status");
    lead.status = status;
  }

  if (assigned_to) {
    const user = await userRepo.findOne({ where: { id: assigned_to } });
    if (!user) throw new AppError(404, "Invalid Assigned User");
    lead.assigned_to = user;
  }

  return await leadRepo.save(lead);
};

// Get Lead By ID
export const getLeadByIdService = async (id: string) => {
  const lead = await leadRepo.findOne({
    where: { id, deleted: false },
    relations: ["source", "status", "assigned_to"],
  });

  if (!lead) {
    throw new AppError(404, "Lead not found");
  }

  return lead;
};

// Get All Leads
export const getAllLeadsService = async () => {
  return await leadRepo.find({
    where: { deleted: false },
    relations: ["source", "status", "assigned_to"],
  });
};

// Update Lead By ID
export const updateLeadService = async (id: string, data: any) => {
  const {
    first_name,
    last_name,
    company,
    phone,
    email,
    location,
    budget,
    requirement,
    source_id,
    status_id,
    assigned_to,
  } = data;

  const lead = await leadRepo.findOne({ where: { id, deleted: false }, });
  if (!lead) throw new AppError(404, "Lead not found");

  // Check email duplication (only if email is changing)
  if (email && email !== lead.email) {
    const existing = await leadRepo.findOne({ where: { email } });
    if (existing) throw new AppError(400, "Lead with this email already exists");
    lead.email = email;
  }

  lead.first_name = first_name ?? lead.first_name;
  lead.last_name = last_name ?? lead.last_name;
  lead.company = company ?? lead.company;
  lead.phone = phone ?? lead.phone;
  lead.location = location ?? lead.location;
  lead.budget = budget ?? lead.budget;
  lead.requirement = requirement ?? lead.requirement;

  if (source_id !== undefined) {
    if (source_id === null) {
      lead.source = null;
    } else {
      const source = await leadSourceRepo.findOne({ where: { id: source_id } });
      if (!source) throw new AppError(404, "Invalid Lead Source");
      lead.source = source;
    }
  }

  if (status_id !== undefined) {
    if (status_id === null) {
      lead.status = null;
    } else {
      const status = await leadStatusRepo.findOne({ where: { id: status_id } });
      if (!status) throw new AppError(404, "Invalid Lead Status");
      lead.status = status;
    }
  }

  if (assigned_to !== undefined) {
    if (assigned_to === null) {
      lead.assigned_to = null;
    } else {
      const user = await userRepo.findOne({ where: { id: assigned_to } });
      if (!user) throw new AppError(404, "Invalid Assigned User");
      lead.assigned_to = user;
    }
  }

  return await leadRepo.save(lead);
};

// Soft Delete Lead
export const softDeleteLeadService = async (id: string) => {
  // Fetch the lead including its related entities: source, status, and assigned_to
  const lead = await leadRepo.findOne({
    where: { id },
    relations: ['source', 'status', 'assigned_to'],  // Loading related entities
  });

  if (!lead) {
    throw new AppError(404, "Lead not found");
  }

  // Mark as deleted and set the deleted_at timestamp
  lead.deleted = true;
  lead.deleted_at = new Date();

  // Save the updated lead
  await leadRepo.save(lead);

  // Return the response with status, message, and the updated lead data
  return {
    status: "success",
    message: "Lead soft deleted successfully",
    data: lead,  // Returning the updated lead data
  };
};

