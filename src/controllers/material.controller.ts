import { NextFunction, Request, Response } from "express";
import {
  createMaterialSchema,
  updateMaterialSchema,
} from "../schemas/material.schema";
import { MaterialService } from "../services/material.service";

const service = MaterialService();

export const materialController = () => {
  const createMaterial = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const parsed = createMaterialSchema.parse(req.body);
      const result = await service.createMaterial(parsed);
      res
        .status(201)
        .json({ status: "success", message: "Material created", data: result });
    } catch (err: any) {
      // Handle duplicate key constraint violation
      if (
        err.code === "23505" ||
        err.message?.includes("duplicate key value violates unique constraint")
      ) {
        console.log("Duplicate constraint error:", err.message);

        // Check if it's a code constraint
        if (
          err.message?.includes("code") ||
          err.constraint?.includes("code") ||
          err.message?.includes("UQ_")
        ) {
          return res.status(409).json({
            status: "error",
            message:
              "Material with this code already exists. Please use a different code.",
          });
        } else {
          return res.status(409).json({
            status: "error",
            message:
              "Material with this information already exists. Please check your input.",
          });
        }
      }
      next(err);
    }
  };

  const getAllMaterials = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const filters = {
        searchText: req.query.searchText as string | undefined,
        page: req.query.page as string | undefined,
        limit: req.query.limit as string | undefined,
      };
      const result = await service.getAllMaterials(filters);
      res
        .status(200)
        .json({
          status: "success",
          message: "All materials fetched",
          data: result,
        });
    } catch (err) {
      next(err);
    }
  };

  // Export Materials to Excel
  const exportMaterialsExcel = async (req: Request, res: Response) => {
    try {
      const filters = {
        searchText: req.query.searchText as string | undefined,
        page: req.query.page as string | undefined,
        limit: req.query.limit as string | undefined,
      };
      const workbook = await service.exportMaterialsToExcel(filters);
      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=materials_${Date.now()}.xlsx`
      );
      await workbook.xlsx.write(res);
      res.end();
    } catch (error) {
      console.error("Error exporting materials:", error);
      res.status(500).json({ message: "Failed to export materials" });
    }
  };

  // Download Material Template
  const downloadMaterialTemplate = async (req: Request, res: Response) => {
    try {
      const workbook = await service.generateMaterialTemplate();
      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
      res.setHeader(
        "Content-Disposition",
        "attachment; filename=materials_template.xlsx"
      );
      await workbook.xlsx.write(res);
      res.end();
    } catch (error) {
      console.error("Error generating material template:", error);
      res.status(500).json({ message: "Failed to download material template" });
    }
  };

  // Upload Materials from Excel
  const uploadMaterialsFromExcel = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      if (!req.file || !req.file.buffer) {
        return res
          .status(400)
          .json({ status: "error", message: "No file uploaded" });
      }
      const result = await service.uploadMaterialsFromExcelService(
        req.file.buffer
      );
      res.status(200).json({
        status: "success",
        message: "Materials uploaded from Excel successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  const getMaterialById = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { id } = req.params;
      const result = await service.getMaterialById(id);
      res
        .status(200)
        .json({ status: "success", message: "Material fetched", data: result });
    } catch (err) {
      next(err);
    }
  };

  const updateMaterial = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { id } = req.params;
      const parsed = updateMaterialSchema.parse(req.body);
      const result = await service.updateMaterial(id, parsed);
      res
        .status(200)
        .json({ status: "success", message: "Material updated", data: result });
    } catch (err) {
      next(err);
    }
  };

  const softDeleteMaterial = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { id } = req.params;
      const result = await service.softDeleteMaterial(id);
      res
        .status(200)
        .json({ status: "success", message: "Material deleted", data: result });
    } catch (err) {
      next(err);
    }
  };

  // Change Material Status (active/inactive)
  const changeStatusMaterial = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { id } = req.params;
      const { active } = req.body;
      if (typeof active !== "boolean") {
        return res
          .status(400)
          .json({ status: "error", message: "'active' must be boolean" });
      }
      const result = await service.updateMaterial(id, { active });
      res
        .status(200)
        .json({
          status: "success",
          message: "Material status updated",
          data: result,
        });
    } catch (err) {
      next(err);
    }
  };

  return {
    createMaterial,
    getAllMaterials,
    getMaterialById,
    updateMaterial,
    softDeleteMaterial,
    exportMaterialsExcel,
    downloadMaterialTemplate,
    uploadMaterialsFromExcel,
    changeStatusMaterial,
  };
};
