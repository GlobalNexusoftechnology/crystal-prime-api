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
      if (!source) throw new AppError(400, "Invalid Lead Source");
      lead.source = source;
    }

    if (status_id) {
      const status = await leadStatusRepo.findOne({ where: { id: status_id } });
      if (!status) throw new AppError(400, "Invalid Lead Status");
      lead.status = status;
    }

    if (assigned_to) {
      const user = await userRepo.findOne({ where: { id: assigned_to } });
      if (!user) throw new AppError(400, "Invalid Assigned User");
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
    if (!lead) throw new AppError(400, "Lead not found");
    return lead;
  };

  const getLeadStats = async (userId: string) => {
    const [totalLeads, assignedToMe, profileSent, businessDone, notInterested] =
      await Promise.all([
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
      ]);

    return {
      totalLeads,
      assignedToMe,
      profileSent,
      businessDone,
      notInterested,
    };
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
    if (!lead) throw new AppError(400, "Lead not found");

    if (email && email !== lead.email) {
      const existing = await leadRepo.findOne({ where: { email } });
      if (existing)
        throw new AppError(400, "Lead with this email already exists");
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

    if (assigned_to !== undefined) {
      lead.assigned_to =
        assigned_to === null
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
      relations: ["source", "status", "assigned_to"],
      order: { created_at: "DESC" },
    });
  } else {
    leads = await leadRepo.find({
      where: { deleted: false, assigned_to: { id: userId } },
      relations: ["source", "status", "assigned_to"],
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
      { header: "email", key: "email", width: 25 },
      { header: "location", key: "location", width: 20 },
      { header: "requirement", key: "requirement", width: 20 },
      { header: "budget", key: "budget", width: 15 },
      { header: "source", key: "source", width: 15 },
      { header: "status", key: "status", width: 15 },
    ];

    return workbook;
  };

  // Service to handle Excel upload
  const uploadLeadsFromExcelService = async (fileBuffer: Buffer, user: User) => {
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
      const existingEmail = await leadRepo.findOne({
        where: { email: String(email).trim(), deleted: false },
      });

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
        email: String(email).trim(),
        location: data.location || "",
        budget: Number(data.budget) || 0,
        requirement: data.requirement || "",
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

   const findLeadByEmail = async ({ email }: { email: string | undefined }) => {
  return await leadRepo.findOne({
    where: { email, deleted: false },
  });
};

 const findLeadByPhoneNumber = async ({ phone }: { phone: number }) => {
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
    findLeadByPhoneNumber
  };
};
