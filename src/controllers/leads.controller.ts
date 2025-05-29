import { Request, Response, NextFunction } from "express";
import { LeadService } from "../services/leads.service";
import { findUserById } from "../services/user.service";
import { createLeadSchema, updateLeadSchema } from "../schemas/leads.schema";

const service = LeadService();

export const leadController = () => {
  // Create Lead
  const createLead = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
    const parsed = createLeadSchema.parse(req.body);

    // Check if user already exists by email
    const existingLeadByEmail = await service.findLeadByEmail({ email: parsed.email });
    if (existingLeadByEmail) {
      return res.status(409).json({
        status: "fail",
        message: "Lead with that email already exists",
      });
    }

    // Check if phone number is provided
    if (parsed.phone) {
      const existingLeadByPhone = await service.findLeadByPhoneNumber({ phone: parsed.phone });
      if (existingLeadByPhone) {
        return res.status(409).json({
          status: "fail",
          message: "Lead with that phone number already exists",
        });
      }
    }

      const result = await service.createLead(parsed);
      res
        .status(201)
        .json({ status: "success", message: "Lead created", data: result });
    } catch (error) {
      next(error);
    }
  };

  // Get All Lead
  const getAllLeads = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const userId = res?.locals?.user?.id;
      const role = res?.locals?.user?.role?.role;
      let result;

      if(role === 'Admin' || role === 'admin') {
        result = await service.getAllLeads();
      } else {
        result = await service.getLeadById(userId);
      }
      
      const leadStats = await service.getLeadStats(userId);

      res.status(200).json({
        status: "success",
        message: "All Leads fetched",
        data: { list: result, stats: leadStats },
      });
    } catch (error) {
      next(error);
    }
  };

  // Get Lead by ID
  const getLeadById = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { id } = req.params;
      const result = await service.getLeadById(id);
      res
        .status(200)
        .json({ status: "success", message: "Lead fetched", data: result });
    } catch (error) {
      next(error);
    }
  };

  // Update Lead
  const updateLead = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { id } = req.params;
      const parsed = updateLeadSchema.parse(req.body);
      const result = await service.updateLead(id, parsed);
      res
        .status(200)
        .json({ status: "success", message: "Lead updated", data: result });
    } catch (error) {
      next(error);
    }
  };

  // Soft Delete Lead
  const softDeleteLead = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { id } = req.params;
      const result = await service.softDeleteLead(id);
      res
        .status(200)
        .json({ status: "success", message: "Lead deleted", data: result });
    } catch (error) {
      next(error);
    }
  };

  // Export Lead Excel file
  const exportLeadsExcelController = async (req: Request, res: Response) => {
    try {
      const userId = res.locals.user.id;
      const userData = await findUserById(userId)
      const userRole = userData.role.role

      const workbook = await service.exportLeadsToExcel(userId, userRole);

      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=leads_${Date.now()}.xlsx`
      );

      await workbook.xlsx.write(res);
      res.end();
    } catch (error) {
      console.error("Error exporting leads:", error);
      res.status(500).json({ message: "Failed to export leads" });
    }
  };

  // Download lead template file.
  const downloadLeadTemplate = async (req: Request, res: Response) => {
    try {
      const workbook = await service.generateLeadTemplate();

      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
      res.setHeader(
        "Content-Disposition",
        "attachment; filename=leads_template.xlsx"
      );

      await workbook.xlsx.write(res);
      res.end();
    } catch (error) {
      console.error("Error generating template:", error);
      res.status(500).json({ message: "Failed to download the template" });
    }
  };

  const uploadLeadsFromExcel = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const user = res.locals.user
      if (!req.file) {
        return res
          .status(400)
          .json({ status: "error", message: "No file uploaded" });
      }

      const result = await service.uploadLeadsFromExcelService(req.file.buffer, user);
      res.status(201).json({
        status: "success",
        message: "Leads uploaded successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  return {
    createLead,
    getAllLeads,
    getLeadById,
    updateLead,
    softDeleteLead,
    exportLeadsExcelController,
    downloadLeadTemplate,
    uploadLeadsFromExcel,
  };
};
