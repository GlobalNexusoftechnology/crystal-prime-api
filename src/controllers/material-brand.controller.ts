import { Request, Response, NextFunction } from "express";
import {
  createMaterialBrand,
  getAllMaterialBrands,
  getMaterialBrandById,
  updateMaterialBrandById,
  deleteMaterialBrandById,
} from "../services/material-brand.service";

// Create
export const createMaterialBrandHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const payload = req.body;
    const created = await createMaterialBrand(payload);
    res.status(201).json({
      status: "success",
      message: `${payload.name} created successfully`,
      data: created,
    });
  } catch (err) {
    next(err);
  }
};

// Read All
export const getAllMaterialBrandsHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = await getAllMaterialBrands({
      page: req.query.page,
      limit: req.query.limit,
    });
    res.status(200).json({
      status: "success",
      message: "Material brands fetched successfully",
      data: { list: result.data, pagination: result.pagination },
    });
  } catch (err) {
    next(err);
  }
};

// Read One
export const getMaterialBrandByIdHandler = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const data = await getMaterialBrandById(req.params.id);
    res.status(200).json({
      status: "success",
      message: "Material brand fetched successfully",
      data,
    });
  } catch (err) {
    next(err);
  }
};

// Update
export const updateMaterialBrandHandler = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const updated = await updateMaterialBrandById(req.params.id, req.body);
    res.status(200).json({
      status: "success",
      message: "Material brand updated successfully",
      data: updated,
    });
  } catch (err) {
    next(err);
  }
};

// Delete
export const deleteMaterialBrandHandler = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    await deleteMaterialBrandById(req.params.id);
    res.status(200).json({
      status: "success",
      message: "Material brand deleted successfully",
    });
  } catch (err) {
    next(err);
  }
};
