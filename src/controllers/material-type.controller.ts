import { Request, Response, NextFunction } from "express";
import {
  createMaterialType,
  getAllMaterialTypes,
  getMaterialTypeById,
  updateMaterialTypeById,
  deleteMaterialTypeById,
} from "../services/material-type.service";

export const createMaterialTypeHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const payload = req.body;
    const created = await createMaterialType(payload);
    res
      .status(201)
      .json({
        status: "success",
        message: `${payload.name} created successfully`,
        data: created,
      });
  } catch (err) {
    next(err);
  }
};

export const getAllMaterialTypesHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = await getAllMaterialTypes({
      page: req.query.page,
      limit: req.query.limit,
    });
    res
      .status(200)
      .json({
        status: "success",
        message: "Material types fetched successfully",
        data: { list: result.data, pagination: result.pagination },
      });
  } catch (err) {
    next(err);
  }
};

export const getMaterialTypeByIdHandler = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const data = await getMaterialTypeById(req.params.id);
    res
      .status(200)
      .json({
        status: "success",
        message: "Material type fetched successfully",
        data,
      });
  } catch (err) {
    next(err);
  }
};

export const updateMaterialTypeHandler = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const updated = await updateMaterialTypeById(req.params.id, req.body);
    res
      .status(200)
      .json({
        status: "success",
        message: "Material type updated successfully",
        data: updated,
      });
  } catch (err) {
    next(err);
  }
};

export const deleteMaterialTypeHandler = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    await deleteMaterialTypeById(req.params.id);
    res
      .status(200)
      .json({
        status: "success",
        message: "Material type deleted successfully",
      });
  } catch (err) {
    next(err);
  }
};
