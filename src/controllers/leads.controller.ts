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
      const userData = res?.locals?.user;
      const parsed = createLeadSchema.parse(req.body);

      const emailList = String(parsed.email)
        .split(",")
        .map((e) => e.trim())
        .filter(Boolean);

      // Replace email field with array version before passing to service
      parsed.email = emailList;

      const result = await service.createLead(parsed, userData);

      res
        .status(201)
        .json({ status: "success", message: "Lead created", data: result });
    } catch (error) {
      next(error);
    }
  };

  // Get All Leads
  const getAllLeads = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const userId = res?.locals?.user?.id;
      const role = res?.locals?.user?.role?.role;
      const searchText = req.query.searchText as string | undefined;
      const statusId = req.query.statusId as string | undefined;
      const typeId = req.query.typeId as string | undefined;
      const dateRange = req.query.dateRange as ("All" | "Daily" | "Weekly" | "Monthly") | undefined;
      const referenceDate = req.query.referenceDate ? new Date(req.query.referenceDate as string) : undefined;
      const followupFrom = req.query.followupFrom ? new Date(req.query.followupFrom as string) : undefined;
      const followupTo = req.query.followupTo ? new Date(req.query.followupTo as string) : undefined;
      const sourceId = req.query.sourceId as string | undefined;
      const assignedToId = req.query.assignedToId as string | undefined;
      const page = req.query.page ? parseInt(req.query.page as string) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;

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
        page,
        limit
      };

      const result = await service.getAllLeads(filters, userId, role);
      const leadStats = await service.getLeadStats(userId, role);

      res.status(200).json({
        status: "success",
        message: "All Leads fetched",
        data: { list: result.data, pagination: result.pagination, stats: leadStats },
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
      const userData = res?.locals?.user;
      const { id } = req.params;
      const parsed = updateLeadSchema.parse(req.body);

      if (parsed.email) {
        parsed.email = String(parsed.email)
          .split(",")
          .map((e) => e.trim())
          .filter(Boolean);
      }

      const result = await service.updateLead(id, parsed, userData);

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

  // Export Leads to Excel
  const exportLeadsExcelController = async (req: Request, res: Response) => {
    try {
      const userId = res.locals.user.id;
      const userData = await findUserById(userId);
      const userRole = userData.role.role;

      // Collect all filter params
      const searchText = req.query.searchText as string | undefined;
      const statusId = req.query.statusId as string | undefined;
      const typeId = req.query.typeId as string | undefined;
      const dateRange = req.query.dateRange as ("All" | "Daily" | "Weekly" | "Monthly") | undefined;
      const referenceDate = req.query.referenceDate ? new Date(req.query.referenceDate as string) : undefined;
      const followupFrom = req.query.followupFrom ? new Date(req.query.followupFrom as string) : undefined;
      const followupTo = req.query.followupTo ? new Date(req.query.followupTo as string) : undefined;
      const sourceId = req.query.sourceId as string | undefined;
      const assignedToId = req.query.assignedToId as string | undefined;

      const workbook = await service.exportLeadsToExcel(
        userId,
        userRole,
        searchText,
        statusId,
        typeId,
        dateRange,
        referenceDate,
        followupFrom,
        followupTo,
        sourceId,
        assignedToId
      );

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

  // Download Lead Template
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

  // Upload Leads from Excel
  const uploadLeadsFromExcel = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const user = res.locals.user;
      if (!req.file) {
        return res
          .status(400)
          .json({ status: "error", message: "No file uploaded" });
      }

      const result = await service.uploadLeadsFromExcelService(
        req.file.buffer,
        user
      );
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

