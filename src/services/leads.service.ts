import { AppDataSource } from "../utils/data-source";
import { ChannelType, Leads } from "../entities/leads.entity";
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
import { Between, ILike, Not } from "typeorm";
import { Clients } from "../entities/clients.entity";
import { createLeadSchema, createMetaLeadSchema } from "../schemas/leads.schema";
import { getValidToken } from "./page-token.service";
import { Document, Packer, Paragraph, TextRun, ImageRun, Table, TableRow, TableCell, WidthType, AlignmentType, BorderStyle } from "docx";
import fs from "fs";
import path from "path";
import { formatQuotationDate } from "../utils/formatQuotationDate";

const leadRepo = AppDataSource.getRepository(Leads);
const userRepo = AppDataSource.getRepository(User);
const leadSourceRepo = AppDataSource.getRepository(LeadSources);
const leadStatusRepo = AppDataSource.getRepository(LeadStatuses);
const leadTypeRepo = AppDataSource.getRepository(LeadTypes);
const leadFollowupRepo = AppDataSource.getRepository(LeadFollowup);
const clientRepo = AppDataSource.getRepository(Clients);

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
      possibility_of_conversion,
      source_id,
      status_id,
      type_id,
      assigned_to,
    } = data;

    // Validate email (optional now)
    if (email && typeof email !== "string") {
      throw new AppError(400, "Email must be a string");
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
    lead.email = email || "";
    lead.location = location ?? "";
    // Handle numeric fields properly
    lead.budget = budget && budget !== "" ? Number(budget) : null;
    lead.requirement = requirement ?? "";
    lead.possibility_of_conversion = possibility_of_conversion && possibility_of_conversion !== "" ? Number(possibility_of_conversion) : null;
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
  const getAllLeads = async (
    filters: any = {},
    userId?: string,
    role?: string
  ) => {
    const page = Number(filters.page) > 0 ? Number(filters.page) : 1;
    const limit = Number(filters.limit) > 0 ? Number(filters.limit) : 10;
    const skip = (page - 1) * limit;

    const {
      searchText,
      statusId,
      typeId,
      dateRange,
      referenceDate,
      followupFrom,
      followupTo,
      sourceId,
      assignedToId,
    } = filters;

    let query = leadRepo
      .createQueryBuilder("lead")
      .leftJoinAndSelect("lead.source", "source")
      .leftJoinAndSelect("lead.status", "status")
      .leftJoinAndSelect("lead.assigned_to", "assigned_to")
      .leftJoinAndSelect("lead.type", "type")
      .leftJoinAndSelect("lead.followups", "followup")
      .where("lead.deleted = false");

    // Role-based filtering - non-admins can only see their assigned leads
    if (role && role !== "admin" && role !== "Admin") {
      query = query.andWhere("assigned_to.id = :userId", { userId });
    }

    if (searchText && searchText.trim() !== "") {
      const search = `%${searchText.trim().toLowerCase()}%`;
      query = query.andWhere(
        `LOWER(lead.first_name) LIKE :search
         OR LOWER(lead.last_name) LIKE :search
         OR LOWER(lead.company) LIKE :search
         OR LOWER(lead.phone) LIKE :search
         OR LOWER(lead.location) LIKE :search
         OR LOWER(lead.requirement) LIKE :search
         OR LOWER(lead.email) LIKE :search`,
        { search }
      );
    }

    if (statusId && statusId !== "All Status") {
      query = query.andWhere("status.id = :statusId", { statusId });
    }

    if (typeId && typeId !== "All Type") {
      query = query.andWhere("type.id = :typeId", { typeId });
    }

    if (sourceId && sourceId !== "All Source") {
      query = query.andWhere("source.id = :sourceId", { sourceId });
    }

    if (assignedToId && assignedToId !== "All Assigned") {
      query = query.andWhere("assigned_to.id = :assignedToId", {
        assignedToId,
      });
    }

    const now = referenceDate ? new Date(referenceDate) : new Date();

    if (dateRange && dateRange !== "All") {
      let start: Date | undefined = undefined;
      let end: Date | undefined = undefined;

      if (dateRange === "Daily") {
        start = new Date(now);
        start.setHours(0, 0, 0, 0);
        end = new Date(now);
        end.setHours(23, 59, 59, 999);
      } else if (dateRange === "Weekly") {
        start = new Date(now);
        start.setDate(now.getDate() - now.getDay());
        start.setHours(0, 0, 0, 0);
        end = new Date(start);
        end.setDate(start.getDate() + 6);
        end.setHours(23, 59, 59, 999);
      } else if (dateRange === "Monthly") {
        start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
        end = new Date(
          now.getFullYear(),
          now.getMonth() + 1,
          0,
          23,
          59,
          59,
          999
        );
      }

      if (start && end) {
        query = query.andWhere("lead.created_at BETWEEN :start AND :end", {
          start,
          end,
        });
      }
    }

    if (followupFrom && followupTo) {
      query = query.andWhere(
        "followup.due_date BETWEEN :followupFrom AND :followupTo",
        {
          followupFrom,
          followupTo,
        }
      );
    } else if (followupFrom) {
      query = query.andWhere("followup.due_date >= :followupFrom", {
        followupFrom,
      });
    } else if (followupTo) {
      query = query.andWhere("followup.due_date <= :followupTo", {
        followupTo,
      });
    }

    query.orderBy("lead.created_at", "DESC");
    query.skip(skip).take(limit);

    const [leads, total] = await query.getManyAndCount();

    return {
      data: leads,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
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

  const getLeadStats = async (userId: string, role: string) => {
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

    const isAdmin = role === "admin" || role === "Admin";
    const assignedToFilter = isAdmin ? {} : { assigned_to: { id: userId } };
    const followupUserFilter = isAdmin ? {} : { user: { id: userId } };

    const [
      totalLeads,
      assignedToMe,
      profileSent,
      convertedLeads,
      lostLeads,
      todayFollowups,
    ] = await Promise.all([
      // Total leads
      leadRepo.count({ where: { deleted: false, ...assignedToFilter } }),

      // Assigned to me
      isAdmin
        ? leadRepo.count({ where: { deleted: false } })
        : leadRepo.count({
            where: { deleted: false, assigned_to: { id: userId } },
            relations: ["assigned_to"],
          }),

      // Profile sent
      leadRepo.count({
        where: {
          deleted: false,
          status: { name: "Profile Sent" },
          ...assignedToFilter,
        },
        relations: ["status"],
      }),

      // Converted leads
      leadRepo
        .createQueryBuilder("lead")
        .leftJoin("lead.status", "status")
        .where("lead.deleted = :deleted", { deleted: false })
        .andWhere("LOWER(status.name) IN (:...statuses)", {
          statuses: ["business done", "completed"], // Add more if needed
        })
        .andWhere(isAdmin ? "1=1" : "lead.assigned_to = :userId", { userId })
        .getCount(),

      // Lost leads (no-interested variations)
      leadRepo
        .createQueryBuilder("lead")
        .leftJoin("lead.status", "status")
        .where("lead.deleted = :deleted", { deleted: false })
        .andWhere("LOWER(status.name) IN (:...statuses)", {
          statuses: [
            "no-interested",
            "no interested",
            "not interested",
            "no-Interested",
          ],
        })
        .andWhere(isAdmin ? "1=1" : "lead.assigned_to = :userId", { userId })
        .getCount(),

      // Today's followups (date-only comparison, exclude COMPLETED)
      leadFollowupRepo
        .createQueryBuilder("f")
        .leftJoin("f.user", "u")
        .where("f.deleted = :deleted", { deleted: false })
        .andWhere("DATE(COALESCE(f.due_date, f.created_at)) = CURRENT_DATE")
        .andWhere("(f.status IS NULL OR f.status != :completed)", { completed: FollowupStatus.COMPLETED })
        .andWhere(isAdmin ? "1=1" : "u.id = :userId", { userId })
        .getCount(),
    ]);

    return {
      totalLeads,
      assignedToMe,
      profileSent,
      convertedLeads,
      lostLeads,
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
      possibility_of_conversion,
      source_id,
      status_id,
      type_id,
      assigned_to,
    } = data;

    const lead = await leadRepo.findOne({ where: { id, deleted: false },
    relations: ["assigned_to"],
   });
    if (!lead) throw new AppError(400, "Lead not found");

    if (email) {
      lead.email = email || "";
    }

    lead.first_name = first_name ?? lead.first_name;
    lead.last_name = last_name ?? lead.last_name;
    lead.company = company ?? lead.company;
    lead.phone = phone ?? lead.phone;
    lead.location = location ?? lead.location;
    lead.budget = budget ?? lead.budget;
    lead.requirement = requirement ?? lead.requirement;
    lead.possibility_of_conversion =
      possibility_of_conversion ?? lead.possibility_of_conversion;
    lead.other_contact = other_contact ?? lead.other_contact;
    lead.updated_by = `${userData?.first_name} ${userData?.last_name}`.trim();

    if (source_id !== undefined) {
      lead.source =
        source_id === null
          ? null
          : await leadSourceRepo.findOne({ where: { id: source_id } });
    }

    if (status_id) {
      const status = await leadStatusRepo.findOne({ where: { id: status_id } });
      if (status) {
        lead.status = status;

        //Status is completed add lead into client table.
        const currentStatus = status?.name?.toLocaleLowerCase();
        if (currentStatus === "business done") {
          const existingLead = await clientRepo.findOne({
            where: {
              lead: { id: lead.id },
            },
          });
          //if not already exist then create
          if (!existingLead) {
            const name = (lead.first_name ?? "") + (lead.last_name ?? "");

            let email = lead?.email || "";

            const contact_number = lead?.phone ?? "";
            const address = lead?.location ?? "";
            const company_name = lead?.company ?? "";
            const leadId = lead.id;

            const client = clientRepo.create({
              name,
              email,
              lead: { id: leadId },
              contact_number,
              address,
              company_name,
              contact_person: name,
            });
            await clientRepo.save(client); //save lead to client.
          }
        }
      }
    }

    if (type_id !== undefined) {
      lead.type =
        type_id === null
          ? null
          : await leadTypeRepo.findOne({ where: { id: type_id } });
    }

        // Handle lead escalation
        if (data.escalate_to === true) {
          lead.escalate_to = true;

          // Notify all admins about the escalated lead
          const adminUsers = await userRepo.find({
            where: { role: { role: "admin" }, deleted: false },
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

    if (assigned_to !== undefined && assigned_to !== lead.assigned_to?.id) {
      lead.assigned_to =
        assigned_to === null
          ? null
          : await userRepo.findOne({ where: { id: assigned_to } });

          await notificationService.createNotification(
            assigned_to,
            NotificationType.LEAD_ASSIGNED,
            `You have been assigned a new lead: ${lead.first_name} ${lead.last_name}`,
            {
              leadId: lead.id,
              leadName: `${lead.first_name} ${lead.last_name}`,
              assignedBy: `${userData?.first_name} ${userData?.last_name}`,
            }
          );
    }

    const savedLead = await leadRepo.save(lead);

    // // Send notification to assigned user if any
    // if (lead.assigned_to) {
    //   await notificationService.createNotification(
    //     lead.assigned_to.id,
    //     NotificationType.LEAD_ASSIGNED,
    //     `You have been assigned a new lead: ${first_name} ${last_name}`,
    //     {
    //       leadId: savedLead.id,
    //       leadName: `${first_name} ${last_name}`,
    //       assignedBy: `${userData?.first_name} ${userData?.last_name}`,
    //     }
    //   );
    // }

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
    userRole: string,
    searchText?: string,
    statusId?: string,
    typeId?: string,
    dateRange?: "All" | "Daily" | "Weekly" | "Monthly",
    referenceDate?: Date,
    followupFrom?: Date,
    followupTo?: Date,
    sourceId?: string,
    assignedToId?: string
  ): Promise<ExcelJS.Workbook> => {
    const filters = {
      searchText,
      statusId,
      typeId,
      dateRange,
      referenceDate,
      followupFrom,
      followupTo,
      sourceId,
      assignedToId,
      page: 1,
      limit: 10000, // Large limit to get all leads for export
    };

    const result = await getAllLeads(filters, userId, userRole);
    const leads = result.data;

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
      {
        header: "Possibility of Conversion (%)",
        key: "possibility_of_conversion",
        width: 25,
      },
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
        email: lead.email ?? "",
        location: lead.location ?? "",
        budget: lead.budget ?? 0,
        requirement: lead.requirement ?? "",
        possibility_of_conversion: lead.possibility_of_conversion ?? "",
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
      {
        header: "possibility_of_conversion",
        key: "possibility_of_conversion",
        width: 25,
      },
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
    await workbook.xlsx.load(fileBuffer as any);
    const worksheet = workbook.worksheets[0];

    const headers: string[] = [];
    worksheet.getRow(1).eachCell((cell) => {
      headers.push(cell.text.toLowerCase().trim());
    });

    // Define required fields
    const requiredFields = ["first_name", "last_name"];
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
        const cell = row.getCell(colIndex + 1);
        const cellValue = cell.value;

        let value = "";
        if (
          cellValue &&
          typeof cellValue === "object" &&
          "text" in cellValue &&
          cellValue.text &&
          typeof cellValue.text === "object" &&
          "richText" in (cellValue.text as any) &&
          Array.isArray((cellValue.text as any).richText)
        ) {
          value = ((cellValue.text as any).richText as any[])
            .map((rt: any) => rt.text)
            .join("");
        } else if (
          cellValue &&
          typeof cellValue === "object" &&
          "text" in cellValue &&
          typeof (cellValue as any).text === "string"
        ) {
          value = (cellValue as any).text;
        } else {
          value = cell.text || "";
        }
        leadData[header] = value;
      });

      leadData._rowNumber = rowNumber; // Attach row number for error tracking
      leadsToInsert.push(leadData);
    });

    const savedLeads = [];

    for (const data of leadsToInsert) {
      const rowNumber = data._rowNumber;

      // Check if email already exists (only if email is provided and valid)
      const email = data.email || "";
      const emailString = String(email).trim();

      if (emailString && emailString.length > 0) {
        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(emailString)) {
          throw new AppError(
            400,
            `Invalid email format at row ${rowNumber}: ${emailString}`
          );
        }

        const existingEmail = await leadRepo
          .createQueryBuilder("lead")
          .where("lead.deleted = false")
          .andWhere("lead.email = :email", { email: emailString })
          .getOne();

        if (existingEmail) {
          throw new AppError(
            400,
            `Email already exists at row ${rowNumber}: ${emailString}`
          );
        }
      }

      // Create lead object
      const lead = leadRepo.create({
        first_name: data.first_name || "",
        last_name: data.last_name || "",
        company: data.company || "",
        phone: data.phone || "",
        other_contact: data.other_contact || "",
        email: emailString,
        location: data.location || "",
        budget: Number(data.budget) || 0,
        requirement: data.requirement || "",
        possibility_of_conversion:
          Number(data.possibility_of_conversion) || null,
        created_by: `${user.first_name} ${user.last_name}` || "",
        updated_by: `${user.first_name} ${user.last_name}` || "",
      });

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

  const findLeadByEmail = async ({ email }: { email: string }) => {
    return await leadRepo
      .createQueryBuilder("lead")
      .where("lead.deleted = false")
      .andWhere("lead.email = :email", { email })
      .getOne();
  };

  const findLeadByPhoneNumber = async ({ phone }: { phone: string }) => {
    return await leadRepo.findOne({
      where: { phone, deleted: false },
    });
  };

  // Group leads by status for a given date range and user
  const groupLeadsByStatus = async (
    dateRange: "Weekly" | "Monthly" | "Yearly",
    userId?: string,
    role?: string,
    referenceDate?: Date
  ) => {
    const now = referenceDate ? new Date(referenceDate) : new Date();
    let start: Date | undefined;
    let end: Date | undefined;
    if (dateRange === "Weekly") {
      start = new Date(now);
      start.setDate(now.getDate() - now.getDay());
      start.setHours(0, 0, 0, 0);
      end = new Date(start);
      end.setDate(start.getDate() + 6);
      end.setHours(23, 59, 59, 999);
    } else if (dateRange === "Monthly") {
      start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    } else if (dateRange === "Yearly") {
      start = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
      end = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
    }
    const qb = leadRepo
      .createQueryBuilder("lead")
      .leftJoin("lead.status", "status")
      .select(["status.name AS status", "COUNT(*)::int AS count"])
      .where("lead.deleted = false");
    if (start && end) {
      qb.andWhere("lead.created_at BETWEEN :start AND :end", { start, end });
    }
    if (role !== "admin" && role !== "Admin" && userId) {
      qb.andWhere("lead.assigned_to = :userId", { userId });
    }
    return await qb.groupBy("status.name").getRawMany();
  };

  // Group leads by type for a given date range and user
  const groupLeadsByType = async (
    dateRange: "Weekly" | "Monthly" | "Yearly",
    userId?: string,
    role?: string,
    referenceDate?: Date
  ) => {
    const now = referenceDate ? new Date(referenceDate) : new Date();
    let start: Date | undefined;
    let end: Date | undefined;
    if (dateRange === "Weekly") {
      start = new Date(now);
      start.setDate(now.getDate() - now.getDay());
      start.setHours(0, 0, 0, 0);
      end = new Date(start);
      end.setDate(start.getDate() + 6);
      end.setHours(23, 59, 59, 999);
    } else if (dateRange === "Monthly") {
      start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    } else if (dateRange === "Yearly") {
      start = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
      end = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
    }
    const qb = leadRepo
      .createQueryBuilder("lead")
      .leftJoin("lead.type", "type")
      .select(["type.name AS type", "COUNT(*)::int AS count"])
      .where("lead.deleted = false");
    if (start && end) {
      qb.andWhere("lead.created_at BETWEEN :start AND :end", { start, end });
    }
    if (role !== "admin" && role !== "Admin" && userId) {
      qb.andWhere("lead.assigned_to = :userId", { userId });
    }
    return await qb.groupBy("type.name").getRawMany();
  };

  const verifyWebhook = (mode: any, token: any): boolean => {
    const VERIFY_TOKEN = process.env.META_VERIFY_TOKEN;

    if (mode === "subscribe" && token === VERIFY_TOKEN) {
      return true;
    }
    return false;
  };

  const handleMetaLead = async (leadId: string, channel: ChannelType) => {
  const PAGE_ACCESS_TOKEN = await getValidToken();
  const META_DATA_SOURCE_ENDPOINT = process.env.META_DATA_SOURCE_ENDPOINT!;


  // Step 1: Fetch the lead details
  const url = `${META_DATA_SOURCE_ENDPOINT}/${leadId}?access_token=${PAGE_ACCESS_TOKEN}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new AppError(400, "Failed to fetch lead from Meta");
  }

  const data = await response.json();
  const fieldData = data.field_data;

  console.log("\n\n\n\n\nMeta Lead Data:", data, "\n\n\n");

  const mapped: Record<string, any> = {};

  for (const item of fieldData) {
    const value = item.values?.[0];
    switch (item.name) {
      case "email":
        mapped.email = value;
        break;
      case "attachments":
        mapped.attachments = item.values;
        break;
      default:
        mapped[item.name] = value;
        break;
    }
  }

  createMetaLeadSchema.parse(mapped);

  // Step 2: Fetch Campaign Name
  let campaignName: string | null = null;
  try {
    const adId = data.ad_id;
    if (adId) {
      const adUrl = `${META_DATA_SOURCE_ENDPOINT}/${adId}?fields=adset{campaign{name}}&access_token=${PAGE_ACCESS_TOKEN}`;
      const adResp = await fetch(adUrl);

      if (adResp.ok) {
        const adData = await adResp.json();
        campaignName = adData?.adset?.campaign?.name || null;
        console.log("\n\n\n\nCampaign Name:", campaignName, "\n\n\n");
      }
    }
  } catch (err) {
    console.error("\n\nFailed to fetch campaign info: ", err, "\n\n");
  }

  // Step 3: Find Type in DB (optional)
  let leadType: LeadTypes | null = null;
  
  try {
    if (campaignName) {
      leadType = await leadTypeRepo.findOne({ where: { name: ILike(campaignName) } });

      if (!leadType) {
        console.log("\n\n\nNo matching Campaign name\n\n\n");
        return;
      }
    }
  } catch (e) {
    console.log("\n\n\nError while fetching lead types", e, "\n\n\n");
  }

  let phoneNumber = null;

  if(mapped?.phone_number){
    phoneNumber = mapped.phone_number;
  }else if(mapped?.phone){
    phoneNumber = mapped.phone;
  }
  
  // Step 4: Save lead
  const newLead = leadRepo.create({
    first_name: mapped.first_name,
    last_name: mapped.last_name,
    company: mapped.company,
    phone: phoneNumber,
    other_contact: mapped.other_contact ?? null,
    email: mapped.email || "",
    location: mapped.address,
    budget: mapped.budget && mapped.budget !== "" ? parseFloat(mapped.budget) : null,
    requirement: mapped.requirement,
    attachments: mapped.attachments || [],
    channel,
    type: leadType || null,
  });

  await leadRepo.save(newLead);

  console.log(
    "\n\n\n✅ Lead saved with campaign type:",
    campaignName,
    "->",
    leadType?.name || "null",
    "\n\n\n"
  );
};

  const handleGoogleLead = async (payload: any, receivedApiKey: string) => {
    const expectedApiKey = process.env.GOOGLE_SECRETE_KEY;

    if (!expectedApiKey || receivedApiKey !== expectedApiKey) {
      throw new AppError(401, "Unauthorized: Invalid API Key");
    }

    if (!payload) {
      throw new AppError(400, "Invalid payload from Google");
    }

    const prepData = {
      ...payload,
      email: payload.email || "",
      budget: payload.budget && payload.budget !== "" ? parseInt(payload.budget) : null,

      attachments: Array.isArray(payload.attachments)
        ? payload.attachments
        : payload.attachments
        ? [payload.attachments]
        : [],
    };

    const data = createLeadSchema.parse(prepData);

    const newLead = leadRepo.create({
      first_name: data.first_name,
      last_name: data.last_name,
      company: data.company,
      phone: data.phone,
      other_contact: data.other_contact,
      email: data.email || "",
      location: data.location,
      budget: data.budget && data.budget !== "" ? Number(data.budget) : null,
      requirement: data.requirement,
      attachments: data.attachments,
      channel: ChannelType.GOOGLE,
    });

    await leadRepo.save(newLead);
  };

  const generateQuotationDocService = async (
    leadId: string,
    proposalDate?: string,
    proposalNumber?: string,
    proposalText?: string
  ) => {
    const lead = await leadRepo.findOne({
      where: { id: leadId },
      relations: ["assigned_to", "status", "type", "source"],
    });
  
    if (!lead) throw new AppError(404, "Lead not found");
  
    // Read logo from file (support ts-node and compiled build locations)
    const logoCandidates = [
      path.join(__dirname, "../../public/satkar-logo.png"), // when running TS directly
      path.join(__dirname, "../../../src/public/satkar-logo.png"), // when running from build output
      path.join(process.cwd(), "src/public/satkar-logo.png"),
      path.join(process.cwd(), "public/satkar-logo.png"),
    ];
    const resolvedLogoPath = logoCandidates.find((p) => fs.existsSync(p));
    if (!resolvedLogoPath) {
      throw new AppError(500, "Quotation logo not found. Ensure 'src/public/satkar-logo.png' is available.");
    }
    const logoBuffer = fs.readFileSync(resolvedLogoPath);
  
    // Build document
    const doc = new Document({
      sections: [
        {
          children: [
            // Logo on top-left
            new Paragraph({
              children: [
                new ImageRun({
                  data: new Uint8Array(logoBuffer),
                  transformation: { width: 120, height: 40 },
                } as any),
              ],
            }),
            // Separator line under logo
            new Paragraph({
              border: {
                bottom: { style: BorderStyle.SINGLE, size: 4, color: "C0C0C0" },
              },
            }),
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              borders: {
                top: { style: BorderStyle.SINGLE, size: 4, color: "D0D0D0" },
                bottom: { style: BorderStyle.SINGLE, size: 4, color: "D0D0D0" },
                left: { style: BorderStyle.SINGLE, size: 4, color: "D0D0D0" },
                right: { style: BorderStyle.SINGLE, size: 4, color: "D0D0D0" },
                insideHorizontal: { style: BorderStyle.SINGLE, size: 4, color: "D0D0D0" },
                insideVertical: { style: BorderStyle.SINGLE, size: 4, color: "D0D0D0" },
              },
              rows: [
                new TableRow({
                  children: [
                    // Left Column (Static info)
                    new TableCell({
                      width: { size: 50, type: WidthType.PERCENTAGE },
                      margins: { top: 120, bottom: 120, left: 120, right: 120 },
                      children: [
                        new Paragraph({
                          children: [new TextRun({ text: "Quotation From:", bold: true })],
                          spacing: { after: 120 },
                        }),
                        new Paragraph({ text: "Satkar Software Solutions Private Limited" }),
                        new Paragraph({ text: "GST No: 27AAUCS490971ZW" }),
                        new Paragraph({ text: "Udyam Reg: UDYAM-MH-26-0525073" }),
                        new Paragraph({ text: "Email ID: manish@satkarinfotech.com" }),
                        new Paragraph({ text: "Contact Person: " }),
                        new Paragraph({ text: "Contact No: " }),
                      ],
                    }),
  
                    // Right Column (Client info)
                    new TableCell({
                      width: { size: 50, type: WidthType.PERCENTAGE },
                      margins: { top: 120, bottom: 120, left: 120, right: 120 },
                      children: [
                        new Paragraph({
                          alignment: AlignmentType.RIGHT,
                          children: [new TextRun({ text: "Quotation To:", bold: true })],
                          spacing: { after: 120 },
                        }),
                        new Paragraph({ text: lead.company || "-", alignment: AlignmentType.RIGHT }),
                        new Paragraph({ text: `Client GST No: -`, alignment: AlignmentType.RIGHT }),
                        new Paragraph({
                          text: `Client Name: ${lead.first_name || ""} ${lead.last_name || ""}`,
                          alignment: AlignmentType.RIGHT,
                        }),
                        new Paragraph({ text: `Client Address: ${lead.location || "-"}`, alignment: AlignmentType.RIGHT }),
                        new Paragraph({ text: `Client Contact No: ${lead.phone || "-"}`, alignment: AlignmentType.RIGHT }),
                        new Paragraph({ text: `Client Email ID: ${lead.email || "-"}`, alignment: AlignmentType.RIGHT }),
                      ],
                    }),
                  ],
                }),
              ],
            }),
            
            // Proposal Date and Number section
            new Paragraph({ text: "", spacing: { after: 200 } }),
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              rows: [
                new TableRow({
                  children: [
                    // Proposal Date field
                    new TableCell({
                      width: { size: 50, type: WidthType.PERCENTAGE },
                      margins: { top: 120, bottom: 120, left: 120, right: 120 },
                      borders: {
                        top: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
                        bottom: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
                        left: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
                        right: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
                      },
                      children: [
                        new Paragraph({
                          children: [
                            new TextRun({ text: "Proposal Date:", bold: true }),
                            new TextRun({ text: " " }),
                            new TextRun({ text: formatQuotationDate(proposalDate) || "_____________" }),
                          ],
                          alignment: AlignmentType.CENTER,
                          spacing: { after: 100, before: 100 },
                        }),
                      ],
                    }),
                    
                    // Proposal Number field
                    new TableCell({
                      width: { size: 50, type: WidthType.PERCENTAGE },
                      margins: { top: 120, bottom: 120, left: 120, right: 120 },
                      borders: {
                        top: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
                        bottom: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
                        left: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
                        right: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
                      },
                      children: [
                        new Paragraph({
                          children: [
                            new TextRun({ text: "Proposal Number:", bold: true }),
                            new TextRun({ text: " " }),
                            new TextRun({ text: proposalNumber || "_____________" }),
                          ],
                          alignment: AlignmentType.CENTER,
                          spacing: { after: 100, before: 100 },
                        }),
                      ],
                    }),
                  ],
                }),
              ],
            }),
            
            // Large text area section
            new Paragraph({ text: "", spacing: { after: 200 } }),
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              rows: [
                new TableRow({
                  children: [
                    new TableCell({
                      width: { size: 100, type: WidthType.PERCENTAGE },
                      margins: { top: 200, bottom: 200, left: 120, right: 120 },
                      borders: {
                        top: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
                        bottom: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
                        left: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
                        right: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
                      },
                      children: [
                        new Paragraph({
                          children: [
                            new TextRun({ text: "Proposal Details:", bold: true }),
                          ],
                          alignment: AlignmentType.LEFT,
                          spacing: { after: 120, before: 120 },
                        }),
                        new Paragraph({
                          text: proposalText || "_________________________________________________________",
                          alignment: AlignmentType.LEFT,
                          spacing: { after: 120, before: 0 },
                        }),
                      ],
                    }),
                  ],
                }),
              ],
            }),
          ],
        },
      ],
    });
  
    const buffer = await Packer.toBuffer(doc);
    return buffer;
  };

  return {
    generateQuotationDocService,
    handleGoogleLead,
    handleMetaLead,
    verifyWebhook,
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
    groupLeadsByStatus,
    groupLeadsByType,
  };
};
