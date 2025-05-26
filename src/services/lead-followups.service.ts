// services/lead-followup.service.ts
import { AppDataSource } from "../utils/data-source";
import { LeadFollowup, FollowupStatus } from "../entities/lead-followups.entity";
import { Leads } from "../entities/leads.entity";
import { User } from "../entities/user.entity";
import AppError from "../utils/appError";

const leadFollowupRepo = AppDataSource.getRepository(LeadFollowup);
const leadRepo = AppDataSource.getRepository(Leads);
const userRepo = AppDataSource.getRepository(User);

export const LeadFollowupService = () => {

  // Create Lead Followup with any data
  const createLeadFollowup = async (data: any) => {
    const {
      lead_id,
      user_id,
      status = FollowupStatus.PENDING,
      due_date,
      remarks,
    } = data;

    const lead = await leadRepo.findOne({ where: { id: lead_id, deleted: false } });
    if (!lead) throw new AppError(404, "Lead not found");

    let user = null;
    if (user_id) {
      user = await userRepo.findOne({ where: { id: user_id } });
      if (!user) throw new AppError(404, "User not found");
    }

    const leadFollowup = new LeadFollowup();
    leadFollowup.lead = lead;
    leadFollowup.user = user;
    leadFollowup.status = status;
    leadFollowup.due_date = due_date ?? null;
    if(leadFollowup.status === FollowupStatus.COMPLETED) {
      leadFollowup.completed_date = new Date();
    }
    leadFollowup.remarks = remarks ?? "";

    return await leadFollowupRepo.save(leadFollowup);
  };

  // Get All Lead Followups
  const getAllLeadFollowups = async () => {
    return await leadFollowupRepo.find({
      where: { deleted: false },
      relations: ["lead", "user"],
    });
  };

  // Get Lead Followup By ID
  const getLeadFollowupById = async (id: string) => {
    const leadFollowup = await leadFollowupRepo.findOne({
      where: { id, deleted: false },
      relations: ["lead", "user"],
    });
    if (!leadFollowup) throw new AppError(404, "Lead Followup not found");
    return leadFollowup;
  };

  // Update Lead Followup with any data
  const updateLeadFollowup = async (id: string, data: any) => {
    const {
      user_id,
      status,
      due_date,
      completed_date,
      remarks,
    } = data;

    const leadFollowup = await leadFollowupRepo.findOne({ where: { id, deleted: false } });
    if (!leadFollowup) throw new AppError(404, "Lead Followup not found");

    if (user_id !== undefined) {
      if (user_id === null) {
        leadFollowup.user = null;
      } else {
        const user = await userRepo.findOne({ where: { id: user_id } });
        if (!user) throw new AppError(404, "User not found");
        leadFollowup.user = user;
      }
    }

    if (status !== undefined) leadFollowup.status = status;
    if (due_date !== undefined) leadFollowup.due_date = due_date;
    if (completed_date !== undefined) leadFollowup.completed_date = completed_date;
    if (remarks !== undefined) leadFollowup.remarks = remarks;

    return await leadFollowupRepo.save(leadFollowup);
  };

  // Soft Delete Lead Followup
  const softDeleteLeadFollowup = async (id: string) => {
    const leadFollowup = await leadFollowupRepo.findOne({ where: { id } });
    if (!leadFollowup) throw new AppError(404, "Lead Followup not found");

    leadFollowup.deleted = true;
    leadFollowup.deleted_at = new Date();

    await leadFollowupRepo.save(leadFollowup);

    return {
      status: "success",
      message: "Lead Followup soft deleted successfully",
      data: leadFollowup,
    };
  };

  return {
    createLeadFollowup,
    getAllLeadFollowups,
    getLeadFollowupById,
    updateLeadFollowup,
    softDeleteLeadFollowup,
  };
};



