// services/lead-followup.service.ts
import { AppDataSource } from "../utils/data-source";
import { LeadFollowup, FollowupStatus } from "../entities/lead-followups.entity";
import { Leads } from "../entities/leads.entity";
import { User } from "../entities/user.entity";
import AppError from "../utils/appError";
import { NotificationService } from "./notification.service";
import { NotificationType } from "../entities/notification.entity";

const leadFollowupRepo = AppDataSource.getRepository(LeadFollowup);
const leadRepo = AppDataSource.getRepository(Leads);
const userRepo = AppDataSource.getRepository(User);
const notificationService = NotificationService();

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

    const savedFollowup = await leadFollowupRepo.save(leadFollowup);

    // Get all admin users for notifications
    const adminUsers = await userRepo.find({
      where: { role: { role: "admin" } },
      relations: ["role"]
    });

    if (user) {
      await notificationService.createNotification(
        user.id,
        NotificationType.FOLLOWUP_CREATED,
        `Dear ${user?.first_name || ""} ${user?.last_name || ""}, a new follow-up has been assigned to you for lead: ${lead?.first_name || ""} ${lead?.last_name || ""}.`,
        {
          followupId: savedFollowup?.id,
          leadId: lead?.id,
          leadName: `${lead?.first_name} ${lead?.last_name}`,
          leadContact: lead.phone || lead.email,
          dueDate: due_date,
          remarks: remarks,
        }
      );
    }

    // Handle specific status notifications
    if (status === FollowupStatus.AWAITING_RESPONSE) {
      // Notify all admins about quotation sent
      for (const admin of adminUsers) {
        await notificationService.createNotification(
          admin.id,
          NotificationType.QUOTATION_SENT,
          `${user ? `${user.first_name} ${user.last_name}` : 'Staff'} has sent Quotation to ${lead.first_name} ${lead.last_name}, to know more click here`,
          {
            followupId: savedFollowup.id,
            leadId: lead.id,
            leadName: `${lead.first_name} ${lead.last_name}`,
            leadContact: lead.phone || lead.email,
            status: status,
            remarks: remarks,
            assignedBy: user ? `${user.first_name} ${user.last_name}` : 'Unassigned'
          }
        );
      }
    } else if (status === FollowupStatus.COMPLETED) {
      // Notify all admins about business done
      for (const admin of adminUsers) {
        await notificationService.createNotification(
          admin.id,
          NotificationType.BUSINESS_DONE,
          `${user ? `${user.first_name} ${user.last_name}` : 'Staff'} has completed business with ${lead.first_name} ${lead.last_name}, to know more click here`,
          {
            followupId: savedFollowup.id,
            leadId: lead.id,
            leadName: `${lead.first_name} ${lead.last_name}`,
            leadContact: lead.phone || lead.email,
            status: status,
            remarks: remarks,
            assignedBy: user ? `${user.first_name} ${user.last_name}` : 'Unassigned'
          }
        );
      }
    }

    // Send notification to assigned user
    if (user) {
      await notificationService.createNotification(
        user.id,
        NotificationType.FOLLOWUP_CREATED,
        `Dear ${user.first_name} ${user.last_name}, you have got new lead: ${lead.first_name} ${lead.last_name} (${lead.phone || lead.email})`,
        {
          followupId: savedFollowup.id,
          leadId: lead.id,
          leadName: `${lead.first_name} ${lead.last_name}`,
          leadContact: lead.phone || lead.email,
          dueDate: due_date,
          remarks: remarks
        }
      );
    }

    // If there's a due date, schedule a reminder notification
    if (due_date) {
      // Schedule a reminder notification for the due date
      const reminderDate = new Date(due_date);
      reminderDate.setHours(0, 0, 0, 0); // Set to start of day
      
      // Store the reminder in metadata for processing by a scheduled task
      await notificationService.createNotification(
        user?.id || 'system',
        NotificationType.FOLLOWUP_REMINDER,
        `You have to take follow-up for lead: ${lead.first_name} ${lead.last_name} today, click here to get more details`,
        {
          followupId: savedFollowup.id,
          leadId: lead.id,
          leadName: `${lead.first_name} ${lead.last_name}`,
          leadContact: lead.phone || lead.email,
          dueDate: due_date,
          reminderDate: reminderDate,
          remarks: remarks
        }
      );
    }

    // Notify all staff members
    const staffMembers = await userRepo.find({
      where: { role: { role: "staff" } },
      relations: ["role"]
    });

    for (const staff of staffMembers) {
      await notificationService.createNotification(
        staff.id,
        NotificationType.FOLLOWUP_CREATED,
        `New followup scheduled for lead: ${lead.first_name} ${lead.last_name} (${lead.phone || lead.email})`,
        {
          followupId: savedFollowup.id,
          leadId: lead.id,
          leadName: `${lead.first_name} ${lead.last_name}`,
          leadContact: lead.phone || lead.email,
          assignedTo: user ? `${user.first_name} ${user.last_name}` : 'Unassigned',
          dueDate: due_date,
          remarks: remarks
        }
      );
    }

    return savedFollowup;
  };

  // Get All Lead Followups
  // Get All Lead Followups
  const getAllLeadFollowups = async () => {
    return await leadFollowupRepo.find({
      where: { deleted: false },
      relations: ["lead", "user"],
    });
  };

  const getLeadFollowupsByLeadId = async (leadId: string) => {
    const followups = await leadFollowupRepo.find({
      where: {
        deleted: false,
        lead: { id: leadId },
      },
      relations: ["lead", "user"],
      order: { created_at: "DESC" }, // Optional: Latest first
    });

    return followups;
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

    const leadFollowup = await leadFollowupRepo.findOne({ 
      where: { id, deleted: false },
      relations: ["lead", "user"]
    });
    if (!leadFollowup) throw new AppError(404, "Lead Followup not found");

    const oldUser = leadFollowup.user;
    const oldDueDate = leadFollowup.due_date;

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

    const savedFollowup = await leadFollowupRepo.save(leadFollowup);

    // Send notifications for changes
    if (leadFollowup.user) {
      // Notify new assigned user if changed
      if (!oldUser || oldUser.id !== leadFollowup.user.id) {
        await notificationService.createNotification(
          leadFollowup.user.id,
          NotificationType.FOLLOWUP_UPDATED,
          `You have been assigned a followup for lead: ${leadFollowup.lead.first_name} ${leadFollowup.lead.last_name} (${leadFollowup.lead.phone || leadFollowup.lead.email})`,
          {
            followupId: savedFollowup.id,
            leadId: leadFollowup.lead.id,
            leadName: `${leadFollowup.lead.first_name} ${leadFollowup.lead.last_name}`,
            leadContact: leadFollowup.lead.phone || leadFollowup.lead.email,
            dueDate: leadFollowup.due_date,
            remarks: leadFollowup.remarks
          }
        );
      }

      // Notify about rescheduled followup
      if (oldDueDate && due_date && oldDueDate.getTime() !== due_date.getTime()) {
        await notificationService.createNotification(
          leadFollowup.user.id,
          NotificationType.FOLLOWUP_UPDATED,
          `Followup rescheduled for lead: ${leadFollowup.lead.first_name} ${leadFollowup.lead.last_name} (${leadFollowup.lead.phone || leadFollowup.lead.email})`,
          {
            followupId: savedFollowup.id,
            leadId: leadFollowup.lead.id,
            leadName: `${leadFollowup.lead.first_name} ${leadFollowup.lead.last_name}`,
            leadContact: leadFollowup.lead.phone || leadFollowup.lead.email,
            oldDueDate: oldDueDate,
            newDueDate: due_date,
            remarks: leadFollowup.remarks
          }
        );
      }
    }

    return savedFollowup;
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
    getLeadFollowupsByLeadId
  };
};



