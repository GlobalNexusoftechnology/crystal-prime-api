import { AppDataSource } from "../utils/data-source";
import { LeadFollowup } from "../entities/lead-followups.entity";
import { Leads } from "../entities/leads.entity";
import { User } from "../entities/user.entity";
import AppError from "../utils/appError";

const followupRepo = AppDataSource.getRepository(LeadFollowup);
const leadRepo = AppDataSource.getRepository(Leads);
const userRepo = AppDataSource.getRepository(User);

// Create Followup
export const createFollowupService = async (data: any) => {
  const {
    lead_id,
    user_id,
    status,
    due_date,
    completed_date,
    remarks,
  } = data;

  const lead = await leadRepo.findOne({ where: { id: lead_id, deleted: false } });
  if (!lead) throw new AppError(404, "Lead not found");

  // const user = await userRepo.findOne({ where: { id: user_id } });
  // if (!user) throw new AppError(404, "User not found");

  const followup = followupRepo.create({
    lead,
    // user,
    status,
    due_date,
    completed_date,
    remarks,
  });

  return await followupRepo.save(followup);
};

// Get All Followups
export const getAllFollowupsService = async () => {
  return await followupRepo.find({
    where: { deleted: false },
    relations: ["lead", "user"],
    order: { created_at: "DESC" },
  });
};

// Get Followup by ID
export const getFollowupByIdService = async (id: string) => {
  const followup = await followupRepo.findOne({
    where: { id, deleted: false },
    relations: ["lead", "user"],
  });
  if (!followup) throw new AppError(404, "Followup not found");
  return followup;
};

// Update Followup
export const updateFollowupService = async (id: string, data: any) => {
  const followup = await followupRepo.findOne({ where: { id, deleted: false } });
  if (!followup) throw new AppError(404, "Followup not found");

  const {
    lead_id,
    user_id,
    status,
    due_date,
    completed_date,
    remarks,
  } = data;

  if (lead_id) {
    const lead = await leadRepo.findOne({ where: { id: lead_id, deleted: false } });
    if (!lead) throw new AppError(404, "Lead not found");
    followup.lead = lead;
  }

  if (user_id) {
    const user = await userRepo.findOne({ where: { id: user_id } });
    if (!user) throw new AppError(404, "User not found");
    followup.user = user;
  }

  followup.status = status ?? followup.status;
  followup.due_date = due_date ?? followup.due_date;
  followup.completed_date = completed_date ?? followup.completed_date;
  followup.remarks = remarks ?? followup.remarks;

  return await followupRepo.save(followup);
};

// Soft Delete Followup
export const softDeleteFollowupService = async (id: string) => {
  const followup = await followupRepo.findOne({ where: { id, deleted: false } });
  if (!followup) throw new AppError(404, "Followup not found");

  followup.deleted = true;
  followup.deleted_at = new Date();

  await followupRepo.save(followup);

  return followup;
};


