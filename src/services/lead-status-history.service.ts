import { AppDataSource } from "../utils/data-source";
import { LeadStatusHistory } from "../entities/lead-status-history.entity";
import { Leads } from "../entities/leads.entity";
import { User } from "../entities/user.entity";
import { LeadStatuses } from "../entities/lead-statuses.entity";
import AppError from "../utils/appError";

interface StatusHistoryInput {
  lead_id: string;
  status_id?: string | null;  // status_id can be string, null, or undefined
  changed_by: string | null;  // changed_by can be string or null
  status_remarks?: string | null;  // status_remarks can be string, null, or undefined
}

const historyRepo = AppDataSource.getRepository(LeadStatusHistory);
const leadRepo = AppDataSource.getRepository(Leads);
const userRepo = AppDataSource.getRepository(User);
const statusRepo = AppDataSource.getRepository(LeadStatuses);

export const LeadStatusHistoryService = () => {
  // Create
  const createStatusHistory = async (data: StatusHistoryInput) => {
    const { lead_id, status_id, changed_by, status_remarks } = data;

    // Validate lead
    const lead = await leadRepo.findOne({ where: { id: lead_id, deleted: false } });
    if (!lead) throw new AppError(404, "Lead not found");

    // Validate user (changed_by)
    if (changed_by) {
      const user = await userRepo.findOne({ where: { id: changed_by } });
      if (!user) throw new AppError(404, "Changed by user not found");
    }

    // Validate status
    let status = null;
    if (status_id) {
      status = await statusRepo.findOne({ where: { id: status_id } });
      if (!status) throw new AppError(404, "Status not found");
    }

    // Create history record
    const record = historyRepo.create({
      lead,
      status,
      changed_by: changed_by ? await userRepo.findOne({ where: { id: changed_by } }) : null,  // Handle changed_by being nullable
      status_remarks,
    });

    // Update lead status if status is provided
    if (status) {
      lead.status = status;
      await leadRepo.save(lead);
    }    

    return await historyRepo.save(record);
  };

  // Get All
  const getAllStatusHistories = async (leadId?: string) => {
    if (leadId) {
      return await historyRepo.find({
        where: { deleted: false, lead: { id: leadId } },
        relations: ["lead", "status", "changed_by"],
        order: { created_at: "DESC" },
      });
    }
    return await historyRepo.find({
      where: { deleted: false },
      relations: ["lead", "status", "changed_by"],
      order: { created_at: "DESC" },
    });
  };

  // Get by ID
  const getStatusHistoryById = async (id: string) => {
    const record = await historyRepo.findOne({
      where: { id, deleted: false },
      relations: ["lead", "status", "changed_by"],
    });

    if (!record) throw new AppError(404, "Status history not found");
    return record;
  };

  // Update
  const updateStatusHistory = async (id: string, data: Partial<StatusHistoryInput>) => {
    const record = await historyRepo.findOne({
      where: { id, deleted: false },
      relations: ["lead", "status", "changed_by"],
    });

    if (!record) throw new AppError(404, "Status history not found");

    const { lead_id, status_id, changed_by, status_remarks } = data;

    // Update lead if provided
    if (lead_id) {
      const lead = await leadRepo.findOne({ where: { id: lead_id, deleted: false } });
      if (!lead) throw new AppError(404, "Lead not found");
      record.lead = lead;
    }

    // Update changed_by if provided
    if (changed_by) {
      const user = await userRepo.findOne({ where: { id: changed_by } });
      if (!user) throw new AppError(404, "User not found");
      record.changed_by = user;
    }

    // Update status if provided
    if (status_id) {
      const status = await statusRepo.findOne({ where: { id: status_id } });
      if (!status) throw new AppError(404, "Status not found");
      record.status = status;
    }

    // Update status_remarks if provided
    if (status_remarks !== undefined) record.status_remarks = status_remarks;

    return await historyRepo.save(record);
  };

  // Soft Delete
  const softDeleteStatusHistory = async (id: string) => {
    const record = await historyRepo.findOne({ where: { id, deleted: false } });
    if (!record) throw new AppError(404, "Status history not found");

    record.deleted = true;
    record.deleted_at = new Date();

    return await historyRepo.save(record);
  };

  // Get by Lead ID
  const getStatusHistoriesByLeadId = async (leadId: string) => {
    const lead = await leadRepo.findOne({ where: { id: leadId, deleted: false } });
    if (!lead) throw new AppError(404, "Lead not found");

    return await historyRepo.find({
      where: { deleted: false, lead: { id: leadId } },
      relations: ["lead", "status", "changed_by"],
      order: { created_at: "DESC" },
    });
  };

  return {
    createStatusHistory,
    getAllStatusHistories,
    getStatusHistoryById,
    updateStatusHistory,
    softDeleteStatusHistory,
    getStatusHistoriesByLeadId,
  };
};

