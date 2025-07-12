import { Request, Response, NextFunction } from 'express';
import {
  createEILogType,
  getAllEILogTypes,
  getEILogTypeById,
  updateEILogTypeById,
  deleteEILogTypeById,
} from '../services';

// Handler to create a new EILogType
export const createEILogTypeHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const payload = req.body;
    const eilogType = await createEILogType(payload);
    res.status(201).json({
      status: 'success',
      message: 'EILogType created successfully',
      data: eilogType,
    });
  } catch (err) {
    next(err);
  }
};

// Handler to get all EILogTypes
export const getAllEILogTypesHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const eilogTypes = await getAllEILogTypes();
    res.status(200).json({
      status: 'success',
      message: 'EILogTypes fetched successfully',
      data: eilogTypes,
    });
  } catch (err) {
    next(err);
  }
};

// Handler to get a single EILogType by ID
export const getEILogTypeByIdHandler = async (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const eilogType = await getEILogTypeById(id);
    res.status(200).json({
      status: 'success',
      message: 'EILogType fetched successfully',
      data: eilogType,
    });
  } catch (err) {
    next(err);
  }
};

// Handler to update an existing EILogType by ID
export const updateEILogTypeHandler = async (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const updated = await updateEILogTypeById(id, updates);
    res.status(200).json({
      status: 'success',
      message: 'EILogType updated successfully',
      data: updated,
    });
  } catch (err) {
    next(err);
  }
};

// Handler to soft delete an EILogType by ID
export const deleteEILogTypeHandler = async (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    await deleteEILogTypeById(id);
    res.status(200).json({
      status: 'success',
      message: 'EILogType deleted successfully',
    });
  } catch (err) {
    next(err);
  }
}; 