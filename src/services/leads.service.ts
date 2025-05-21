import { AppDataSource } from "../utils/data-source";
import { Leads } from "../entities/leads.entity";
import { LeadSources } from "../entities/lead-sources.entity";
import { LeadStatuses } from "../entities/lead-statuses.entity";
import { User } from "../entities/user.entity";
import AppError from "../utils/appError";
import ExcelJS from "exceljs";

const leadRepo = AppDataSource.getRepository(Leads);
const userRepo = AppDataSource.getRepository(User);
const leadSourceRepo = AppDataSource.getRepository(LeadSources);
const leadStatusRepo = AppDataSource.getRepository(LeadStatuses);

// Create lead
export const LeadService = () => {
  // Create Lead
  const createLead = async (data: any) => {
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
    if (existingEmail) throw new AppError(400, "Lead with this email already exists");

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

  // Get All Leads
  const getAllLeads = async () => {
    return await leadRepo.find({
      where: { deleted: false },
      relations: ["source", "status", "assigned_to"],
    });
  };

  // Get Lead By ID
  const getLeadById = async (id: string) => {
    const lead = await leadRepo.findOne({
      where: { id, deleted: false },
      relations: ["source", "status", "assigned_to"],
    });
    if (!lead) throw new AppError(404, "Lead not found");
    return lead;
  };

  // Update Lead
  const updateLead = async (id: string, data: any) => {
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

    const lead = await leadRepo.findOne({ where: { id, deleted: false } });
    if (!lead) throw new AppError(404, "Lead not found");

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
      lead.source = source_id === null
        ? null
        : await leadSourceRepo.findOne({ where: { id: source_id } });
    }

    if (status_id !== undefined) {
      lead.status = status_id === null
        ? null
        : await leadStatusRepo.findOne({ where: { id: status_id } });
    }

    if (assigned_to !== undefined) {
      lead.assigned_to = assigned_to === null
        ? null
        : await userRepo.findOne({ where: { id: assigned_to } });
    }

    return await leadRepo.save(lead);
  };

  // Soft Delete Lead
  const softDeleteLead = async (id: string) => {
    const lead = await leadRepo.findOne({
      where: { id },
      relations: ["source", "status", "assigned_to"],
    });

    if (!lead) throw new AppError(404, "Lead not found");

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
  const exportLeadsToExcel = async (): Promise<ExcelJS.Workbook> => {
    const leadRepo = AppDataSource.getRepository(Leads);

    const leads = await leadRepo.find({
      where: { deleted: false },
      relations: ["source", "status", "assigned_to"],
      order: { created_at: "DESC" },
    });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Leads");

    worksheet.columns = [
      { header: "Sr No", key: "sr_no", width: 6 },
      { header: "First Name", key: "first_name", width: 20 },
      { header: "Last Name", key: "last_name", width: 20 },
      { header: "Company", key: "company", width: 25 },
      { header: "Phone", key: "phone", width: 20 },
      { header: "Email", key: "email", width: 30 },
      { header: "Location", key: "location", width: 20 },
      { header: "Budget", key: "budget", width: 15 },
      { header: "Requirement", key: "requirement", width: 40 },
      { header: "Source", key: "source", width: 20 },
      { header: "Status", key: "status", width: 20 },
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
        email: lead.email ?? "",
        location: lead.location ?? "",
        budget: lead.budget ?? 0,
        requirement: lead.requirement ?? "",
        source: lead.source?.name ?? "",
        status: lead.status?.name ?? "",
        assigned_to: lead.assigned_to?.name ?? "", // ✅ Only 'name' assumed for User
        created_at: lead.created_at?.toLocaleString() ?? "",
      });
    });

    return workbook;
  };

  return {
    createLead,
    getAllLeads,
    getLeadById,
    updateLead,
    softDeleteLead,
    exportLeadsToExcel
  };
};


