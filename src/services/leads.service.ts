import { AppDataSource } from "../utils/data-source";
import { Leads } from "../entities/leads.entity";
import { LeadSources } from "../entities/lead-sources.entity";
import { LeadStatuses } from "../entities/lead-statuses.entity";
import { User } from "../entities/user.entity";
import AppError from "../utils/appError";
import ExcelJS from "exceljs";
import { LeadTypes } from "../entities/lead-type.entity";
import { NotificationService } from "./notification.service";
import { NotificationType } from "../entities/notification.entity";
import {
  LeadFollowup,
  FollowupStatus,
} from "../entities/lead-followups.entity";
import { Between, Not } from "typeorm";

const leadRepo = AppDataSource.getRepository(Leads);
const userRepo = AppDataSource.getRepository(User);
const leadSourceRepo = AppDataSource.getRepository(LeadSources);
const leadStatusRepo = AppDataSource.getRepository(LeadStatuses);
const leadTypeRepo = AppDataSource.getRepository(LeadTypes);
const leadFollowupRepo = AppDataSource.getRepository(LeadFollowup);

const notificationService = NotificationService();
// Create lead
export const LeadService = () => {
  // Create Lead
  const createLead = async (data: any, userData: any) => {
    const {
      first_name,
      last_name,
      company,
      phone,
      other_contact,
      email,
      location,
      budget,
      requirement,
      source_id,
      status_id,
      type_id,
      assigned_to,
    } = data;

    // Validate emails
    if (!email || !Array.isArray(email) || email.length === 0) {
      throw new AppError(400, "At least one email is required");
    }

    // Check if any email already exists
    // for (const emailStr of email) {
    //   const existing = await leadRepo.findOne({ where: { email: emailStr } });
    //   if (existing) {
    //     throw new AppError(400, `Email ${emailStr} already exists`);
    //   }
    // }

    const lead = new Leads();
    lead.first_name = first_name;
    lead.last_name = last_name;
    lead.company = company ?? "";
    lead.phone = phone ?? "";
    lead.email = Array.isArray(email)
      ? email
      : typeof email === "string"
      ? [email]
      : [];
    lead.location = location ?? "";
    lead.budget = budget ?? 0;
    lead.requirement = requirement ?? "";
    lead.other_contact = other_contact ?? "";
    lead.created_by = `${userData?.first_name} ${userData?.last_name}`.trim();
    lead.updated_by = `${userData?.first_name} ${userData?.last_name}`.trim();

    if (source_id) {
      const source = await leadSourceRepo.findOne({ where: { id: source_id } });
      if (!source) throw new AppError(400, "Invalid Lead Source");
      lead.source = source;
    }

    if (status_id) {
      const status = await leadStatusRepo.findOne({ where: { id: status_id } });
      if (!status) throw new AppError(400, "Invalid Lead Status");
      lead.status = status;
    }

    if (type_id) {
      const type = await leadTypeRepo.findOne({ where: { id: type_id } });
      if (!type) throw new AppError(400, "Invalid Lead Type");
      lead.type = type;
    }

    if (assigned_to) {
      const user = await userRepo.findOne({ where: { id: assigned_to } });
      if (!user) throw new AppError(400, "Invalid Assigned User");
      lead.assigned_to = user;
    }

    const savedLead = await leadRepo.save(lead);

    // Send notification to assigned user if any
    if (lead.assigned_to) {
      await notificationService.createNotification(
        lead.assigned_to.id,
        NotificationType.LEAD_ASSIGNED,
        `You have been assigned a new lead: ${first_name} ${last_name}`,
        {
          leadId: savedLead.id,
          leadName: `${first_name} ${last_name}`,
          assignedBy: `${userData?.first_name} ${userData?.last_name}`,
        }
      );
    }

    return savedLead;
  };

  // Get All Leads
  const getAllLeads = async () => {
    return await leadRepo.find({
      where: { deleted: false },
      relations: ["source", "status", "assigned_to", "type"],
      order: {
        created_at: "DESC",
      },
    });
  };

  // Get Lead By ID
  const getLeadById = async (id: string) => {
    const lead = await leadRepo.findOne({
      where: { id, deleted: false },
      relations: ["source", "status", "assigned_to", "type"],
    });
    if (!lead) throw new AppError(400, "Lead not found");
    return lead;
  };

  const getLeadStats = async (userId: string) => {
    // Get today's start and end timestamps in UTC
    const now = new Date();
    const today = new Date(
      Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate(),
        0,
        0,
        0,
        0
      )
    );
    const tomorrow = new Date(
      Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate() + 1,
        0,
        0,
        0,
        0
      )
    );

    const [
      totalLeads,
      assignedToMe,
      profileSent,
      businessDone,
      notInterested,
      todayFollowups,
    ] = await Promise.all([
      leadRepo.count({ where: { deleted: false } }),

      leadRepo.count({
        where: { deleted: false, assigned_to: { id: userId } },
        relations: ["assigned_to"],
      }),

      leadRepo.count({
        where: { deleted: false, status: { name: "Profile Sent" } },
        relations: ["status"],
      }),

      leadRepo.count({
        where: { deleted: false, status: { name: "Business Done" } },
        relations: ["status"],
      }),

      leadRepo.count({
        where: { deleted: false, status: { name: "Not Interested" } },
        relations: ["status"],
      }),

      // Get today's followups count
      leadFollowupRepo.count({
        where: {
          deleted: false,
          user: { id: userId },
          due_date: Between(today, tomorrow),
          status: Not(FollowupStatus.COMPLETED),
        },
        relations: ["user"],
      }),
    ]);

    return {
      totalLeads,
      assignedToMe,
      profileSent,
      businessDone,
      notInterested,
      todayFollowups,
    };
  };

  // Update Lead
  const updateLead = async (id: string, data: any, userData: any) => {
    const {
      first_name,
      last_name,
      company,
      phone,
      other_contact,
      email,
      location,
      budget,
      requirement,
      source_id,
      status_id,
      type_id,
      assigned_to,
    } = data;

    const lead = await leadRepo.findOne({ where: { id, deleted: false } });
    if (!lead) throw new AppError(400, "Lead not found");

    if (email) {
      const newEmailArray = Array.isArray(email)
        ? email
        : typeof email === "string"
        ? [email]
        : [];

      // Optionally check for duplicate emails in the array
      // const existing = await leadRepo
      //   .createQueryBuilder("lead")
      //   .where("lead.id != :id", { id })
      //   .andWhere(":emailList && lead.email", { emailList: newEmailArray })
      //   .getOne();

      // if (existing) {
      //   throw new AppError(400, "One or more emails already exist in another lead");
      // }

      lead.email = newEmailArray;
    }

    lead.first_name = first_name ?? lead.first_name;
    lead.last_name = last_name ?? lead.last_name;
    lead.company = company ?? lead.company;
    lead.phone = phone ?? lead.phone;
    lead.location = location ?? lead.location;
    lead.budget = budget ?? lead.budget;
    lead.requirement = requirement ?? lead.requirement;
    lead.other_contact = other_contact ?? lead.other_contact;
    lead.updated_by = `${userData?.first_name} ${userData?.last_name}`.trim();

    if (source_id !== undefined) {
      lead.source =
        source_id === null
          ? null
          : await leadSourceRepo.findOne({ where: { id: source_id } });
    }

    if (status_id !== undefined) {
      lead.status =
        status_id === null
          ? null
          : await leadStatusRepo.findOne({ where: { id: status_id } });
    }

    if (type_id !== undefined) {
      lead.type =
        type_id === null
          ? null
          : await leadTypeRepo.findOne({ where: { id: type_id } });
    }

    if (assigned_to !== undefined) {
      lead.assigned_to =
        assigned_to === null
          ? null
          : await userRepo.findOne({ where: { id: assigned_to } });
    }

    // Handle lead escalation
    if (data.escalate_to === true && !lead.escalate_to) {
      lead.escalate_to = true;

      // Get all staff members to notify
      const staffMembers = await userRepo.find({
        where: { role: { role: "staff" } },
        relations: ["role"],
      });

      // Notify all staff members about the escalated lead
      for (const staff of staffMembers) {
        await notificationService.createNotification(
          staff.id,
          NotificationType.LEAD_ESCALATED,
          `Lead Escalated: ${lead.first_name} ${lead.last_name} (${
            lead.phone || lead.email
          })`,
          {
            leadId: lead.id,
            leadName: `${lead.first_name} ${lead.last_name}`,
            leadContact: lead.phone || lead.email,
            escalatedBy: `${userData?.first_name} ${userData?.last_name}`,
            requirement: lead.requirement,
          }
        );
      }

      // Notify all admins about the escalated lead
      const adminUsers = await userRepo.find({
        where: { role: { role: "admin" } },
        relations: ["role"],
      });

      for (const admin of adminUsers) {
        await notificationService.createNotification(
          admin.id,
          NotificationType.LEAD_ESCALATED,
          `Lead Escalated: ${lead.first_name} ${lead.last_name} (${
            lead.phone || lead.email
          })`,
          {
            leadId: lead.id,
            leadName: `${lead.first_name} ${lead.last_name}`,
            leadContact: lead.phone || lead.email,
            escalatedBy: `${userData?.first_name} ${userData?.last_name}`,
            requirement: lead.requirement,
          }
        );
      }
    }

    const savedLead = await leadRepo.save(lead);

    // Send notification to assigned user if any
    if (lead.assigned_to) {
      await notificationService.createNotification(
        lead.assigned_to.id,
        NotificationType.LEAD_ASSIGNED,
        `You have been assigned a new lead: ${first_name} ${last_name}`,
        {
          leadId: savedLead.id,
          leadName: `${first_name} ${last_name}`,
          assignedBy: `${userData?.first_name} ${userData?.last_name}`,
        }
      );
    }

    return savedLead;
  };

  // Soft Delete Lead
  const softDeleteLead = async (id: string) => {
    const lead = await leadRepo.findOne({
      where: { id },
      relations: ["source", "status", "assigned_to", "type"],
    });

    if (!lead) throw new AppError(400, "Lead not found");

    lead.deleted = true;
    lead.deleted_at = new Date();

    await leadRepo.save(lead);

    return {
      status: "success",
      message: "Lead soft deleted successfully",
      data: lead,
    };
  };

  //  Export Leads to Excel
  const exportLeadsToExcel = async (
    userId: string,
    userRole: string
  ): Promise<ExcelJS.Workbook> => {
    const leadRepo = AppDataSource.getRepository(Leads);

    let leads: Leads[];

    if (userRole === "admin" || userRole === "Admin") {
      leads = await leadRepo.find({
        where: { deleted: false },
        relations: ["source", "status", "assigned_to", "type"],
        order: { created_at: "DESC" },
      });
    } else {
      leads = await leadRepo.find({
        where: { deleted: false, assigned_to: { id: userId } },
        relations: ["source", "status", "assigned_to", "type"],
        order: { created_at: "DESC" },
      });
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Leads");

    worksheet.columns = [
      { header: "Sr No", key: "sr_no", width: 6 },
      { header: "First Name", key: "first_name", width: 20 },
      { header: "Last Name", key: "last_name", width: 20 },
      { header: "Company", key: "company", width: 25 },
      { header: "Phone", key: "phone", width: 20 },
      { header: "Other Contact", key: "other_contact", width: 20 },
      { header: "Email", key: "email", width: 30 },
      { header: "Location", key: "location", width: 20 },
      { header: "Budget", key: "budget", width: 15 },
      { header: "Requirement", key: "requirement", width: 40 },
      { header: "Source", key: "source", width: 20 },
      { header: "Status", key: "status", width: 20 },
      { header: "type", key: "type", width: 20 },
      { header: "Assigned To", key: "assigned_to", width: 25 },
      { header: "Created At", key: "created_at", width: 25 },
    ];

    leads.forEach((lead, index) => {
      worksheet.addRow({
        sr_no: index + 1,
        first_name: lead.first_name,
        last_name: lead.last_name,
        company: lead.company ?? "",
        phone: lead.phone ?? "",
        other_contact: lead.other_contact ?? "",
        email: lead.email?.join(", ") ?? "",
        location: lead.location ?? "",
        budget: lead.budget ?? 0,
        requirement: lead.requirement ?? "",
        source: lead.source?.name ?? "",
        status: lead.status?.name ?? "",
        type: lead.type?.name ?? "",
        assigned_to: `${lead.assigned_to?.first_name} ${lead.assigned_to?.last_name}`,
        created_at: lead.created_at?.toLocaleString() ?? "",
      });
    });

    return workbook;
  };

  const generateLeadTemplate = async (): Promise<ExcelJS.Workbook> => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Leads");

    worksheet.columns = [
      { header: "first_name", key: "first_name", width: 20 },
      { header: "last_name", key: "last_name", width: 20 },
      { header: "company", key: "company", width: 25 },
      { header: "phone", key: "phone", width: 15 },
      { header: "other_contact", key: "other_contact", width: 15 },
      { header: "email", key: "email", width: 25 },
      { header: "location", key: "location", width: 20 },
      { header: "requirement", key: "requirement", width: 20 },
      { header: "budget", key: "budget", width: 15 },
      { header: "source", key: "source", width: 15 },
      { header: "status", key: "status", width: 15 },
      { header: "type", key: "type", width: 15 },
    ];

    return workbook;
  };

  // Service to handle Excel upload
  const uploadLeadsFromExcelService = async (
    fileBuffer: Buffer,
    user: User
  ) => {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(fileBuffer);
    const worksheet = workbook.worksheets[0];

    const headers: string[] = [];
    worksheet.getRow(1).eachCell((cell) => {
      headers.push(cell.text.toLowerCase().trim());
    });

    // Define required fields
    const requiredFields = ["first_name", "last_name", "email"];
    const missingFields = requiredFields.filter(
      (field) => !headers.includes(field)
    );
    if (missingFields.length > 0) {
      throw new AppError(
        400,
        `Missing required fields: ${missingFields.join(", ")}`
      );
    }

    const leadsToInsert: any[] = [];
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return; // Skip header row

      const leadData: any = {};
      headers.forEach((header, colIndex) => {
        leadData[header] = row.getCell(colIndex + 1).value || "";
      });

      leadData._rowNumber = rowNumber; // Attach row number for error tracking
      leadsToInsert.push(leadData);
    });

    const savedLeads = [];

    for (const data of leadsToInsert) {
      const rowNumber = data._rowNumber;

      // Check if email already exists
      const email = data.email?.text || data.email || "";
      const emailList = String(email)
        .split(",")
        .map((e) => e.trim())
        .filter(Boolean);

      const existingEmail = await leadRepo
        .createQueryBuilder("lead")
        .where("lead.deleted = false")
        .andWhere(":emailList && lead.email", { emailList })
        .getOne();

      if (existingEmail) {
        throw new AppError(
          400,
          `Email already exists at row ${rowNumber}: ${email}`
        );
      }

      // Create lead object
      const lead = leadRepo.create({
        first_name: data.first_name || "",
        last_name: data.last_name || "",
        company: data.company || "",
        phone: data.phone || "",
        other_contact: data.other_contact || "",
        email: String(email)
          .split(",")
          .map((e) => e.trim())
          .filter(Boolean),
        location: data.location || "",
        budget: Number(data.budget) || 0,
        requirement: data.requirement || "",
        created_by: `${user.first_name} ${user.last_name}` || "",
        updated_by: `${user.first_name} ${user.last_name}` || "",
      });

      lead.email = emailList;

      // Find Source by Name
      if (data.source) {
        const source = await leadSourceRepo.findOne({
          where: { name: String(data.source).trim() },
        });
        if (!source) {
          throw new AppError(
            400,
            `Invalid source name at row ${rowNumber}: ${data.source}`
          );
        }
        lead.source = source;
      }

      if (data.type) {
        const type = await leadTypeRepo.findOne({
          where: { name: String(data.type).trim() },
        });
        if (!type) {
          throw new AppError(
            400,
            `Invalid type name at row ${rowNumber}: ${data.type}`
          );
        }
        lead.type = type;
      }

      // Find Status by Name
      if (data.status) {
        const status = await leadStatusRepo.findOne({
          where: { name: String(data.status).trim() },
        });
        if (!status) {
          throw new AppError(
            400,
            `Invalid status name at row ${rowNumber}: ${data.status}`
          );
        }
        lead.status = status;
      }

      lead.assigned_to = user;

      const saved = await leadRepo.save(lead);
      savedLeads.push(saved);
    }

    return { total: savedLeads.length, leads: savedLeads };
  };

  const findLeadByEmail = async ({ emailList }: { emailList: string[] }) => {
    return await leadRepo
      .createQueryBuilder("lead")
      .where("lead.deleted = false")
      .andWhere(":emailList && lead.email", { emailList })
      .getOne();
  };

  const findLeadByPhoneNumber = async ({ phone }: { phone: string }) => {
    return await leadRepo.findOne({
      where: { phone, deleted: false },
    });
  };

  return {
    createLead,
    getAllLeads,
    getLeadStats,
    getLeadById,
    updateLead,
    softDeleteLead,
    exportLeadsToExcel,
    generateLeadTemplate,
    uploadLeadsFromExcelService,
    findLeadByEmail,
    findLeadByPhoneNumber,
  };
};
