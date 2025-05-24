import { Request, Response, NextFunction } from "express";
import { LeadService } from "../services/leads.service";
import { createLeadSchema, updateLeadSchema } from "../schemas/leads.schema";
import path from "path";
import fs from "fs/promises";

const service = LeadService();

export const leadController = () => {

  // Create Lead
  const createLead = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = createLeadSchema.parse(req.body);
      const result = await service.createLead(parsed);
      res.status(201).json({ status: "success", message: "Lead created", data: result });
    } catch (error) {
      next(error);
    }
  };

  // Get All Lead
  const getAllLeads = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await service.getAllLeads();
      res.status(200).json({ status: "success", message: "All Leads fetched", data: result });
    } catch (error) {
      next(error);
    }
  };

  // Get Lead by ID
  const getLeadById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const result = await service.getLeadById(id);
      res.status(200).json({ status: "success", message: "Lead fetched", data: result });
    } catch (error) {
      next(error);
    }
  };

  // Update Lead
  const updateLead = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const parsed = updateLeadSchema.parse(req.body);
      const result = await service.updateLead(id, parsed);
      res.status(200).json({ status: "success", message: "Lead updated", data: result });
    } catch (error) {
      next(error);
    }
  };

  // Soft Delete Lead
  const softDeleteLead = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const result = await service.softDeleteLead(id);
      res.status(200).json({ status: "success", message: "Lead deleted", data: result });
    } catch (error) {
      next(error);
    }
  };

  // Excel file
  const exportLeadsExcelController = async (req: Request, res: Response) => {
    try {
      const workbook = await service.exportLeadsToExcel();

      const exportDir = path.join(__dirname, "..", "..", "public", "exports");
      await fs.mkdir(exportDir, { recursive: true });

      const filename = `leads_${Date.now()}.xlsx`;
      const filepath = path.join(exportDir, filename);

      await workbook.xlsx.writeFile(filepath);

      const fileURL = `${req.protocol}://${req.get("host")}/exports/${filename}`;

      res.json({ fileURL });
    } catch (error) {
      console.error("Error exporting leads:", error);
      res.status(500).json({ message: "Failed to export leads" });
    }
  };


const downloadLeadTemplate = async (req: Request, res: Response) => {
  try {
    const relativePath = await service.generateLeadTemplate();
    const fileUrl = `${req.protocol}://${req.get('host')}${relativePath}`;

    return res.status(200).json({
      message: 'Lead template generated successfully',
      url: fileUrl,
    });
  } catch (error) {
    console.error('Error generating template:', error);
    return res.status(500).json({ message: 'Something went wrong' });
  }
};


  return {
    createLead,
    getAllLeads,
    getLeadById,
    updateLead,
    softDeleteLead,
    exportLeadsExcelController,
    downloadLeadTemplate
  };
};

