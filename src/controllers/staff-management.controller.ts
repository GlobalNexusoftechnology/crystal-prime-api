import { Request, Response, NextFunction } from "express";
import { staffService } from "../services/staff-management.service";
import { createStaffSchema, updateStaffSchema } from "../schemas/staff-management.schema";
import path from "path";
import fs from "fs/promises";

const service = staffService();

export const staffController = () => {

  //  Create Staff
  const createStaff = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsedData = createStaffSchema.parse(req.body);
      const result = await service.createStaff(parsedData);
      res.status(201).json({ status: "success", message: "Staff created", data: result });
    } catch (error) {
      next(error);
    }
  };

  //  Get All Staff
  const getAllStaff = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { search, page, limit, sortBy, sortOrder } = req.query;

      const result = await service.getAllStaff({
        search: search as string,
        page: parseInt(page as string) || 1,
        limit: parseInt(limit as string) || 10,
        sortBy: (sortBy as any) || 'created_at',
        sortOrder: (sortOrder as 'ASC' | 'DESC') || 'DESC',
      });

      res.status(200).json({
        status: 'success',
        ...result,
      });
    } catch (error) {
      next(error);
    }
  };

  //  Get Staff by ID
  const getStaffById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const result = await service.getStaffById(id);
      res.status(200).json({ status: "success", message: "Staff fetched by ID", data: result });
    } catch (error) {
      next(error);
    }
  };

  //  Update Staff
  const updateStaff = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const parsedData = updateStaffSchema.parse(req.body);
      const result = await service.updateStaff(id, parsedData);
      res.status(200).json({ status: "success", message: "Staff updated", data: result });
    } catch (error) {
      next(error);
    }
  };

  // Soft Delete Staff
  const softDeleteStaff = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const result = await service.softDeleteStaff(id);
      res.status(200).json({ status: "success", message: "Staff deleted", data: result });
    } catch (error) {
      next(error);
    }
  };

  const exportStaffExcelController = async (req: Request, res: Response) => {
  try {
    const workbook = await service.exportStaffToExcel();

    const exportDir = path.join(__dirname, "..", "..", "public", "exports");
    await fs.mkdir(exportDir, { recursive: true });

    const filename = `staff_${Date.now()}.xlsx`;
    const filepath = path.join(exportDir, filename);

    await workbook.xlsx.writeFile(filepath);

    const fileURL = `${req.protocol}://${req.get("host")}/exports/${filename}`;
    res.json({ fileURL });
  } catch (error) {
    console.error("Error exporting staff:", error);
    res.status(500).json({ message: "Failed to export staff data" });
  }
};

  return {
    createStaff,
    getAllStaff,
    getStaffById,
    updateStaff,
    softDeleteStaff,
    exportStaffExcelController
  };
};
